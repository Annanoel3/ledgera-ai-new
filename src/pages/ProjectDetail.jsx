import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, CreditCard, Wallet, TrendingUp, Plus, Pencil, Loader2, ChevronDown, ChevronUp, Clock, Trash2, Calendar, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import EventsModal from "@/components/projects/EventsModal";
import SubscriptionsTab from "@/components/projects/SubscriptionsTab";
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

export default function ProjectDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const [showIncomeDetails, setShowIncomeDetails] = useState(false);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());

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
    queryFn: () => base44.entities.IncomeItem.filter({ projectId, created_by: user.email }, '-date'),
    initialData: [],
    enabled: !!projectId && !!user,
  });

  const { data: expenseItems } = useQuery({
    queryKey: ['expenseItems', projectId],
    queryFn: () => base44.entities.ExpenseItem.filter({ projectId, created_by: user.email }, '-date'),
    initialData: [],
    enabled: !!projectId && !!user,
  });

  const { data: documents } = useQuery({
    queryKey: ['projectDocuments', projectId],
    queryFn: async () => {
      const docs = await base44.entities.Document.list('-uploadDate');
      return docs.filter(doc => doc.projectId === projectId);
    },
    enabled: !!projectId,
    initialData: [],
  });

  // Create activity history from all items
  const activityHistory = React.useMemo(() => {
    const activities = [];

    incomeItems.forEach(item => {
      activities.push({
        type: 'income',
        date: item.created_date || item.date,
        description: `Added income: ${item.notes || 'Income item'}`,
        amount: item.amount,
      });
    });

    expenseItems.forEach(item => {
      activities.push({
        type: 'expense',
        date: item.created_date || item.date,
        description: `Added expense: ${item.notes || item.vendor || 'Expense item'}`,
        amount: item.amount,
      });
    });

    documents.forEach(doc => {
      activities.push({
        type: 'document',
        date: doc.created_date || doc.uploadDate,
        description: `Uploaded ${doc.fileName}`,
        amount: null,
      });
    });

    return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [incomeItems, expenseItems, documents]);

  const deleteIncomeMutation = useMutation({
    mutationFn: (id) => base44.entities.IncomeItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomeItems', projectId]);
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['projects']);
      toast.success("Income item deleted successfully");
    },
    onError: (error) => {
      console.error('Delete income error:', error);
      if (error.message?.includes('not found')) {
        toast.error("This item was already deleted");
        queryClient.invalidateQueries(['incomeItems', projectId]);
        queryClient.invalidateQueries(['project', projectId]);
        queryClient.invalidateQueries(['projects']);
      } else {
        toast.error("Failed to delete income item: " + (error?.message || "Unknown error"));
      }
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
      console.error('Delete expense error:', error);
      if (error.message?.includes('not found')) {
        toast.error("This item was already deleted");
        queryClient.invalidateQueries(['expenseItems', projectId]);
        queryClient.invalidateQueries(['project', projectId]);
        queryClient.invalidateQueries(['projects']);
      } else {
        toast.error("Failed to delete expense item: " + (error?.message || "Unknown error"));
      }
    }
  });

  const updateIncomeProjectMutation = useMutation({
    mutationFn: ({ id, newProjectId }) => base44.entities.IncomeItem.update(id, { projectId: newProjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomeItems']);
      queryClient.invalidateQueries(['project', projectId]); // Invalidate current project
      queryClient.invalidateQueries(['projects']); // Invalidate all projects (for dashboard totals and the project moved to)
      toast.success("Income item moved to new project");
    },
    onError: (error) => {
      console.error('Update income error:', error);
      toast.error("Failed to update income item: " + (error?.message || "Unknown error"));
    }
  });

  const updateExpenseProjectMutation = useMutation({
    mutationFn: ({ id, newProjectId }) => base44.entities.ExpenseItem.update(id, { projectId: newProjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseItems']);
      queryClient.invalidateQueries(['project', projectId]); // Invalidate current project
      queryClient.invalidateQueries(['projects']); // Invalidate all projects (for dashboard totals and the project moved to)
      toast.success("Expense item moved to new project");
    },
    onError: (error) => {
      console.error('Update expense error:', error);
      toast.error("Failed to update expense item: " + (error?.message || "Unknown error"));
    }
  });

  const handleDeleteIncome = async (e, itemId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this income item?")) {
      try {
        await deleteIncomeMutation.mutateAsync(itemId);
      } catch (error) {
        // Error handling is done in mutation's onError, but this catch prevents unhandled promise rejection
        console.error('Deletion process caught an error:', error);
      }
    }
  };

  const handleDeleteExpense = async (e, itemId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this expense item?")) {
      try {
        console.log('Attempting to delete expense:', itemId);
        await deleteExpenseMutation.mutateAsync(itemId);
        console.log('Expense deleted successfully');
      } catch (error) {
        console.error('Deletion process caught an error:', error);
      }
    }
  };

  const handleIncomeProjectChange = async (itemId, newProjectId) => {
    try {
      await updateIncomeProjectMutation.mutateAsync({ id: itemId, newProjectId });
    } catch (error) {
      // Error handling is done in mutation's onError, but this catch prevents unhandled promise rejection
      console.error('Update process caught an error:', error);
    }
  };

  const handleExpenseProjectChange = async (itemId, newProjectId) => {
    try {
      await updateExpenseProjectMutation.mutateAsync({ id: itemId, newProjectId });
    } catch (error) {
      // Error handling is done in mutation's onError, but this catch prevents unhandled promise rejection
      console.error('Update process caught an error:', error);
    }
  };

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success("Project deleted successfully");
      navigate(createPageUrl("Projects"));
    },
    onError: (error) => {
      console.error('Delete project error:', error);
      toast.error("Failed to delete project: " + (error?.message || "Unknown error"));
    }
  });

  const handleDeleteProject = () => {
    if (window.confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const formatCurrency = (amount) => {
    if (!profile) return `$${amount.toFixed(2)}`;
    return new Intl.NumberFormat(profile.locale || 'en-US', {
      style: 'currency',
      currency: profile.currency || 'USD',
    }).format(amount);
  };

  if (userLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#22A699]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 md:p-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
        <div className="max-w-6xl mx-auto">
          <p style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Loading project or project not found...</p>
        </div>
      </div>
    );
  }

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

  const actualIncome = filteredIncomeItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const actualExpenses = filteredExpenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const profit = actualIncome - actualExpenses;
  const margin = actualIncome > 0 ? (profit / actualIncome) * 100 : 0;

  const statusColors = {
    planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    complete: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Projects"))}
            className="mb-4 gap-2"
            style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{project.title}</h1>
            <Badge className={statusColors[project.status]}>{project.status}</Badge>
          </div>

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

            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowEventsModal(true)}
                style={{
                  backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: profile?.darkMode ? '#d1d5db' : '#374151'
                }}
              >
                <Calendar className="w-4 h-4" /> Events
              </Button>
              <Button variant="outline" size="sm" className="gap-2" style={{
                backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#d1d5db' : '#374151'
              }}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending}
                style={{
                  backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: '#ef4444'
                }}
              >
                {deleteProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Clickable Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setShowIncomeDetails(!showIncomeDetails)}
            style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Income</CardTitle>
              <DollarSign className="w-4 h-4" style={{ color: profile?.darkMode ? '#6b7280' : '#9ca3af' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{formatCurrency(actualIncome)}</div>
              <p className="text-xs mt-1" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>{filteredIncomeItems.length} items • Click to view</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setShowExpenseDetails(!showExpenseDetails)}
            style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Expenses</CardTitle>
              <CreditCard className="w-4 h-4" style={{ color: profile?.darkMode ? '#6b7280' : '#9ca3af' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{formatCurrency(actualExpenses)}</div>
              <p className="text-xs mt-1" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>{filteredExpenseItems.length} items • Click to view</p>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Profit</CardTitle>
              <Wallet className="w-4 h-4" style={{ color: profile?.darkMode ? '#6b7280' : '#9ca3af' }} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profit >= 0 ? 'text-[#22A699]' : 'text-red-500'}`}>
                {formatCurrency(profit)}
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Margin</CardTitle>
              <TrendingUp className="w-4 h-4" style={{ color: profile?.darkMode ? '#6b7280' : '#9ca3af' }} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${margin >= 0 ? 'text-[#22A699]' : 'text-red-500'}`}>
                {margin.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Income Details Dropdown */}
        {showIncomeDetails && filteredIncomeItems.length > 0 && (
          <Card className="mb-6" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader>
              <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Income Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Date</TableHead>
                    <TableHead className="dark:text-gray-300">Category</TableHead>
                    <TableHead className="dark:text-gray-300">Amount</TableHead>
                    <TableHead className="dark:text-gray-300">Notes</TableHead>
                    <TableHead className="dark:text-gray-300">Project</TableHead>
                    <TableHead className="dark:text-gray-300 sr-only">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncomeItems.map((item) => (
                    <TableRow key={item.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">{format(new Date(item.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="dark:text-gray-300">{item.category}</TableCell>
                      <TableCell className="font-medium text-[#22A699]">{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">{item.notes || '-'}</TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteIncome(e, item.id)}
                          className="hover:text-red-500"
                          disabled={deleteIncomeMutation.isPending}
                        >
                          {deleteIncomeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Expense Details Dropdown */}
        {showExpenseDetails && filteredExpenseItems.length > 0 && (
          <Card className="mb-6" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader>
              <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Expense Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Date</TableHead>
                    <TableHead className="dark:text-gray-300">Category</TableHead>
                    <TableHead className="dark:text-gray-300">Vendor</TableHead>
                    <TableHead className="dark:text-gray-300">Amount</TableHead>
                    <TableHead className="dark:text-gray-300">Notes</TableHead>
                    <TableHead className="dark:text-gray-300">Project</TableHead>
                    <TableHead className="dark:text-gray-300 sr-only">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenseItems.map((item) => (
                    <TableRow key={item.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">{format(new Date(item.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="dark:text-gray-300">{item.category}</TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">{item.vendor || '-'}</TableCell>
                      <TableCell className="font-medium text-red-500">{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">{item.notes || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={item.projectId}
                          onValueChange={(newProjectId) => handleExpenseProjectChange(item.id, newProjectId)}
                          disabled={updateExpenseProjectMutation.isPending}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteExpense(e, item.id)}
                          className="hover:text-red-500"
                          disabled={deleteExpenseMutation.isPending}
                        >
                          {deleteExpenseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Rest of tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 dark:bg-gray-800 dark:border-gray-700">
            <TabsTrigger value="overview" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-400">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-400">Recurring</TabsTrigger>
            <TabsTrigger value="documents" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-400">Documents</TabsTrigger>
            <TabsTrigger value="history" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-400">History</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Recurring</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionsTab projectId={projectId} darkMode={profile?.darkMode} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                  {project.endDate && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {format(new Date(project.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {project.notes && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                      <p className="text-gray-900 dark:text-white">{project.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Project Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No documents yet</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-start justify-between p-3 rounded-lg border dark:border-gray-700">
                        <div>
                          <p className="font-medium dark:text-white">{doc.fileName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityHistory.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No activity yet</p>
                ) : (
                  <div className="space-y-3">
                    {activityHistory.map((activity, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 rounded-lg border dark:border-gray-700">
                        <div className="flex-1">
                          <p className="font-medium dark:text-white">{activity.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(activity.date), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        {activity.amount !== null && (
                          <p className={`font-semibold ${activity.type === 'income' ? 'text-[#22A699]' : 'text-red-500'}`}>
                            {activity.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(activity.amount))}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>

          {/* Events Modal */}
          <EventsModal 
          projectId={projectId} 
          isOpen={showEventsModal} 
          onClose={() => setShowEventsModal(false)}
          darkMode={profile?.darkMode}
          />
          </div>
          </div>
          );
          }