import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from './Header';
import { SidebarProvider } from '../../contexts/SidebarContext';

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default expanded width

  // Listen for sidebar width changes
  useEffect(() => {
    const checkSidebarWidth = () => {
      // Find sidebar by looking for the fixed positioned sidebar div
      const sidebar = document.querySelector('.fixed.z-50.h-screen');
      if (sidebar && window.innerWidth >= 1024) {
        const width = sidebar.offsetWidth;
        setSidebarWidth(width);
      } else {
        setSidebarWidth(0); // Mobile: no margin needed
      }
    };

    // Initial check
    checkSidebarWidth();
    
    // Check on window resize
    window.addEventListener('resize', checkSidebarWidth);
    
    // Use MutationObserver to detect sidebar class changes (collapse/expand)
    const observer = new MutationObserver(checkSidebarWidth);
    const sidebar = document.querySelector('.fixed.z-50.h-screen');
    
    if (sidebar) {
      observer.observe(sidebar, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
    }

    // Recheck periodically to ensure sync
    const interval = setInterval(checkSidebarWidth, 100);

    return () => {
      window.removeEventListener('resize', checkSidebarWidth);
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
  
  // Redirect only if at the base role path
  if (location.pathname === `/${user.role}` || location.pathname === `/${user.role}/`) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-white text-black dark:bg-black dark:text-white overflow-hidden">
        <Sidebar />
        {/* Main content area with smooth transition */}
        <div 
          className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
          style={{ 
            marginLeft: window.innerWidth >= 1024 ? `${sidebarWidth}px` : '0'
          }}
        >
          {/* Header with fixed positioning */}
          <div className="fixed top-0 z-40 transition-all duration-300 ease-in-out"
            style={{
              left: window.innerWidth >= 1024 ? `${sidebarWidth}px` : '0',
              right: '0'
            }}
          >
            <Header />
          </div>
          {/* Main content with proper top padding */}
          <main className="flex-1 overflow-auto pt-16 p-6 dark:bg-black">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;