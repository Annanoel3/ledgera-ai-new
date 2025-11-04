import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, ExternalLink, Loader2, FolderOpen, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Documents() {
  const [search, setSearch] = useState("");
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

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      // Get ALL documents, not just by created_by
      const allDocs = await base44.entities.Document.list('-uploadDate');
      // Filter to only docs for projects owned by this user
      const userProjects = await base44.entities.Project.filter({ created_by: user.email });
      const userProjectIds = userProjects.map(p => p.id);
      return allDocs.filter(doc => 
        doc.created_by === user.email || userProjectIds.includes(doc.projectId)
      );
    },
    enabled: !!user,
    initialData: [],
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
    },
  });

  const handleDeleteDocument = async (e, docId) => {
    e.stopPropagation();
    if (window.confirm("Delete this document? This action cannot be undone.")) {
      await deleteDocumentMutation.mutateAsync(docId);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
    doc.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const documentsByMonth = filteredDocuments.reduce((acc, doc) => {
    const month = format(new Date(doc.uploadDate), 'MMMM yyyy');
    if (!acc[month]) acc[month] = [];
    acc[month].push(doc);
    return acc;
  }, {});

  const typeColors = {
    invoice: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    contract: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    receipt: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };

  if (userLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#22A699]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Documents</h1>
        <p className="mb-8" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>All your invoices, contracts, and receipts in one place</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="pl-10"
            style={{
              backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
              color: profile?.darkMode ? '#ffffff' : '#111827'
            }}
          />
        </div>

        {filteredDocuments.length === 0 ? (
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: profile?.darkMode ? '#374151' : '#f3f4f6' }}>
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>No documents yet</h3>
              <p className="mb-4" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Upload files through the chat to get started</p>
              <Link to={createPageUrl("Chat")}>
                <Button className="bg-[#22A699] hover:bg-[#1d8d82]">Go to Chat</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(documentsByMonth).map(([month, docs]) => (
              <div key={month}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                  <FolderOpen className="w-5 h-5 text-[#22A699]" />
                  {month}
                </h2>
                <div className="grid gap-4">
                  {docs.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-lg transition-all" style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: profile?.darkMode ? '#374151' : '#f3f4f6' }}>
                              <FileText className="w-6 h-6" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold mb-1 truncate" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>{doc.fileName}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={typeColors[doc.fileType]}>{doc.fileType}</Badge>
                                <span className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                                  {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                                </span>
                              </div>
                              {doc.notes && (
                                <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>{doc.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                              className="flex-shrink-0"
                              style={{
                                backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                                border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                                color: profile?.darkMode ? '#d1d5db' : '#111827'
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => handleDeleteDocument(e, doc.id)}
                              className="flex-shrink-0 hover:text-red-500 hover:border-red-500"
                              style={{
                                backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                                border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                                color: profile?.darkMode ? '#d1d5db' : '#111827'
                              }}
                              disabled={deleteDocumentMutation.isPending}
                            >
                              {deleteDocumentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}