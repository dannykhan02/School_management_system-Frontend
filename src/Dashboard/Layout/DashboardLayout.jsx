import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from './Header';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { AlertCircle } from "lucide-react";

const DashboardLayout = () => {
  const { user, loading, mustChangePassword } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Listen for sidebar collapse/expand changes
  useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector('[class*="z-40"][class*="h-screen"]');
      const currentIsMobile = window.innerWidth < 1024;
      setIsMobile(currentIsMobile);

      if (sidebar && !currentIsMobile) {
        const isCollapsed = sidebar.classList.contains('lg:w-16');
        setSidebarCollapsed(isCollapsed);
      } else {
        setSidebarCollapsed(false);
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        <div className="text-lg text-black dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  if (location.pathname === `/${user.role}` || location.pathname === `/${user.role}/`) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // Calculate sidebar width - 0 on mobile, 64 if collapsed, 256 if expanded
  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 64 : 256);

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-white text-black dark:bg-black dark:text-white overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area - flex column container */}
        <div 
          className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
          style={{
            marginLeft: isMobile ? '0' : `${sidebarWidth}px`
          }}
        >
          {/* Header - Fixed at top */}
          <Header />
          
          {/* Password change banner */}
          {mustChangePassword && !location.pathname.includes(`/${user.role}/dashboard`) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    You must change your password to continue using the system.
                  </p>
                </div>
                <a
                  href={`/${user.role}/dashboard`}
                  className="text-sm font-medium text-amber-800 dark:text-amber-200 underline"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          )}
          
          {/* Main content area - scrollable */}
          <main 
            className="flex-1 overflow-auto pt-16 px-6 pb-6 transition-all duration-300 ease-in-out"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;