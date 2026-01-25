import { Routes, Route, Navigate } from 'react-router-dom';
import Invoices from './Invoices';

export default function SupplierRoutes() {
  return (
    <Routes>
      <Route path="invoices" element={<Invoices />} />
      <Route path="*" element={<Navigate to="invoices" replace />} />
    </Routes>
  );
}
