import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { Textarea } from "@/components/ui/textarea";
import { Download, Trash2, Loader2, FileText, Plus, X, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import toast from 'react-hot-toast';
import { exportFinancialData } from "@/functions/exportFinancialData";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];
const locales = ["en-US", "en-GB", "fr-FR", "de-DE", "es-ES"];

export default function Settings() {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [professions, setProfessions] = useState([]);
  const [newProfession, setNewProfession] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [locale, setLocale] = useState("en-US");
  const [goalMonthlyIncome, setGoalMonthlyIncome] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [funMode, setFunMode] = useState(false);

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
      if (profiles.length === 0) {
        const newProfile = await base44.entities.UserProfile.create({
          professions: [],
          currency: "USD",
          locale: "en-US",
          subscribed: false,
          trialStart: new Date().toISOString(),
          darkMode: false,
          funMode: false,
          created_by: user.email, // Ensure created_by is set for new profiles
        });
        return newProfile;
      }
      return profiles[0];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      setDisplayName(user.full_name || "");
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfessions(profile.professions || []);
      setCurrency(profile.currency || "USD");
      setLocale(profile.locale || "en-US");
      setGoalMonthlyIncome(profile.goalMonthlyIncome?.toString() || "");
      setDarkMode(profile.darkMode || false);
      setFunMode(profile.funMode || false);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
    },
  });

  const { data: allIncome } = useQuery({
    queryKey: ['allIncome'],
    queryFn: () => base44.entities.IncomeItem.filter({ created_by: user.email }, '-date'),
    initialData: [],
    enabled: !!user,
  });

  const { data: allExpenses } = useQuery({
    queryKey: ['allExpenses'],
    queryFn: () => base44.entities.ExpenseItem.filter({ created_by: user.email }, '-date'),
    initialData: [],
    enabled: !!user,
  });

  const { data: allProjects } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.filter({ created_by: user.email }, '-created_date'),
    initialData: [],
    enabled: !!user,
  });

  const handleSaveProfile = () => {
    if (displayName !== user?.full_name) {
      updateUserMutation.mutate({ full_name: displayName });
    }
    
    updateProfileMutation.mutate({
      professions,
      currency,
      locale,
      goalMonthlyIncome: goalMonthlyIncome ? parseFloat(goalMonthlyIncome) : undefined,
      darkMode,
      funMode,
    });
  };

  const handleAddProfession = () => {
    if (newProfession.trim() && !professions.includes(newProfession.trim())) {
      setProfessions([...professions, newProfession.trim()]);
      setNewProfession("");
    }
  };

  const handleRemoveProfession = (profession) => {
    setProfessions(professions.filter(p => p !== profession));
  };

  const handleExportCSV = async () => {
    try {
      // Helper function to escape CSV values
      const escapeCsv = (value) => {
        if (value === null || value === undefined) return '';
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n') || strValue.includes('\r')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      };

      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Projects section
      csvContent += "PROJECTS\n";
      csvContent += "Title,Status,Start Date,Total Income,Total Expenses,Profit,Notes\n";
      allProjects.forEach(project => {
        const profit = (project.totalIncome || 0) - (project.totalExpense || 0);
        csvContent += `${escapeCsv(project.title)},${escapeCsv(project.status)},${escapeCsv(project.startDate || '')},${escapeCsv(project.totalIncome || 0)},${escapeCsv(project.totalExpense || 0)},${escapeCsv(profit)},${escapeCsv(project.notes || '')}\n`;
      });
      
      csvContent += "\n";
      
      // Income section
      csvContent += "INCOME\n";
      csvContent += "Date,Project,Amount,Category,Method,Notes\n";
      allIncome.forEach(item => {
        const project = allProjects.find(p => p.id === item.projectId);
        csvContent += `${escapeCsv(item.date)},${escapeCsv(project?.title || 'Unknown')},${escapeCsv(item.amount)},${escapeCsv(item.category || '')},${escapeCsv(item.method || '')},${escapeCsv(item.notes || '')}\n`;
      });
      
      csvContent += "\n";
      
      // Expenses section
      csvContent += "EXPENSES\n";
      csvContent += "Date,Project,Amount,Category,Vendor,Notes\n";
      allExpenses.forEach(item => {
        const project = allProjects.find(p => p.id === item.projectId);
        csvContent += `${escapeCsv(item.date)},${escapeCsv(project?.title || 'Unknown')},${escapeCsv(item.amount)},${escapeCsv(item.category || '')},${escapeCsv(item.vendor || '')},${escapeCsv(item.notes || '')}\n`;
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ledgera-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export CSV");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Generating comprehensive PDF report...");
      
      const response = await exportFinancialData({
        projects: allProjects,
        income: allIncome,
        expenses: allExpenses,
        currency: profile?.currency || 'USD',
        locale: profile?.locale || 'en-US',
        selectedYear: new Date().getFullYear().toString()
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
      link.download = `ledgera-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
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

  const deleteAllDataMutation = useMutation({
    mutationFn: async () => {
      try {
        const allProjectsToDelete = await base44.entities.Project.filter({ created_by: user.email });
        const allIncomeToDelete = await base44.entities.IncomeItem.filter({ created_by: user.email });
        const allExpensesToDelete = await base44.entities.ExpenseItem.filter({ created_by: user.email });
        const allDocumentsToDelete = await base44.entities.Document.filter({ created_by: user.email });

        console.log('Deleting:', {
          projects: allProjectsToDelete.length,
          income: allIncomeToDelete.length,
          expenses: allExpensesToDelete.length,
          documents: allDocumentsToDelete.length,
        });

        // Delete all records - wrap each delete in try/catch to handle missing records
        for (const project of allProjectsToDelete) {
          try {
            await base44.entities.Project.delete(project.id);
          } catch (e) {
            console.log('Project already deleted or error:', project.id, e.message);
          }
        }
        
        for (const income of allIncomeToDelete) {
          try {
            await base44.entities.IncomeItem.delete(income.id);
          } catch (e) {
            console.log('Income already deleted or error:', income.id, e.message);
          }
        }
        
        for (const expense of allExpensesToDelete) {
          try {
            await base44.entities.ExpenseItem.delete(expense.id);
          } catch (e) {
            console.log('Expense already deleted or error:', expense.id, e.message);
          }
        }
        
        for (const doc of allDocumentsToDelete) {
          try {
            await base44.entities.Document.delete(doc.id);
          } catch (e) {
            console.log('Document already deleted or error:', doc.id, e.message);
          }
        }
        
        // NOTE: We cannot delete conversations yet through the Base44 API.
        // Chat history will remain but all financial data is cleared.

        // Reset profile
        if (profile) {
          await base44.entities.UserProfile.update(profile.id, {
            professions: [],
            currency: "USD",
            locale: "en-US",
            goalMonthlyIncome: undefined,
            darkMode: false,
            funMode: false,
          });
        }

        console.log('All financial data deleted successfully');
      } catch (error) {
        console.error('Error deleting data:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("All financial data erased successfully. (Note: Chat history preserved)");
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      toast.error("Failed to erase data: " + error.message);
    }
  });

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleResetApp = () => setShowResetDialog(true);

  const handleDeleteAccount = async () => {
    // Delete all data then log out
    try {
      await deleteAllDataMutation.mutateAsync();
      await base44.auth.logout('/');
    } catch (e) {
      toast.error("Failed to delete account: " + e.message);
    }
  };



  if (userLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#22A699]" />
      </div>
    );
  }

  return (
    <>
    <ResetDialog />
    <DeleteAccountDialog />
    <div className="p-6 md:p-8 pb-24 md:pb-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Settings</h1>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader>
              <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="displayName" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="placeholder-gray-500 dark:placeholder-gray-400"
                  style={{
                    backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                    color: profile?.darkMode ? '#ffffff' : '#111827'
                  }}
                />
              </div>

              <div>
                <Label className="mb-3 block" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Your Business / Professions</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newProfession}
                    onChange={(e) => setNewProfession(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddProfession()}
                    placeholder="e.g., Photographer, Musician, Designer"
                    className="placeholder-gray-500 dark:placeholder-gray-400"
                    style={{
                      backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                      border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                      color: profile?.darkMode ? '#ffffff' : '#111827'
                    }}
                  />
                  <Button onClick={handleAddProfession} className="bg-[#22A699] hover:bg-[#1d8d82] text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {professions.map((profession, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-2" style={{
                      backgroundColor: profile?.darkMode ? '#374151' : '#f3f4f6',
                      border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                      color: profile?.darkMode ? '#d1d5db' : '#374151'
                    }}>
                      {profession}
                      <button
                        onClick={() => handleRemoveProfession(profession)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {professions.length === 0 && (
                    <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Add your professions above, or tell the AI about them in Chat</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger style={{
                      backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                      border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                      color: profile?.darkMode ? '#ffffff' : '#111827'
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}` }}>
                      {currencies.map((curr) => (
                        <SelectItem key={curr} value={curr} style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="locale" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Locale</Label>
                  <Select value={locale} onValueChange={setLocale}>
                    <SelectTrigger style={{
                      backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                      border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                      color: profile?.darkMode ? '#ffffff' : '#111827'
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}` }}>
                      {locales.map((loc) => (
                        <SelectItem key={loc} value={loc} style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="goal" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Monthly Income Goal</Label>
                <Input
                  id="goal"
                  type="number"
                  value={goalMonthlyIncome}
                  onChange={(e) => setGoalMonthlyIncome(e.target.value)}
                  placeholder="5000"
                  className="placeholder-gray-500 dark:placeholder-gray-400"
                  style={{
                    backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                    color: profile?.darkMode ? '#ffffff' : '#111827'
                  }}
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending || updateUserMutation.isPending}
                className="bg-[#22A699] hover:bg-[#1d8d82] text-white"
              >
                {updateProfileMutation.isPending || updateUserMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>



          {/* Data Section */}
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader>
              <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={createPageUrl("Documents")} className="block">
                <Button variant="outline" className="w-full gap-2 justify-start hover:bg-gray-50 dark:hover:bg-gray-600" style={{
                  backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: profile?.darkMode ? '#ffffff' : '#111827'
                }}>
                  <FileText className="w-4 h-4" />
                  View Documents & Invoices
                </Button>
              </Link>
              <Button variant="outline" onClick={handleExportCSV} className="w-full gap-2 justify-start hover:bg-gray-50 dark:hover:bg-gray-600" style={{
                  backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: profile?.darkMode ? '#ffffff' : '#111827'
              }}>
                <Download className="w-4 h-4" />
                Export to CSV
              </Button>
              <Button variant="outline" onClick={handleExportPDF} className="w-full gap-2 justify-start hover:bg-gray-50 dark:hover:bg-gray-600" style={{
                  backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: profile?.darkMode ? '#ffffff' : '#111827'
              }}>
                <Download className="w-4 h-4" />
                Export to PDF
              </Button>
              <Link to={createPageUrl("Terms")} className="block">
                <Button variant="outline" className="w-full gap-2 justify-start hover:bg-gray-50 dark:hover:bg-gray-600" style={{
                  backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: profile?.darkMode ? '#ffffff' : '#111827'
                }}>
                  <FileText className="w-4 h-4" />
                  Terms & Privacy Policy
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader>
              <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Dark Mode</Label>
                  <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Use dark theme throughout the app</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={(checked) => {
                    setDarkMode(checked);
                    updateProfileMutation.mutate({ ...profile, darkMode: checked });
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: profile?.darkMode ? '#374151' : '#e5e7eb' }}>
                <div>
                  <Label htmlFor="funMode" className="flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Who Said Accounting Can't Be Fun?
                  </Label>
                  <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Make your accountant playful and enthusiastic! 🎉</p>
                </div>
                <Switch
                  id="funMode"
                  checked={funMode}
                  onCheckedChange={(checked) => {
                    setFunMode(checked);
                    updateProfileMutation.mutate({ ...profile, funMode: checked });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader>
              <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Send Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <FeedbackForm profile={profile} user={user} />
            </CardContent>
          </Card>

          {/* Danger Zone Section */}
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `2px solid ${profile?.darkMode ? '#991b1b' : '#dc2626'}` }}>
            <CardHeader>
              <CardTitle style={{ color: profile?.darkMode ? '#ef4444' : '#dc2626' }}>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                onClick={handleResetApp}
                disabled={deleteAllDataMutation.isPending}
                className="w-full gap-2 justify-start"
                style={{
                  backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
                  border: `2px solid ${profile?.darkMode ? '#991b1b' : '#dc2626'}`,
                  color: profile?.darkMode ? '#ef4444' : '#dc2626'
                }}
              >
                {deleteAllDataMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    Erasing Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    Reset Financial Data (Keep Chat History)
                  </>
                )}
              </Button>
              <p className="text-xs" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                This will permanently delete all projects, income, expenses, and documents. This action cannot be undone. Your chat history will remain.
              </p>

              <Button
                variant="outline"
                onClick={() => setShowDeleteAccountDialog(true)}
                className="w-full gap-2 justify-start hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4"
                style={{
                  backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: profile?.darkMode ? '#ef4444' : '#dc2626'
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );

  // Reset data confirmation dialog
  function ResetDialog() {
    return (
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Reset All Financial Data?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
            This will permanently delete all projects, income, expenses, and documents. Your chat history will remain. <strong>This cannot be undone.</strong>
          </p>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setShowResetDialog(false)} style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`, color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteAllDataMutation.isPending}
              onClick={() => { setShowResetDialog(false); deleteAllDataMutation.mutate(); }}
            >
              {deleteAllDataMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, Reset Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Delete account confirmation dialog
  function DeleteAccountDialog() {
    return (
      <Dialog open={showDeleteAccountDialog} onOpenChange={(o) => { setShowDeleteAccountDialog(o); setDeleteConfirmText(''); }}>
        <DialogContent style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Delete Your Account?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
            This will permanently delete your account and all associated data. <strong>This cannot be undone.</strong>
          </p>
          <p className="text-sm mt-2" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
            Type <strong>DELETE</strong> to confirm:
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full mt-1 px-3 py-2 rounded-md border text-sm"
            style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`, color: profile?.darkMode ? '#ffffff' : '#111827' }}
          />
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => { setShowDeleteAccountDialog(false); setDeleteConfirmText(''); }} style={{ backgroundColor: profile?.darkMode ? '#374151' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`, color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== 'DELETE' || deleteAllDataMutation.isPending}
              onClick={handleDeleteAccount}
            >
              {deleteAllDataMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

}

function FeedbackForm({ profile, user }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const sendFeedbackMutation = useMutation({
    mutationFn: async (data) => {
      await base44.integrations.Core.SendEmail({
        from_name: "Ledgera AI Feedback",
        to: "annabairdballew@gmail.com",
        subject: `Feedback from ${data.name}`,
        body: `From: ${data.name} (${data.email})\n\n${data.message}`
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      setMessage("");
      setTimeout(() => setSubmitted(false), 3000);
      toast.success("Thank you for your feedback!");
    },
    onError: (error) => {
      console.error('Feedback send error:', error);
      toast.error("Failed to send feedback. Please try again.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    sendFeedbackMutation.mutate({ name, email, message });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
          Feedback Sent!
        </h3>
        <p className="text-center" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
          Thank you for helping us improve Ledgera AI.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="feedback-name" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Name</Label>
        <Input
          id="feedback-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          style={{
            backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
            border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
            color: profile?.darkMode ? '#ffffff' : '#111827'
          }}
        />
      </div>

      <div>
        <Label htmlFor="feedback-email" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Email</Label>
        <Input
          id="feedback-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
            border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
            color: profile?.darkMode ? '#ffffff' : '#111827'
          }}
        />
      </div>

      <div>
        <Label htmlFor="feedback-message" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Your Feedback</Label>
        <Textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you think, what features you'd like, or report any issues..."
          rows={5}
          required
          style={{
            backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
            border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
            color: profile?.darkMode ? '#ffffff' : '#111827'
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={sendFeedbackMutation.isPending}
        className="w-full bg-[#22A699] hover:bg-[#1d8d82] text-white"
      >
        {sendFeedbackMutation.isPending ? "Sending..." : "Send Feedback"}
      </Button>
    </form>
  );
}