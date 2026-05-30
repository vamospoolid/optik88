import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';
import BottomNav from './components/BottomNav';

// Splash screen (eager loaded — must show immediately)
import SplashScreen from './pages/SplashScreen';

// Pages (lazy loaded for performance)
const LoginPage       = React.lazy(() => import('./pages/Login'));
const DashboardPage   = React.lazy(() => import('./pages/Dashboard'));
const PatientListPage = React.lazy(() => import('./pages/PatientList'));
const PatientDetailPage = React.lazy(() => import('./pages/PatientDetail'));
const ExaminationPage = React.lazy(() => import('./pages/Examination'));
const NewOrderPage    = React.lazy(() => import('./pages/NewOrder'));
const TransactionPage = React.lazy(() => import('./pages/Transaction'));
const TrxDetailPage   = React.lazy(() => import('./pages/TrxDetail'));
const StockPage       = React.lazy(() => import('./pages/Stock'));
const CashbookPage    = React.lazy(() => import('./pages/Cashbook'));
const ReportsPage     = React.lazy(() => import('./pages/Reports'));
const SettingsPage    = React.lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 2 } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppShell() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <>
      <React.Suspense fallback={
        <div className="loading-center">
          <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid #E8EAFF', borderTopColor: '#2B35E8', borderRadius: '50%' }} />
          <span className="text-sm text-secondary">Memuat...</span>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/"           element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/pasien"     element={<ProtectedRoute><PatientListPage /></ProtectedRoute>} />
          <Route path="/pasien/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
          <Route path="/periksa"    element={<ProtectedRoute><ExaminationPage /></ProtectedRoute>} />
          <Route path="/order/baru" element={<ProtectedRoute><NewOrderPage /></ProtectedRoute>} />
          <Route path="/transaksi"  element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
          <Route path="/transaksi/:id" element={<ProtectedRoute><TrxDetailPage /></ProtectedRoute>} />
          <Route path="/stok"       element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
          <Route path="/kas"        element={<ProtectedRoute><CashbookPage /></ProtectedRoute>} />
          <Route path="/laporan"    element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/pengaturan" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
      {isAuthenticated && <BottomNav />}
    </>
  );
}

export default function App() {
  // Show splash only once per session
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem('splashShown') === '1';
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem('splashShown', '1');
    setSplashDone(true);
  };

  // If splash is still running, render it full-screen
  if (!splashDone) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppShell />
      </Router>
    </QueryClientProvider>
  );
}
