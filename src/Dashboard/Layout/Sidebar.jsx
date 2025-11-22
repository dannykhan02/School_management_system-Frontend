import React, { useState } from "react";
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
import { getNavigationItems } from "../../config/navigation";
import { useSidebar } from "../../contexts/SidebarContext";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();

  const toggleDarkMode = () => {
    const html = document.documentElement;

    if (isDarkMode) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }

    setIsDarkMode(!isDarkMode);
  };

  const isActive = (item) => {
    return (
      item.href === location.pathname ||
      location.pathname.startsWith(item.href + "/")
    );
  };

  const sidebarItems = getNavigationItems(user?.role);

  return (
    <>
      {/* Backdrop with blur for mobile - matches ClassroomManager style */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`
          flex flex-col 
          bg-card dark:bg-sidebar 
          border-r border-border
          fixed
          z-50 h-screen
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0 shadow-lg" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-16 w-16" : "lg:w-64 w-64"}
        `}
      >
        {/* HEADER - Fixed height 64px to match header */}
        <div className="flex items-center justify-between p-4 border-b border-border h-16 flex-shrink-0">
          {!collapsed ? (
            <>
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "E"}
                </div>
                <span className="font-bold text-lg text-foreground truncate">
                  EduPulse
                </span>
              </div>

              {/* Collapse button - visible on desktop when expanded */}
              <button
                className="hidden lg:flex p-2 rounded-lg hover:bg-accent transition-all duration-200 text-foreground flex-shrink-0 ml-auto"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Close button - only visible on mobile */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-accent text-foreground flex-shrink-0 ml-auto"
                onClick={toggleSidebar}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            /* When collapsed - show only expand button centered */
            <button
              className="hidden lg:flex p-2 rounded-lg hover:bg-accent transition-all duration-200 text-foreground mx-auto"
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
          <div className={`p-4 border-b border-border flex-shrink-0 ${collapsed ? "lg:p-2" : ""}`}>
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shadow flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-medium">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {sidebarItems.map((item) => {
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
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
        <div className={`border-t border-border flex-shrink-0 ${collapsed ? "p-2 space-y-2" : "p-4 space-y-2"}`}>
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center gap-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors ${collapsed ? "justify-center p-3" : "px-3 py-2"}`}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span className="text-sm font-medium">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors ${collapsed ? "justify-center p-3" : "px-3 py-2"}`}
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