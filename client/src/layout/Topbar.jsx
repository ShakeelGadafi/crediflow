import { useAuth } from '../auth/useAuth';
import { LogOut, User, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Map path to title
  const getTitle = () => {
      const path = location.pathname;
      if (path.includes('/dashboard')) return 'Dashboard';
      if (path.includes('/credit')) return 'Credit Management';
      if (path.includes('/utilities')) return 'Utilities';
      if (path.includes('/expenditure')) return 'Expenditure Tracker';
      if (path.includes('/suppliers')) return 'Supplier Invoices';
      return 'Overview';
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 tracking-tight">{getTitle()}</h2>
      <div className="flex items-center space-x-6">
        <button className="text-gray-500 hover:text-indigo-600 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500 transform translate-x-1/2 -translate-y-1/2"></span>
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center gap-3">
             <div className="text-right hidden md:block">
                 <p className="text-sm font-semibold text-gray-700">{user?.full_name || 'User'}</p>
                 <p className="text-xs text-gray-500">{user?.role || 'Guest'}</p>
             </div>
             <button onClick={logout} className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all custom-logout-btn" title="Logout">
                <LogOut className="w-5 h-5" />
             </button>
        </div>
      </div>
    </header>
  );
}
