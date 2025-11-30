import { useState, useEffect } from 'react';

/**
 * Custom hook for managing dark mode theme persistence
 * Automatically initializes theme from localStorage and system preferences
 * @returns {Object} Object containing isDarkMode boolean and toggleDarkMode function
 */
export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const html = document.documentElement;

      if (savedTheme === 'dark') {
        html.classList.add('dark');
        setIsDarkMode(true);
      } else if (savedTheme === 'light') {
        html.classList.remove('dark');
        setIsDarkMode(false);
      } else {
        // Use system preference if no saved theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          html.classList.add('dark');
          localStorage.setItem('theme', 'dark');
          setIsDarkMode(true);
        } else {
          html.classList.remove('dark');
          localStorage.setItem('theme', 'light');
          setIsDarkMode(false);
        }
      }
      setIsInitialized(true);
    };

    initializeTheme();
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;

    if (isDarkMode) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return { isDarkMode, toggleDarkMode, isInitialized };
};