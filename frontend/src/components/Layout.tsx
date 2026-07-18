import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isProfileEmpty, type LayoutProps } from "../types";

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentUserProfile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasEmptyProfile = isProfileEmpty(currentUserProfile);
  const token = localStorage.getItem("token");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMobileOpen(false);
    navigate("/login");
  };

  // 1. Прибираємо requiresProfile, бо тепер ВСІ сторінки доступні
  const navItems = [
    { label: "Recommendations", path: "/recommendations" },
    { label: "Connections", path: "/connections" },
    { label: "Chats", path: "/chat" }, 
    { label: "My Profile", path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 font-sans">
      
      {/* Гарний банер-нагадування, який тепер не блокує, а просто інформує */}
      {hasEmptyProfile && token && (
        <div className="m-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-800 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">⚡</span>
            <div>
              <h4 className="font-bold text-sm">
                Please complete your profile to unlock full recommendations!
              </h4>
              <p className="text-xs text-amber-600">You can still look around the app.</p>
            </div>
          </div>
          <button 
            className="text-white bg-amber-600 hover:bg-amber-700 font-medium rounded-xl text-sm px-4 py-2 transition-colors"
            onClick={() => navigate('/profile')}>
            Complete profile
          </button>
        </div>
      )}

      {token && (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Змінюємо лінк логотипу, тепер він завжди веде на головну */}
                <Link
                  to="/recommendations"
                  className="text-xl font-black text-indigo-600 tracking-wider"
                >
                  ⚡ match-me
                </Link>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      isActive(item.path)
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                <span className="h-5 w-px bg-gray-200 mx-3" />

                <button
                  onClick={handleLogout}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm"
                >
                  Log Out
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 focus:outline-none"
                  aria-label="Toggle navigation menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-inner">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-bold transition ${
                    isActive(item.path)
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-gray-100 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-center bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm tracking-wide shadow-sm"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </nav>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};
