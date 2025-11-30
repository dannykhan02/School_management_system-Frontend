import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  X, 
  Sun, 
  Moon
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { getNavigationItems } from "../../config/navigation";
import { useSidebar } from "../../contexts/SidebarContext";
import { apiRequest } from "../../utils/api";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [schoolHasStreams, setSchoolHasStreams] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();

  const isActive = (item) => {
    return (
      item.href === location.pathname ||
      location.pathname.startsWith(item.href + "/")
    );
  };

  const sidebarItems = getNavigationItems(user?.role);

  // Check if school has streams enabled
  useEffect(() => {
    const checkSchoolStreams = async () => {
      if (user?.school_id) {
        try {
          const response = await apiRequest(`schools/${user.school_id}`, 'GET');
          const schoolData = response?.data || response || {};
          setSchoolHasStreams(schoolData.has_streams || false);
        } catch (error) {
          console.error('Failed to fetch school info:', error);
          setSchoolHasStreams(false);
        }
      }
    };

    checkSchoolStreams();
  }, [user?.school_id]);

  // Filter navigation items based on stream availability
  const filteredSidebarItems = sidebarItems.map(item => {
    // If item requires streams and school doesn't have streams, hide it
    if (item.requiresStreams && !schoolHasStreams) {
      return null;
    }
    return item;
  }).filter(Boolean);

  return (
    <>
      {/* Backdrop with blur for mobile - z-index below header */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={toggleSidebar}
          style={{ top: '64px' }}
        />
      )}

      <div
        className={`
          flex flex-col 
          bg-white dark:bg-slate-800/50 
          border-r border-slate-200 dark:border-slate-700
          fixed
          top-0
          left-0
          z-40
          h-screen
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0 shadow-lg" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-16 w-16" : "lg:w-64 w-64"}
        `}
      >
        {/* HEADER - Fixed height 64px to match header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 h-16 flex-shrink-0">
          {!collapsed ? (
            <>
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-bold text-sm shadow-md flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "E"}
                </div>
                <span className="font-bold text-lg text-[#0d141b] dark:text-white truncate">
                  EduPulse
                </span>
              </div>

              {/* Collapse button - visible on desktop when expanded */}
              <button
                className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 flex-shrink-0 ml-auto"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Close button - only visible on mobile */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 flex-shrink-0 ml-auto"
                onClick={toggleSidebar}
                aria-label="Close sidebar"
                title="Close sidebar"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            /* When collapsed - show only expand button centered */
            <button
              className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 mx-auto"
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* USER INFO */}
        {user && (
          <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 ${collapsed ? "lg:p-2" : ""}`}>
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden shadow flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#0d141b] dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-[#4c739a] dark:text-slate-400 capitalize">{user.role}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {filteredSidebarItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium 
                  transition-colors
                  ${collapsed ? "justify-center" : ""}
                  ${
                    active
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }
                `}
                title={collapsed ? item.name : ""}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER BUTTONS - Larger when collapsed */}
        <div className={`border-t border-slate-200 dark:border-slate-700 flex-shrink-0 ${collapsed ? "p-2 space-y-2" : "p-4 space-y-2"}`}>
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center gap-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${collapsed ? "justify-center p-3" : "px-3 py-2"}`}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span className="text-sm font-medium">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${collapsed ? "justify-center p-3" : "px-3 py-2"}`}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;