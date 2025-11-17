import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  X, 
  Sun, 
  Moon,
  UserCircle 
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getNavigationItems } from "../../config/navigation";
import { useSidebar } from "../../contexts/SidebarContext";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();

  const toggleDarkMode = () => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  // Checks if the current route matches the navigation item
  const isActive = (item) => {
    return item.href === location.pathname || location.pathname.startsWith(item.href + '/');
  };

  // Get navigation items based on user role
  const sidebarItems = getNavigationItems(user?.role);

  // Helper to get a user-friendly role name
  const getRoleDisplayName = (role) => {
    const roleNames = {
      super_admin: "Super Admin",
      admin: "School Admin",
      teacher: "Teacher Portal",
      student: "Student Portal"
    };
    return roleNames[role] || "Dashboard";
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
          fixed lg:relative z-40 h-screen
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-16" : "lg:w-64"}
          w-64
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-lg text-gray-800 dark:text-white">
                EduPulse
              </span>
            </div>
          )}
          
          {/* Desktop Collapse Toggle */}
          <button
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={toggleSidebar}
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className={`p-4 border-b border-gray-200 dark:border-gray-800 ${collapsed ? "lg:p-2" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm">{user.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                    {user.role?.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                  ${collapsed ? "lg:justify-center" : ""}
                `}
                title={collapsed ? item.name : undefined}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer with Theme Toggle and Logout */}
        <div className={`p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 ${collapsed ? "lg:p-2" : ""}`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5
              text-gray-700 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-800
              font-medium text-sm
              rounded-lg 
              transition-colors
              ${collapsed ? "lg:justify-center" : ""}
            `}
            title={collapsed ? (isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode") : undefined}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0" />
            )}
            {!collapsed && <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5
              text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-900/20
              font-medium text-sm
              rounded-lg 
              transition-colors
              ${collapsed ? "lg:justify-center" : ""}
            `}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;