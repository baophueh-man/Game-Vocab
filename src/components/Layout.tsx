import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Gamepad2, Home, PlusCircle, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import VoiceSettings from './ui/VoiceSettings';

export default function Layout() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/create', icon: PlusCircle, label: 'Create' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <Gamepad2 className="w-8 h-8" />
            <span>VocaGame</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <VoiceSettings />
            <nav className="flex gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-colors text-sm font-medium",
                      isActive 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            {user && (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
