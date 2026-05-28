import React, { useCallback, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Loader2 as RefreshIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, ArrowRight, Loader2, FolderKanban, CalendarDays, TrendingUp as TrendingUpIcon, FileText, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { startOfMonth, endOfMonth, subMonths, format, startOfYear, endOfYear } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import QuickEditItem from "../components/dashboard/QuickEditItem";
import { toast } from "sonner";
import { deleteExpenseItem } from "@/functions/deleteExpenseItem";
import { deleteIncomeItem } from "@/functions/deleteIncomeItem";
import { useYear } from "@/lib/YearContext";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { selectedYear, setSelectedYear } = useYear();
  const [selectedMonth, setSelectedMonth] = React.useState('all');
  const [recentActivityOpen, setRecentActivityOpen] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const { refreshing, pullDistance } = usePullToRefresh(handleRefresh);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return null;
      }
      return await base44.auth.me();
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!user) return [];
      const allProjects = await base44.entities.Project.filter({ created_by: user.email }, '-created_date');
      const allIncome = await base44.entities.IncomeItem.filter({ created_by: user.email });
      const allExpenses = await base44.entities.ExpenseItem.filter({ created_by: user.email });

      return allProjects.map((project) => {
        const projectIncome = allIncome.
        filter((item) => item.projectId === project.id).
        reduce((sum, item) => sum + (item.amount || 0), 0);

        const projectExpenses = allExpenses.
        filter((item) => item.projectId === project.id).
        reduce((sum, item) => sum + (item.amount || 0), 0);

        return {
          ...project,
          totalIncome: projectIncome,
          totalExpense: projectExpenses
        };
      });
    },
    initialData: [],
    enabled: !!user
  });

  const { data: incomeItems } = useQuery({
    queryKey: ['incomeItems'],
    queryFn: async () => {
      const allProjects = await base44.entities.Project.filter({ created_by: user.email });
      const projectIds = allProjects.map(p => p.id);
      const items = await base44.entities.IncomeItem.list('-date', 500);
      return items.filter(item => projectIds.includes(item.projectId));
    },
    initialData: [],
    enabled: !!user
  });

  const { data: expenseItems } = useQuery({
    queryKey: ['expenseItems'],
    queryFn: async () => {
      const allProjects = await base44.entities.Project.filter({ created_by: user.email });
      const projectIds = allProjects.map(p => p.id);
      const items = await base44.entities.ExpenseItem.list('-date', 500);
      return items.filter(item => projectIds.includes(item.projectId));
    },
    initialData: [],
    enabled: !!user
  });

  const formatCurrency = (amount) => {
    if (!profile) return `$${amount.toFixed(2)}`;
    return new Intl.NumberFormat(profile.locale || 'en-US', {
      style: 'currency',
      currency: profile.currency || 'USD'
    }).format(amount);
  };

  // Add update mutations
  const updateIncomeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IncomeItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomeItems']);
      queryClient.invalidateQueries(['projects']);
      toast.success("Updated!");
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ExpenseItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseItems']);
      queryClient.invalidateQueries(['projects']);
      toast.success("Updated!");
    }
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (id) => deleteIncomeItem({ itemId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomeItems']);
      queryClient.invalidateQueries(['projects']);
      toast.success("Deleted!");
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => deleteExpenseItem({ itemId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseItems']);
      queryClient.invalidateQueries(['projects']);
      toast.success("Deleted!");
    }
  });

  const convertMutation = useMutation({
    mutationFn: async ({ id, fromType, toType, data }) => {
      // Delete from old type
      if (fromType === 'income') {
        await deleteIncomeItem({ itemId: id });
        return await base44.entities.ExpenseItem.create(data);
      } else {
        await deleteExpenseItem({ itemId: id });
        return await base44.entities.IncomeItem.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['incomeItems']);
      queryClient.invalidateQueries(['expenseItems']);
      queryClient.invalidateQueries(['projects']);
      toast.success("Converted!");
    }
  });

  const handleUpdateIncome = async (id, data) => {
    await updateIncomeMutation.mutateAsync({ id, data });
  };

  const handleUpdateExpense = async (id, data) => {
    await updateExpenseMutation.mutateAsync({ id, data });
  };

  const handleDeleteIncome = async (id) => {
    await deleteIncomeMutation.mutateAsync(id);
  };

  const handleDeleteExpense = async (id) => {
    await deleteExpenseMutation.mutateAsync(id);
  };

  const handleConvertIncome = async (id) => {
    const item = incomeItems.find((i) => i.id === id);
    if (!item) {
      toast.error("Item not found for conversion.");
      return;
    }

    const newData = {
      projectId: item.projectId,
      amount: item.amount,
      date: item.date,
      category: 'other', // Default category for converted items
      vendor: item.notes || '', // Using notes as vendor for income to expense
      notes: item.notes || '',
      created_by: user.email // Ensure created_by is passed
    };

    await convertMutation.mutateAsync({ id, fromType: 'income', toType: 'expense', data: newData });
  };

  const handleConvertExpense = async (id) => {
    const item = expenseItems.find((i) => i.id === id);
    if (!item) {
      toast.error("Item not found for conversion.");
      return;
    }

    const newData = {
      projectId: item.projectId,
      amount: item.amount,
      date: item.date,
      category: 'other', // Default category for converted items
      notes: item.notes || item.vendor || '', // Using notes/vendor as notes for expense to income
      created_by: user.email // Ensure created_by is passed
    };

    await convertMutation.mutateAsync({ id, fromType: 'expense', toType: 'income', data: newData });
  };

  // Get all years from data
  const allYears = [...new Set([
    ...incomeItems.map(item => new Date(item.date).getFullYear()),
    ...expenseItems.map(item => new Date(item.date).getFullYear()),
    new Date().getFullYear() // Always include current year
  ])].sort((a, b) => b - a);
  const availableYears = allYears.map(y => y.toString());

  // Filter by year + period
  const yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
  const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
  const today = new Date();
  const ytdEnd = today;

  const displayMonthNum = (selectedMonth !== 'all' && selectedMonth !== 'ytd') ? parseInt(selectedMonth) : new Date().getMonth();
  const monthStart = startOfMonth(new Date(parseInt(selectedYear), displayMonthNum, 1));
  const monthEnd = endOfMonth(new Date(parseInt(selectedYear), displayMonthNum, 1));

  const filterByPeriod = (items) => items.filter((item) => {
    const itemDate = new Date(item.date);
    if (selectedMonth === 'all') return itemDate >= yearStart && itemDate <= yearEnd;
    if (selectedMonth === 'ytd') return itemDate >= yearStart && itemDate <= ytdEnd;
    return itemDate >= monthStart && itemDate <= monthEnd;
  });

  const yearIncomeItems = filterByPeriod(incomeItems);
  const yearExpenseItems = filterByPeriod(expenseItems);

  const periodIncome = yearIncomeItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const periodExpenses = yearExpenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const periodProfit = periodIncome - periodExpenses;

  // Calculate 6-month chart data (always uses all items for year context)
  const allYearIncomeItems = incomeItems.filter(item => { const d = new Date(item.date); return d >= yearStart && d <= yearEnd; });
  const allYearExpenseItems = expenseItems.filter(item => { const d = new Date(item.date); return d >= yearStart && d <= yearEnd; });

  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(parseInt(selectedYear), new Date().getMonth()), i);
    const monthStartDate = startOfMonth(monthDate);
    const monthEndDate = endOfMonth(monthDate);

    const income = allYearIncomeItems.
    filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= monthStartDate && itemDate <= monthEndDate;
    }).
    reduce((sum, item) => sum + (item.amount || 0), 0);

    const expenses = allYearExpenseItems.
    filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= monthStartDate && itemDate <= monthEndDate;
    }).
    reduce((sum, item) => sum + (item.amount || 0), 0);

    chartData.push({
      month: format(monthDate, 'MMM'),
      income,
      expenses,
      profit: income - expenses
    });
  }

  // Top projects filtered by the same period as KPI cards
  const yearProjectIncomeMap = yearIncomeItems.reduce((acc, item) => {
    if (item.projectId) acc[item.projectId] = (acc[item.projectId] || 0) + item.amount;
    return acc;
  }, {});

  const yearProjectExpenseMap = yearExpenseItems.reduce((acc, item) => {
    if (item.projectId) acc[item.projectId] = (acc[item.projectId] || 0) + item.amount;
    return acc;
  }, {});

  const topProjects = projects.
  map((p) => ({
    ...p,
    totalIncome: yearProjectIncomeMap[p.id] || 0,
    totalExpense: yearProjectExpenseMap[p.id] || 0,
    profit: (yearProjectIncomeMap[p.id] || 0) - (yearProjectExpenseMap[p.id] || 0),
    margin: (yearProjectIncomeMap[p.id] || 0) > 0 ? (((yearProjectIncomeMap[p.id] || 0) - (yearProjectExpenseMap[p.id] || 0)) / (yearProjectIncomeMap[p.id] || 0) * 100).toFixed(1) : 0
  })).
  sort((a, b) => b.profit - a.profit).
  slice(0, 5);

  const hasData = incomeItems.length > 0 || expenseItems.length > 0;

  const recentActivity = [...yearIncomeItems.map((item) => ({ ...item, type: 'income', title: item.notes || `Income #${item.id}` })),
  ...yearExpenseItems.map((item) => ({ ...item, type: 'expense', title: item.notes || item.vendor || `Expense #${item.id}` }))].
  sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  if (userLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#22A699]" />
      </div>);

  }

  if (!hasData) {
    return (
      <div className="p-6 md:p-8 pb-24 md:pb-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Dashboard</h1>
          </div>
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: profile?.darkMode ? '#374151' : '#f3f4f6' }}>
                <BarChart className="w-8 h-8" style={{ color: profile?.darkMode ? '#6b7280' : '#9ca3af' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>No data yet</h3>
              <p className="mb-4" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Log income or expenses in Chat to see your dashboard</p>
              <Link to={createPageUrl("Chat")}>
                <Button className="bg-[#22A699] hover:bg-[#1d8d82] text-white">Go to Chat</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>);

  }

  return (
    <div className="px-6 py-6 md:p-8 md:pb-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 10 || refreshing) && (
        <div className="flex justify-center items-center py-2 transition-all" style={{ height: refreshing ? '40px' : `${Math.min(pullDistance / 2, 40)}px`, overflow: 'hidden' }}>
          <RefreshIcon className={`w-5 h-5 text-[#22A699] ${refreshing ? 'animate-spin' : ''}`} style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 2}deg)` }} />
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Dashboard</h1>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to={createPageUrl("Projects")}>
            <Card className="hover:shadow-md transition-all cursor-pointer h-full" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <FolderKanban className="w-8 h-8 mb-2" style={{ color: '#22A699' }} />
                <p className="font-medium text-sm" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Projects</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("Calendar")}>
            <Card className="hover:shadow-md transition-all cursor-pointer h-full" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <CalendarDays className="w-8 h-8 mb-2" style={{ color: '#22A699' }} />
                <p className="font-medium text-sm" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Calendar</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("Reports")}>
            <Card className="hover:shadow-md transition-all cursor-pointer h-full" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <TrendingUpIcon className="w-8 h-8 mb-2" style={{ color: '#22A699' }} />
                <p className="font-medium text-sm" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Reports</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("Documents")}>
            <Card className="hover:shadow-md transition-all cursor-pointer h-full" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 mb-2" style={{ color: '#22A699' }} />
                <p className="font-medium text-sm" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Documents</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="space-y-4 mb-8">
          {/* Month and Year selectors — always visible */}
          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36" style={{
                backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#ffffff' : '#111827'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}` }}>
                <SelectItem value="all" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>All Months</SelectItem>
                <SelectItem value="ytd" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Year to Date</SelectItem>
                <SelectItem value="0" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>January</SelectItem>
                <SelectItem value="1" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>February</SelectItem>
                <SelectItem value="2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>March</SelectItem>
                <SelectItem value="3" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>April</SelectItem>
                <SelectItem value="4" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>May</SelectItem>
                <SelectItem value="5" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>June</SelectItem>
                <SelectItem value="6" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>July</SelectItem>
                <SelectItem value="7" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>August</SelectItem>
                <SelectItem value="8" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>September</SelectItem>
                <SelectItem value="9" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>October</SelectItem>
                <SelectItem value="10" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>November</SelectItem>
                <SelectItem value="11" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>December</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={(y) => { setSelectedYear(y); setSelectedMonth('all'); }}>
              <SelectTrigger className="w-24" style={{
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
            <span className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
              {selectedMonth === 'all' ? `All of ${selectedYear}`
                : selectedMonth === 'ytd' ? `YTD ${selectedYear}`
                : `${['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(selectedMonth)]} ${selectedYear}`}
            </span>
          </div>

          {/* KPI cards using the selected period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                  Profit
                </CardTitle>
                <Wallet className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                  {formatCurrency(periodProfit)}
                </div>
                <div className="flex items-center gap-1 text-sm mt-1" style={{ color: periodProfit >= 0 ? '#22A699' : '#ef4444' }}>
                  {periodProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {periodProfit >= 0 ? 'Positive' : 'Negative'}
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                  Income
                </CardTitle>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                  {formatCurrency(periodIncome)}
                </div>
                <p className="text-sm mt-1" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                  {yearIncomeItems.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                  Expenses
                </CardTitle>
                <CreditCard className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                  {formatCurrency(periodExpenses)}
                </div>
                <p className="text-sm mt-1" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                  {yearExpenseItems.length} transactions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 6-Month Chart */}
        <Card className="mb-8" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
          <CardHeader>
            <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>6-Month Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={profile?.darkMode ? '#374151' : '#e5e5e5'} />
                <XAxis dataKey="month" stroke={profile?.darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={profile?.darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: profile?.darkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e5e5'}`,
                    color: profile?.darkMode ? '#fff' : '#000'
                  }} />

                <Bar dataKey="income" fill="#22A699" />
                <Bar dataKey="expenses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity with Quick Edit */}
        <Card className="mb-8" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
          <CardHeader 
            className="cursor-pointer flex flex-row items-center justify-between"
            onClick={() => setRecentActivityOpen(!recentActivityOpen)}
          >
            <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
              Activity
              <span className="text-sm font-normal ml-2" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                {selectedMonth === 'all' ? `All of ${selectedYear}`
                  : selectedMonth === 'ytd' ? `YTD ${selectedYear}`
                  : `${['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(selectedMonth)]} ${selectedYear}`}
              </span>
            </CardTitle>
            <ChevronDown 
              className="w-5 h-5 transition-transform" 
              style={{ 
                color: profile?.darkMode ? '#9ca3af' : '#6b7280',
                transform: recentActivityOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
              }} 
            />
          </CardHeader>
          {recentActivityOpen && (
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ?
                <p className="text-center py-8" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                    No activity yet. Start by chatting with Ledgera AI!
                  </p> :

                recentActivity.slice(0, 10).map((item) =>
                <QuickEditItem
                  key={`${item.type}-${item.id}`}
                  item={item}
                  type={item.type}
                  projects={projects}
                  onUpdate={item.type === 'income' ? handleUpdateIncome : handleUpdateExpense}
                  onDelete={item.type === 'income' ? handleDeleteIncome : handleDeleteExpense}
                  onConvert={item.type === 'income' ? handleConvertIncome : handleConvertExpense}
                  formatCurrency={formatCurrency}
                  profile={profile}
                  isSaving={updateIncomeMutation.isLoading || updateExpenseMutation.isLoading || deleteIncomeMutation.isLoading || deleteExpenseMutation.isLoading || convertMutation.isLoading} />

                )
                }
              </div>
            </CardContent>
          )}
        </Card>

        {/* Top Projects */}
        {topProjects.length > 0 &&
        <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Top Projects</CardTitle>
              <Link to={createPageUrl("Projects")}>
                <Button variant="ghost" size="sm" className="gap-2" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                  View all <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProjects.map((project) =>
              <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                    <div className="flex items-center justify-between p-4 rounded-lg transition-colors" style={{
                  border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                  backgroundColor: profile?.darkMode ? 'transparent' : '#ffffff'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = profile?.darkMode ? '#374151' : '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = profile?.darkMode ? 'transparent' : '#ffffff'}>

                      <div>
                        <h4 className="font-medium" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{project.title}</h4>
                        <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                          {formatCurrency(project.totalIncome)} income • {formatCurrency(project.totalExpense)} expenses
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{formatCurrency(project.profit)}</div>
                        <div className="text-sm" style={{ color: project.margin >= 0 ? '#22A699' : '#ef4444' }}>
                          {project.margin}% margin
                        </div>
                      </div>
                    </div>
                  </Link>
              )}
              </div>
            </CardContent>
          </Card>
        }
      </div>
    </div>);

}