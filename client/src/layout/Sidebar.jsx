import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { LayoutDashboard, Users, Receipt, CreditCard, Banknote, ShieldCheck, ChevronRight, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
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

  // Admin only menu items
  if (role === 'ADMIN') {
    menuItems.push({ label: 'Staff Management', path: '/admin/staff', icon: ShieldCheck });
  }

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  return (
    <aside className={`
      w-[280px] bg-slate-900 text-white h-screen fixed overflow-y-auto z-40 shadow-2xl
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          CrediFlow
        </h1>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Main Menu
        </p>
        {menuItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                active 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </div>
              {active && <ChevronRight className="w-4 h-4 text-indigo-200" />}
            </Link>
          );
        })}
      </nav>
      
      {/* User section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
