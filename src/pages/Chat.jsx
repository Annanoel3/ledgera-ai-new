
import React, { useState, useEffect, useRef } from "react";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { processFinancialData } from "@/functions/processFinancialData";
import { processChat } from "@/functions/processChat";
import { speechToText } from "@/functions/speechToText";

// Move component definitions OUTSIDE to prevent re-mounting on every render
const ChatHeader = ({ profile, showChatList, setShowChatList, handleNewChat, setShowCapabilities }) => (
  <div className="sticky top-0 z-10 shadow-sm" style={{
    borderBottom: profile?.funMode ? 'none' : `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
    background: profile?.funMode
      ? 'linear-gradient(to right, #ec4899, #a855f7, #3b82f6)'
      : (profile?.darkMode ? '#1a1a1a' : '#ffffff'),
    paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
    paddingBottom: '0.75rem',
    paddingLeft: '1rem',
    paddingRight: '1rem'
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
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
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
            color: profile?.funMode ? '#ffffff' : (profile?.darkMode ? '#ffffff' : '#111827')
          }}>
            {profile?.funMode ? "Your Money Wizard" : "Ledgera AI"}
          </h2>
          <p className="truncate" style={{
            fontSize: '0.7rem',
            color: profile?.funMode ? '#fce7f3' : (profile?.darkMode ? '#9ca3af' : '#6b7280')
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
          }}
        >
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
          }}
        >
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
          }}
        >
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
          }}
        >
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
          }}
        >
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
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);

const ChatInputArea = ({ profile, selectedFiles, removeFile, fileInputRef, handleFileSelect, handleKeyPress, input, setInput, isRecording, stopRecording, startRecording, handleSend, sendingMessage, uploadingFile }) => (
  <>
    {selectedFiles.length > 0 && (
      <div style={{
        borderTop: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
        background: profile?.darkMode ? '#1a1a1a' : '#f9fafb',
        padding: '0.5rem 1rem'
      }}>
        <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto">
          {selectedFiles.map((file, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              background: profile?.funMode
                ? (profile?.darkMode
                    ? 'rgba(236, 72, 153, 0.3)'
                    : 'linear-gradient(to right, #fce7f3, #fae8ff)')
                : (profile?.darkMode ? '#374151' : '#f3f4f6'),
              color: profile?.darkMode ? '#e5e7eb' : '#374151'
            }}>
              <FileText className="w-4 h-4" />
              <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
              <button
                onClick={() => removeFile(idx)}
                style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    <div style={{
      borderTop: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`,
      boxShadow: profile?.funMode ? '0 -10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
      paddingTop: '0.75rem',
      paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      paddingLeft: '1rem',
      paddingRight: '1rem',
      background: profile?.funMode
        ? (profile?.darkMode
            ? 'linear-gradient(to right, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2))'
            : 'linear-gradient(to right, #fce7f3, #faf5ff, #eff6ff)')
        : (profile?.darkMode ? '#1a1a1a' : '#f9fafb')
    }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-12 flex-shrink-0 transition-transform hover:scale-110"
            style={{
              background: profile?.funMode
                ? 'linear-gradient(to right, #f472b6, #a855f7)'
                : (profile?.darkMode ? '#374151' : '#f3f4f6'),
              color: profile?.funMode ? '#ffffff' : (profile?.darkMode ? '#d1d5db' : '#111827')
            }}
            size="icon"
            variant="outline"
            disabled={uploadingFile || isRecording}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={profile?.funMode ? "Spill the financial tea..." : "Type your message or speak..."}
              className="min-h-[48px] max-h-32 resize-none text-base"
              style={{
                background: profile?.darkMode ? '#1f2937' : '#ffffff',
                border: profile?.funMode
                  ? (profile?.darkMode ? '1px solid #a855f7' : '1px solid #f9a8d4')
                  : (profile?.darkMode ? '1px solid #374151' : '1px solid #e5e7eb'),
                color: profile?.darkMode ? '#ffffff' : '#111827'
              }}
              disabled={sendingMessage || isRecording || uploadingFile}
            />
          </div>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            className="h-12 w-12 flex-shrink-0 transition-transform hover:scale-110"
            style={{
              background: isRecording
                ? '#ef4444'
                : (profile?.funMode
                    ? 'linear-gradient(to right, #3b82f6, #a855f7)'
                    : (profile?.darkMode ? '#374151' : '#f3f4f6')),
              color: isRecording ? '#ffffff' : (profile?.funMode ? '#ffffff' : (profile?.darkMode ? '#d1d5db' : '#111827')),
              animation: isRecording ? 'pulse 2s infinite' : 'none'
            }}
            size="icon"
            variant={isRecording ? "default" : "outline"}
            disabled={uploadingFile}
          >
            {isRecording ? (
              <Square className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && selectedFiles.length === 0) || sendingMessage || isRecording || uploadingFile}
            className="h-12 w-12 flex-shrink-0 shadow-md transition-all hover:scale-110"
            style={{
              background: profile?.funMode
                ? 'linear-gradient(to right, #ec4899, #a855f7)'
                : '#22A699'
            }}
            size="icon"
          >
            {sendingMessage || uploadingFile ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </Button>
        </div>
        {isRecording && (
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
        )}
        {uploadingFile && (
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
        )}
      </div>
    </div>
  </>
);

export default function Chat() {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showChatList, setShowChatList] = useState(false);
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
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
    staleTime: 5 * 60 * 1000,
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
        });
        return newProfile;
      }
      return profiles[0];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Project.filter({ created_by: user.email }, '-updated_date');
    },
    initialData: [],
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
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
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: 'always', // Always refetch when component mounts
    initialData: [],
  });

  useEffect(() => {
    if (conversations && conversations.length > 0 && !conversationId) {
      const latestConv = conversations[0];
      setConversationId(latestConv.id);
      setMessages(latestConv.messages || []);
    }
  }, [conversations, conversationId]);

  // CRITICAL FIX: Sync messages whenever conversation changes OR conversations data updates
  useEffect(() => {
    if (conversationId && conversations) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv && conv.messages) {
        setMessages(conv.messages);
      }
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, backgroundProcessing]);

  const handleNewChat = () => {
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
    if ((!input.trim() && selectedFiles.length === 0) || sendingMessage || uploadingFile) return;

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

          if (incomeCount === 0 && expenseCount === 0 && duplicateFiles.length === 0) {
            toastMessage = "Files saved, but no transactions were extracted.";
            processingSummaryMessage = "I saved the files but could not extract any transactions from them.";
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

      setInput("");
      setSelectedFiles([]);

      setSendingMessage(true);
      try {
        const response = await processChat({
          message: finalMessage,
          conversationId: conversationId || null
        });

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });

        try {
          toast.info("Transcribing...");

          const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
          const uploadResponse = await base44.integrations.Core.UploadFile({ file });

          const response = await speechToText({ file_url: uploadResponse.file_url });

          if (response.data.text) {
            toast.success("Transcription complete!");
            setInput(response.data.text);
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error("Could not transcribe audio. Please try again.");
        }

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    e.target.value = null;
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: profile?.funMode
          ? (profile?.darkMode
              ? 'linear-gradient(to bottom right, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))'
              : 'linear-gradient(to bottom right, #fdf2f8, #faf5ff, #eff6ff)')
          : (profile?.darkMode ? '#0f0f0f' : 'linear-gradient(to bottom, #f9fafb, #f3f4f6)')
      }}
    >
      <ChatHeader profile={profile} showChatList={showChatList} setShowChatList={setShowChatList} handleNewChat={handleNewChat} setShowCapabilities={setShowCapabilities} />

      {showChatList && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setShowChatList(false)}
          />

          <div className="absolute top-20 right-4 z-50 w-80 max-h-96 overflow-y-auto rounded-lg shadow-xl" style={{
            backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
            border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`
          }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Your Conversations</h3>
                <button
                  onClick={() => setShowChatList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {conversations && conversations.length > 0 ? (
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
                          backgroundColor: conv.id === conversationId
                            ? (profile?.darkMode ? '#374151' : '#f3f4f6')
                            : 'transparent',
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
                        }}
                      >
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-center py-4" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                    No conversations yet. Start chatting!
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

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

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {showWelcome ? (
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
                    background: profile?.funMode
                      ? 'linear-gradient(135deg, #f472b6, #a855f7)'
                      : 'linear-gradient(135deg, #22A699, #1d8d82)',
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
                    border: profile?.funMode
                      ? (profile?.darkMode ? '1px solid #a855f7' : '1px solid #fbc2eb')
                      : (profile?.darkMode ? '1px solid #374151' : '1px solid #e5e7eb'),
                    background: profile?.funMode
                      ? (profile?.darkMode
                          ? 'linear-gradient(135deg, #1f2937, rgba(168, 85, 247, 0.3))'
                          : 'linear-gradient(135deg, #ffffff, #fdf2f8)')
                      : (profile?.darkMode ? '#1f2937' : '#ffffff')
                  }}>
                    {profile?.funMode ? (
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
                      </>
                    ) : (
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
                          <li style={{ marginBottom: '0.25rem' }}>Generate reports and ROI analysis</li>
                          <li style={{ marginBottom: '0.25rem' }}>Prepare for tax season</li>
                          <li style={{ marginBottom: '0.25rem' }>Answer questions about your business</li>
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.filter(m => m.role === 'user' || m.role === 'assistant').map((message, idx) => (
                <MessageBubble key={idx} message={message} profile={profile} />
              ))}

              {backgroundProcessing && (
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
                    background: profile?.funMode
                      ? 'linear-gradient(135deg, #f472b6, #a855f7)'
                      : 'linear-gradient(135deg, #22A699, #1d8d82)',
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
                    border: profile?.funMode
                      ? (profile?.darkMode ? '1px solid #a855f7' : '1px solid #fbc2eb')
                      : (profile?.darkMode ? '1px solid #374151' : '1px solid #e5e7eb'),
                    background: profile?.funMode
                      ? (profile?.darkMode
                          ? 'linear-gradient(135deg, #1f2937, rgba(168, 85, 247, 0.3))'
                          : 'linear-gradient(135deg, #ffffff, #fdf2f8)')
                      : (profile?.darkMode ? '#1f2937' : '#ffffff')
                  }}>
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#22A699' }} />
                      <span style={{ color: profile?.darkMode ? '#d1d5db' : '#374151', fontSize: '15px' }}>
                        Processing files...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <ChatInputArea
        profile={profile}
        selectedFiles={selectedFiles}
        removeFile={removeFile}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        handleKeyPress={handleKeyPress}
        input={input}
        setInput={setInput}
        isRecording={isRecording}
        stopRecording={stopRecording}
        startRecording={startRecording}
        handleSend={handleSend}
        sendingMessage={sendingMessage}
        uploadingFile={uploadingFile}
      />
    </div>
  );
}
