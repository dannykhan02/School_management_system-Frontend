import React, { useState, useEffect } from 'react'
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from '../../contexts/SidebarContext';
import { Menu } from 'lucide-react';

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const checkSidebarState = () => {
      const currentIsMobile = window.innerWidth < 1024;
      setIsMobile(currentIsMobile);

      if (currentIsMobile) {
        setSidebarWidth(0);
      } else {
        const sidebar = document.querySelector('[class*="z-40"][class*="h-screen"]');
        if (sidebar) {
          const isCollapsed = sidebar.classList.contains('lg:w-16');
          setSidebarWidth(isCollapsed ? 64 : 256);
        }
      }
    };

    checkSidebarState();
    window.addEventListener('resize', checkSidebarState);
    
    const observer = new MutationObserver(checkSidebarState);
    const sidebar = document.querySelector('[class*="z-40"][class*="h-screen"]');
    if (sidebar) {
      observer.observe(sidebar, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
    }

    const interval = setInterval(checkSidebarState, 100);

    return () => {
      window.removeEventListener('resize', checkSidebarState);
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <header 
      className="fixed top-0 right-0 z-20 bg-white border-b border-gray-200 dark:bg-black dark:border-gray-800 h-16 transition-all duration-300 ease-in-out"
      style={{
        left: `${sidebarWidth}px`
      }}
    >
      <div className="flex items-center justify-between px-6 h-full">
        {/* Left side - Menu button for mobile */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            aria-label="Toggle sidebar"
            title="Open sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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