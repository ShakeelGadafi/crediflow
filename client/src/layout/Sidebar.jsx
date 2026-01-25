import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { LayoutDashboard, Users, Receipt, CreditCard, Banknote } from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const permissions = user?.permissions || [];
  const role = user?.role;

  const hasPermission = (perm) => {
    if (role === 'ADMIN') return true; 
    return permissions.includes(perm) || permissions.some(p => p.permission_name === perm);
  };

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }, 
    { label: 'Credit Customers', path: '/credit/customers', icon: Users, permission: 'CREDIT_TO_COME' },
    { label: 'Utilities', path: '/utilities', icon: Receipt, permission: 'DAILY_EXPENDITURE_UTILITIES' },
    { label: 'Expenditure', path: '/expenditure', icon: CreditCard, permission: 'DAILY_EXPENDITURE_TRACKER' },
    { label: 'Suppliers', path: '/suppliers/invoices', icon: Banknote, permission: 'GRN_CREDIT_REMINDER' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed overflow-y-auto z-10 shadow-xl transition-all duration-300">
        <div className="p-6 border-b border-gray-800 flex items-center justify-center">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">CrediFlow</h1>
        </div>
        <nav className="mt-6 px-4 space-y-1">
            {menuItems.map((item) => {
                if (item.permission && !hasPermission(item.permission)) return null;
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                            active 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <Icon className={`w-5 h-5 mr-3 transition-colors ${active ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
            <div className="flex items-center space-x-3">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                 {user?.full_name?.charAt(0) || 'U'}
               </div>
               <div className="overflow-hidden">
                   <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                   <p className="text-xs text-gray-500 truncate">{user?.role}</p>
               </div>
            </div>
        </div>
    </aside>
  );
}
