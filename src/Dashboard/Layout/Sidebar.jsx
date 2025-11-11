import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, LogOut, X } from "lucide-react"; // Using lucide-react for consistency
import { useAuth } from "../../contexts/AuthContext";
import { getNavigationItems } from "../../config/navigation";
import { useSidebar } from "../../contexts/SidebarContext";

const Sidebar = () => {
  const [openSubmenus, setOpenSubmenus] = useState({});
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();

  const toggleSubmenu = (name) => {
    setOpenSubmenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Checks if the current route matches the navigation item
  const isActive = (item) => {
    return item.href === location.pathname;
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
          flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed lg:relative z-40 w-64 h-screen
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                {getRoleDisplayName(user?.role)}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={toggleSidebar}
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {sidebarItems.map((item) => {
            const active = isActive(item);
            return (
              <div key={item.name}>
                <Link
                  to={item.href}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                >
                  <div
                    className={`
                      flex items-center justify-between rounded-lg cursor-pointer transition-colors duration-200 p-3
                      ${active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`
                          ${active
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-500 dark:text-gray-400"
                          }
                        `}
                      >
                        {item.icon}
                      </div>
                      <span className={`font-medium text-sm ${active ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"}`}>
                        {item.name}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Footer with Logout Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={logout}
            className="
              w-full flex items-center justify-center space-x-2 
              px-4 py-3 text-red-600 border border-red-300 dark:border-red-800
              hover:bg-gradient-to-r from-red-500 to-red-600 
              hover:text-white hover:border-transparent
              font-medium 
              rounded-lg 
              transition-all 
              duration-200 
              ease-in-out
              hover:shadow-lg
              transform
              hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;