import './App.css'
import { initAdMob, maybeShowAdOnOpen } from '@/lib/admob';
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import ProjectFinancials from './pages/ProjectFinancials';
import DeleteAccount from './pages/DeleteAccount';
import DeleteData from './pages/DeleteData';
import Calendar from './pages/Calendar';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  in: { x: 0, opacity: 1 },
  out: { x: '-30%', opacity: 0 },
};
const pageTransition = { type: 'tween', ease: 'easeInOut', duration: 0.22 };

function AnimatedRoutes({ mainPageKey, MainPage, Pages }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
        style={{ width: '100%' }}
      >
        <Routes location={location}>
          <Route path="/" element={<MainPage />} />
          <Route path="/DeleteAccount" element={<DeleteAccount />} />
          <Route path="/DeleteData" element={<DeleteData />} />
          <Route path="/Calendar" element={<LayoutWrapper currentPageName="Calendar"><Calendar /></LayoutWrapper>} />
          {Object.entries(Pages).map(([path, Page]) => (
            <Route key={path} path={`/${path}`} element={<Page />} />
          ))}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <AnimatedRoutes mainPageKey={mainPageKey} MainPage={MainPage} Pages={Pages} />
    </LayoutWrapper>
  );
};


function App() {
  useEffect(() => {
    // First-launch ad suppression using localStorage
    const count = parseInt(localStorage.getItem('app_open_count') || '0', 10);
    const newCount = count + 1;
    localStorage.setItem('app_open_count', String(newCount));

    // Only initialize ads if not the first open
    if (newCount >= 2) {
      initAdMob().then(() => maybeShowAdOnOpen());
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        <Route path="/Terms" element={<Terms />} />
        <Route
          path="*"
          element={
            <AuthProvider>
              <QueryClientProvider client={queryClientInstance}>
                <NavigationTracker />
                <Routes>
                  <Route path="/ProjectFinancials" element={<LayoutWrapper currentPageName="ProjectFinancials"><ProjectFinancials /></LayoutWrapper>} />
                  <Route path="*" element={<AuthenticatedApp />} />
                </Routes>
                <Toaster />
                <VisualEditAgent />
              </QueryClientProvider>
            </AuthProvider>
          }
        />
      </Routes>
    </Router>
  )
}

export default App