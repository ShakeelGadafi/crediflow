import { useAuth } from '../auth/useAuth';
import { LogOut, Bell, Search, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Map path to title and subtitle
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return { title: 'Dashboard', subtitle: 'Welcome back! Here\'s your overview.' };
    if (path.includes('/credit')) return { title: 'Credit Management', subtitle: 'Manage customer credit accounts and billing' };
    if (path.includes('/utilities')) return { title: 'Utilities', subtitle: 'Track and manage utility bills' };
    if (path.includes('/expenditure')) return { title: 'Expenditure Tracker', subtitle: 'Monitor and categorize expenses' };
    if (path.includes('/suppliers')) return { title: 'Supplier Invoices', subtitle: 'Manage supplier payments and invoices' };
    if (path.includes('/admin')) return { title: 'Administration', subtitle: 'Manage staff and permissions' };
    return { title: 'Overview', subtitle: 'Manage your business operations' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuClick}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 hidden sm:block">{subtitle}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Search button */}
        <button className="p-2 sm:p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
          <Search className="w-5 h-5" />
        </button>
        
        {/* Notifications */}
        <button className="p-2 sm:p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-200 mx-1 sm:mx-2 hidden sm:block"></div>
        
        {/* User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-700">{user?.full_name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'Guest'}</p>
          </div>
          <button 
            onClick={logout} 
            className="p-2 sm:p-2.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" 
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
