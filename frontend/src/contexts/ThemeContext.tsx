/**
 * ThemeContext
 * - Provides theme switching functionality using Material-UI ThemeProvider
 * - Manages dark/light mode state
 * - Creates proper Material-UI themes
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};

interface ThemeContextProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#3fd921',
        light: '#6eff4f',
        dark: '#2ba615',
        contrastText: '#ffffff',
      },
      success: {
        main: '#3fd921',
        light: '#6eff4f',
        dark: '#2ba615',
        contrastText: '#ffffff',
      },
    },
    components: {
      // Override MUI Container to remove max-width constraint
      MuiContainer: {
        styleOverrides: {
          root: {
            maxWidth: 'none !important',
            width: '100%',
            padding: 0,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            // Force full width
            margin: 0,
            padding: 0,
            width: '100%',
            maxWidth: 'none !important',
            // Custom scrollbar styling
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: isDarkMode ? '#2b2b2b' : '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: isDarkMode ? '#6b6b6b' : '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: isDarkMode ? '#8b8b8b' : '#a1a1a1',
              },
            },
            // Apply to all scrollable elements
            '*::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '*::-webkit-scrollbar-track': {
              backgroundColor: isDarkMode ? '#2b2b2b' : '#f1f1f1',
            },
            '*::-webkit-scrollbar-thumb': {
              backgroundColor: isDarkMode ? '#6b6b6b' : '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: isDarkMode ? '#8b8b8b' : '#a1a1a1',
              },
            },
            // Override any container constraints
            '.container, .container-fluid, .main-section, .MuiContainer-root': {
              maxWidth: 'none !important',
              width: '100% !important',
              padding: '0 !important',
              margin: '0 !important',
            },
            '#root': {
              width: '100%',
              maxWidth: 'none',
            },
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
