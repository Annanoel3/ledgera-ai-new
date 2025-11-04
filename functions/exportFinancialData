
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';
import 'npm:jspdf-autotable@3.5.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projects, income, expenses, currency, locale, selectedYear, selectedMonth } = body;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Ledgera brand colors
    const primaryColor = [34, 166, 153];
    const lightTeal = [178, 226, 221];
    const darkGray = [31, 41, 55];

    // Helper to format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat(locale || 'en-US', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(amount);
    };

    // Calculate totals
    const totalIncome = income.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const profit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : 0;

    // =======================
    // PAGE 1: VISUAL SUMMARY
    // =======================

    // Background gradient effect
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative top bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Simple logo design (instead of loading image)
    doc.setFillColor(...primaryColor);
    doc.circle(25, 25, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('L', 25, 29, { align: 'center' });

    // Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('FINANCIAL REPORT', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    const periodText = selectedMonth ? 
      `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}` : 
      selectedYear;
    doc.text(periodText, pageWidth / 2, 40, { align: 'center' });

    // Summary boxes - SMALLER -> now slightly larger
    let yPos = 65;
    const boxWidth = (pageWidth - 40) / 3;
    const boxHeight = 22;
    
    // Total Income Box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, yPos, boxWidth - 5, boxHeight, 3, 3, 'F');
    doc.setDrawColor(...lightTeal);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, yPos, boxWidth - 5, boxHeight, 3, 3, 'S');
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10); // Changed from 8
    doc.setFont(undefined, 'normal');
    doc.text('TOTAL INCOME', 20 + (boxWidth - 5) / 2, yPos + 7, { align: 'center' });
    
    doc.setFontSize(16); // Changed from 14
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(formatCurrency(totalIncome), 20 + (boxWidth - 5) / 2, yPos + 16, { align: 'center' });

    // Total Expenses Box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20 + boxWidth, yPos, boxWidth - 5, boxHeight, 3, 3, 'F');
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(20 + boxWidth, yPos, boxWidth - 5, boxHeight, 3, 3, 'S');
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10); // Changed from 8
    doc.setFont(undefined, 'normal');
    doc.text('TOTAL EXPENSES', 20 + boxWidth + (boxWidth - 5) / 2, yPos + 7, { align: 'center' });
    
    doc.setFontSize(16); // Changed from 14
    doc.setFont(undefined, 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(totalExpenses), 20 + boxWidth + (boxWidth - 5) / 2, yPos + 16, { align: 'center' });

    // Profit Box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20 + boxWidth * 2, yPos, boxWidth - 5, boxHeight, 3, 3, 'F');
    if (profit >= 0) {
      doc.setDrawColor(...lightTeal);
    } else {
      doc.setDrawColor(254, 202, 202);
    }
    doc.setLineWidth(0.5);
    doc.roundedRect(20 + boxWidth * 2, yPos, boxWidth - 5, boxHeight, 3, 3, 'S');
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10); // Changed from 8
    doc.setFont(undefined, 'normal');
    doc.text('NET PROFIT', 20 + boxWidth * 2 + (boxWidth - 5) / 2, yPos + 7, { align: 'center' });
    
    doc.setFontSize(16); // Changed from 14
    if (profit >= 0) {
      doc.setTextColor(...primaryColor);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(formatCurrency(profit), 20 + boxWidth * 2 + (boxWidth - 5) / 2, yPos + 16, { align: 'center' });

    yPos += 28;

    // Key Performance Indicators
    const kpiBoxWidth = (pageWidth - 60) / 4;
    const kpis = [
      { label: 'Profit Margin', value: `${profitMargin}%` },
      { label: 'Transactions', value: `${income.length + expenses.length}` },
      { label: 'Avg Income', value: formatCurrency(income.length > 0 ? totalIncome / income.length : 0) },
      { label: 'Avg Expense', value: formatCurrency(expenses.length > 0 ? totalExpenses / expenses.length : 0) }
    ];

    kpis.forEach((kpi, idx) => {
      const xPos = 20 + (kpiBoxWidth + 5) * idx;
      
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(xPos, yPos, kpiBoxWidth, 16, 2, 2, 'F');
      
      doc.setFontSize(13); // Changed from 9 (+4)
      doc.setTextColor(100, 116, 139);
      doc.setFont(undefined, 'normal');
      doc.text(kpi.label, xPos + 6, yPos + 6);
      
      doc.setFontSize(15); // Changed from 11 (+4)
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...darkGray);
      doc.text(kpi.value, xPos + 6, yPos + 12);
    });

    yPos += 22;

    // Income Breakdown by PROJECT
    doc.setFillColor(...primaryColor);
    doc.roundedRect(20, yPos, pageWidth - 40, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); // Changed from 12 (+2 for consistency)
    doc.setFont(undefined, 'bold');
    doc.text('Income by Project', 25, yPos + 6);

    yPos += 12;

    // Group income by PROJECT
    const incomeByProject = income.reduce((acc, item) => {
      const projectId = item.projectId;
      const project = projects.find(p => p.id === projectId);
      const projectName = project ? project.title : 'Uncategorized';
      
      if (!acc[projectName]) acc[projectName] = { amount: 0, count: 0 };
      acc[projectName].amount += item.amount;
      acc[projectName].count += 1;
      return acc;
    }, {});

    const sortedIncome = Object.entries(incomeByProject).sort((a, b) => b[1].amount - a[1].amount);
    const topIncome = sortedIncome.slice(0, 5);

    topIncome.forEach(([projectName, data]) => {
      const percentage = totalIncome > 0 ? ((data.amount / totalIncome) * 100).toFixed(1) : 0;
      const barWidth = Math.max((data.amount / totalIncome) * (pageWidth - 100), 5);
      
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, yPos, pageWidth - 40, 11, 2, 2, 'F');
      
      // Colored bar
      doc.setFillColor(...primaryColor);
      doc.roundedRect(22, yPos + 1.5, barWidth, 8, 1, 1, 'F');
      
      doc.setFontSize(14); // Changed from 10 (+4)
      doc.setTextColor(...darkGray);
      doc.setFont(undefined, 'bold');
      doc.text(projectName, 26, yPos + 7);
      
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(14); // Changed from 10 (+4)
      doc.text(`${formatCurrency(data.amount)} (${percentage}%)`, pageWidth - 25, yPos + 7, { align: 'right' });
      
      yPos += 13;
    });

    yPos += 4;

    // Expense Breakdown
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(20, yPos, pageWidth - 40, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); // Changed from 12 (+2 for consistency)
    doc.setFont(undefined, 'bold');
    doc.text('Expense Breakdown', 25, yPos + 6);

    yPos += 12;

    const expensesByCategory = expenses.reduce((acc, item) => {
      const cat = item.category || 'other';
      if (!acc[cat]) acc[cat] = { amount: 0, count: 0 };
      acc[cat].amount += item.amount;
      acc[cat].count += 1;
      return acc;
    }, {});

    const sortedExpenses = Object.entries(expensesByCategory).sort((a, b) => b[1].amount - a[1].amount);
    const topExpenses = sortedExpenses.slice(0, 5);

    topExpenses.forEach(([cat, data]) => {
      const percentage = totalExpenses > 0 ? ((data.amount / totalExpenses) * 100).toFixed(1) : 0;
      const barWidth = Math.max((data.amount / totalExpenses) * (pageWidth - 100), 5);
      
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, yPos, pageWidth - 40, 11, 2, 2, 'F');
      
      // Colored bar
      doc.setFillColor(239, 68, 68);
      doc.roundedRect(22, yPos + 1.5, barWidth, 8, 1, 1, 'F');
      
      doc.setFontSize(14); // Changed from 10 (+4)
      doc.setTextColor(...darkGray);
      doc.setFont(undefined, 'bold');
      doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), 26, yPos + 7);
      
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(14); // Changed from 10 (+4)
      doc.text(`${formatCurrency(data.amount)} (${percentage}%)`, pageWidth - 25, yPos + 7, { align: 'right' });
      
      yPos += 13;
    });

    // =======================
    // PAGE 2: BALANCE SHEET
    // =======================

    doc.addPage();
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('BALANCE SHEET', pageWidth / 2, 16, { align: 'center' });

    yPos = 35;

    // Calculate balance sheet items
    const cashFromOperations = totalIncome;
    const accountsReceivable = 0;
    const inventory = 0;
    
    const totalCurrentAssets = cashFromOperations + accountsReceivable + inventory;
    const propertyEquipment = 0;
    const totalNonCurrentAssets = propertyEquipment;
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const accountsPayable = 0;
    const currentLiabilities = accountsPayable;
    const longTermDebt = 0;
    const totalLiabilities = currentLiabilities + longTermDebt;

    const ownersEquity = profit;
    const totalEquity = ownersEquity;

    // Assets Section - COMPACT
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Assets', 20, yPos);

    yPos += 8;

    // Current Assets
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Current Assets', 25, yPos);
    yPos += 6;

    const currentAssetsItems = [
      { label: 'Cash and cash equivalents', amount: cashFromOperations },
      { label: 'Accounts receivable', amount: accountsReceivable },
      { label: 'Inventory', amount: inventory }
    ];

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);

    currentAssetsItems.forEach(item => {
      doc.text(item.label, 30, yPos);
      doc.text(formatCurrency(item.amount), pageWidth - 25, yPos, { align: 'right' });
      yPos += 5;
    });

    yPos += 1;
    doc.setFont(undefined, 'bold');
    doc.text('Total current assets', 30, yPos);
    doc.text(formatCurrency(totalCurrentAssets), pageWidth - 25, yPos, { align: 'right' });
    yPos += 8;

    // Non-current Assets
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Non-current Assets', 25, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);
    doc.text('Property, plant and equipment', 30, yPos);
    doc.text(formatCurrency(propertyEquipment), pageWidth - 25, yPos, { align: 'right' });
    yPos += 5;

    doc.setFont(undefined, 'bold');
    doc.text('Total non-current assets', 30, yPos);
    doc.text(formatCurrency(totalNonCurrentAssets), pageWidth - 25, yPos, { align: 'right' });
    yPos += 6;

    // Total Assets
    doc.setFillColor(...lightTeal);
    doc.rect(20, yPos - 1.5, pageWidth - 40, 7, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...darkGray);
    doc.text('TOTAL ASSETS', 25, yPos + 3);
    doc.text(formatCurrency(totalAssets), pageWidth - 25, yPos + 3, { align: 'right' });

    yPos += 12;

    // Liabilities Section - COMPACT
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Liabilities and Owner\'s Equity', 20, yPos);
    yPos += 8;

    // Current Liabilities
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text('Current Liabilities', 25, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);
    doc.text('Accounts payable', 30, yPos);
    doc.text(formatCurrency(accountsPayable), pageWidth - 25, yPos, { align: 'right' });
    yPos += 5;

    doc.setFont(undefined, 'bold');
    doc.text('Total current liabilities', 30, yPos);
    doc.text(formatCurrency(currentLiabilities), pageWidth - 25, yPos, { align: 'right' });
    yPos += 8;

    // Non-current Liabilities
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text('Non-current Liabilities', 25, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);
    doc.text('Long-term debt', 30, yPos);
    doc.text(formatCurrency(longTermDebt), pageWidth - 25, yPos, { align: 'right' });
    yPos += 5;

    doc.setFont(undefined, 'bold');
    doc.text('Total non-current liabilities', 30, yPos);
    doc.text(formatCurrency(longTermDebt), pageWidth - 25, yPos, { align: 'right' });
    yPos += 6;

    // Total Liabilities
    doc.setFillColor(254, 202, 202);
    doc.rect(20, yPos - 1.5, pageWidth - 40, 7, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...darkGray);
    doc.text('TOTAL LIABILITIES', 25, yPos + 3);
    doc.text(formatCurrency(totalLiabilities), pageWidth - 25, yPos + 3, { align: 'right' });

    yPos += 12;

    // Owner's Equity
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Owner\'s Equity', 25, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);
    doc.text('Retained earnings', 30, yPos);
    if (ownersEquity >= 0) {
      doc.setTextColor(...primaryColor);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(formatCurrency(ownersEquity), pageWidth - 25, yPos, { align: 'right' });
    yPos += 5;

    doc.setFont(undefined, 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Total equity', 30, yPos);
    if (totalEquity >= 0) {
      doc.setTextColor(...primaryColor);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(formatCurrency(totalEquity), pageWidth - 25, yPos, { align: 'right' });
    yPos += 6;

    // Total Liabilities + Equity
    doc.setFillColor(...lightTeal);
    doc.rect(20, yPos - 1.5, pageWidth - 40, 7, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...darkGray);
    doc.text('TOTAL LIABILITIES + EQUITY', 25, yPos + 3);
    doc.text(formatCurrency(totalLiabilities + totalEquity), pageWidth - 25, yPos + 3, { align: 'right' });

    // =======================
    // PAGE 3: TRANSACTIONS
    // =======================

    doc.addPage();
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = 20;

    // Income Transactions
    doc.setFillColor(...primaryColor);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Income Transactions', 20, yPos + 6);

    yPos += 12;

    const incomeTableData = income.map(item => {
      const project = projects.find(p => p.id === item.projectId);
      return [
        new Date(item.date).toLocaleDateString(locale),
        project ? project.title : 'N/A',
        formatCurrency(item.amount),
        (item.notes || '').substring(0, 30)
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Project', 'Amount', 'Notes']],
      body: incomeTableData,
      theme: 'plain',
      headStyles: {
        fillColor: lightTeal,
        textColor: darkGray,
        fontStyle: 'bold',
        fontSize: 7
      },
      bodyStyles: {
        textColor: darkGray,
        fontSize: 6
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 'auto' }
      }
    });

    yPos = doc.lastAutoTable.finalY + 12;

    if (yPos > pageHeight - 80) {
      doc.addPage();
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      yPos = 20;
    }

    // Expense Transactions
    doc.setFillColor(239, 68, 68);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Expense Transactions', 20, yPos + 6);

    yPos += 12;

    const expenseTableData = expenses.map(item => [
      new Date(item.date).toLocaleDateString(locale),
      item.category || 'other',
      item.vendor || '-',
      formatCurrency(item.amount),
      (item.notes || '').substring(0, 25)
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Category', 'Vendor', 'Amount', 'Notes']],
      body: expenseTableData,
      theme: 'plain',
      headStyles: {
        fillColor: [254, 202, 202],
        textColor: darkGray,
        fontStyle: 'bold',
        fontSize: 7
      },
      bodyStyles: {
        textColor: darkGray,
        fontSize: 6
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 22 },
        2: { cellWidth: 25 },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 'auto' }
      }
    });

    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Generated by Ledgera AI - ${new Date().toLocaleDateString(locale || 'en-US')} - Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=ledgera-report-${periodText.replace(/\s/g, '-')}.pdf`
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ 
      error: 'PDF generation failed',
      details: error.message 
    }, { status: 500 });
  }
});
