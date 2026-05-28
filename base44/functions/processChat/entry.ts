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
    // Keep only the last 40 messages to avoid context bloat
    const trimmed = messages.slice(-40);

    return trimmed.map(msg => {
        const cleaned = { ...msg };
        
        // Remove empty tool_calls arrays
        if (cleaned.tool_calls && Array.isArray(cleaned.tool_calls) && cleaned.tool_calls.length === 0) {
            delete cleaned.tool_calls;
        }
        
        // Remove empty content strings for tool messages, or set a default
        if (cleaned.role === 'tool' && !cleaned.content) {
            cleaned.content = 'Function executed successfully';
        }

        // Normalize array content — only user messages with image_url parts are valid multimodal
        // All other array content (e.g. stale stored arrays) must be flattened to a string
        if (Array.isArray(cleaned.content)) {
            const hasImagePart = cleaned.content.some(p => p.type === 'image_url');
            if (cleaned.role === 'user' && hasImagePart) {
                // Valid vision message — leave as-is
            } else {
                // Flatten to plain text
                cleaned.content = cleaned.content
                    .filter(p => p.type === 'text')
                    .map(p => p.text)
                    .join('\n') || '';
            }
        }

        // Ensure content is always a string for non-user roles
        if (cleaned.role !== 'user' && cleaned.content !== null && cleaned.content !== undefined && typeof cleaned.content !== 'string') {
            cleaned.content = String(cleaned.content);
        }

        // Truncate large tool result payloads (e.g. get_income/get_expenses) to avoid token overflow
        if (cleaned.role === 'tool' && cleaned.content && cleaned.content.length > 3000) {
            try {
                const parsed = JSON.parse(cleaned.content);
                // Summarize large arrays
                if (parsed.income && Array.isArray(parsed.income)) {
                    parsed.income = parsed.income.slice(0, 20);
                    parsed._truncated = true;
                }
                if (parsed.expenses && Array.isArray(parsed.expenses)) {
                    parsed.expenses = parsed.expenses.slice(0, 20);
                    parsed._truncated = true;
                }
                cleaned.content = JSON.stringify(parsed);
            } catch (_) {
                cleaned.content = cleaned.content.substring(0, 3000) + '...[truncated]';
            }
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
                name: (message || '').substring(0, 50),
                createdAt: new Date().toISOString()
            });
            messages = [];
            console.log('Created conversation:', conversation.id);
        }

        // Add user message — support vision if fileUrls provided
        const fileUrlsArray = Array.isArray(fileUrls) ? fileUrls : (fileUrls ? [fileUrls] : []);
        if (fileUrlsArray.length > 0) {
            const contentParts = [];
            if (message) {
                contentParts.push({ type: 'text', text: message });
            }
            for (const url of fileUrlsArray) {
                contentParts.push({ type: 'image_url', image_url: { url, detail: 'high' } });
            }
            messages.push({ role: 'user', content: contentParts });
        } else {
            messages.push({ role: 'user', content: message || '' });
        }

        // Get user profile for context
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        const profile = profiles[0];

        // Build system instructions (static, not from database)
        let instructions = `You are Ledgera AI, a personal CPA and financial advisor. CRITICAL: Respect user intent exactly and never make unauthorized changes.

ABSOLUTE RULES - NEVER VIOLATE:
- NEVER modify, rename, recategorize, or change any financial record unless the user explicitly asked for that specific change in their current message
- NEVER guess at project assignments. If the user says "add to app development", only assign to a project whose name clearly matches "app development". If no match exists, ask the user
- NEVER change vendor/payee names. Store them exactly as they appear in the uploaded image or as the user typed them
- NEVER perform bulk operations (delete all, move all, etc.) without listing exactly what will be affected and asking the user to confirm first
- When extracting expenses from an image, extract ONLY what is visible. Do not infer, guess, or fill in missing fields
- If you are unsure about any field, leave it blank or ask the user — do not make something up
- NEVER delete anything without explicit user confirmation
- NEVER modify amounts, dates, or categories without explicit user request

GREETINGS:
- Only greet on first message if conversation is empty
- For returning users, skip the intro and ask how you can help

If funMode is true, be conversational and friendly with money puns. Keep it light while staying helpful.

PROJECT ASSIGNMENT (STRICT):
When extracting transactions or creating records:
1. If user specifies a project name, search for exact or very clear matches only
2. If no clear match, ask the user which project to use instead of guessing
3. Never assign multiple items to different projects without explicit user instruction for each

TRANSACTION CREATION:
- Only create when user has explicitly provided all required details
- For INCOME: Ask for amount, date, project if missing
- For EXPENSES: Ask for amount, date, vendor (from image/user), and project if missing
- Wait for explicit user confirmation before executing any create tool

FILE PROCESSING (RECEIPTS & EXPENSE IMAGES):
- When a user uploads a receipt, invoice, or expense image, ALWAYS extract ALL of the following fields if visible:
  * amount: the total amount paid
  * date: the transaction date (YYYY-MM-DD format)
  * vendor: the store/merchant/payee name exactly as printed
  * category: choose the best match from [supplies, travel, homeOffice, equipment, marketing, professional, utilities, education, insurance, other] based on the merchant type
  * notes: a brief description of what was purchased (e.g., "Office supplies - paper and pens", "Lunch with client", "Gas for travel")
  * projectId: ask the user which project to assign to if not already specified
- Always populate vendor, notes, and category — do NOT leave them blank if the information is readable in the image
- For vendor: use the business name exactly as it appears on the receipt
- For notes: include what was purchased, not just the store name
- For category: infer from the merchant type (e.g., gas station = travel, restaurant = other or marketing if client meal, office supply store = supplies)
- Do NOT infer missing amounts or dates — ask the user if illegible
- Treat [System: ...] notes as context only — the actual user request is the text before that

DELETION & UPDATES:
- Always list specific items being affected (date, amount, vendor/description) before deleting
- Get explicit user approval for every delete or update operation
- Never batch-delete or batch-update without itemized confirmation

Be conversational, ask clarifying questions, and wait for explicit user intent before taking action.`;
        
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
            tool_choice: "auto",
            max_tokens: 4096
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
                tool_choice: "auto",
                max_tokens: 4096
            });

            responseMessage = completion.choices[0].message;
            messages.push(responseMessage);
        }

        // Sanitize messages before saving — only keep user/assistant messages, always store content as string
        const messagesForDB = messages
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .map(msg => {
                const { tool_calls, ...rest } = msg;
                // Always flatten array content to a plain string for DB storage
                if (Array.isArray(rest.content)) {
                    rest.content = rest.content
                        .filter(p => p.type === 'text')
                        .map(p => p.text)
                        .join('\n') || '[image]';
                }
                // Ensure content is always a string
                if (typeof rest.content !== 'string') {
                    rest.content = rest.content != null ? String(rest.content) : '';
                }
                return rest;
            });

        // Update conversation
        await base44.entities.Conversation.update(conversation.id, {
            messages: messagesForDB,
            name: conversation.name || (message || '').substring(0, 50)
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