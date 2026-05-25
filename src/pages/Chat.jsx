import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Loader2, Square, Paperclip, X, FileText, Plus, MessageSquare, Trash2, Info } from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { processFinancialData } from "@/functions/processFinancialData";
import { processChat } from "@/functions/processChat";
import { speechToText } from "@/functions/speechToText";
import { setMicActive } from "@/lib/admob";
import { VoiceRecorder } from 'capacitor-voice-recorder';

// Move component definitions OUTSIDE to prevent re-mounting on every render
const ChatHeader = ({ profile, showChatList, setShowChatList, handleNewChat, setShowCapabilities }) =>
<div className="px-4 fixed top-0 left-0 right-0 z-50 shadow-sm" style={{
  paddingTop: 'max(2rem, env(safe-area-inset-top))',
  paddingBottom: '0.5rem',
  borderBottom: profile?.funMode ? 'none' : `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
  background: profile?.funMode ?
  'linear-gradient(to right, #ec4899, #a855f7, #3b82f6)' :
  profile?.darkMode ? '#1a1a1a' : '#ffffff'
}}>
    <div className="flex items-center justify-between max-w-4xl mx-auto gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-shrink">
        <Link to={createPageUrl("Dashboard")}>
          <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          background: profile?.funMode ? '#ffffff' : 'linear-gradient(135deg, #22A699, #1d8d82)',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>

            <span style={{
            fontWeight: '600',
            fontSize: '1rem',
            color: profile?.funMode ? '#a855f7' : '#ffffff'
          }}>
              {profile?.funMode ? "💸" : "LA"}
            </span>
          </div>
        </Link>
        <div className="min-w-0">
          <h2 className="truncate" style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: profile?.funMode ? '#ffffff' : profile?.darkMode ? '#ffffff' : '#111827'
        }}>
            {profile?.funMode ? "Your Money Wizard" : "Ledgera AI"}
          </h2>
          <p className="py-1 truncate" style={{
          fontSize: '0.7rem',
          color: profile?.funMode ? '#fce7f3' : profile?.darkMode ? '#9ca3af' : '#6b7280'
        }}>
            {profile?.funMode ? "Let's make bookkeeping fun" : "Available 24/7"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
        onClick={() => setShowCapabilities(true)}
        variant="outline"
        size="sm"
        className="gap-2 hidden md:flex"
        style={{
          backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
          color: profile?.darkMode ? '#d1d5db' : '#374151'
        }}>

          <Info className="w-4 h-4" /> What I Can Do
        </Button>
        <Button
        onClick={() => setShowCapabilities(true)}
        variant="outline"
        size="sm"
        className="md:hidden"
        style={{
          backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
          color: profile?.darkMode ? '#d1d5db' : '#374151',
          padding: '0.5rem'
        }}>

          <Info className="w-4 h-4" />
        </Button>
        <Button
        onClick={() => setShowChatList(!showChatList)}
        variant="outline"
        size="sm"
        className="gap-2 hidden md:flex"
        style={{
          backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
          color: profile?.darkMode ? '#d1d5db' : '#374151'
        }}>

          <MessageSquare className="w-4 h-4" /> Chats
        </Button>
        <Button
        onClick={() => setShowChatList(!showChatList)}
        variant="outline"
        size="sm"
        className="md:hidden"
        style={{
          backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
          color: profile?.darkMode ? '#d1d5db' : '#374151',
          padding: '0.5rem'
        }}>

          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button
        onClick={handleNewChat}
        variant="outline"
        size="sm"
        className="gap-2 hidden md:flex"
        style={{
          backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
          color: profile?.darkMode ? '#d1d5db' : '#374151'
        }}>

          <Plus className="w-4 h-4" /> New Chat
        </Button>
        <Button
        onClick={handleNewChat}
        variant="outline"
        size="sm"
        className="md:hidden"
        style={{
          backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
          color: profile?.darkMode ? '#d1d5db' : '#374151',
          padding: '0.5rem'
        }}>

          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>;


const ChatInputArea = memo(({ profile, selectedFiles, removeFile, fileInputRef, handleFileSelect, input, setInput, isRecording, stopRecording, startRecording, handleSend, sendingMessage, uploadingFile }) =>
    <div className="flex-shrink-0 w-full" style={{
    borderTop: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
    boxShadow: profile?.funMode ? '0 -10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
    background: profile?.funMode ?
    profile?.darkMode ?
    'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), linear-gradient(to right, #ec4899, #a855f7, #3b82f6)' :
    'linear-gradient(to right, #fce7f3, #faf5ff, #eff6ff)' :
    profile?.darkMode ? '#1a1a1a' : '#f9fafb'
  }}>
      <div className="max-w-4xl mx-auto w-full px-3 pt-2 pb-2">
        {/* File preview strip — lives inside the same bar */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
            {selectedFiles.map((file, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: '0.5rem',
                padding: '0.4rem 0.6rem',
                fontSize: '0.8rem',
                flexShrink: 0,
                background: profile?.funMode ?
                  profile?.darkMode ? 'rgba(236, 72, 153, 0.3)' : 'linear-gradient(to right, #fce7f3, #fae8ff)' :
                  profile?.darkMode ? '#374151' : '#e5e7eb',
                color: profile?.darkMode ? '#e5e7eb' : '#374151'
              }}>
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                <button onClick={() => removeFile(idx)} style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }} />

          <Button
          onClick={() => fileInputRef.current?.click()}
          className="h-12 w-12 flex-shrink-0 shadow-md transition-all hover:scale-110"
          style={{
            background: profile?.funMode ?
            'linear-gradient(to right, #f472b6, #a855f7)' :
            profile?.darkMode ? '#374151' : '#e5e7eb'
          }}
          size="icon"
          disabled={uploadingFile || isRecording}>
            <Paperclip className="w-5 h-5" style={{ color: profile?.funMode ? '#ffffff' : profile?.darkMode ? '#d1d5db' : '#111827' }} />
          </Button>

          <div className="flex-1 relative">
            <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={profile?.funMode ? "Spill the financial tea..." : "Type your message or speak..."}
            className="px-3 py-1 text-base rounded-md flex w-full border shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[48px] max-h-32 resize-none"
            style={{
              backgroundColor: profile?.funMode ?
              profile?.darkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)' :
              profile?.darkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.7)',
              border: profile?.funMode ?
              profile?.darkMode ? '1px solid #a855f7' : '1px solid #f9a8d4' :
              profile?.darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
              color: profile?.darkMode ? '#ffffff' : '#111827'
            }}
            disabled={sendingMessage || isRecording || uploadingFile} />
          </div>

          <Button
          onClick={isRecording ? stopRecording : startRecording}
          className="h-12 w-12 flex-shrink-0 shadow-md transition-all hover:scale-110"
          style={{
            background: isRecording ?
            '#ef4444' :
            profile?.funMode ?
            'linear-gradient(to right, #3b82f6, #a855f7)' :
            profile?.darkMode ? '#374151' : '#e5e7eb',
            animation: isRecording ? 'pulse 2s infinite' : 'none'
          }}
          size="icon"
          disabled={uploadingFile}>
            {isRecording ?
          <Square className="w-5 h-5 text-white" /> :
          <Mic className="w-5 h-5" style={{ color: profile?.funMode ? '#ffffff' : profile?.darkMode ? '#d1d5db' : '#111827' }} />
          }
          </Button>

          <Button
          onClick={handleSend}
          disabled={!input.trim() && selectedFiles.length === 0 || sendingMessage || isRecording || uploadingFile}
          className="h-12 w-12 flex-shrink-0 shadow-md transition-all hover:scale-110"
          style={{
            background: profile?.funMode ?
            'linear-gradient(to right, #ec4899, #a855f7)' :
            '#22A699'
          }}
          size="icon">
            {sendingMessage || uploadingFile ?
          <Loader2 className="w-5 h-5 animate-spin text-white" /> :
          <Send className="w-5 h-5 text-white" />
          }
          </Button>
        </div>

        {isRecording &&
      <p style={{
        fontSize: '0.75rem',
        textAlign: 'center',
        marginTop: '0.5rem',
        animation: 'pulse 2s infinite',
        fontWeight: '500',
        color: profile?.funMode ? '#a855f7' : '#ef4444'
      }}>
            Recording... Click to stop
          </p>
      }
        {uploadingFile &&
      <p style={{
        fontSize: '0.75rem',
        textAlign: 'center',
        marginTop: '0.5rem',
        animation: 'pulse 2s infinite',
        fontWeight: '500',
        color: profile?.funMode ? '#a855f7' : '#22A699'
      }}>
            Uploading your files...
          </p>
      }
      </div>
    </div>
);


export default function Chat() {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showChatList, setShowChatList] = useState(false);
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingDuplicates, setPendingDuplicates] = useState([]);
  const fileInputRef = useRef(null);
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
    staleTime: 5 * 60 * 1000
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
          funMode: false
        });
        return newProfile;
      }
      return profiles[0];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Project.filter({ created_by: user.email }, '-updated_date');
    },
    initialData: [],
    staleTime: 2 * 60 * 1000,
    enabled: !!user
  });

  const { data: conversations, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user?.email) return [];

      try {
        const allConversations = await base44.entities.Conversation.filter({ userEmail: user.email }, '-createdAt', 50);
        return allConversations;
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
    initialData: []
  });

  // On initial load only: auto-select the latest conversation
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!initialLoadDone.current && conversations && conversations.length > 0 && !conversationId) {
      initialLoadDone.current = true;
      const latestConv = conversations[0];
      setConversationId(latestConv.id);
      setMessages(latestConv.messages || []);
    }
  }, [conversations]);



  const handleNewChat = () => {
    initialLoadDone.current = true; // prevent auto-reselect
    setConversationId(null);
    setMessages([]);
    setShowChatList(false);
  };

  const handleSelectChat = (conv) => {
    setConversationId(conv.id);
    setMessages(conv.messages || []);
    setShowChatList(false);
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();

    try {
      await base44.entities.Conversation.delete(convId);

      if (convId === conversationId) {
        handleNewChat();
      }

      refetchConversations();
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleSend = async () => {
    if (!input.trim() && selectedFiles.length === 0 || sendingMessage || uploadingFile) return;

    let fileUrls = [];
    let fileNames = [];
    const userMessageText = input.trim();

    if (selectedFiles.length > 0) {
      setUploadingFile(true);
      try {
        for (const file of selectedFiles) {
          const response = await base44.integrations.Core.UploadFile({ file });
          fileUrls.push(response.file_url);
          fileNames.push(file.name);
        }
        toast.success(`Uploaded ${selectedFiles.length} file(s)`);
      } catch (error) {
        toast.error("Failed to upload files");
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);

      const files = fileUrls.map((url, idx) => ({
        fileName: fileNames[idx],
        fileUrl: url,
        fileType: 'receipt'
      }));

      // Optimistically show user message with file attachments
      const optimisticUserMsg = {
        role: 'user',
        content: userMessageText || '',
        _fileNames: fileNames,
        _fileUrls: fileUrls
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);
      setInput("");
      setSelectedFiles([]);

      setBackgroundProcessing(true);

      let processingSummaryMessage = "";
      try {
        const response = await processFinancialData({
          action: 'processFiles',
          data: {
            files,
            userMessage: input.trim()
          }
        });

        if (response.data.success) {
          const processData = response.data;
          const incomeCount = processData.incomeCount || 0;
          const expenseCount = processData.expenseCount || 0;
          const totalIncome = processData.totalIncome || 0;
          const totalExpenses = processData.totalExpenses || 0;
          const duplicatesSkipped = processData.duplicatesSkipped || 0;
          const duplicateFiles = processData.duplicateFiles || [];
          const uncertainAssignments = processData.uncertainAssignments || [];
          const newPendingDuplicates = processData.pendingDuplicates || [];

          let toastMessage = "";

          if (duplicateFiles.length > 0) {
            toastMessage += `Skipped ${duplicateFiles.length} file(s) that were already uploaded.\n`;
          }

          if (incomeCount > 0) {
            toastMessage += `Added ${incomeCount} income item(s) totaling $${totalIncome.toFixed(2)}\n`;
            processingSummaryMessage += `I successfully added ${incomeCount} income items totaling $${totalIncome.toFixed(2)}. `;
          }

          if (expenseCount > 0) {
            toastMessage += `Added ${expenseCount} expense item(s) totaling $${totalExpenses.toFixed(2)}\n`;
            processingSummaryMessage += `I successfully added ${expenseCount} expense items totaling $${totalExpenses.toFixed(2)}. `;
          }

          if (duplicatesSkipped > 0) {
            toastMessage += `Skipped ${duplicatesSkipped} duplicate transaction(s)`;
            processingSummaryMessage += `Skipped ${duplicatesSkipped} duplicate transactions. `;
          }

          if (uncertainAssignments.length > 0) {
            processingSummaryMessage += `\n\nIMPORTANT: I was unsure which project these belong to, so I made my best guess. Here's what I assigned:\n`;
            uncertainAssignments.forEach((item) => {
              processingSummaryMessage += `- $${item.amount.toFixed(2)} (${item.description}) → ${item.assignedProject}\n`;
            });
            processingSummaryMessage += `\nPlease confirm if these project assignments are correct, or let me know if any need to be moved to a different project.`;
          }

          if (newPendingDuplicates.length > 0) {
            setPendingDuplicates(newPendingDuplicates);
            processingSummaryMessage += `\n\nDUPLICATE WARNING: ${newPendingDuplicates.length} transaction(s) look like they may already exist. Ask the user if each one was intentional or a mistake, one by one. List each: `;
            newPendingDuplicates.forEach((dup) => {
              processingSummaryMessage += `\n- $${dup.amount.toFixed ? dup.amount.toFixed(2) : dup.amount} on ${dup.date} (${dup.notes || dup.vendor}) → ${dup.projectName}`;
            });
            processingSummaryMessage += `\nIf user says YES keep it, reply with EXACTLY: "SAVE_DUPLICATES". If user says NO skip them, reply with EXACTLY: "SKIP_DUPLICATES".`;
          }

          if (incomeCount === 0 && expenseCount === 0 && duplicateFiles.length === 0) {
            toastMessage = "Files saved. No transactions auto-extracted.";
            processingSummaryMessage = "The file was saved but no transactions could be auto-extracted from it. Please ask the user to list any expenses or income they want to add manually.";
          }

          if (toastMessage) {
            toast.success(toastMessage);
          }

          queryClient.invalidateQueries(['projects']);
          queryClient.invalidateQueries(['incomeItems']);
          queryClient.invalidateQueries(['expenseItems']);
          queryClient.invalidateQueries(['documents']);
        }
      } catch (error) {
        console.error('Processing error:', error);
        toast.error("File processing failed: " + error.message);
        processingSummaryMessage = `I encountered an error processing the files: ${error.message}`;
      } finally {
        setBackgroundProcessing(false);
      }

      let finalMessage = '';
      if (userMessageText) {
        finalMessage = userMessageText;
        if (processingSummaryMessage) {
          finalMessage += `\n\n[System: ${processingSummaryMessage.trim()}]`;
        }
      } else {
        finalMessage = processingSummaryMessage ? `[System: ${processingSummaryMessage.trim()}]` : "I uploaded some files.";
      }

      setSendingMessage(true);
      try {
        const response = await processChat({
          message: finalMessage,
          conversationId: conversationId || null,
          fileUrls: fileUrls
        });

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
        }

        // Check if AI signaled to save or skip duplicates
        const aiReply = response.data.response || '';
        if (aiReply.includes('SAVE_DUPLICATES') && pendingDuplicates.length > 0) {
          try {
            await processFinancialData({ action: 'processFiles', data: { files: [], userMessage: '', forceSave: true, preSavedItems: pendingDuplicates } });
            setPendingDuplicates([]);
          } catch (e) { console.error('Error force-saving duplicates:', e); }
        } else if (aiReply.includes('SKIP_DUPLICATES')) {
          setPendingDuplicates([]);
        }

        // Append AI reply without overwriting optimistic user message
        if (aiReply) {
          setMessages((prev) => [...prev, { role: 'assistant', content: aiReply }]);
        }
        await refetchConversations();
      } catch (error) {
        console.error('Chat error:', error);
        toast.error("Failed to send message: " + (error.response?.data?.error || error.message));
      } finally {
        setSendingMessage(false);
      }

    } else {
      const message = input.trim();
      setInput("");

      // Optimistically add user message to UI
      const newUserMessage = { role: 'user', content: message };
      setMessages((prev) => [...prev, newUserMessage]);

      setSendingMessage(true);
      try {
        const response = await processChat({
          message: message,
          conversationId: conversationId || null
        });

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
        }

        // Append AI reply without overwriting optimistic user message
        const aiReplyText = response.data.response || '';
        if (aiReplyText.includes('SAVE_DUPLICATES') && pendingDuplicates.length > 0) {
          try {
            await processFinancialData({ action: 'processFiles', data: { files: [], userMessage: '', forceSave: true, preSavedItems: pendingDuplicates } });
            setPendingDuplicates([]);
          } catch (e) { console.error('Error force-saving duplicates:', e); }
        } else if (aiReplyText.includes('SKIP_DUPLICATES')) {
          setPendingDuplicates([]);
        }
        if (aiReplyText) {
          setMessages((prev) => [...prev, { role: 'assistant', content: aiReplyText }]);
        }
        await refetchConversations();
      } catch (error) {
        console.error('Chat error:', error);
        console.error('Error response:', error.response?.data);
        toast.error("Failed to send message: " + (error.response?.data?.error || error.message));
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const { value: hasPermission } = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPermission) {
        const { value: granted } = await VoiceRecorder.requestAudioRecordingPermission();
        if (!granted) {
          toast.error("Microphone permission denied.");
          return;
        }
      }
      await VoiceRecorder.startRecording();
      setIsRecording(true);
      setMicActive(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast.error("Could not start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    try {
      const result = await VoiceRecorder.stopRecording();
      setIsRecording(false);
      setMicActive(false);

      const { recordDataBase64, mimeType } = result.value;
      const dataUrl = `data:${mimeType};base64,${recordDataBase64}`;

      toast.info("Transcribing...");

      // Convert dataUrl to a File for upload
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const ext = mimeType.includes('aac') ? 'm4a' : 'webm';
      const file = new File([blob], `recording.${ext}`, { type: mimeType });

      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const response = await speechToText({ file_url: uploadResponse.file_url });

      if (response.data.text) {
        toast.success("Transcription complete!");
        setInput(response.data.text);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      setIsRecording(false);
      setMicActive(false);
      toast.error("Could not process recording. Please try again.");
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = null;
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const showWelcome = messages.length === 0 && !sendingMessage;

  if (userLoading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#22A699] mx-auto mb-3" />
            <p style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>Loading chat...</p>
          </div>
        </div>
      </div>);

  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: 'calc(100vh - 4rem - env(safe-area-inset-bottom))',
        background: profile?.funMode ?
        profile?.darkMode ?
        'linear-gradient(to bottom right, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))' :
        'linear-gradient(to bottom right, #fdf2f8, #faf5ff, #eff6ff)' :
        profile?.darkMode ? '#0f0f0f' : 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
      }}>

      <ChatHeader profile={profile} showChatList={showChatList} setShowChatList={setShowChatList} handleNewChat={handleNewChat} setShowCapabilities={setShowCapabilities} />

      {showChatList &&
      <>
          <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setShowChatList(false)} />


          <div className="absolute top-20 right-4 z-50 w-80 max-h-96 overflow-y-auto rounded-lg shadow-xl" style={{
          backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`
        }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Your Conversations</h3>
                <button
                onClick={() => setShowChatList(false)}
                className="text-gray-400 hover:text-gray-600">

                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {conversations && conversations.length > 0 ?
              conversations.map((conv) => {
                const dateStr = conv.createdAt;
                let displayDate = 'Recent';
                if (dateStr) {
                  try {
                    displayDate = format(new Date(dateStr), 'MMM d');
                  } catch (e) {
                    displayDate = 'Recent';
                  }
                }

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectChat(conv)}
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group"
                    style={{
                      backgroundColor: conv.id === conversationId ?
                      profile?.darkMode ? '#374151' : '#f3f4f6' :
                      'transparent',
                      border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`
                    }}
                    onMouseEnter={(e) => {
                      if (conv.id !== conversationId) {
                        e.currentTarget.style.backgroundColor = profile?.darkMode ? '#374151' : '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (conv.id !== conversationId) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                            {conv.name || 'Finance Chat'}
                          </p>
                          <p className="text-xs truncate" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                            {conv.messages?.length || 0} messages • {displayDate}
                          </p>
                        </div>
                        <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-100 h-8 w-8 flex-shrink-0"
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>

                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>);

              }) :

              <p className="text-sm text-center py-4" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                    No conversations yet. Start chatting!
                  </p>
              }
              </div>
            </div>
          </div>
        </>
      }

      <Dialog open={showCapabilities} onOpenChange={setShowCapabilities}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{
          backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`
        }}>
          <DialogHeader>
            <DialogTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
              What Ledgera AI Can Do
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                💵 Income Tracking
              </h3>
              <ul className="list-disc space-y-1 ml-4 text-sm" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>Log income from any source</li>
                <li>Automatically categorize by project</li>
                <li>Track payment methods and dates</li>
                <li>Delete or edit income items anytime</li>
                <li>Move income between projects</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                💳 Expense Management
              </h3>
              <ul className="list-disc space-y-1 ml-4 text-sm" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>Track all business expenses</li>
                <li>Categorize automatically (supplies, travel, marketing, etc.)</li>
                <li>Record vendor information</li>
                <li>Remove expenses with a simple request</li>
                <li>Move expenses between projects</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                📁 Smart File Processing
              </h3>
              <ul className="list-disc space-y-1 ml-4 text-sm" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>Upload receipts, invoices, or bank statements</li>
                <li>AI extracts transaction data automatically</li>
                <li>Smart project assignment based on content</li>
                <li>Duplicate detection to avoid double-entry</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                📊 Financial Reports
              </h3>
              <ul className="list-disc space-y-1 ml-4 text-sm" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>Income statements and balance sheets</li>
                <li>Project profitability analysis</li>
                <li>ROI calculations and margin tracking</li>
                <li>Tax preparation summaries</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                🎤 Voice Input
              </h3>
              <ul className="list-disc space-y-1 ml-4 text-sm" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>Record voice messages</li>
                <li>Automatic transcription to text</li>
                <li>Perfect for on-the-go expense tracking</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                💬 Natural Conversation
              </h3>
              <ul className="list-disc space-y-1 ml-4 text-sm" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
                <li>Ask questions in plain English</li>
                <li>Get advice and insights</li>
                <li>No accounting jargon required</li>
                <li>Available 24/7</li>
              </ul>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: profile?.darkMode ? '#374151' : '#e5e7eb' }}>
              <p className="text-sm" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                <strong style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Pro Tip:</strong> Just talk to me naturally! Tell me what you do, upload your files, and I will organize everything for you.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="px-4 flex-1 overflow-y-auto" style={{ paddingTop: '5rem', paddingBottom: '1rem' }}>
        <div className="max-w-4xl mx-auto space-y-4 py-4">
          {showWelcome ?
          <div className="flex flex-col items-center justify-center h-full">
              <div className="w-full max-w-2xl">
                <div className="flex gap-3 justify-start mb-8">
                  <div style={{
                  height: '2rem',
                  width: '2rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  background: profile?.funMode ?
                  'linear-gradient(135deg, #f472b6, #a855f7)' :
                  'linear-gradient(135deg, #22A699, #1d8d82)'
                }}>
                    <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.875rem' }}>
                      {profile?.funMode ? "💰" : "LA"}
                    </span>
                  </div>
                  <div style={{
                  maxWidth: '85%',
                  borderRadius: '1rem',
                  padding: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: profile?.funMode ?
                  profile?.darkMode ? '1px solid #a855f7' : '1px solid #fbc2eb' :
                  profile?.darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                  background: profile?.funMode ?
                  profile?.darkMode ?
                  'linear-gradient(135deg, #1f2937, rgba(168, 85, 247, 0.3))' :
                  'linear-gradient(135deg, #ffffff, #fdf2f8)' :
                  profile?.darkMode ? '#1f2937' : '#ffffff'
                }}>
                    {profile?.funMode ?
                  <>
                        <p style={{
                      fontSize: '15px',
                      lineHeight: '1.4',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: profile?.darkMode ? '#ffffff' : '#111827'
                    }}>
                          Hey {user?.full_name?.split(' ')[0] || 'there'}! I am Ledgera AI, your accountant who actually gets it.
                        </p>
                        <p style={{
                      fontSize: '15px',
                      lineHeight: '1.4',
                      marginBottom: '0.5rem',
                      color: profile?.darkMode ? '#d1d5db' : '#374151'
                    }}>
                          I am here to help you:
                        </p>
                        <ul style={{
                      listStyleType: 'disc',
                      listStylePosition: 'inside',
                      marginBottom: '0.5rem',
                      color: profile?.darkMode ? '#d1d5db' : '#374151',
                      fontSize: '15px',
                      lineHeight: '1.4'
                    }}>
                          <li style={{ marginBottom: '0.25rem' }}>Track money stuff without boring spreadsheets</li>
                          <li style={{ marginBottom: '0.25rem' }}>Catch expenses you definitely forgot about</li>
                          <li style={{ marginBottom: '0.25rem' }}>Actually understand your ROI not just pretend</li>
                          <li style={{ marginBottom: '0.25rem' }}>Make tax season less painful</li>
                          <li style={{ marginBottom: '0.25rem' }}>Get reminders to log income/expenses after events</li>
                          <li style={{ marginBottom: '0.25rem' }}>Answer money questions in plain English</li>
                        </ul>
                        <p style={{
                      fontSize: '15px',
                      lineHeight: '1.4',
                      color: profile?.darkMode ? '#ffffff' : '#111827',
                      fontWeight: '500'
                    }}>
                          So... what do you do for work?
                        </p>
                      </> :

                  <>
                        <p style={{
                      fontSize: '15px',
                      lineHeight: '1.4',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: profile?.darkMode ? '#ffffff' : '#111827'
                    }}>
                          Hi {user?.full_name?.split(' ')[0] || 'there'}! I am Ledgera AI, your personal accountant.
                        </p>
                        <p style={{
                      fontSize: '15px',
                      lineHeight: '1.4',
                      marginBottom: '0.5rem',
                      color: profile?.darkMode ? '#d1d5db' : '#374151'
                    }}>
                          I can help you:
                        </p>
                        <ul style={{
                      listStyleType: 'disc',
                      listStylePosition: 'inside',
                      marginBottom: '0.5rem',
                      color: profile?.darkMode ? '#d1d5db' : '#374151',
                      fontSize: '15px',
                      lineHeight: '1.4'
                    }}>
                          <li style={{ marginBottom: '0.25rem' }}>Track all income and expenses by project</li>
                          <li style={{ marginBottom: '0.25rem' }}>Catch costs you might have missed</li>
                          <li style={{ marginBottom: '0.25rem' }}>Create custom financial reports</li>
                          <li style={{ marginBottom: '0.25rem' }}>Get reminders to log income/expenses after events</li>
                          <li style={{ marginBottom: '0.25rem' }}>Answer questions about your business</li>
                        </ul>
                        <p style={{
                      fontSize: '15px',
                      lineHeight: '1.4',
                      color: profile?.darkMode ? '#ffffff' : '#111827',
                      fontWeight: '500'
                    }}>
                          Let us get started - what is your business? What do you do?
                        </p>
                      </>
                  }
                  </div>
                </div>
              </div>
            </div> :

          <>
              {(() => {
              const filtered = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
              const grouped = [];
              let currentGroup = null;

              for (const msg of filtered) {
                if (msg.role === 'assistant') {
                  if (!currentGroup) {
                    currentGroup = { role: 'assistant', parts: [] };
                  }
                  currentGroup.parts.push(msg);
                } else {
                  if (currentGroup) {
                    grouped.push(currentGroup);
                    currentGroup = null;
                  }
                  grouped.push(msg);
                }
              }
              if (currentGroup) grouped.push(currentGroup);

              return grouped.map((item, idx) => {
                if (item.role === 'assistant' && item.parts) {
                  // Render grouped assistant messages with single avatar
                  return (
                    <div key={idx} className="flex gap-3 justify-start">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg mt-1`} style={{
                        background: profile?.funMode ?
                        'linear-gradient(135deg, #f472b6, #a855f7)' :
                        'linear-gradient(135deg, #22A699, #1d8d82)'
                      }}>
                          <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.75rem' }}>
                            {profile?.funMode ? "💰" : "LA"}
                          </span>
                        </div>
                        <div className="space-y-2 flex-1">
                          {item.parts.map((msg, i) =>
                        <div key={i} className="max-w-[80%]">
                              <MessageBubble message={msg} profile={profile} hideAvatar={true} />
                            </div>
                        )}
                        </div>
                      </div>);

                }
                return <MessageBubble key={idx} message={item} profile={profile} />;
              });
            })()}

              {backgroundProcessing &&
            <div className="flex gap-3 justify-start">
                  <div style={{
                height: '2rem',
                width: '2rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                background: profile?.funMode ?
                'linear-gradient(135deg, #f472b6, #a855f7)' :
                'linear-gradient(135deg, #22A699, #1d8d82)'
              }}>
                    <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.875rem' }}>
                      {profile?.funMode ? "💰" : "LA"}
                    </span>
                  </div>
                  <div style={{
                maxWidth: '85%',
                borderRadius: '1rem',
                padding: '0.75rem 1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: profile?.funMode ?
                profile?.darkMode ? '1px solid #a855f7' : '1px solid #fbc2eb' :
                profile?.darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                background: profile?.funMode ?
                profile?.darkMode ?
                'linear-gradient(135deg, #1f2937, rgba(168, 85, 247, 0.3))' :
                'linear-gradient(135deg, #ffffff, #fdf2f8)' :
                profile?.darkMode ? '#1f2937' : '#ffffff'
              }}>
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#22A699' }} />
                      <span style={{ color: profile?.darkMode ? '#d1d5db' : '#374151', fontSize: '15px' }}>
                        Processing files...
                      </span>
                    </div>
                  </div>
                </div>
            }


            </>
          }
        </div>
      </div>

      <ChatInputArea
        profile={profile}
        selectedFiles={selectedFiles}
        removeFile={removeFile}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        input={input}
        setInput={setInput}
        isRecording={isRecording}
        stopRecording={stopRecording}
        startRecording={startRecording}
        handleSend={handleSend}
        sendingMessage={sendingMessage}
        uploadingFile={uploadingFile} />

    </div>);

}