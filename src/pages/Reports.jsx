
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import { startOfYear, endOfYear, startOfMonth, endOfMonth, format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Reports() {
  const initialYear = new Date().getFullYear().toString();
  const initialMonth = "all";
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [activeTab, setActiveTab] = useState("income");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [easterEggOpen, setEasterEggOpen] = useState(false);
  const [gifIndex, setGifIndex] = useState(0);
  const queryClient = useQueryClient();

  const funnyGifs = [
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHJ3NWM3aGo4OWF2M2d0MG5hYmQ4dHp5dGh3MG5hYmQ4dHp5dGh3MG5hYmQ4dHp5dGh3MG5hYmQ4dHp5dGh3MG5hYmQ4dHp5dGh3MG5hYmQ4dHp5dGh3MG5hYmQ4dHp5dGh3MG5hYmQ4dHp5dGh3MG5hYmQ4dHp5dGh3MG5hYmQ4dHp5/67ThRZlYBvibtdF9JH/giphy.gif", // Great job celebration
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", // Money raining
    "https://media.giphy.com/media/LdOyjZ7io5Msw/giphy.gif", // Make it rain
    "https://media.giphy.com/media/3oKIPa2TdahY8LAAxy/giphy.gif", // Scrooge McDuck swimming in money
    "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif", // Arrested Development "I've made a huge mistake"
    "https://media.giphy.com/media/l3vRgiN4fSg8rkJy0/giphy.gif", // Wolf of Wall Street chest pound
  ];

  const handleEasterEggClick = () => {
    setEasterEggOpen(true);
    setGifIndex((prev) => (prev + 1) % funnyGifs.length);
  };

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return null;
      }
      return await base44.auth.me();
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!user) return [];
      
      const allProjects = await base44.entities.Project.filter({ created_by: user.email }, '-created_date');
      const allIncome = await base44.entities.IncomeItem.filter({ created_by: user.email });
      const allExpenses = await base44.entities.ExpenseItem.filter({ created_by: user.email });
      
      return allProjects.map(project => {
        const projectIncome = allIncome
          .filter(item => item.projectId === project.id)
          .reduce((sum, item) => sum + (item.amount || 0), 0);
        
        const projectExpenses = allExpenses
          .filter(item => item.projectId === project.id)
          .reduce((sum, item) => sum + (item.amount || 0), 0);
        
        return {
          ...project,
          totalIncome: projectIncome,
          totalExpense: projectExpenses,
        };
      });
    },
    initialData: [],
    enabled: !!user,
  });

  const { data: incomeItems } = useQuery({
    queryKey: ['incomeItems'],
    queryFn: () => {
      if (!user) return [];
      return base44.entities.IncomeItem.filter({ created_by: user.email }, '-date');
    },
    initialData: [],
    enabled: !!user,
  });

  const { data: expenseItems } = useQuery({
    queryKey: ['expenseItems'],
    queryFn: () => {
      if (!user) return [];
      return base44.entities.ExpenseItem.filter({ created_by: user.email }, '-date');
    },
    initialData: [],
    enabled: !!user,
  });

  const formatCurrency = (amount) => {
    if (!profile) return `$${amount.toFixed(2)}`;
    return new Intl.NumberFormat(profile.locale || 'en-US', {
      style: 'currency',
      currency: profile.currency || 'USD',
    }).format(amount);
  };

  let yearStart, yearEnd;
  
  if (selectedMonth !== "all") {
    const monthNum = parseInt(selectedMonth);
    yearStart = startOfMonth(new Date(parseInt(selectedYear), monthNum - 1, 1));
    yearEnd = endOfMonth(new Date(parseInt(selectedYear), monthNum - 1, 1));
  } else {
    yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
    yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
  }

  const filterByYearAndProject = (items) => {
    return items.filter(item => {
      const itemDate = new Date(item.date);
      const dateMatch = itemDate >= yearStart && itemDate <= yearEnd;
      const projectMatch = selectedProjectId === "all" || item.projectId === selectedProjectId;
      return dateMatch && projectMatch;
    });
  };

  const yearIncomeItems = filterByYearAndProject(incomeItems);
  const yearExpenseItems = filterByYearAndProject(expenseItems);

  const totalRevenue = yearIncomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = yearExpenseItems.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  const expensesByCategory = yearExpenseItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    acc[cat] = (acc[cat] || 0) + item.amount;
    return acc;
  }, {});

  const incomeByCategory = yearIncomeItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    acc[cat] = (acc[cat] || 0) + item.amount;
    return acc;
  }, {});

  const allYearIncomeItems = incomeItems.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= yearStart && itemDate <= yearEnd;
  });

  const allYearExpenseItems = expenseItems.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= yearStart && itemDate <= yearEnd;
  });

  const yearProjectIncomeMap = allYearIncomeItems.reduce((acc, item) => {
    if (item.projectId) {
      acc[item.projectId] = (acc[item.projectId] || 0) + item.amount;
    }
    return acc;
  }, {});

  const yearProjectExpenseMap = allYearExpenseItems.reduce((acc, item) => {
    if (item.projectId) {
      acc[item.projectId] = (acc[item.projectId] || 0) + item.amount;
    }
    return acc;
  }, {});

  const projectROI = projects.map(p => {
    const revenue = yearProjectIncomeMap[p.id] || 0;
    const expenses = yearProjectExpenseMap[p.id] || 0;
    const profit = revenue - expenses;
    const roi = expenses > 0 ? (((revenue - expenses) / expenses) * 100).toFixed(1) : 0;
    const margin = revenue > 0 ? (((revenue - expenses) / revenue) * 100).toFixed(1) : 0;
    return {
      ...p,
      revenue,
      expenses,
      profit,
      roi,
      margin,
    };
  }).sort((a, b) => b.profit - a.profit);

  const currentAssets = totalRevenue;
  const currentLiabilities = 0;
  const equity = netIncome;

  const quarterlyBreakdown = [];
  for (let q = 1; q <= 4; q++) {
    const qStart = startOfMonth(new Date(parseInt(selectedYear), (q - 1) * 3, 1));
    const qEnd = endOfMonth(new Date(parseInt(selectedYear), (q - 1) * 3 + 2, 1));
    
    const qIncome = allYearIncomeItems.filter(item => {
      const d = new Date(item.date);
      return d >= qStart && d <= qEnd;
    }).reduce((sum, item) => sum + item.amount, 0);

    const qExpenses = allYearExpenseItems.filter(item => {
      const d = new Date(item.date);
      return d >= qStart && d <= qEnd;
    }).reduce((sum, item) => sum + item.amount, 0);

    quarterlyBreakdown.push({
      quarter: `Q${q}`,
      income: qIncome,
      expenses: qExpenses,
      profit: qIncome - qExpenses,
      estimatedTax: (qIncome - qExpenses) * 0.25,
    });
  }

  const categoryLabels = {
    travel: 'Travel & Transportation',
    homeOffice: 'Home Office',
    supplies: 'Supplies & Materials',
    equipment: 'Equipment & Software',
    marketing: 'Marketing & Advertising',
    professional: 'Professional Services',
    utilities: 'Utilities & Communications',
    education: 'Education & Training',
    insurance: 'Business Insurance',
    other: 'Other Business Expenses',
  };

  const getCategoryExpenses = (category) => {
    // Get ALL expenses for the selected year/month period first
    const periodExpenses = expenseItems.filter(e => {
      const itemDate = new Date(e.date);
      return itemDate >= yearStart && itemDate <= yearEnd;
    });

    return periodExpenses.filter(e => {
      // Direct category match - always include
      if (e.category === category) {
        return true;
      }

      // For keyword-based matching, define keywords per category
      const keywords = {
        travel: ['travel', 'transport', 'uber', 'lyft', 'taxi', 'mileage', 'gas', 'fuel', 'hotel', 'airbnb', 'flight', 'parking'],
        homeOffice: ['home office', 'rent', 'mortgage', 'desk', 'chair', 'home workspace'],
        supplies: ['supplies', 'material', 'inventory', 'wax', 'wick', 'fragrance', 'jar', 'label', 'packaging', 'paper', 'pen', 'candle', 'soap', 'craft'],
        equipment: ['equipment', 'software', 'hardware', 'computer', 'tool', 'laptop', 'phone', 'tablet', 'subscription', 'saas', 'app'],
        marketing: ['marketing', 'advertising', 'ad', 'promotion', 'social media', 'facebook', 'instagram', 'google ads', 'seo'],
        professional: ['professional', 'legal', 'accounting', 'consulting', 'lawyer', 'accountant', 'cpa', 'attorney', 'consultant'],
        utilities: ['utilities', 'phone', 'internet', 'electricity', 'water', 'cell', 'wifi', 'broadband'],
        education: ['education', 'training', 'course', 'seminar', 'workshop', 'conference', 'book', 'udemy', 'coursera', 'class'],
        insurance: ['insurance', 'liability', 'health insurance', 'business insurance', 'coverage', 'policy'],
      };

      // Build search text from all fields
      const searchText = `${e.category || ''} ${e.notes || ''} ${e.vendor || ''}`.toLowerCase();
      
      // For "other" category, show items that don't match any specific category
      if (category === 'other') {
        // If already categorized, don't show in other
        if (e.category && e.category !== 'other') {
          return false;
        }
        
        // Check if it matches any known category keywords
        const allKeywords = Object.values(keywords).flat();
        const matchesAnyCategory = allKeywords.some(keyword => searchText.includes(keyword));
        
        // Show in "other" if it doesn't match any category
        return !matchesAnyCategory;
      }
      
      // For specific categories, check keywords if not explicitly categorized
      if (keywords[category]) {
        return keywords[category].some(keyword => searchText.includes(keyword));
      }
      
      return false;
    });
  };

  const taxCategories = {};
  Object.keys(categoryLabels).forEach(cat => {
    const expenses = getCategoryExpenses(cat);
    taxCategories[cat] = {
      expenses,
      amount: expenses.reduce((sum, e) => sum + e.amount, 0)
    };
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (itemId) => base44.entities.ExpenseItem.delete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseItems']);
      queryClient.invalidateQueries(['projects']);
      toast.success("Expense deleted successfully");
      if (selectedCategory) {
        const refreshed = getCategoryExpenses(selectedCategory);
        setCategoryExpenses(refreshed);
      }
    },
    onError: (error) => {
      console.error('Delete expense error:', error);
      if (error.message?.includes('not found')) {
        toast.error("This expense was already deleted");
        queryClient.invalidateQueries(['expenseItems']); // Invalidate anyway to ensure consistency
        queryClient.invalidateQueries(['projects']); // Invalidate anyway to ensure consistency
      } else {
        toast.error("Failed to delete expense: " + (error?.message || "Unknown error"));
      }
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ExpenseItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseItems']);
      queryClient.invalidateQueries(['projects']); // Invalidate projects to update ROI/expenses
      toast.success("Expense updated");
      if (selectedCategory) {
        // Re-fetch and update category expenses after mutation
        const refreshed = getCategoryExpenses(selectedCategory);
        setCategoryExpenses(refreshed);
      }
    },
    onError: (error) => {
      console.error('Update expense error:', error);
      toast.error("Failed to update expense: " + (error?.message || "Unknown error"));
    }
  });

  const handleViewCategory = (categoryKey) => {
    setSelectedCategory(categoryKey);
    const expenses = getCategoryExpenses(categoryKey);
    setCategoryExpenses(expenses);
  };

  const handleUpdateExpenseCategory = async (expenseId, newCategory) => {
    try {
      await updateExpenseMutation.mutateAsync({
        id: expenseId,
        data: { category: newCategory }
      });
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDeleteExpense = async (e, itemId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this expense item? This action cannot be undone.")) {
      try {
        console.log('Attempting to delete expense:', itemId);
        await deleteExpenseMutation.mutateAsync(itemId);
        console.log('Expense deleted successfully');
      } catch (error) {
        console.error('Deletion process caught an error:', error);
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedYear(initialYear);
    setSelectedMonth(initialMonth);
    setSelectedProjectId("all");
    setActiveTab("income");
    toast.info("Report filters reset.");
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Generating comprehensive PDF report...");
      
      const response = await base44.functions.invoke('exportFinancialData', {
        projects: projects,
        income: allYearIncomeItems,
        expenses: allYearExpenseItems,
        currency: profile?.currency || 'USD',
        locale: profile?.locale || 'en-US',
        selectedYear: selectedYear,
        selectedMonth: selectedMonth !== "all" ? parseInt(selectedMonth) : null
      });
      
      if (!response || !response.data) {
        throw new Error('No data received from server');
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const monthName = selectedMonth !== "all" ? months.find(m => m.value === selectedMonth)?.label : null;
      const fileName = selectedMonth !== "all" 
        ? `ledgera-report-${selectedYear}-${monthName}.pdf`
        : `ledgera-report-${selectedYear}.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success("Professional financial report downloaded!");
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF: " + (error.message || 'Unknown error'));
    }
  };

  const availableYears = ['2024', '2025'];
  const months = [
    { value: "all", label: "Full Year" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  if (userLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#22A699]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Financial Reports</h1>
            <p style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Professional accounting reports for your business</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32" style={{
                backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#ffffff' : '#111827'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}` }}>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year} style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40" style={{
                backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#ffffff' : '#111827'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}` }}>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value} style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleResetFilters} style={{
              backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
              color: profile?.darkMode ? '#ffffff' : '#111827'
            }}>
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportPDF} style={{
              backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
              color: profile?.darkMode ? '#ffffff' : '#111827'
            }}>
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Easter Egg Button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={handleEasterEggClick}
            className="text-xs opacity-30 hover:opacity-60 transition-opacity"
            style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}
          >
            👀 don't click this
          </button>
        </div>

        <Tabs defaultValue="income" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 mb-16" style={{ backgroundColor: 'transparent', border: 'none' }}>
            <TabsTrigger 
              value="income" 
              className="flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all w-full"
              style={{
                backgroundColor: activeTab === 'income'
                  ? '#22A699'
                  : (profile?.darkMode ? '#1f2937' : '#f3f4f6'),
                border: activeTab === 'income'
                  ? '1px solid #22A699'
                  : `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: activeTab === 'income'
                  ? '#ffffff'
                  : (profile?.darkMode ? '#d1d5db' : '#374151')
              }}
            >
              Income Statement
            </TabsTrigger>
            <TabsTrigger 
              value="balance" 
              className="flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all w-full"
              style={{
                backgroundColor: activeTab === 'balance'
                  ? '#22A699'
                  : (profile?.darkMode ? '#1f2937' : '#f3f4f6'),
                border: activeTab === 'balance'
                  ? '1px solid #22A699'
                  : `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: activeTab === 'balance'
                  ? '#ffffff'
                  : (profile?.darkMode ? '#d1d5db' : '#374151')
              }}
            >
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger 
              value="roi" 
              className="flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all w-full"
              style={{
                backgroundColor: activeTab === 'roi'
                  ? '#22A699'
                  : (profile?.darkMode ? '#1f2937' : '#f3f4f6'),
                border: activeTab === 'roi'
                  ? '1px solid #22A699'
                  : `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: activeTab === 'roi'
                  ? '#ffffff'
                  : (profile?.darkMode ? '#d1d5db' : '#374151')
              }}
            >
              Project ROI
            </TabsTrigger>
            <TabsTrigger 
              value="tax" 
              className="flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all w-full"
              style={{
                backgroundColor: activeTab === 'tax'
                  ? '#22A699'
                  : (profile?.darkMode ? '#1f2937' : '#f3f4f6'),
                border: activeTab === 'tax'
                  ? '1px solid #22A699'
                  : `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: activeTab === 'tax'
                  ? '#ffffff'
                  : (profile?.darkMode ? '#d1d5db' : '#374151')
              }}
            >
              Tax Prep
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4" style={{ marginTop: '6rem' }}>
            <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                  Income Statement - {selectedYear} {selectedMonth !== "all" ? months.find(m => m.value === selectedMonth)?.label : ''}
                  {selectedProjectId !== "all" && (
                    <span className="text-sm font-normal ml-2" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                      ({projects.find(p => p.id === selectedProjectId)?.title})
                    </span>
                  )}
                </CardTitle>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-48" style={{
                    backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                    color: profile?.darkMode ? '#ffffff' : '#111827'
                  }}>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}` }}>
                    <SelectItem value="all" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id} style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Revenue</h3>
                    <Table>
                      <TableBody>
                        {Object.entries(incomeByCategory).map(([cat, amount]) => (
                          <TableRow key={cat}>
                            <TableCell className="font-medium capitalize" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{cat}</TableCell>
                            <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2">
                          <TableCell className="font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Total Revenue</TableCell>
                          <TableCell className="text-right font-bold text-[#22A699]">
                            {formatCurrency(totalRevenue)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Expenses</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Category</TableHead>
                          <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Amount</TableHead>
                          <TableHead style={{ width: '40px' }}></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(expensesByCategory).map(([cat, amount]) => (
                          <TableRow 
                            key={cat}
                            onClick={() => handleViewCategory(cat)}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = profile?.darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <TableCell className="font-medium capitalize" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{categoryLabels[cat] || cat}</TableCell>
                            <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(amount)}</TableCell>
                            <TableCell className="text-right">
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2">
                          <TableCell className="font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Total Expenses</TableCell>
                          <TableCell className="text-right font-bold text-red-600" colSpan={2}>
                            {formatCurrency(totalExpenses)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="border-t-2 pt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xl" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Net Income</h3>
                      <p className={`font-bold text-2xl ${netIncome >= 0 ? 'text-[#22A699]' : 'text-red-600'}`}>
                        {formatCurrency(netIncome)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" style={{ marginTop: '6rem' }}>
            <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardHeader>
                <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Balance Sheet - {selectedYear} {selectedMonth !== "all" ? months.find(m => m.value === selectedMonth)?.label : ''}</CardTitle>
                <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                  A snapshot of your business financial health at a point in time. 
                  (Simplified for cash-basis operations)
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Assets</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>Cash (from operations)</TableCell>
                          <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(currentAssets)}</TableCell>
                        </TableRow>
                        <TableRow className="border-t-2">
                          <TableCell className="font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Total Assets</TableCell>
                          <TableCell className="text-right font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{formatCurrency(currentAssets)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Liabilities</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>Current Liabilities</TableCell>
                          <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(currentLiabilities)}</TableCell>
                        </TableRow>
                        <TableRow className="border-t-2">
                          <TableCell className="font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Total Liabilities</TableCell>
                          <TableCell className="text-right font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{formatCurrency(currentLiabilities)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Equity</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>Owner's Equity / Retained Earnings</TableCell>
                          <TableCell className={`text-right ${equity >= 0 ? 'text-[#22A699]' : 'text-red-500'}`}>
                            {formatCurrency(equity)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-t-2">
                          <TableCell className="font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Total Equity</TableCell>
                          <TableCell className={`text-right font-bold ${equity >= 0 ? 'text-[#22A699]' : 'text-red-500'}`}>
                            {formatCurrency(equity)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="border-t-2 pt-4 mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Assets = Liabilities + Equity</h3>
                    <p className={`font-bold text-2xl ${currentAssets === (currentLiabilities + equity) ? 'text-[#22A699]' : 'text-red-600'}`}>
                      {formatCurrency(currentAssets)} = {formatCurrency(currentLiabilities + equity)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roi" style={{ marginTop: '6rem' }}>
            <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardHeader>
                <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Project ROI Analysis - {selectedYear} {selectedMonth !== "all" ? months.find(m => m.value === selectedMonth)?.label : ''}</CardTitle>
              </CardHeader>
              <CardContent>
                {projectROI.length === 0 ? (
                  <p className="text-center text-gray-500" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>No projects with income or expenses for this period.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Project</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Revenue</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Expenses</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Profit</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>ROI</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectROI.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{project.title}</TableCell>
                          <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(project.revenue)}</TableCell>
                          <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(project.expenses)}</TableCell>
                          <TableCell className={`text-right font-semibold ${project.profit >= 0 ? 'text-[#22A699]' : 'text-red-600'}`}>
                            {formatCurrency(project.profit)}
                          </TableCell>
                          <TableCell className={`text-right ${project.roi >= 0 ? 'text-[#22A699]' : 'text-red-600'}`}>
                            {project.roi}%
                          </TableCell>
                          <TableCell className={`text-right ${project.margin >= 0 ? 'text-[#22A699]' : 'text-red-600'}`}>
                            {project.margin}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" style={{ marginTop: '6rem' }}>
            <div className="space-y-6">
              <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
                <CardHeader>
                  <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Year-End Tax Summary - {selectedYear} {selectedMonth !== "all" ? months.find(m => m.value === selectedMonth)?.label : ''}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="rounded-lg p-4" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
                      <p className="text-sm mb-1" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Total Income</p>
                      <p className="text-2xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div className="rounded-lg p-4" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
                      <p className="text-sm mb-1" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Total Deductions</p>
                      <p className="text-2xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{formatCurrency(totalExpenses)}</p>
                    </div>
                    <div className="rounded-lg p-4" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
                      <p className="text-sm mb-1" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Taxable Income</p>
                      <p className="text-2xl font-bold text-[#22A699]">{formatCurrency(netIncome)}</p>
                      {netIncome < 0 && (
                        <p className="text-sm mt-2" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                          No tax owed — business loss this period
                        </p>
                      )}
                    </div>
                  </div>

                  {netIncome >= 0 && (
                    <div className="rounded-lg p-4 mb-6" style={{
                      backgroundColor: profile?.darkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                      borderColor: profile?.darkMode ? '#1e40af' : '#bfdbfe'
                    }}>
                      <h4 className="font-semibold mb-2" style={{ color: profile?.darkMode ? '#bfdbfe' : '#1e40af' }}>💡 Tax Tip</h4>
                      <p className="text-sm" style={{ color: profile?.darkMode ? '#93c5fd' : '#1e40af' }}>
                        As a self-employed individual, you may owe quarterly estimated taxes. 
                        Keep 25-30% of your net income aside for federal and state taxes.
                      </p>
                    </div>
                  )}
                  
                  {netIncome < 0 && (
                    <div className="rounded-lg p-4 mb-6" style={{
                      backgroundColor: profile?.darkMode ? 'rgba(234, 179, 8, 0.2)' : '#fefce8',
                      borderColor: profile?.darkMode ? '#a16207' : '#fde047'
                    }}>
                      <h4 className="font-semibold mb-2" style={{ color: profile?.darkMode ? '#fde047' : '#a16207' }}>💡 Business Loss Note</h4>
                      <p className="text-sm" style={{ color: profile?.darkMode ? '#fde68a' : '#a16207' }}>
                        You have a business loss this period. This loss may be deductible against other income on your tax return. 
                        Consult with a tax professional to understand how to use this loss.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
                <CardHeader>
                  <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Deductible Expense Categories</CardTitle>
                  <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Click any category to view and edit expenses</p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Category</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Amount</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Items</TableHead>
                        <TableHead style={{ width: '40px' }}></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(taxCategories).map(([key, data]) => {
                        if (data.amount === 0) return null;
                        return (
                          <TableRow 
                            key={key}
                            onClick={() => handleViewCategory(key)}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = profile?.darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <TableCell className="font-medium" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>
                              {categoryLabels[key]}
                            </TableCell>
                            <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(data.amount)}</TableCell>
                            <TableCell className="text-right text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                              {data.expenses.length}
                            </TableCell>
                            <TableCell className="text-right">
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Total Deductions</TableCell>
                        <TableCell className="text-right font-bold text-[#22A699]" colSpan={3}>
                          {formatCurrency(totalExpenses)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
                <CardHeader>
                  <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Quarterly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Quarter</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Income</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Expenses</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Profit</TableHead>
                        <TableHead className="text-right" style={{ color: profile?.darkMode ? '#cbd5e1' : '#64748b' }}>Est. Tax (25%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quarterlyBreakdown.map((q) => (
                        <TableRow key={q.quarter}>
                          <TableCell className="font-medium" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{q.quarter}</TableCell>
                          <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(q.income)}</TableCell>
                          <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(q.expenses)}</TableCell>
                          <TableCell className="text-right" style={{ color: profile?.darkMode ? '#e0e7ed' : '#374151' }}>{formatCurrency(q.profit)}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">
                            {formatCurrency(q.estimatedTax)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Easter Egg Dialog */}
      <Dialog open={easterEggOpen} onOpenChange={setEasterEggOpen}>
        <DialogContent className="max-w-lg" style={{
          backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`
        }}>
          <DialogHeader>
            <DialogTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
              🎉 You Found It!
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <img 
              src={funnyGifs[gifIndex]} 
              alt="Celebration"
              className="w-full max-w-md rounded-lg mb-4"
            />
            <p className="text-center text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
              Click again for more financial wisdom 😎
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Expenses Dialog */}
      <Dialog open={selectedCategory !== null} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{
          backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`
        }}>
          <DialogHeader>
            <DialogTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
              {selectedCategory && `${categoryLabels[selectedCategory] || (selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1))} Expenses`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {categoryExpenses.length === 0 ? (
              <p className="text-center py-8" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                No expenses in this category for {selectedYear} {selectedMonth !== "all" ? months.find(m => m.value === selectedMonth)?.label : 'this period'}.
              </p>
            ) : (
              categoryExpenses.map((expense) => {
                const expenseProject = projects.find(p => p.id === expense.projectId);
                return (
                  <div 
                    key={expense.id} 
                    className="p-4 rounded-lg border space-y-3"
                    style={{
                      backgroundColor: profile?.darkMode ? '#374151' : '#f9fafb',
                      border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-base mb-1" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                          {expense.notes || 'No description'}
                        </p>
                        <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                          {expense.vendor || 'No vendor'} • {format(new Date(expense.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <p className="font-semibold text-lg" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* PROJECT DROPDOWN - First */}
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium" style={{ color: profile?.darkMode ? '#ffffff' : '#111827', minWidth: '80px' }}>
                          Project:
                        </Label>
                        <Select
                          value={expense.projectId || ''}
                          onValueChange={(newProjectId) => {
                            updateExpenseMutation.mutate({
                              id: expense.id,
                              data: { projectId: newProjectId }
                            });
                          }}
                        >
                          <SelectTrigger className="flex-1" style={{
                            backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                            color: profile?.darkMode ? '#ffffff' : '#111827'
                          }}>
                            <SelectValue placeholder="Select project">
                              {expenseProject?.title || 'Select project'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent style={{
                            backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                            border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`
                          }}>
                            {projects.map(proj => (
                              <SelectItem key={proj.id} value={proj.id} style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                                {proj.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* CATEGORY DROPDOWN - Second */}
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium" style={{ color: profile?.darkMode ? '#ffffff' : '#111827', minWidth: '80px' }}>
                          Recategorize:
                        </Label>
                        <Select
                          value={expense.category || 'other'}
                          onValueChange={(newCat) => handleUpdateExpenseCategory(expense.id, newCat)}
                        >
                          <SelectTrigger className="flex-1" style={{
                            backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                            color: profile?.darkMode ? '#ffffff' : '#111827'
                          }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent style={{
                            backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                            border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`
                          }}>
                            {Object.keys(categoryLabels).map(catKey => (
                              <SelectItem key={catKey} value={catKey} style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                                {categoryLabels[catKey]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* DELETE BUTTON */}
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={(e) => handleDeleteExpense(e, expense.id)}
                          disabled={deleteExpenseMutation.isPending}
                        >
                          {deleteExpenseMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
