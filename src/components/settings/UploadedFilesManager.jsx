import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Image, FileSpreadsheet, File, Trash2, ExternalLink, Loader2, Search, FolderOpen } from "lucide-react";
import { format } from "date-fns";

function getFileIcon(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return Image;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['pdf'].includes(ext)) return FileText;
  return File;
}

function getFileTypeBadge(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return { label: 'Image', color: 'bg-pink-100 text-pink-800' };
  if (['xls', 'xlsx'].includes(ext)) return { label: 'Excel', color: 'bg-green-100 text-green-800' };
  if (['csv'].includes(ext)) return { label: 'CSV', color: 'bg-teal-100 text-teal-800' };
  if (['pdf'].includes(ext)) return { label: 'PDF', color: 'bg-red-100 text-red-800' };
  return { label: 'File', color: 'bg-gray-100 text-gray-800' };
}

export default function UploadedFilesManager({ profile, user }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const allDocs = await base44.entities.Document.list('-uploadDate');
      const userProjects = await base44.entities.Project.filter({ created_by: user.email });
      const userProjectIds = userProjects.map(p => p.id);
      return allDocs.filter(doc =>
        doc.created_by === user.email || userProjectIds.includes(doc.projectId)
      );
    },
    enabled: !!user,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setDeletingId(null);
    },
    onError: () => setDeletingId(null),
  });

  const handleDelete = (docId) => {
    if (window.confirm("Delete this file? This action cannot be undone.")) {
      setDeletingId(docId);
      deleteDocumentMutation.mutate(docId);
    }
  };

  const filtered = documents.filter(doc =>
    doc.fileName?.toLowerCase().includes(search.toLowerCase()) ||
    doc.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const darkMode = profile?.darkMode;

  return (
    <Card style={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
      <CardHeader>
        <CardTitle style={{ color: darkMode ? '#ffffff' : '#111827' }}>Uploaded Files</CardTitle>
        <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
          All files you've uploaded via Chat — PDFs, images, spreadsheets, etc.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="pl-10"
            style={{
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
              color: darkMode ? '#ffffff' : '#111827'
            }}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#22A699]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <FolderOpen className="w-10 h-10 text-gray-400" />
            <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
              {search ? "No files match your search" : "No uploaded files yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.map((doc) => {
              const Icon = getFileIcon(doc.fileName);
              const badge = getFileTypeBadge(doc.fileName);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{
                    backgroundColor: darkMode ? '#374151' : '#f9fafb',
                    border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`
                  }}
                >
                  <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: darkMode ? '#4b5563' : '#e5e7eb' }}>
                    <Icon className="w-5 h-5" style={{ color: darkMode ? '#d1d5db' : '#6b7280' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: darkMode ? '#ffffff' : '#111827' }}>{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`text-xs ${badge.color}`}>{badge.label}</Badge>
                      <span className="text-xs" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                        {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      className="h-8 w-8"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="h-8 w-8 hover:text-red-500"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}>
            {filtered.length} file{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}