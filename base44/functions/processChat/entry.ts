import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import OpenAI from 'npm:openai@4.73.1';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

// Define all available tools/functions for the AI
const tools = [
    {
        type: "function",
        function: {
            name: "create_project",
            description: "Creates a new project for tracking income and expenses",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "The project name or business name" },
                    status: { type: "string", enum: ["planned", "active", "complete"], description: "Project status", default: "active" },
                    startDate: { type: "string", description: "Project start date in YYYY-MM-DD format" },
                    notes: { type: "string", description: "Additional notes about the project" }
                },
                required: ["title"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_project",
            description: "Updates an existing project's details",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "string", description: "The ID of the project to update" },
                    title: { type: "string", description: "New project title" },
                    status: { type: "string", enum: ["planned", "active", "complete"], description: "New project status" },
                    notes: { type: "string", description: "Updated notes" }
                },
                required: ["projectId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_projects",
            description: "Retrieves all projects for the user. Use this to check what projects exist before creating income/expenses.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_income",
            description: "Records a new income transaction",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "string", description: "The project this income belongs to" },
                    amount: { type: "number", description: "Income amount" },
                    date: { type: "string", description: "Date in YYYY-MM-DD format" },
                    category: { type: "string", description: "Income category" },
                    method: { type: "string", description: "Payment method (e.g., cash, check, credit card)" },
                    notes: { type: "string", description: "Additional details" }
                },
                required: ["projectId", "amount", "date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_income",
            description: "Updates an existing income item",
            parameters: {
                type: "object",
                properties: {
                    incomeId: { type: "string", description: "The ID of the income item to update" },
                    projectId: { type: "string", description: "New project ID if moving" },
                    amount: { type: "number", description: "Updated amount" },
                    date: { type: "string", description: "Updated date in YYYY-MM-DD format" },
                    category: { type: "string", description: "Updated category" },
                    method: { type: "string", description: "Updated payment method" },
                    notes: { type: "string", description: "Updated notes" }
                },
                required: ["incomeId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_income",
            description: "Retrieves income items, optionally filtered by project",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "string", description: "Filter by specific project ID" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_expense",
            description: "Records a new expense transaction. Intelligently categorize based on description (supplies, travel, homeOffice, equipment, marketing, professional, utilities, education, insurance, other)",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "string", description: "The project this expense belongs to" },
                    amount: { type: "number", description: "Expense amount" },
                    date: { type: "string", description: "Date in YYYY-MM-DD format" },
                    category: { type: "string", enum: ["supplies", "travel", "homeOffice", "equipment", "marketing", "professional", "utilities", "education", "insurance", "other"], description: "Expense category for tax purposes" },
                    vendor: { type: "string", description: "Vendor or merchant name" },
                    notes: { type: "string", description: "Additional details" }
                },
                required: ["projectId", "amount", "date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_expense",
            description: "Updates an existing expense item. Use this to recategorize expenses or move them between projects.",
            parameters: {
                type: "object",
                properties: {
                    expenseId: { type: "string", description: "The ID of the expense item to update" },
                    projectId: { type: "string", description: "New project ID if moving" },
                    amount: { type: "number", description: "Updated amount" },
                    date: { type: "string", description: "Updated date in YYYY-MM-DD format" },
                    category: { type: "string", enum: ["supplies", "travel", "homeOffice", "equipment", "marketing", "professional", "utilities", "education", "insurance", "other"], description: "Updated category" },
                    vendor: { type: "string", description: "Updated vendor" },
                    notes: { type: "string", description: "Updated notes" }
                },
                required: ["expenseId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_expenses",
            description: "Retrieves expense items, optionally filtered by project",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "string", description: "Filter by specific project ID" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_user_profile",
            description: "Retrieves the user's profile including settings",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "schedule_check_in",
            description: "Schedules a future check-in notification for after an event or on a specific date",
            parameters: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: ["after_event", "weekly"],
                        description: "Type of check-in to schedule"
                    },
                    scheduledFor: {
                        type: "string",
                        description: "When to send the notification in YYYY-MM-DD format or ISO date-time"
                    },
                    eventName: {
                        type: "string",
                        description: "Name of the event (required for after_event type)"
                    },
                    projectId: {
                        type: "string",
                        description: "Associated project ID"
                    }
                },
                required: ["type", "scheduledFor"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_project",
            description: "Deletes a project and all its associated income, expense, and subscription records",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "string", description: "The ID of the project to delete" }
                },
                required: ["projectId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_income",
            description: "Deletes an income item",
            parameters: {
                type: "object",
                properties: {
                    incomeId: { type: "string", description: "The ID of the income item to delete" }
                },
                required: ["incomeId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_expense",
            description: "Deletes an expense item",
            parameters: {
                type: "object",
                properties: {
                    expenseId: { type: "string", description: "The ID of the expense item to delete" }
                },
                required: ["expenseId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_subscription",
            description: "Deletes a recurring subscription",
            parameters: {
                type: "object",
                properties: {
                    subscriptionId: { type: "string", description: "The ID of the subscription to delete" }
                },
                required: ["subscriptionId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_event",
            description: "Creates a new event for a project",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "string", description: "The project ID for this event" },
                    name: { type: "string", description: "Event name (e.g., Client meeting, Project launch)" },
                    startDate: { type: "string", description: "Event start date-time in ISO format" },
                    endDate: { type: "string", description: "Event end date-time in ISO format" },
                    notes: { type: "string", description: "Additional notes about the event" }
                },
                required: ["projectId", "name", "startDate"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_event",
            description: "Deletes an event from a project",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string", description: "The ID of the event to delete" }
                },
                required: ["eventId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_events",
            description: "Retrieves events for a specific project",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "string", description: "The project ID to get events for" }
                },
                required: ["projectId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_recurring_expense",
            description: "Creates a recurring subscription/expense that repeats at a set interval. Use this when user requests a subscription or recurring expense.",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "string", description: "The project ID this subscription belongs to" },
                    name: { type: "string", description: "Name of the subscription (e.g., 'Claude Subscription', 'Netflix')" },
                    amount: { type: "number", description: "Amount per billing cycle" },
                    frequency: { type: "string", enum: ["monthly", "yearly", "weekly", "custom"], description: "How often to charge" },
                    customDays: { type: "number", description: "For custom frequency, number of days between charges" },
                    startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
                    endDate: { type: "string", description: "End date in YYYY-MM-DD format (optional)" },
                    category: { type: "string", description: "Expense category" },
                    notes: { type: "string", description: "Additional notes" }
                },
                required: ["projectId", "name", "amount", "frequency", "startDate"]
            }
        }
    }
];

// Helper to clean messages before sending to OpenAI
function cleanMessagesForOpenAI(messages) {
    return messages.map(msg => {
        const cleaned = { ...msg };
        
        // Remove empty tool_calls arrays
        if (cleaned.tool_calls && Array.isArray(cleaned.tool_calls) && cleaned.tool_calls.length === 0) {
            delete cleaned.tool_calls;
        }
        
        // Remove empty content strings for tool messages, or set a default
        if (cleaned.role === 'tool' && !cleaned.content) {
            cleaned.content = 'Function executed successfully';
        }
        
        return cleaned;
    });
}

// Execute a tool call
async function executeTool(toolName, args, base44, userEmail) {
    console.log(`Executing tool: ${toolName}`, args);
    
    try {
        switch (toolName) {
            case "create_project": {
                const project = await base44.entities.Project.create({
                    title: args.title,
                    status: args.status || "active",
                    startDate: args.startDate || new Date().toISOString().split('T')[0],
                    notes: args.notes || "",
                    totalIncome: 0,
                    totalExpense: 0,
                    created_by: userEmail
                });
                return { success: true, project };
            }
            
            case "update_project": {
                const updateData = {};
                if (args.title) updateData.title = args.title;
                if (args.status) updateData.status = args.status;
                if (args.notes) updateData.notes = args.notes;
                
                const updated = await base44.entities.Project.update(args.projectId, updateData);
                return { success: true, project: updated };
            }
            
            case "get_projects": {
                const projects = await base44.entities.Project.filter({ created_by: userEmail }, '-created_date');
                
                // Calculate totals for each project
                const allIncome = await base44.entities.IncomeItem.filter({ created_by: userEmail });
                const allExpenses = await base44.entities.ExpenseItem.filter({ created_by: userEmail });
                
                const projectsWithTotals = projects.map(project => {
                    const projectIncome = allIncome
                        .filter(item => item.projectId === project.id)
                        .reduce((sum, item) => sum + (item.amount || 0), 0);
                    
                    const projectExpenses = allExpenses
                        .filter(item => item.projectId === project.id)
                        .reduce((sum, item) => sum + (item.amount || 0), 0);
                    
                    return {
                        id: project.id,
                        title: project.title,
                        status: project.status,
                        totalIncome: projectIncome,
                        totalExpense: projectExpenses,
                        profit: projectIncome - projectExpenses,
                        startDate: project.startDate,
                        notes: project.notes
                    };
                });
                
                return { success: true, projects: projectsWithTotals };
            }
            
            case "create_income": {
                const income = await base44.entities.IncomeItem.create({
                    projectId: args.projectId,
                    amount: args.amount,
                    date: args.date,
                    category: args.category || "other",
                    method: args.method || "",
                    notes: args.notes || "",
                    created_by: userEmail
                });
                
                // Update project totals
                await updateProjectTotals(base44, args.projectId, userEmail);
                
                return { success: true, income };
            }
            
            case "update_income": {
                const updateData = {};
                if (args.projectId) updateData.projectId = args.projectId;
                if (args.amount !== undefined) updateData.amount = args.amount;
                if (args.date) updateData.date = args.date;
                if (args.category) updateData.category = args.category;
                if (args.method) updateData.method = args.method;
                if (args.notes !== undefined) updateData.notes = args.notes;
                
                // Get the old income to know which project to update
                const oldIncome = await base44.entities.IncomeItem.filter({ id: args.incomeId });
                const oldProjectId = oldIncome[0]?.projectId;
                
                const updated = await base44.entities.IncomeItem.update(args.incomeId, updateData);
                
                // Update totals for both old and new projects if projectId changed
                if (oldProjectId) {
                    await updateProjectTotals(base44, oldProjectId, userEmail);
                }
                if (args.projectId && args.projectId !== oldProjectId) {
                    await updateProjectTotals(base44, args.projectId, userEmail);
                }
                
                return { success: true, income: updated };
            }
            
            case "get_income": {
                const filter = {};
                if (args.projectId) filter.projectId = args.projectId;
                
                const income = await base44.asServiceRole.entities.IncomeItem.filter(filter, '-date');
                return { success: true, income };
            }
            
            case "create_expense": {
                const expense = await base44.entities.ExpenseItem.create({
                    projectId: args.projectId,
                    amount: args.amount,
                    date: args.date,
                    category: args.category || "other",
                    vendor: args.vendor || "",
                    notes: args.notes || "",
                    created_by: userEmail
                });
                
                // Intelligently detect recurring patterns
                const recurringKeywords = ['subscription', 'monthly', 'yearly', 'recurring', 'claude', 'chatgpt', 'gpt', 'openai', 'adobe', 'figma', 'slack', 'github', 'netlify', 'aws', 'stripe', 'base44', 'netflix', 'spotify', 'hulu', 'canva', 'notion', 'linear', 'copilot'];
                const description = (args.vendor || args.notes || "").toLowerCase();
                const isLikelyRecurring = recurringKeywords.some(keyword => description.includes(keyword));
                
                if (isLikelyRecurring) {
                    try {
                        // Check if there are other expenses from this vendor in the past
                        const allExpenses = await base44.entities.ExpenseItem.filter({ projectId: args.projectId, created_by: userEmail });
                        const sameVendorExpenses = allExpenses.filter(e => e.vendor && e.vendor.toLowerCase() === (args.vendor || "").toLowerCase());
                        
                        // If multiple expenses from same vendor exist, it's definitely recurring
                        if (sameVendorExpenses.length >= 2) {
                            // Calculate average amount and frequency
                            const amounts = sameVendorExpenses.map(e => e.amount);
                            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
                            const dates = sameVendorExpenses.map(e => new Date(e.date).getTime()).sort((a, b) => b - a);
                            
                            // Estimate frequency from date gaps
                            let frequency = "monthly";
                            if (dates.length >= 2) {
                                const daysBetween = (dates[0] - dates[1]) / (1000 * 60 * 60 * 24);
                                if (daysBetween > 300) frequency = "yearly";
                                else if (daysBetween > 20 && daysBetween < 35) frequency = "monthly";
                                else if (daysBetween > 5 && daysBetween < 10) frequency = "weekly";
                            }
                            
                            await base44.entities.RecurringSubscription.create({
                                projectId: args.projectId,
                                name: args.vendor || "Subscription",
                                amount: Math.round(avgAmount * 100) / 100,
                                frequency: frequency,
                                startDate: sameVendorExpenses[sameVendorExpenses.length - 1].date,
                                category: args.category || "subscriptions",
                                notes: `Auto-detected recurring from ${sameVendorExpenses.length + 1} transactions`,
                                active: true,
                                created_by: userEmail
                            });
                        } else if (sameVendorExpenses.length === 1) {
                            // Single prior expense + this one = likely recurring, assume monthly
                            const avgAmount = (sameVendorExpenses[0].amount + args.amount) / 2;
                            await base44.entities.RecurringSubscription.create({
                                projectId: args.projectId,
                                name: args.vendor || "Subscription",
                                amount: Math.round(avgAmount * 100) / 100,
                                frequency: "monthly",
                                startDate: sameVendorExpenses[0].date,
                                category: args.category || "subscriptions",
                                notes: `Auto-detected recurring subscription`,
                                active: true,
                                created_by: userEmail
                            });
                        }
                    } catch (error) {
                        console.log('Could not create recurring subscription:', error.message);
                    }
                }
                
                // Update project totals
                await updateProjectTotals(base44, args.projectId, userEmail);
                
                return { success: true, expense };
            }
            
            case "update_expense": {
                const updateData = {};
                if (args.projectId) updateData.projectId = args.projectId;
                if (args.amount !== undefined) updateData.amount = args.amount;
                if (args.date) updateData.date = args.date;
                if (args.category) updateData.category = args.category;
                if (args.vendor) updateData.vendor = args.vendor;
                if (args.notes !== undefined) updateData.notes = args.notes;
                
                // Get the old expense to know which project to update
                const oldExpense = await base44.entities.ExpenseItem.filter({ id: args.expenseId });
                const oldProjectId = oldExpense[0]?.projectId;
                
                const updated = await base44.entities.ExpenseItem.update(args.expenseId, updateData);
                
                // Update totals for both old and new projects if projectId changed
                if (oldProjectId) {
                    await updateProjectTotals(base44, oldProjectId, userEmail);
                }
                if (args.projectId && args.projectId !== oldProjectId) {
                    await updateProjectTotals(base44, args.projectId, userEmail);
                }
                
                return { success: true, expense: updated };
            }
            
            case "get_expenses": {
                const filter = {};
                if (args.projectId) filter.projectId = args.projectId;
                
                const expenses = await base44.asServiceRole.entities.ExpenseItem.filter(filter, '-date');
                return { success: true, expenses };
            }
            
            case "get_user_profile": {
                const profiles = await base44.entities.UserProfile.filter({ created_by: userEmail });
                if (profiles.length === 0) {
                    return { success: true, profile: null };
                }
                return { success: true, profile: profiles[0] };
            }

            case "schedule_check_in": {
                const checkIn = await base44.entities.ScheduledCheckIn.create({
                    userEmail: userEmail,
                    type: args.type,
                    scheduledFor: args.scheduledFor,
                    eventName: args.eventName || "",
                    projectId: args.projectId || "",
                    sent: false,
                    created_by: userEmail
                });
                return { success: true, checkIn };
            }

            case "delete_project": {
                // Use service role to bypass created_by mismatch (items may be created by service role)
                const incomeItems = await base44.asServiceRole.entities.IncomeItem.filter({ projectId: args.projectId });
                for (const income of incomeItems) {
                    await base44.asServiceRole.entities.IncomeItem.delete(income.id);
                }

                const expenseItems = await base44.asServiceRole.entities.ExpenseItem.filter({ projectId: args.projectId });
                for (const expense of expenseItems) {
                    await base44.asServiceRole.entities.ExpenseItem.delete(expense.id);
                }

                const subscriptions = await base44.asServiceRole.entities.RecurringSubscription.filter({ projectId: args.projectId });
                for (const subscription of subscriptions) {
                    await base44.asServiceRole.entities.RecurringSubscription.delete(subscription.id);
                }

                await base44.entities.Project.delete(args.projectId);
                return { success: true, message: "Project and all associated records deleted successfully" };
            }

            case "delete_income": {
                const incomeToDelete = await base44.asServiceRole.entities.IncomeItem.filter({ id: args.incomeId });
                const incomeProjectId = incomeToDelete[0]?.projectId;
                await base44.asServiceRole.entities.IncomeItem.delete(args.incomeId);
                if (incomeProjectId) await updateProjectTotals(base44, incomeProjectId, userEmail);
                return { success: true, message: "Income item deleted successfully" };
            }

            case "delete_expense": {
                const expenseToDelete = await base44.asServiceRole.entities.ExpenseItem.filter({ id: args.expenseId });
                const expenseProjectId = expenseToDelete[0]?.projectId;
                await base44.asServiceRole.entities.ExpenseItem.delete(args.expenseId);
                if (expenseProjectId) await updateProjectTotals(base44, expenseProjectId, userEmail);
                return { success: true, message: "Expense item deleted successfully" };
            }

            case "delete_subscription": {
                await base44.asServiceRole.entities.RecurringSubscription.delete(args.subscriptionId);
                return { success: true, message: "Subscription deleted successfully" };
            }

            case "create_event": {
                const event = await base44.entities.Event.create({
                    projectId: args.projectId,
                    name: args.name,
                    startDate: args.startDate,
                    endDate: args.endDate || null,
                    notes: args.notes || "",
                    created_by: userEmail
                });
                return { success: true, event };
            }

            case "delete_event": {
                await base44.entities.Event.delete(args.eventId);
                return { success: true, message: "Event deleted successfully" };
            }

            case "get_events": {
                const events = await base44.entities.Event.filter({ projectId: args.projectId, created_by: userEmail }, '-startDate');
                return { success: true, events };
            }

            case "create_recurring_expense": {
                const subscription = await base44.entities.RecurringSubscription.create({
                    projectId: args.projectId,
                    name: args.name,
                    amount: args.amount,
                    frequency: args.frequency,
                    customDays: args.customDays || null,
                    startDate: args.startDate,
                    endDate: args.endDate || null,
                    category: args.category || "subscriptions",
                    notes: args.notes || "",
                    active: true,
                    created_by: userEmail
                });
                return { success: true, subscription };
            }
            
            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
        return { success: false, error: error.message };
    }
}

// Helper function to update project totals
async function updateProjectTotals(base44, projectId, userEmail) {
    try {
        const allIncome = await base44.entities.IncomeItem.filter({ projectId, created_by: userEmail });
        const allExpenses = await base44.entities.ExpenseItem.filter({ projectId, created_by: userEmail });
        
        const totalIncome = allIncome.reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalExpense = allExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
        
        await base44.entities.Project.update(projectId, {
            totalIncome,
            totalExpense
        });
    } catch (error) {
        console.error('Error updating project totals:', error);
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.error('No authenticated user found');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Processing chat for user:', user.email);

        const body = await req.json();
        const { message, conversationId, fileUrls } = body;

        console.log('Request body:', { message, conversationId, fileUrls });

        if (!message && (!fileUrls || fileUrls.length === 0)) {
            return Response.json({ error: 'Message is required' }, { status: 400 });
        }

        let conversation;
        let messages = [];

        // Load or create conversation
        if (conversationId) {
            console.log('Loading existing conversation:', conversationId);
            const conversations = await base44.entities.Conversation.filter({ id: conversationId });
            if (conversations.length > 0) {
                conversation = conversations[0];
                messages = conversation.messages || [];
                console.log('Loaded conversation with', messages.length, 'messages');
            } else {
                console.log('Conversation not found, creating new one');
                conversation = null;
            }
        }

        if (!conversation) {
            console.log('Creating new conversation');
            conversation = await base44.entities.Conversation.create({
                userEmail: user.email,
                messages: [],
                name: message.substring(0, 50),
                createdAt: new Date().toISOString()
            });
            messages = [];
            console.log('Created conversation:', conversation.id);
        }

        // Add user message — support vision if fileUrls provided
        if (fileUrls && fileUrls.length > 0) {
            const contentParts = [];
            if (message) {
                contentParts.push({ type: 'text', text: message });
            }
            for (const url of fileUrls) {
                contentParts.push({ type: 'image_url', image_url: { url, detail: 'high' } });
            }
            messages.push({ role: 'user', content: contentParts });
        } else {
            messages.push({ role: 'user', content: message });
        }

        // Get user profile for context
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        const profile = profiles[0];

        // Build system instructions (static, not from database)
        let instructions = `You are Ledgera AI, a personal CPA and financial advisor. Only greet on first message if conversation is empty. Skip intro for returning users.

IMPORTANT - FIRST MESSAGE LOGIC:
- Check if user has any existing Projects
- If they have projects, DO NOT ask what they do - they've already set up their business types! Just greet them warmly and ask how you can help today.
- ONLY ask 'what type of work do you do?' (e.g., graphic design, music, development, etc.) if they have zero Projects.
- When they tell you, create a new Project with that as the title instead of storing it as a profession.

If funMode is true in UserProfile, be conversational and friendly like talking to a friend about money - throw in a bad money pun or dad joke occasionally. Keep it light and relatable while still being helpful.

CRITICAL - PROJECT SELECTION FOR NEW TRANSACTIONS:
When user wants to add income/expenses and you need to assign them to a project:
1. TRY TO INFER THE PROJECT FIRST based on:
   - The nature of the expense/income and user's professions (e.g., Claude credits = app development, Figma = design work)
   - Keywords in the description that match a project name
   - If there's only ONE matching project that makes sense, assign to it directly
2. If you CANNOT confidently infer the project, THEN ask: "Which project should this go to?" and list options
3. If they have a project that perfectly matches (e.g., "App Development" project + Claude credits expense), assign it without asking
4. Offer option to create new project if none fit
5. Once assigned/confirmed, create the income/expense item

When user tells you what type of work they do (ONLY if they have no projects):
1. Create a Project with that work type as the name (e.g., "Graphic Design", "Music Production")
2. Confirm it's created and ask how you can help them manage finances for this business

CRITICAL - INCOME VS EXPENSE DETECTION:
When user mentions money coming IN or money they RECEIVED or EARNED:
- Payment received, client paid, got paid, earned, invoice paid, sold items, made a sale, revenue = INCOME
- Use create_income function

When user mentions money going OUT or money they SPENT or PAID:
- Bought supplies, paid for, spent on, purchased, expense, cost = EXPENSE
- Use create_expense function

Pay close attention to the context. If user says 'I got $500' that's INCOME. If they say 'I spent $500 on supplies' that's EXPENSE.

For INCOME: Ask when, amount, what for. Auto-assign to project. Create and confirm. You can also UPDATE or DELETE income items when the user requests.

For EXPENSES: Ask when, amount, category, vendor. Auto-assign to project. Create and confirm. You can also UPDATE or DELETE expense items when the user requests.

SMART EXPENSE CATEGORIZATION: When creating expenses, intelligently assign them to the most appropriate tax category based on the description and vendor.

RECATEGORIZING EXPENSES: When user asks to change category or move expenses, you can UPDATE the ExpenseItem with a new category.

For PROJECTS: Always create a project when user tells you their business. Create additional projects when requested. Track profitability. You can delete projects, and all associated income/expense/subscription records when user explicitly requests it.

For EVENTS: You can create and delete events, and list events for a project. When user mentions an upcoming event (gig, meeting, etc.), ask if they want to create an event record.

For RECURRING EXPENSES: The system is SMART and auto-detects recurring patterns:
1. When you record a subscription-like expense (Claude, Base44, Netflix, etc.), the system checks for similar past expenses
2. If 2+ transactions from the same vendor exist, it automatically creates a recurring subscription with:
   - Average amount calculated from all matching expenses
   - Frequency auto-detected from date gaps (weekly, monthly, yearly)
   - Auto-grouped with note explaining it was detected
3. If user explicitly requests recurring setup, use create_recurring_expense with the appropriate frequency
4. For frequency="yearly", set startDate to the first occurrence
5. For frequency="monthly", set startDate to the first month it occurs
6. If user specifies an end date, calculate endDate (e.g., "2026-12-31")
7. Don't mention the auto-detection to user unless relevant - just confirm the subscription was created
8. Users can always manually adjust or create subscriptions via the UI with the arrow button on expenses

DELETION OPERATIONS: You can now delete income items, expense items, subscriptions, events, and projects when the user requests it. Always confirm what's being deleted before doing so.

CRITICAL FOR FINANCIAL CALCULATIONS:
When calculating totals, profit, or any financial metrics, ALWAYS use Project.totalIncome and Project.totalExpense fields directly. NEVER sum up individual items. These fields are pre-calculated and guaranteed accurate.

For REPORTS: Summarize financials using Project totals. Calculate margins, ROI, and profit/loss from those totals.

MOVING ITEMS: You can update expense and income items to change their projectId to move them between projects.

FILE UPLOADS: When the message contains a [System: ...] note about file processing results, treat it as background context only. The user's ACTUAL request is the text before the [System: ...] tag.
CRITICAL FILE UPLOAD RULES:
- NEVER claim you have already added items unless you literally just called create_expense or create_income in THIS response
- NEVER say "I've already added those" based on a previous conversation turn — you CANNOT see the file contents anymore
- If user says "add these to [project]" and you don't have the specific line-item details right in front of you, ALWAYS ask: "I don't have the details from the file anymore — could you list the expenses (amount, vendor, date) and I'll add them right away?"
- Only confirm items are added AFTER you have actually called create_expense or create_income with real data

SCHEDULING CHECK-INS:
- When user mentions an upcoming event (gig, wedding, photoshoot, etc.), ASK if they want a reminder to log income/expenses after it's done
- If yes, use schedule_check_in with type="after_event" and scheduledFor set to the day AFTER the event
- When setting up weekly check-ins, use schedule_check_in with type="weekly" and scheduledFor set to their preferred day/time

Be conversational, ask clarifying questions, and offer proactive advice.

TAX PREPARATION: Proactively help users categorize expenses correctly for tax purposes.`;
        
        // Add profile context if available
        if (profile) {
            instructions += `\n\nUser's currency: ${profile.currency || 'USD'}`;
            instructions += `\nUser's locale: ${profile.locale || 'en-US'}`;
            if (profile.funMode) {
                instructions += "\nFun mode is ENABLED - be playful and use money puns!";
            }
            if (profile.darkMode) {
                instructions += "\nUser prefers dark mode.";
            }
        }

        // Clean messages before sending to OpenAI
        const cleanedMessages = cleanMessagesForOpenAI(messages);

        console.log('Calling OpenAI with', cleanedMessages.length, 'messages');

        // Call OpenAI
        let completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: instructions },
                ...cleanedMessages
            ],
            tools: tools,
            tool_choice: "auto"
        });

        console.log('OpenAI response received');

        let responseMessage = completion.choices[0].message;
        messages.push(responseMessage);

        // Handle tool calls
        while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            console.log('Processing', responseMessage.tool_calls.length, 'tool calls');
            
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);
                
                console.log(`Executing tool: ${functionName}`, functionArgs);
                
                const toolResult = await executeTool(functionName, functionArgs, base44, user.email);
                
                console.log(`Tool result for ${functionName}:`, toolResult);
                
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: functionName,
                    content: JSON.stringify(toolResult)
                });
            }

            // Clean messages again before next OpenAI call
            const cleanedMessagesForNextCall = cleanMessagesForOpenAI(messages);

            // Get next response
            completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: instructions },
                    ...cleanedMessagesForNextCall
                ],
                tools: tools,
                tool_choice: "auto"
            });

            responseMessage = completion.choices[0].message;
            messages.push(responseMessage);
        }

        // Sanitize messages before saving — multimodal content (arrays) must be stringified
        const messagesForDB = messages.map(msg => {
            if (msg.content && typeof msg.content !== 'string') {
                // Convert array content to plain text for storage
                const textParts = Array.isArray(msg.content)
                    ? msg.content.filter(p => p.type === 'text').map(p => p.text).join('\n')
                    : String(msg.content);
                return { ...msg, content: textParts || '[image]' };
            }
            return msg;
        });

        // Update conversation
        await base44.entities.Conversation.update(conversation.id, {
            messages: messagesForDB,
            name: conversation.name || message.substring(0, 50)
        });

        console.log('Conversation updated successfully');

        return Response.json({
            success: true,
            conversationId: conversation.id,
            response: responseMessage.content
        });

    } catch (error) {
        console.error('Error in processChat:', error);
        console.error('Error stack:', error.stack);
        
        return Response.json({ 
            error: error.message || 'Internal server error',
            details: error.stack
        }, { status: 500 });
    }
});