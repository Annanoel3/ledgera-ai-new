import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Trash2, Loader2, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import RecurringSubscriptionModal from "@/components/projects/RecurringSubscriptionModal";
import ExpenseRow from "@/components/projects/ExpenseRow";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useProjectFilter } from "@/hooks/useProjectFilter";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Loader2 as RefreshLoader } from "lucide-react";

export default function ProjectFinancials() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const urlParams = new URLSearchParams(window.location.search);
   const projectId = urlParams.get('id');
   const tabParam = urlParams.get('tab');
   const { selectedYear, selectedMonth, setSelectedYear, setSelectedMonth } = useProjectFilter(projectId);
   const [showRecurringModal, setShowRecurringModal] = useState(false);
   const [selectedExpense, setSelectedExpense] = useState(null);
   const [groupingMode, setGroupingMode] = useState(false);
   const [selectedExpenseIds, setSelectedExpenseIds] = useState(new Set());
   const [defaultTab, setDefaultTab] = useState(tabParam === 'expenses' ? 'expenses' : 'income');
   const windowSize = useWindowSize();
   const isMobile = windowSize.width < 768;

  const { data: user } = useQuery({
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

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId, created_by: user.email });
      return projects[0];
    },
    enabled: !!projectId && !!user,
  });

  const { data: allProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      return await base44.entities.Project.list('-updated_date');
    },
    initialData: [],
  });

  const { data: incomeItems } = useQuery({
    queryKey: ['incomeItems', projectId],
    queryFn: () => base44.entities.IncomeItem.filter({ projectId }, '-date'),
    initialData: [],
    enabled: !!projectId && !!user,
  });

  const { data: expenseItems } = useQuery({
    queryKey: ['expenseItems', projectId],
    queryFn: () => base44.entities.ExpenseItem.filter({ projectId }, '-date'),
    initialData: [],
    enabled: !!projectId && !!user,
  });

  const duplicateIncomeMutation = useMutation({
    mutationFn: (item) => base44.entities.IncomeItem.create({
      projectId: item.projectId,
      amount: item.amount,
      date: item.date,
      category: item.category,
      method: item.method,
      notes: item.notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomeItems', projectId]);
      queryClient.invalidateQueries(['projects']);
      toast.success("Income item duplicated");
    },
    onError: () => toast.error("Failed to duplicate income item"),
  });

  const duplicateExpenseMutation = useMutation({
    mutationFn: (item) => base44.entities.ExpenseItem.create({
      projectId: item.projectId,
      amount: item.amount,
      date: item.date,
      category: item.category,
      vendor: item.vendor,
      notes: item.notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseItems', projectId]);
      queryClient.invalidateQueries(['projects']);
      toast.success("Expense item duplicated");
    },
    onError: () => toast.error("Failed to duplicate expense item"),
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (id) => base44.entities.IncomeItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomeItems', projectId]);
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['projects']);
      toast.success("Income item deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete income item");
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.ExpenseItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseItems', projectId]);
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['projects']);
      toast.success("Expense item deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete expense item");
    }
  });

  const updateIncomeProjectMutation = useMutation({
    mutationFn: ({ id, newProjectId }) => base44.entities.IncomeItem.update(id, { projectId: newProjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomeItems']);
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['projects']);
      toast.success("Income item moved to new project");
    },
    onError: (error) => {
      toast.error("Failed to update income item");
    }
  });

  const updateExpenseProjectMutation = useMutation({
    mutationFn: ({ id, newProjectId }) => base44.entities.ExpenseItem.update(id, { projectId: newProjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseItems']);
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['projects']);
      toast.success("Expense item moved to new project");
    },
    onError: (error) => {
      toast.error("Failed to update expense item");
    }
  });

  const handleDeleteIncome = async (e, itemId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this income item?")) {
      deleteIncomeMutation.mutate(itemId);
    }
  };

  const handleDeleteExpense = async (e, itemId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this expense item?")) {
      deleteExpenseMutation.mutate(itemId);
    }
  };

  const handleIncomeProjectChange = async (itemId, newProjectId) => {
    updateIncomeProjectMutation.mutate({ id: itemId, newProjectId });
  };

  const handleExpenseProjectChange = async (itemId, newProjectId) => {
    updateExpenseProjectMutation.mutate({ id: itemId, newProjectId });
  };

  const convertToRecurringMutation = useMutation({
    mutationFn: async ({ expenseId, frequency, customDays, name, notes, selectedExpenseIds }) => {
      const expense = expenseItems.find(e => e.id === expenseId);
      if (!expense) throw new Error("Expense not found");
      
      // Use selected expenses for grouping, or fall back to same vendor
      const selectedExpenses = selectedExpenseIds && selectedExpenseIds.length > 0
        ? expenseItems.filter(e => selectedExpenseIds.includes(e.id))
        : expenseItems.filter(item => item.vendor === expense.vendor);
      
      // Calculate average amount
      const avgAmount = selectedExpenses.length > 0 
        ? selectedExpenses.reduce((sum, item) => sum + item.amount, 0) / selectedExpenses.length
        : expense.amount;
      
      // Get earliest date
      const earliestDate = selectedExpenses.length > 0
        ? new Date(Math.min(...selectedExpenses.map(item => new Date(item.date))))
        : new Date(expense.date);
      
      return base44.entities.RecurringSubscription.create({
        projectId: expense.projectId,
        name,
        amount: Math.round(avgAmount * 100) / 100,
        frequency,
        customDays: frequency === "custom" ? customDays : undefined,
        startDate: earliestDate.toISOString().split('T')[0],
        category: expense.category || "subscriptions",
        notes: notes || (selectedExpenses.length > 1 ? `Recurring from ${selectedExpenses.length} payments` : ""),
        active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions', projectId]);
      queryClient.invalidateQueries(['expenseItems', projectId]);
      toast.success("Created recurring subscription");
    },
    onError: (error) => {
      console.error('Convert error:', error);
      toast.error("Failed to create recurring subscription");
    }
  });

  const handleStartRecurring = (expense) => {
    setSelectedExpense(expense);
    setGroupingMode(true);
    setSelectedExpenseIds(new Set([expense.id]));
    setShowRecurringModal(true);
  };

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries(['project', projectId]),
      queryClient.invalidateQueries(['incomeItems', projectId]),
      queryClient.invalidateQueries(['expenseItems', projectId]),
      queryClient.invalidateQueries(['projects']),
    ]);
  };

  const { refreshing, pullDistance } = usePullToRefresh(handleRefresh);

  const handleConfirmRecurring = (settings) => {
    convertToRecurringMutation.mutate({
      expenseId: selectedExpense.id,
      selectedExpenseIds: Array.from(selectedExpenseIds),
      ...settings
    });
    setGroupingMode(false);
    setSelectedExpenseIds(new Set());
  };

  const toggleExpenseSelect = (expenseId) => {
    const newSet = new Set(selectedExpenseIds);
    if (newSet.has(expenseId)) {
      newSet.delete(expenseId);
    } else {
      newSet.add(expenseId);
    }
    setSelectedExpenseIds(newSet);
  };

  const formatCurrency = (amount) => {
    if (!profile) return `$${amount.toFixed(2)}`;
    return new Intl.NumberFormat(profile.locale || 'en-US', {
      style: 'currency',
      currency: profile.currency || 'USD',
    }).format(amount);
  };

  // Calculate year/month filtered data
  const yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
  const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
  const today = new Date();
  const ytdEnd = selectedMonth === 'ytd' ? today : yearEnd;
  const monthStart = startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth), 1));
  const monthEnd = endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth), 1));

  const allYears = [...new Set([
    ...incomeItems.map(item => new Date(item.date).getFullYear()),
    ...expenseItems.map(item => new Date(item.date).getFullYear()),
    new Date().getFullYear()
  ])].sort((a, b) => b - a);
  const availableYears = allYears.map(y => y.toString());

  const filteredIncomeItems = incomeItems.filter(item => {
    const itemDate = new Date(item.date);
    if (selectedMonth === 'all') {
      return itemDate >= yearStart && itemDate <= yearEnd;
    }
    if (selectedMonth === 'ytd') {
      return itemDate >= yearStart && itemDate <= ytdEnd;
    }
    return itemDate >= monthStart && itemDate <= monthEnd;
  });

  const filteredExpenseItems = expenseItems.filter(item => {
    const itemDate = new Date(item.date);
    if (selectedMonth === 'all') {
      return itemDate >= yearStart && itemDate <= yearEnd;
    }
    if (selectedMonth === 'ytd') {
      return itemDate >= yearStart && itemDate <= ytdEnd;
    }
    return itemDate >= monthStart && itemDate <= monthEnd;
  });

  if (!project) {
    return (
      <div className="p-6 md:p-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
        <div className="max-w-6xl mx-auto">
          <p style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div className="fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none" style={{ paddingTop: Math.min(pullDistance / 2, 40) + 'px' }}>
          <div className="rounded-full p-2 shadow-md" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff' }}>
            <RefreshLoader className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#22A699', transform: refreshing ? '' : `rotate(${pullDistance * 2}deg)` }} />
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("ProjectDetail") + `?id=${projectId}`)}
            className="mb-4 gap-2"
            style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Project
          </Button>
          <h1 className="text-3xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{project.title} - Financials</h1>

          <div className="flex gap-4 flex-wrap items-center mt-6">
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
              <SelectTrigger className="w-32" style={{
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
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff' }}>
            <TabsTrigger value="income" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Income ({filteredIncomeItems.length})</TabsTrigger>
            <TabsTrigger value="expenses" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Expenses ({filteredExpenseItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardHeader>
                <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Income Items</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredIncomeItems.length === 0 ? (
                  <p style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }} className="text-center py-8">No income items for this period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderColor: profile?.darkMode ? '#374151' : '#e5e7eb' }}>
                          <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Date</TableHead>
                          <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Category</TableHead>
                          <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Amount</TableHead>
                          <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Notes</TableHead>
                          <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Project</TableHead>
                          <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }} className="sr-only">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredIncomeItems.map((item) => (
                          <TableRow key={item.id} style={{ borderColor: profile?.darkMode ? '#374151' : '#e5e7eb' }}>
                            <TableCell style={{ color: profile?.darkMode ? '#d1d5db' : '#111827' }}>{format(new Date(item.date), 'MMM d, yyyy')}</TableCell>
                            <TableCell style={{ color: profile?.darkMode ? '#d1d5db' : '#111827' }}>{item.category}</TableCell>
                            <TableCell className="font-medium text-[#22A699]">{formatCurrency(item.amount)}</TableCell>
                            <TableCell style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>{item.notes || '-'}</TableCell>
                            <TableCell>
                              <Select
                                value={item.projectId}
                                onValueChange={(newProjectId) => handleIncomeProjectChange(item.id, newProjectId)}
                                disabled={updateIncomeProjectMutation.isPending}
                              >
                                <SelectTrigger className="w-40" style={{
                                  backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                                  color: profile?.darkMode ? '#ffffff' : '#111827'
                                }}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{
                                  backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`
                                }}>
                                  {allProjects.map(proj => (
                                    <SelectItem key={proj.id} value={proj.id} style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                                      {proj.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); duplicateIncomeMutation.mutate(item); }}
                                  className="hover:text-[#22A699]"
                                  disabled={duplicateIncomeMutation.isPending}
                                  title="Duplicate"
                                >
                                  {duplicateIncomeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleDeleteIncome(e, item.id)}
                                  className="hover:text-red-500"
                                  disabled={deleteIncomeMutation.isPending}
                                >
                                  {deleteIncomeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
              <CardHeader>
                <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Expense Items</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredExpenseItems.length === 0 ? (
                  <p style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }} className="text-center py-8">No expense items for this period</p>
                ) : isMobile ? (
                    <div>
                      {filteredExpenseItems.map((item) => (
                        <ExpenseRow
                          key={item.id}
                          item={item}
                          onDelete={handleDeleteExpense}
                          onDuplicate={(item) => duplicateExpenseMutation.mutate(item)}
                          onProjectChange={handleExpenseProjectChange}
                          onMakeRecurring={handleStartRecurring}
                          darkMode={profile?.darkMode}
                          allProjects={allProjects}
                          isDeleteLoading={deleteExpenseMutation.isPending}
                          isDuplicateLoading={duplicateExpenseMutation.isPending}
                          isRecurringLoading={convertToRecurringMutation.isPending}
                          isMobile={true}
                          isSelected={selectedExpenseIds.has(item.id)}
                          onToggleSelect={groupingMode ? toggleExpenseSelect : undefined}
                          showCheckbox={groupingMode}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow style={{ borderColor: profile?.darkMode ? '#374151' : '#e5e7eb' }}>
                            {groupingMode && <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }} className="w-8"></TableHead>}
                            <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Date</TableHead>
                            <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Category</TableHead>
                            <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Vendor</TableHead>
                            <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Amount</TableHead>
                            <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Notes</TableHead>
                            <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Project</TableHead>
                            <TableHead style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }} className="sr-only">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredExpenseItems.map((item) => (
                            <ExpenseRow
                              key={item.id}
                              item={item}
                              onDelete={handleDeleteExpense}
                              onDuplicate={(item) => duplicateExpenseMutation.mutate(item)}
                              onProjectChange={handleExpenseProjectChange}
                              onMakeRecurring={handleStartRecurring}
                              darkMode={profile?.darkMode}
                              allProjects={allProjects}
                              isDeleteLoading={deleteExpenseMutation.isPending}
                              isDuplicateLoading={duplicateExpenseMutation.isPending}
                              isRecurringLoading={convertToRecurringMutation.isPending}
                              isMobile={false}
                              isSelected={selectedExpenseIds.has(item.id)}
                              onToggleSelect={groupingMode ? toggleExpenseSelect : undefined}
                              showCheckbox={groupingMode}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <RecurringSubscriptionModal
          isOpen={showRecurringModal}
          onClose={() => {
            setShowRecurringModal(false);
            setGroupingMode(false);
            setSelectedExpenseIds(new Set());
          }}
          expense={selectedExpense}
          onConfirm={handleConfirmRecurring}
          darkMode={profile?.darkMode}
          relatedExpenses={selectedExpense ? expenseItems.filter(e => e.vendor === selectedExpense.vendor) : []}
        />
      </div>
    </div>
  );
}