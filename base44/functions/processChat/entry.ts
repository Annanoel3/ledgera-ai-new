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
            description: "Updates an existing income item. IMPORTANT: If you don't already have the incomeId, call get_income first to find the record by amount, date, or notes — never ask the user for an ID.",
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
            description: "Updates an existing expense item. Use this to recategorize expenses or move them between projects. IMPORTANT: If you don't already have the expenseId, call get_expenses first to find the record by amount, date, vendor, or notes — never ask the user for an ID.",
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
            description: "Creates a recurring subscription/expense that repeats at a set interval. ONLY call this when the user has EXPLICITLY asked to create a recurring subscription or convert an existing expense to recurring. NEVER call this automatically based on vendor name or patterns.",
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

    return trimmed.map((msg, i) => {
        const cleaned = { ...msg };
        
        // Remove empty tool_calls arrays
        if (cleaned.tool_calls && Array.isArray(cleaned.tool_calls) && cleaned.tool_calls.length === 0) {
            delete cleaned.tool_calls;
        }
        
        // Remove empty content strings for tool messages, or set a default
        if (cleaned.role === 'tool' && !cleaned.content) {
            cleaned.content = 'Function executed successfully';
        }

        // Normalize array content — only the LATEST user message with images is valid multimodal.
        // Strip image_url parts from all older messages to prevent context bleed across uploads.
        if (Array.isArray(cleaned.content)) {
            const isLastMessage = i === trimmed.length - 1;
            const hasImagePart = cleaned.content.some(p => p.type === 'image_url');
            if (cleaned.role === 'user' && hasImagePart && isLastMessage) {
                // Latest vision message — leave as-is
            } else {
                // Flatten to plain text only (strip images from older messages)
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

        // Separate image files from spreadsheet/document files
        const fileUrlsArray = Array.isArray(fileUrls) ? fileUrls : (fileUrls ? [fileUrls] : []);
        const fileNamesArray = Array.isArray(body.fileNames) ? body.fileNames : (body.fileNames ? [body.fileNames] : []);
        
        const spreadsheetExtensions = ['xlsx', 'xls', 'csv'];
        const imageUrls = [];
        const spreadsheetFiles = [];
        
        fileUrlsArray.forEach((url, i) => {
            const fileName = fileNamesArray[i] || '';
            const ext = fileName.split('.').pop().toLowerCase();
            if (spreadsheetExtensions.includes(ext)) {
                spreadsheetFiles.push({ fileUrl: url, fileName });
            } else {
                imageUrls.push(url);
            }
        });

        // Pre-process spreadsheets via processFinancialData so expenses exist before the AI responds
        let spreadsheetSummary = '';
        if (spreadsheetFiles.length > 0) {
            try {
                console.log('Pre-processing spreadsheet files:', spreadsheetFiles.map(f => f.fileName));
                const procResult = await base44.asServiceRole.functions.invoke('processFinancialData', {
                    action: 'processFiles',
                    files: spreadsheetFiles,
                    userMessage: message || ''
                });
                console.log('Spreadsheet processing result:', procResult);
                const r = procResult?.data || procResult;
                spreadsheetSummary = `[System: Spreadsheet(s) were processed automatically. Created ${r.expenseCount || 0} expense(s) and ${r.incomeCount || 0} income item(s) totaling $${((r.totalExpenses || 0) + (r.totalIncome || 0)).toFixed(2)}. ${r.uncertainAssignments?.length ? `Project assignment was uncertain for ${r.uncertainAssignments.length} item(s): ${JSON.stringify(r.uncertainAssignments)}` : ''} The records now exist in the database — use get_expenses/get_income to find them by amount, date, or vendor, then update their project assignment per the user's request.]`;
            } catch (err) {
                console.error('Spreadsheet pre-processing error:', err);
                spreadsheetSummary = `[System: Attempted to process spreadsheet but encountered an error: ${err.message}]`;
            }
        }

        // Add user message — support vision if image fileUrls provided
        if (imageUrls.length > 0) {
            const contentParts = [];
            if (message) {
                contentParts.push({ type: 'text', text: message });
            }
            if (spreadsheetSummary) {
                contentParts.push({ type: 'text', text: spreadsheetSummary });
            }
            for (const url of imageUrls) {
                contentParts.push({ type: 'image_url', image_url: { url, detail: 'high' } });
            }
            messages.push({ role: 'user', content: contentParts });
        } else {
            const fullMessage = [message, spreadsheetSummary].filter(Boolean).join('\n');
            messages.push({ role: 'user', content: fullMessage || '' });
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
- NEVER ask the user for expense IDs, income IDs, or any internal record IDs. You have tools to look up records by date, amount, vendor, or project. Always use those tools to find records yourself
- When a user wants to move, assign, or modify an expense/income, ALWAYS call get_expenses or get_income FIRST to find the matching record by amount, date, vendor, notes, or other details — THEN use update_expense or update_income
- NEVER ask "which expense do you want to move?" — instead, call get_expenses with the projectId parameter to see what's there, or call it without a filter to search all records
- If you need to find a recent expense the user just uploaded, search by amount, date (today), vendor name, or description they provided

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
- When a user uploads a receipt, invoice, or expense image and asks you to add it:
  1. Extract the amount, date, vendor, category, and notes from the image
  2. If you're unsure which project it belongs to, ask the user or search existing projects
  3. Create the expense record(s) using create_expense
  4. After creating, the expense ID will be auto-generated — you do NOT need the user to provide IDs
- Extract ALL visible fields: amount, date (YYYY-MM-DD), vendor (exactly as printed), category, and notes
- Always populate vendor, notes, and category — do NOT leave them blank if readable
- Category options: supplies, travel, homeOffice, equipment, marketing, professional, utilities, education, insurance, other
- If the user later asks to move, modify, or reference these expenses, use get_expenses to find them by recent date/amount/vendor
- Do NOT ask the user for expense IDs under any circumstances — the system auto-generates them when you create records

RECURRING SUBSCRIPTIONS (STRICT):
- NEVER create a recurring subscription automatically, even if the vendor name sounds like a subscription service
- Only create a recurring subscription when the user EXPLICITLY says they want one (e.g. "set this up as recurring", "I pay this every month", "add a recurring subscription")
- When a user asks to convert an existing expense to recurring, ask them: the frequency (monthly/yearly/weekly), the start date, and whether they'd like it scheduled through a specific end date
- Do NOT suggest or nudge the user to create recurring subscriptions unprompted

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