import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import CreditRoutes from './pages/credit/CreditRoutes';
import ExpenditureRoutes from './pages/expenditure/ExpenditureRoutes';
import SupplierRoutes from './pages/suppliers/SupplierRoutes';
import Utilities from './pages/utilities/Utilities';
import StaffManagement from './pages/admin/StaffManagement';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Module Routes */}
          <Route path="/credit/*" element={<CreditRoutes />} />
          <Route path="/expenditure/*" element={<ExpenditureRoutes />} />
          <Route path="/suppliers/*" element={<SupplierRoutes />} />
          <Route path="/utilities/*" element={<Utilities />} />

          {/* Admin Routes */}
          <Route path="/admin/staff" element={<StaffManagement />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App
