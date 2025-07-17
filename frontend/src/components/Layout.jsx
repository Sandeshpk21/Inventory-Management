import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../services/AuthContext';

const navLinks = [
  { to: '/', label: 'Dashboard', roles: ['admin'] },
  { to: '/requirements', label: 'Requirements', roles: ['admin', 'employee'] },
  { to: '/stock', label: 'Stock', roles: ['admin', 'employee'] },
  { to: '/purchase-orders', label: 'Purchase Orders', roles: ['admin'] },
  { to: '/to-be-ordered', label: 'To Be Ordered', roles: ['admin'] },
  { to: '/transactions', label: 'Transactions', roles: ['admin'] },
];

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-blue-800 text-white flex flex-col justify-between py-6 px-4 z-20">
        <div>
          <div className="block text-2xl font-bold mb-8 text-center">Inventory System</div>
          <nav className="flex flex-col gap-2">
            {navLinks.filter(link => link.roles.includes(user?.role)).map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded hover:bg-blue-700 transition-colors ${location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to)) ? 'bg-blue-900 font-semibold' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col items-center gap-2 mt-8">
          {user && (
            <span className="text-sm mb-2">{user.username} ({user.role})</span>
          )}
          <button onClick={handleLogout} className="w-full bg-red-500 px-3 py-1 rounded hover:bg-red-600">Logout</button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 ml-64 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 