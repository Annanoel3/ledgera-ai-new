import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, LayoutDashboard, FolderKanban, Settings, Menu, X, FileText, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import OneSignalInit from "@/components/shared/OneSignalInit";

const navItems = [
  { title: "Chat", url: createPageUrl("Chat"), icon: MessageSquare },
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Projects", url: createPageUrl("Projects"), icon: FolderKanban },
  { title: "Reports", url: createPageUrl("Reports"), icon: TrendingUp },
  { title: "Documents", url: createPageUrl("Documents"), icon: FileText },
  { title: "Settings", url: createPageUrl("Settings"), icon: Settings },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [funMode, setFunMode] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    initialData: null,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Sync with system dark mode preference when no profile override
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (profile?.darkMode === undefined || profile?.darkMode === null) {
        setDarkMode(e.matches);
      }
    };
    mq.addEventListener('change', handleChange);
    // Set initial system preference only if profile hasn't loaded yet
    if (!profile) setDarkMode(mq.matches);
    return () => mq.removeEventListener('change', handleChange);
  }, [profile]);

  useEffect(() => {
    if (profile?.darkMode !== undefined) {
      setDarkMode(profile.darkMode);
    }
    if (profile?.funMode !== undefined) {
      setFunMode(profile.funMode);
    }
  }, [profile]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (darkMode) {
      htmlElement.classList.add('dark');
      htmlElement.style.backgroundColor = '#0f0f0f';
      document.body.style.backgroundColor = '#0f0f0f';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    }
  }, [darkMode]);

  const currentPath = location.pathname;
  const isChat = currentPath === createPageUrl("Chat");

  const primaryColor = funMode ? '#FF6B9D' : '#22A699';
  const primaryHover = funMode ? '#FF4D7D' : '#1d8d82';

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
      window.location.reload();
    }
  };

  return (
    <>
      {user && <OneSignalInit user={user} />}
      
      <style>{`
        :root {
          --primary: ${primaryColor};
          --primary-hover: ${primaryHover};
        }
        
        ${darkMode ? `
          body, html {
            background-color: #0f0f0f !important;
          }
        ` : ''}
        
        ${funMode ? `
          .bg-\\[\\#22A699\\] { background-color: ${primaryColor} !important; }
          .hover\\:bg-\\[\\#1d8d82\\]:hover { background-color: ${primaryHover} !important; }
          .text-\\[\\#22A699\\] { color: ${primaryColor} !important; }
          .border-\\[\\#22A699\\] { border-color: ${primaryColor} !important; }
        ` : ''}
        
        /* Safe area insets for mobile devices */
        @supports (padding-top: env(safe-area-inset-top)) {
          .mobile-top-bar {
            padding-top: calc(0.75rem + env(safe-area-inset-top));
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
          .mobile-bottom-nav {
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
        }
        
        /* Ensure main content respects safe areas on mobile */
        @media (max-width: 768px) {
          body {
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
        }
      `}</style>
      
      <div style={{ backgroundColor: darkMode ? '#0f0f0f' : '#ffffff', minHeight: '100vh' }}>
        {/* Desktop Sidebar - hide on Chat page */}
        {!isChat && (
          <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col" style={{ backgroundColor: darkMode ? '#1a1a1a' : '#ffffff' }}>
            <div className="flex min-h-0 flex-1 flex-col border-r" style={{ 
              borderColor: darkMode ? '#374151' : '#e5e7eb',
              backgroundColor: darkMode ? '#1a1a1a' : '#ffffff'
            }}>
              <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                <div className="flex items-center flex-shrink-0 px-6 mb-8">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68eaceb5d712c1b62b8bd4d5/83975f5f2_Untitleddesign9.png" 
                      alt="Ledgera AI"
                      className="w-10 h-10 object-contain"
                    />
                    <div>
                      <h1 className="text-xl font-bold" style={{ color: darkMode ? '#ffffff' : '#111827' }}>Ledgera AI</h1>
                      <p className="text-xs" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                        {funMode ? "Let's have fun! 🎉" : "Smart bookkeeping"}
                      </p>
                    </div>
                  </div>
                </div>
                <nav className="flex-1 space-y-1 px-3">
                  {navItems.map((item) => {
                    const isActive = currentPath === item.url || currentPath.startsWith(item.url + '/');
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all"
                        style={isActive ? { 
                          backgroundColor: primaryColor,
                          color: '#ffffff'
                        } : {
                          color: darkMode ? '#d1d5db' : '#374151',
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = darkMode ? '#1f2937' : '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="px-3 py-4 border-t" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
                  {user && (
                    <div className="mb-3 px-3">
                      <p className="text-sm font-medium truncate" style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                        {user.full_name}
                      </p>
                      <p className="text-xs truncate" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                        {user.email}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full gap-2 justify-start"
                    style={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      color: darkMode ? '#d1d5db' : '#374151'
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile Top Bar */}
        <div className="mobile-top-bar md:hidden sticky top-0 z-10 flex flex-shrink-0 border-b" style={{
          borderColor: darkMode ? '#374151' : '#e5e7eb',
          backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
          height: '3.5rem'
        }}>
          <button
            type="button"
            className="px-4"
            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex flex-1 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68eaceb5d712c1b62b8bd4d5/83975f5f2_Untitleddesign9.png" 
                alt="Ledgera AI"
                className="w-8 h-8 object-contain"
              />
              <h1 className="text-lg font-bold" style={{ color: darkMode ? '#ffffff' : '#111827' }}>Ledgera AI</h1>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40" style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)', paddingTop: '3.5rem' }} onClick={() => setMobileMenuOpen(false)}>
            <div className="fixed inset-y-0 left-0 w-64 border-r" style={{
              backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
              borderColor: darkMode ? '#374151' : '#e5e7eb',
              paddingTop: '3.5rem'
            }} onClick={(e) => e.stopPropagation()}>
              <div className="p-6 flex flex-col h-full">
                <nav className="space-y-1 flex-1">
                  {navItems.map((item) => {
                    const isActive = currentPath === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg"
                        style={isActive ? {
                          backgroundColor: primaryColor,
                          color: '#ffffff'
                        } : {
                          color: darkMode ? '#d1d5db' : '#374151'
                        }}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="border-t pt-4" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
                  {user && (
                    <div className="mb-3 px-3">
                      <p className="text-sm font-medium truncate" style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                        {user.full_name}
                      </p>
                      <p className="text-xs truncate" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                        {user.email}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full gap-2 justify-start"
                    style={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      color: darkMode ? '#d1d5db' : '#374151'
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={isChat ? "" : "md:pl-64 flex flex-col flex-1"} style={{
          paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
          paddingBottom: isChat ? '0' : '5rem'
        }}>
          <main className={isChat ? "" : "flex-1"}>
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-10 flex border-t" style={{
          borderColor: darkMode ? '#374151' : '#e5e7eb',
          backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
          height: '5rem'
        }}>
          {navItems.map((item) => {
            const isActive = currentPath === item.url || currentPath.startsWith(item.url + '/');
            return (
              <Link
                key={item.title}
                to={item.url}
                className="flex flex-1 flex-col items-center justify-center text-xs font-medium pt-1"
                style={{ color: isActive ? primaryColor : (darkMode ? '#9ca3af' : '#6b7280') }}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-6 w-6 mb-2" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}