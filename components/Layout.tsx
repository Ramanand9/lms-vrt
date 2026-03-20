import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLMS } from '../store';
import { UserRole } from '../types';
import Logo from './Logo';
import AIChatSupport from './AIChatSupport';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const Layout: React.FC = () => {
  const { currentUser, logout } = useLMS();

  if (!currentUser) {
    return null;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const navItems: NavItem[] = isAdmin
    ? [
        { to: '/', label: 'Courses', icon: 'fa-book-open' },
        { to: '/admin/courses', label: 'Course Admin', icon: 'fa-pen-ruler' },
        { to: '/admin/access', label: 'Access Admin', icon: 'fa-user-shield' },
        { to: '/community', label: 'Community', icon: 'fa-users' },
        { to: '/profile', label: 'Profile', icon: 'fa-user-circle' },
      ]
    : [
        { to: '/', label: 'My Courses', icon: 'fa-book-open' },
        { to: '/ai-advisor', label: 'AI Advisor', icon: 'fa-robot' },
        { to: '/community', label: 'Community', icon: 'fa-users' },
        { to: '/profile', label: 'Profile', icon: 'fa-user-circle' },
      ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-screen sticky top-0 shadow-sm">
        <div className="p-8 border-b border-slate-100 flex justify-center">
          <Logo size="md" showTagline={false} />
        </div>

        <nav className="flex-1 p-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-nitrocrimson-600 text-white font-bold shadow-lg shadow-nitrocrimson-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <i className={`fas ${item.icon} w-5 text-lg`}></i>
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-4 py-3 mb-4 bg-slate-50 rounded-2xl">
            <img
              src={currentUser.avatar}
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                {currentUser.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 pb-24 md:pb-8 max-w-7xl mx-auto w-full px-4 md:px-10 pt-10 relative">
        <Outlet />
        {!isAdmin && <AIChatSupport />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-3 px-2 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center flex-1 py-1 transition-all ${
                isActive
                  ? 'text-nitrocrimson-600 scale-110 font-bold'
                  : 'text-slate-400'
              }`
            }
          >
            <i className={`fas ${item.icon} text-xl`}></i>
            <span className="text-[9px] mt-1 uppercase font-black tracking-tighter">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
