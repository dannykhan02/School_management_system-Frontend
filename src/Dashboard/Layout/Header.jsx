import React from 'react'
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from '../../contexts/SidebarContext';


const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 bg-white border-b border-gray-200 dark:bg-black dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Menu button for mobile */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 mr-4"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-black dark:text-white capitalize">
            {user?.role} Dashboard
          </h2>
        </div>

        {/* Right side - Profile */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-black dark:text-white">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
  
        </div>
      </div>
    </header>
  );
};

export default Header;