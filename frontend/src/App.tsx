import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import Examination from './pages/Examination';
import TransactionPage from './pages/Transaction';
import NewOrderPage from './pages/NewOrder';
import Stock from './pages/Stock';
import Reports from './pages/Reports';
import Cashbook from './pages/Cashbook';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <OfflineIndicator />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="pasien" element={<PatientList />} />
            <Route path="pasien/:id" element={<PatientDetail />} />
            <Route path="periksa" element={<Examination />} />
            <Route path="transaksi" element={<TransactionPage />} />
            <Route path="transaksi/baru" element={<NewOrderPage />} />
            <Route path="stok" element={<Stock />} />
            <Route path="kas" element={<Cashbook />} />
            <Route path="laporan" element={<Reports />} />
            <Route path="pengaturan" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
