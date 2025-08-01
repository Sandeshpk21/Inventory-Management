import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../services/AuthContext';
import { Home, ClipboardList, Package, AlertTriangle, Database, Activity, Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Dashboard', roles: ['admin'], icon: <Home className="h-5 w-5 mr-2" /> },
  { to: '/requirements', label: 'Requirements', roles: ['admin', 'employee'], icon: <ClipboardList className="h-5 w-5 mr-2" /> },
  { to: '/stock', label: 'Stock', roles: ['admin', 'employee'], icon: <Database className="h-5 w-5 mr-2" /> },
  { to: '/purchase-orders', label: 'Purchase Orders', roles: ['admin'], icon: <Package className="h-5 w-5 mr-2" /> },
  { to: '/to-be-ordered', label: 'To Be Ordered', roles: ['admin'], icon: <AlertTriangle className="h-5 w-5 mr-2" /> },
  { to: '/transactions', label: 'Transactions', roles: ['admin'], icon: <Activity className="h-5 w-5 mr-2" /> },
];

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-blue-700 text-white hover:bg-blue-600 transition-colors"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 text-white flex flex-col justify-between py-8 px-5 z-20 shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          <div className="block text-xl lg:text-2xl font-extrabold mb-8 lg:mb-10 text-center tracking-tight text-white drop-shadow">
            Inventory System
          </div>
          <nav className="flex flex-col gap-2">
            {navLinks.filter(link => link.roles.includes(user?.role)).map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeSidebar}
                className={`flex items-center px-3 lg:px-4 py-2 rounded-lg transition-all font-medium text-sm lg:text-base gap-2
                  ${location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to))
                    ? 'bg-blue-500/80 text-white shadow-sm' // modern highlight
                    : 'hover:bg-blue-600/60 hover:text-white text-blue-100'}
                `}
              >
                {link.icon}
                <span className="truncate">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col items-center gap-3 mt-8">
          {user && (
            <span className="text-xs lg:text-sm mb-2 text-blue-100 font-semibold tracking-wide text-center">
              {user.username} ({user.role})
            </span>
          )}
          <button 
            onClick={handleLogout} 
            className="w-full bg-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500 text-white font-semibold transition shadow text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 lg:ml-64 overflow-x-auto min-h-screen">
        {/* Add top margin on mobile to account for hamburger menu */}
        <div className="lg:hidden h-16"></div>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 