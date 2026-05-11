import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Folder, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Projects() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState("active");
  const queryClient = useQueryClient();

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

  const { data: allIncome } = useQuery({
    queryKey: ['incomeItems'],
    queryFn: () => base44.entities.IncomeItem.filter({ created_by: user.email }),
    initialData: [],
    enabled: !!user,
  });

  const { data: allExpenses } = useQuery({
    queryKey: ['expenseItems'],
    queryFn: () => base44.entities.ExpenseItem.filter({ created_by: user.email }),
    initialData: [],
    enabled: !!user,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      // Ensure user is available before attempting to filter by user.email
      if (!user?.email) return [];

      const allProjects = await base44.entities.Project.filter({ created_by: user.email }, '-updated_date');
      return allProjects;
    },
    initialData: [],
    enabled: !!user,
  });

  // Calculate year/month filtered totals
  const yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
  const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
  const today = new Date();
  const ytdEnd = selectedMonth === 'ytd' ? today : yearEnd;
  const monthStart = startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth), 1));
  const monthEnd = endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth), 1));

  const yearIncome = allIncome.filter(item => {
    const itemDate = new Date(item.date);
    if (selectedMonth === 'all') {
      return itemDate >= yearStart && itemDate <= yearEnd;
    }
    if (selectedMonth === 'ytd') {
      return itemDate >= yearStart && itemDate <= ytdEnd;
    }
    return itemDate >= monthStart && itemDate <= monthEnd;
  });

  const yearExpenses = allExpenses.filter(item => {
    const itemDate = new Date(item.date);
    if (selectedMonth === 'all') {
      return itemDate >= yearStart && itemDate <= yearEnd;
    }
    if (selectedMonth === 'ytd') {
      return itemDate >= yearStart && itemDate <= ytdEnd;
    }
    return itemDate >= monthStart && itemDate <= monthEnd;
  });

  const allYears = [...new Set([
    ...allIncome.map(item => new Date(item.date).getFullYear()),
    ...allExpenses.map(item => new Date(item.date).getFullYear()),
    new Date().getFullYear()
  ])].sort((a, b) => b - a);
  const availableYears = allYears.map(y => y.toString());

  const projectsWithYearData = projects.map(project => {
    const projectIncome = yearIncome
      .filter(item => item.projectId === project.id)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const projectExpenses = yearExpenses
      .filter(item => item.projectId === project.id)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    return {
      ...project,
      totalIncome: projectIncome,
      totalExpense: projectExpenses,
    };
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      // We also need to invalidate income and expense queries so they are fresh for future project calculations
      queryClient.invalidateQueries(['incomeItems']);
      queryClient.invalidateQueries(['expenseItems']);
      setShowNewDialog(false);
      setNewProjectTitle("");
      setNewProjectStatus("active");
    },
  });

  const formatCurrency = (amount) => {
    if (!profile) return `$${amount.toFixed(2)}`;
    return new Intl.NumberFormat(profile.locale || 'en-US', {
      style: 'currency',
      currency: profile.currency || 'USD',
    }).format(amount);
  };

  const filteredProjects = projectsWithYearData
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || p.status === filter;
      return matchesSearch && matchesFilter;
    })
    .map(p => ({
      ...p,
      profit: (p.totalIncome || 0) - (p.totalExpense || 0),
      margin: p.totalIncome > 0 ? (((p.totalIncome - p.totalExpense) / p.totalIncome) * 100).toFixed(1) : 0
    }));

  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) return;
    createProjectMutation.mutate({
      title: newProjectTitle,
      status: newProjectStatus,
      startDate: new Date().toISOString().split('T')[0],
      created_by: user.email, // Ensure created_by is set for the new project
      // When creating a new project, initial income/expense are 0
      // These will be calculated from IncomeItem/ExpenseItem records by the queryFn
      // No need to set totalIncome/totalExpense directly here.
    });
  };

  const statusColors = {
    planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    complete: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };

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
         <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Projects</h1>
            <div className="flex gap-3 mb-4">
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
            <Button onClick={() => setShowNewDialog(true)} className="bg-[#22A699] hover:bg-[#1d8d82] gap-2 w-full md:w-auto">
              <Plus className="w-5 h-5" /> New Project
            </Button>
          </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              style={{
                paddingLeft: '2.5rem',
                backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#ffffff' : '#111827'
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              style={filter === "all" ? { backgroundColor: '#22A699' } : {
                backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#d1d5db' : '#111827'
              }}
            >
              All
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              onClick={() => setFilter("active")}
              style={filter === "active" ? { backgroundColor: '#22A699' } : {
                backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#d1d5db' : '#111827'
              }}
            >
              Active
            </Button>
            <Button
              variant={filter === "complete" ? "default" : "outline"}
              onClick={() => setFilter("complete")}
              style={filter === "complete" ? { backgroundColor: '#22A699' } : {
                backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#d1d5db' : '#111827'
              }}
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: profile?.darkMode ? '#374151' : '#f3f4f6' }}>
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>No projects yet</h3>
              <p className="mb-4" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Create one or log activity in Chat and I'll make one</p>
              <Button onClick={() => setShowNewDialog(true)} className="bg-[#22A699] hover:bg-[#1d8d82] gap-2">
                <Plus className="w-4 h-4" /> Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((project) => (
              <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                <Card className="hover:shadow-lg transition-all" style={{
                  backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb}'}`
                }}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{project.title}</h3>
                        <Badge className={statusColors[project.status]}>{project.status}</Badge>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Income</p>
                        <p className="text-lg font-semibold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{formatCurrency(project.totalIncome)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Expenses</p>
                        <p className="text-lg font-semibold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{formatCurrency(project.totalExpense)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Profit</p>
                        <p className={`text-lg font-semibold`} style={{ color: project.profit >= 0 ? '#22A699' : '#ef4444' }}>
                          {formatCurrency(project.profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Margin</p>
                        <p className={`text-lg font-semibold`} style={{ color: project.margin >= 0 ? '#22A699' : '#ef4444' }}>
                          {project.margin}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* New Project Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <DialogHeader>
              <DialogTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Project Title</Label>
                <Input
                  id="title"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g., Website Redesign"
                  style={{
                    backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                    color: profile?.darkMode ? '#ffffff' : '#111827'
                  }}
                />
              </div>
              <div>
                <Label htmlFor="status" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Status</Label>
                <Select value={newProjectStatus} onValueChange={setNewProjectStatus}>
                  <SelectTrigger style={{
                    backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                    color: profile?.darkMode ? '#ffffff' : '#111827'
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}` }}>
                    <SelectItem value="planned" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Planned</SelectItem>
                    <SelectItem value="active" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Active</SelectItem>
                    <SelectItem value="complete" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)} style={{
                backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#d1d5db' : '#111827'
              }}>Cancel</Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim() || createProjectMutation.isPending}
                className="bg-[#22A699] hover:bg-[#1d8d82]"
              >
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}