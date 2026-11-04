import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Scale, MessageSquare, FileText, Share2, Shield, 
  Sun, Moon, LogOut, User, Menu, X, LayoutDashboard, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200 dark:border-navy-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 dark:from-gold-500 dark:to-gold-600 flex items-center justify-center text-gold-400 dark:text-navy-950 shadow-md group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-navy-900 dark:text-white">
                  Legal<span className="text-gold-500">AI</span>
                </span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-500 dark:text-slate-400">
                  India Jurisdiction
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/')
                  ? 'bg-navy-50 text-navy-900 dark:bg-navy-800 dark:text-gold-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
              }`}
            >
              Home
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/dashboard')
                      ? 'bg-navy-50 text-navy-900 dark:bg-navy-800 dark:text-gold-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/chat"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/chat')
                      ? 'bg-navy-50 text-navy-900 dark:bg-navy-800 dark:text-gold-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>AI Legal Chat</span>
                </Link>

                <Link
                  to="/drafting"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/drafting')
                      ? 'bg-navy-50 text-navy-900 dark:bg-navy-800 dark:text-gold-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Document Wizard</span>
                </Link>

                <Link
                  to="/knowledge-graph"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/knowledge-graph')
                      ? 'bg-navy-50 text-navy-900 dark:bg-navy-800 dark:text-gold-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Knowledge Graph</span>
                </Link>

                <Link
                  to="/privacy"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/privacy')
                      ? 'bg-navy-50 text-navy-900 dark:bg-navy-800 dark:text-gold-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Privacy Center</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                      isActive('/admin')
                        ? 'bg-gold-50 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400 border border-gold-300 dark:border-gold-600'
                        : 'text-gold-600 dark:text-gold-400 hover:bg-gold-50/50'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-gold-500" />
                    <span>Admin</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Controls: Theme + Auth */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4 text-navy-800" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-navy-700">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition"
                  title="My Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center text-xs font-bold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {user?.full_name?.split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-navy-900 dark:text-slate-200 hover:text-gold-500 dark:hover:text-gold-400 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-navy-900 dark:bg-gold-500 dark:text-navy-950 rounded-lg shadow hover:opacity-95 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
          >
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                Dashboard
              </Link>
              <Link
                to="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                AI Legal Chat
              </Link>
              <Link
                to="/drafting"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                Document Wizard
              </Link>
              <Link
                to="/knowledge-graph"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                Knowledge Graph
              </Link>
              <Link
                to="/privacy"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                Privacy Center
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gold-600 dark:text-gold-400 hover:bg-slate-100 dark:hover:bg-navy-800"
                >
                  Admin Dashboard
                </Link>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-navy-800">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-rose-500 font-medium"
                >
                  Sign Out ({user?.full_name})
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-200 dark:border-navy-800 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-navy-900 dark:text-white font-medium"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-950 rounded-lg font-medium"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
