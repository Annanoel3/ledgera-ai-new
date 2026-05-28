import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, data } = body;

        // Bulk process income items
        if (action === 'bulkIncome') {
            const items = await base44.entities.IncomeItem.bulkCreate(data.items);
            return Response.json({
                success: true,
                count: items.length,
                total: items.reduce((sum, i) => sum + i.amount, 0)
            });
        }

        // Force-save pre-identified duplicate items
        if (action === 'processFiles' && data.preSavedItems && data.preSavedItems.length > 0 && data.forceSave) {
            let savedCount = 0;
            for (const item of data.preSavedItems) {
                if (item.type === 'income') {
                    await base44.entities.IncomeItem.create(item.fullData);
                } else {
                    await base44.entities.ExpenseItem.create(item.fullData);
                }
                savedCount++;
            }
            return Response.json({ success: true, forceSavedCount: savedCount });
        }

        // Bulk process expense items
        if (action === 'bulkExpenses') {
            const items = await base44.entities.ExpenseItem.bulkCreate(data.items);
            return Response.json({
                success: true,
                count: items.length,
                total: items.reduce((sum, i) => sum + i.amount, 0)
            });
        }

        // ROBUST file extraction with multiple fallback strategies
        if (action === 'processFiles') {
            let duplicateFiles = [];
            
            const allProjects = await base44.entities.Project.list();
            
            if (allProjects.length === 0) {
                return Response.json({ 
                    error: 'No projects found. Please create a project first.',
                    success: false 
                }, { status: 400 });
            }

            // Check for duplicate files by URL (not name, since names can repeat)
            const existingDocs = await base44.entities.Document.list();
            const filesToProcess = [];
            
            for (const file of data.files) {
                const isDuplicate = existingDocs.some(doc => 
                    doc.fileUrl === file.fileUrl
                );
                
                if (isDuplicate) {
                    duplicateFiles.push(file.fileName);
                } else {
                    filesToProcess.push(file);
                }
            }

            if (filesToProcess.length === 0) {
                return Response.json({
                    success: true,
                    message: 'All files already uploaded',
                    duplicateFiles,
                    documentsCreated: 0,
                    incomeCount: 0,
                    expenseCount: 0,
                    totalIncome: 0,
                    totalExpenses: 0
                });
            }

            const existingIncome = await base44.entities.IncomeItem.list();
            const existingExpenses = await base44.entities.ExpenseItem.list();

            // Analyze user message for context
            const userMessage = data.userMessage || '';
            const userMessageLower = userMessage.toLowerCase();
            const userSaysIncome = userMessageLower.includes('income') || 
                                   userMessageLower.includes('payment') ||
                                   userMessageLower.includes('got paid') ||
                                   userMessageLower.includes('earned') ||
                                   userMessageLower.includes('revenue');
            const userSaysExpense = userMessageLower.includes('expense') ||
                                    userMessageLower.includes('spent') ||
                                    userMessageLower.includes('bought') ||
                                    userMessageLower.includes('receipt') ||
                                    userMessageLower.includes('purchased');

            console.log('🔍 User context:', { userSaysIncome, userSaysExpense, message: userMessage });

            const allExtractedItems = [];
            
            // Keywords that ALWAYS mean income, never expense
            const incomeKeywords = [
                'gross income', 'revenue', 'sales', 'earnings', 'receipts', 
                'payment received', 'invoice paid', 'total sales', 'income from', 'amount received'
            ];
            
            // Keywords that ALWAYS mean expense, never income
            const expenseKeywords = [
                'paid to', 'payment to', 'purchased from', 'bought from',
                'cost of', 'expense to', 'spent on', 'total paid', 'amount due'
            ];
            
            // STRATEGY: Use GPT-4 Vision for images, ExtractDataFromUploadedFile for spreadsheets/docs
            for (const file of filesToProcess) {
                if (!file.fileUrl) {
                    console.warn(`⚠️ Skipping file with no URL: ${file.fileName}`);
                    continue;
                }
                
                try {
                    console.log(`📄 Processing file: ${file.fileName}`);
                    
                    // Build context-aware prompt
                    let typeHint = '';
                    if (userSaysIncome && !userSaysExpense) {
                        typeHint = 'The user indicated this is INCOME (money received/earned). Look for payment amounts, invoice totals, or earnings.';
                    } else if (userSaysExpense && !userSaysIncome) {
                        typeHint = 'The user indicated this is an EXPENSE (money paid/spent). Look for purchase amounts, receipt totals, or costs.';
                    }

                    const projectContext = `Available projects: ${allProjects.map(p => p.title).join(', ')}`;

                    const transactionSchema = {
                        type: "object",
                        properties: {
                            transactions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        date: { type: "string" },
                                        amount: { type: "number" },
                                        vendor: { type: "string" },
                                        description: { type: "string" },
                                        type: { type: "string" },
                                        projectHint: { type: "string" },
                                        confidence: { type: "string" }
                                    },
                                    required: ["amount"]
                                }
                            }
                        }
                    };

                    let visionResult = null;
                    const ext = (file.fileName || '').split('.').pop().toLowerCase();
                    const isSpreadsheet = ['xlsx', 'xls', 'csv'].includes(ext);

                    if (isSpreadsheet) {
                        // Use ExtractDataFromUploadedFile for spreadsheets
                        console.log(`📊 Using ExtractDataFromUploadedFile for spreadsheet: ${file.fileName}`);
                        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
                            file_url: file.fileUrl,
                            json_schema: transactionSchema
                        });
                        if (extractResult?.status === 'success' && extractResult?.output) {
                            visionResult = extractResult.output;
                        } else {
                            console.warn(`⚠️ ExtractDataFromUploadedFile failed for ${file.fileName}:`, extractResult?.details);
                        }
                    } else {
                        // Use InvokeLLM vision for images/PDFs
                        const extractionPrompt = `You are a financial document analyzer. Extract ALL financial transactions from this image.

${typeHint}
${projectContext}

CRITICAL CLASSIFICATION RULES:
- If you see ANY of these keywords in the document (description, vendor, or general text), it is definitively INCOME: "${incomeKeywords.join('", "')}".
- If you see ANY of these keywords in the document (description, vendor, or general text), it is definitively EXPENSE: "${expenseKeywords.join('", "')}".
- If "gross income" or "revenue" appears, it is INCOME. Do not classify it as an expense.
- Receipts where YOU paid = EXPENSE
- Invoices where THEY paid you = INCOME

For EACH transaction found, return:
- date: The transaction date in YYYY-MM-DD format. READ THE DATE DIRECTLY FROM THE DOCUMENT - look for any date printed on the receipt, invoice, or statement. Only if there is absolutely no date visible, use: ${new Date().toLocaleDateString('en-CA')})
- amount: The dollar amount as a number (e.g., 150.00, not "$150" or "150 dollars")
- vendor: Who was paid or who paid (company/person name)
- description: What was this for (service provided, item purchased, etc.)
- type: Either "income" (money received) or "expense" (money paid out). Apply critical classification rules strictly.
- projectHint: Best guess of which project from the list, or empty if unsure.
- confidence: "high", "medium", or "low" - how sure are you about the project assignment?

IMPORTANT RULES:
1. Extract EVERY amount you see - don't skip anything.
2. If you see multiple line items, extract each one separately.
3. PAY EXTREME ATTENTION TO THE CRITICAL CLASSIFICATION RULES FOR 'type'.
4. If you can't find a date in the document, use: ${new Date().toLocaleDateString('en-CA')}
5. Return at least one transaction even if partial information.

User's additional context: "${userMessage}"

Return JSON with an array of transactions.`;

                        visionResult = await base44.integrations.Core.InvokeLLM({
                            prompt: extractionPrompt,
                            file_urls: [file.fileUrl],
                            response_json_schema: transactionSchema
                        });
                    }

                    console.log(`📊 Extraction result for ${file.fileName}:`, visionResult);

                    if (visionResult?.transactions && Array.isArray(visionResult.transactions) && visionResult.transactions.length > 0) {
                        // VALIDATE and fix obvious mistakes based on hardcoded keywords
                        const validatedTransactions = visionResult.transactions.map(item => {
                            const description = (item.description || '').toLowerCase();
                            const vendor = (item.vendor || '').toLowerCase();
                            const searchText = `${description} ${vendor}`.toLowerCase();
                            
                            const hasIncomeKeyword = incomeKeywords.some(keyword => searchText.includes(keyword));
                            const hasExpenseKeyword = expenseKeywords.some(keyword => searchText.includes(keyword));
                            
                            // If an income keyword is present and it's not already classified as income, or it's classified as expense
                            if (hasIncomeKeyword && item.type !== 'income') {
                                console.log(`⚠️ CORRECTING: "${item.description}" was marked as ${item.type} but contains income keyword! FORCING to INCOME.`);
                                item.type = 'income';
                            } 
                            // Else if an expense keyword is present and it's not already classified as expense, or it's classified as income
                            else if (hasExpenseKeyword && item.type !== 'expense') {
                                console.log(`⚠️ CORRECTING: "${item.description}" was marked as ${item.type} but contains expense keyword! FORCING to EXPENSE.`);
                                item.type = 'expense';
                            }
                            // If both income and expense keywords are present, the first condition (income) takes precedence
                            // based on the spirit of the prompt prioritizing "gross income" etc.

                            return {
                                ...item,
                                fileName: file.fileName,
                                fileUrl: file.fileUrl
                            };
                        });
                        
                        allExtractedItems.push(...validatedTransactions);
                        console.log(`✅ Extracted ${validatedTransactions.length} transactions from ${file.fileName}`);
                    } else {
                        console.warn(`⚠️ No transactions extracted from ${file.fileName}`);
                    }
                } catch (e) {
                    console.error(`❌ Extraction error for ${file.fileName}:`, e);
                }
            }

            console.log(`📈 Total items extracted: ${allExtractedItems.length}`);

            // Process extracted items with smart categorization
            const incomeToCreate = [];
            const expensesToCreate = [];
            let duplicatesSkipped = 0;
            let uncertainAssignments = [];
            const pendingDuplicates = [];

            for (const item of allExtractedItems) {
                // Validate amount
                const parsedAmount = parseFloat(item.amount);
                if (isNaN(parsedAmount) || parsedAmount <= 0) {
                    console.warn(`⚠️ Skipping item with invalid amount: ${item.amount}`);
                    continue;
                }

                // Determine type with user override having highest priority
                let itemType = 'expense'; // Default to expense if unclear
                
                if (userSaysIncome && !userSaysExpense) {
                    itemType = 'income';
                    console.log(`💰 User override: Treating as income`);
                } else if (userSaysExpense && !userSaysIncome) {
                    itemType = 'expense';
                    console.log(`💳 User override: Treating as expense`);
                } else if (item.type) {
                    // Use AI's determination if user didn't specify
                    itemType = item.type.toLowerCase().includes('income') ? 'income' : 'expense';
                }

                // IMPROVED: Smart project assignment with confidence checking
                let assignedProject = null;
                let confidenceLevel = (item.confidence && ['high', 'medium', 'low'].includes(item.confidence.toLowerCase())) ? item.confidence.toLowerCase() : 'low'; // Start with AI's confidence, default low
                
                // Strategy 1: Use AI's projectHint if it provided one
                if (item.projectHint) {
                    const foundProject = allProjects.find(p => 
                        p.title.toLowerCase() === item.projectHint.toLowerCase() ||
                        p.title.toLowerCase().includes(item.projectHint.toLowerCase())
                    );
                    if (foundProject) {
                        assignedProject = foundProject;
                        // If AI provided a hint, and current confidence is not high, upgrade it
                        if (confidenceLevel === 'low' || confidenceLevel === 'medium') { 
                            confidenceLevel = 'high';
                        }
                        console.log(`🎯 AI matched to project: ${assignedProject.title} (AI hint confidence, current: ${confidenceLevel})`);
                    }
                }
                
                // Strategy 2: Check if user mentioned a project in their message
                if (!assignedProject && userMessage) {
                    for (const project of allProjects) {
                        if (userMessageLower.includes(project.title.toLowerCase())) {
                            assignedProject = project;
                            confidenceLevel = 'high'; // User explicit mention is high confidence
                            console.log(`🎯 User mentioned project: ${project.title} (current confidence: ${confidenceLevel})`);
                            break;
                        }
                    }
                }
                
                // Strategy 3: Match vendor/description to project name
                if (!assignedProject) {
                    const searchText = (item.vendor || item.description || '').toLowerCase();
                    let bestMatchProject = null;
                    let maxMatchScore = 0;

                    for (const project of allProjects) {
                        const projectKeywords = project.title.toLowerCase().split(' ').filter(k => k.length > 2); // Exclude very short words
                        const matchScore = projectKeywords.filter(keyword => 
                            searchText.includes(keyword)
                        ).length;
                        
                        if (matchScore > maxMatchScore) {
                            maxMatchScore = matchScore;
                            bestMatchProject = project;
                        }
                    }

                    if (bestMatchProject) {
                        assignedProject = bestMatchProject;
                        if (maxMatchScore >= 2) {
                            confidenceLevel = 'high'; // Strong keyword match
                        } else if (maxMatchScore === 1 && confidenceLevel === 'low') {
                            confidenceLevel = 'medium'; // Upgrade from low if at least one keyword matches
                        }
                        console.log(`📊 Keyword match (score: ${maxMatchScore}): ${assignedProject.title} (current confidence: ${confidenceLevel})`);
                    }
                }
                
                // Strategy 4: If only 1 project exists, use it
                if (!assignedProject && allProjects.length === 1) {
                    assignedProject = allProjects[0];
                    confidenceLevel = 'high'; // Only one option, so high confidence
                    console.log(`📁 Only one project, using: ${assignedProject.title} (current confidence: ${confidenceLevel})`);
                }
                
                // Strategy 5: Fallback to first project but mark as uncertain
                if (!assignedProject) {
                    assignedProject = allProjects[0];
                    confidenceLevel = 'low'; // Default assignment is always low confidence
                    console.log(`❓ Uncertain assignment, defaulting to: ${assignedProject.title} (current confidence: ${confidenceLevel})`);
                }

                // Determine the 'confident' boolean for tracking purposes
                const confidentForTracking = confidenceLevel === 'high';

                const transactionData = {
                    projectId: assignedProject.id,
                    amount: parsedAmount,
                    date: ((item.date || new Date().toISOString().split('T')[0]).split('T')[0]) + 'T12:00:00',
                    notes: item.description || item.vendor || `From ${item.fileName}`,
                    vendor: item.vendor || '',
                    category: item.category || 'other'
                };

                // Track uncertain assignments so AI can ask about them
                if (!confidentForTracking) {
                    uncertainAssignments.push({
                        amount: parsedAmount,
                        description: item.description || item.vendor,
                        assignedProject: assignedProject.title,
                        type: itemType,
                        confidence: confidenceLevel // Also include confidence level for debugging
                    });
                }

                // Duplicate check: same amount + date + project + notes (vendor) to avoid false positives
                const isDuplicate = !data.forceSave && (itemType === 'income' ? existingIncome : existingExpenses).some(existing =>
                    Math.abs(existing.amount - transactionData.amount) < 0.01 &&
                    existing.date === transactionData.date &&
                    existing.projectId === transactionData.projectId &&
                    (existing.notes || '').toLowerCase() === (transactionData.notes || '').toLowerCase()
                );

                if (isDuplicate) {
                    duplicatesSkipped++;
                    pendingDuplicates.push({
                        amount: parsedAmount,
                        date: transactionData.date,
                        notes: transactionData.notes,
                        vendor: item.vendor || '',
                        type: itemType,
                        projectId: transactionData.projectId,
                        projectName: assignedProject.title,
                        fullData: itemType === 'income'
                            ? { ...transactionData, category: 'service', method: 'other' }
                            : { ...transactionData, vendor: item.vendor || 'Unknown', category: 'other' }
                    });
                    console.log(`⏭️ Flagging duplicate for user confirmation: $${parsedAmount} on ${transactionData.date}`);
                    continue;
                }

                if (itemType === 'income') {
                    incomeToCreate.push({
                        ...transactionData,
                        category: item.category || 'service',
                        method: 'other'
                    });
                } else {
                    expensesToCreate.push({
                        ...transactionData
                    });
                }
            }

            console.log(`📝 Creating ${incomeToCreate.length} income items and ${expensesToCreate.length} expense items`);

            // Create transactions individually to avoid bulk truncation
            let createdIncome = [];
            let createdExpenses = [];

            for (const item of incomeToCreate) {
                const created = await base44.entities.IncomeItem.create(item);
                createdIncome.push(created);
            }
            if (createdIncome.length > 0) console.log(`✅ Created ${createdIncome.length} income items`);

            for (const item of expensesToCreate) {
                const created = await base44.entities.ExpenseItem.create(item);
                createdExpenses.push(created);
            }
            if (createdExpenses.length > 0) console.log(`✅ Created ${createdExpenses.length} expense items`);

            // Create document records
            const documentsCreated = [];
            for (const file of filesToProcess) {
                const docProjectId = allProjects[0]?.id; // Default to first project for document if no specific one assigned
                if (!docProjectId) continue;

                try {
                    const createdDoc = await base44.entities.Document.create({
                        fileName: file.fileName,
                        fileUrl: file.fileUrl,
                        fileType: file.fileType || 'other',
                        uploadDate: new Date().toISOString().split('T')[0],
                        projectId: docProjectId
                    });
                    documentsCreated.push(createdDoc);
                } catch (docError) {
                    console.error(`Error creating document for ${file.fileName}:`, docError);
                }
            }
            console.log(`📁 Created ${documentsCreated.length} document records`);

            const totalIncome = createdIncome.reduce((sum, item) => sum + item.amount, 0);
            const totalExpenses = createdExpenses.reduce((sum, item) => sum + item.amount, 0);

            return Response.json({
                success: true,
                documentsCreated: documentsCreated.length,
                incomeCount: createdIncome.length,
                expenseCount: createdExpenses.length,
                totalIncome,
                totalExpenses,
                duplicatesSkipped,
                uncertainAssignments: uncertainAssignments.length > 0 ? uncertainAssignments : undefined,
                duplicateFiles: duplicateFiles.length > 0 ? duplicateFiles : undefined,
                pendingDuplicates: pendingDuplicates.length > 0 ? pendingDuplicates : undefined
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('❌ Error in processFinancialData:', error);
        return Response.json({
            error: error.message || 'Internal server error',
            success: false
        }, { status: 500 });
    }
});