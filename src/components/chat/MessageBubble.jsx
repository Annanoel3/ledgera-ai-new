import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MessageBubble({ message, profile, hideAvatar = false }) {
    const isUser = message.role === 'user';
    const funMode = profile?.funMode;
    const darkMode = profile?.darkMode;
    
    return (
        <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser && !hideAvatar && (
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg",
                    funMode
                        ? "bg-gradient-to-br from-pink-400 to-purple-600 animate-pulse"
                        : "bg-gradient-to-br from-[#22A699] to-[#1d8d82]"
                )}>
                    <span className="text-white font-semibold text-xs">{funMode ? "💰" : "LA"}</span>
                </div>
            )}
            <div className={cn("max-w-[80%]", isUser && "flex flex-col items-end")}>
                {/* File attachments */}
                {isUser && message._fileUrls?.length > 0 && (
                    <div className="flex flex-col gap-1.5 mb-1.5 items-end">
                        {message._fileUrls.map((url, idx) => {
                            const name = message._fileNames?.[idx] || 'File';
                            const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name) || /^https?:.*\.(png|jpe?g|gif|webp|bmp|svg)/i.test(url);
                            return isImage ? (
                                <img
                                    key={idx}
                                    src={url}
                                    alt={name}
                                    className="rounded-xl max-w-[200px] max-h-[200px] object-cover shadow-sm border"
                                    style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
                                />
                            ) : (
                                <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                                    style={{
                                        background: funMode
                                            ? 'linear-gradient(to right, #f9a8d4, #d8b4fe)'
                                            : darkMode ? '#374151' : '#e5e7eb',
                                        color: darkMode ? '#e5e7eb' : '#374151'
                                    }}>
                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                    <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                {message.content && (
                    <div className={cn(
                        "rounded-2xl px-4 py-2.5 shadow-sm transition-transform hover:scale-[1.02]",
                        isUser 
                            ? funMode
                                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                : "bg-[#22A699] text-white"
                            : funMode && darkMode
                                ? "bg-gray-800 border border-purple-700 text-gray-100"
                                : funMode && !darkMode
                                    ? "bg-gradient-to-br from-white to-pink-50 border border-pink-200 text-gray-900"
                                    : darkMode
                                        ? "bg-gray-800 border border-gray-700 text-gray-100"
                                        : "bg-white border border-gray-200 text-gray-900"
                    )}>
                        {isUser ? (
                            <p style={{ fontSize: '15px', lineHeight: '1.4' }} className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                            <ReactMarkdown 
                                className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                components={{
                                    p: ({ children }) => <p className="my-1.5" style={{ fontSize: '15px', lineHeight: '1.4', color: darkMode ? '#e5e7eb' : '#111827' }}>{children}</p>,
                                    ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc" style={{ fontSize: '15px', lineHeight: '1.4', color: darkMode ? '#e5e7eb' : '#111827' }}>{children}</ul>,
                                    ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal" style={{ fontSize: '15px', lineHeight: '1.4', color: darkMode ? '#e5e7eb' : '#111827' }}>{children}</ol>,
                                    li: ({ children }) => <li className="my-0.5" style={{ fontSize: '15px', lineHeight: '1.4', color: darkMode ? '#e5e7eb' : '#111827' }}>{children}</li>,
                                    strong: ({ children }) => (
                                        <strong className={cn(
                                            "font-semibold",
                                            funMode ? (darkMode ? "text-pink-400" : "text-purple-600") : "text-[#22A699]"
                                        )}>
                                            {children}
                                        </strong>
                                    ),
                                    em: ({ children }) => <em className="italic" style={{ fontSize: '15px', color: darkMode ? '#d1d5db' : '#374151' }}>{children}</em>,
                                    code: ({ inline, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group/code">
                                                <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto my-2 text-xs">
                                                    <code className={className} {...props}>{children}</code>
                                                </pre>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 bg-slate-800 hover:bg-slate-700"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                                        toast.success('Code copied');
                                                    }}
                                                >
                                                    <Copy className="h-3 w-3 text-slate-400" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                                                {children}
                                            </code>
                                        );
                                    },
                                    a: ({ children, ...props }) => (
                                        <a {...props} target="_blank" rel="noopener noreferrer" style={{ fontSize: '15px' }} className={funMode ? "text-purple-600 hover:text-purple-800" : "text-[#22A699] hover:text-[#1d8d82]"}>{children}</a>
                                    ),
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}