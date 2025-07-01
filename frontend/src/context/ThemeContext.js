import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';

export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const themeObject = useMemo(
    () => ({
      palette: {
        mode: theme,
        primary: {
          main: '#ff9800',
        },
        secondary: {
          main: '#dc004e',
        },
        background: {
          default: theme === 'light' ? '#f5f5f5' : '#121212',
          paper: theme === 'light' ? '#ffffff' : '#1e1e1e',
          light: '#ffffff',
          dark: '#121212',
        },
        text: {
          primary: theme === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
          secondary: theme === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: theme === 'light' ? '#f5f5f5' : '#121212',
              color: theme === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            containedPrimary: {
              background: 'linear-gradient(90deg, #ff9800 0%, #f44336 100%)',
              color: '#fff',
              boxShadow: '0 2px 4px 0 rgba(244,67,54,0.15)',
              '&:hover': {
                background: 'linear-gradient(90deg, #f44336 0%, #ff9800 100%)',
              },
            },
          },
        },
      },
    }),
    [theme]
  );

  const customTheme = createTheme(themeObject);

  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={customTheme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
}; 