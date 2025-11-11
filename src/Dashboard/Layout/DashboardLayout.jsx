import React from 'react';
import { Outlet, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from './Header';
import { SidebarProvider } from '../../contexts/SidebarContext';


const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

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
        <div className="flex-1 flex flex-col lg:ml-0">
          <Header />
          <main className="flex-1 overflow-auto mt-16 p-6 dark:bg-black">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;