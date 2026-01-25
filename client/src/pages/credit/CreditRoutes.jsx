import { Routes, Route, Navigate } from 'react-router-dom';
import CreditList from './CreditList';
import CustomerDetails from './CustomerDetails';

export default function CreditRoutes() {
  return (
    <Routes>
      <Route path="customers" element={<CreditList />} />
      <Route path="customers/:id" element={<CustomerDetails />} />
      <Route path="*" element={<Navigate to="customers" replace />} />
    </Routes>
  );
}
