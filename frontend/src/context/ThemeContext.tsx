import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  currentTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const createCustomTheme = (mode: 'light' | 'dark'): Theme => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#90caf9' : '#1976d2',
        light: isDark ? '#bbdefb' : '#42a5f5',
        dark: isDark ? '#64b5f6' : '#1565c0',
      },
      secondary: {
        main: isDark ? '#f48fb1' : '#dc004e',
        light: isDark ? '#f8bbd9' : '#ff5983',
        dark: isDark ? '#f06292' : '#9a0036',
      },
      background: {
        default: isDark ? '#121212' : '#fafafa',
        paper: isDark ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#ffffff' : '#000000',
        secondary: isDark ? '#b3b3b3' : '#666666',
      },
      divider: isDark ? '#2e2e2e' : '#e0e0e0',
      success: {
        main: isDark ? '#4caf50' : '#2e7d32',
        light: isDark ? '#81c784' : '#4caf50',
        dark: isDark ? '#388e3c' : '#1b5e20',
      },
      warning: {
        main: isDark ? '#ff9800' : '#ed6c02',
        light: isDark ? '#ffb74d' : '#ff9800',
        dark: isDark ? '#f57c00' : '#e65100',
      },
      error: {
        main: isDark ? '#f44336' : '#d32f2f',
        light: isDark ? '#ef5350' : '#f44336',
        dark: isDark ? '#c62828' : '#b71c1c',
      },
      info: {
        main: isDark ? '#29b6f6' : '#0288d1',
        light: isDark ? '#4fc3f7' : '#29b6f6',
        dark: isDark ? '#0277bd' : '#01579b',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1e1e1e' : '#1976d2',
            color: isDark ? '#ffffff' : '#ffffff',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            boxShadow: isDark 
              ? '0px 2px 4px rgba(0, 0, 0, 0.3), 0px 1px 10px rgba(0, 0, 0, 0.15)'
              : '0px 2px 4px rgba(0, 0, 0, 0.1), 0px 1px 10px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#2e2e2e' : '#ffffff',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableRow-root': {
              backgroundColor: isDark ? '#3e3e3e' : '#f5f5f5',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(even)': {
              backgroundColor: isDark ? '#2a2a2a' : '#fafafa',
            },
            '&:hover': {
              backgroundColor: isDark ? '#3a3a3a' : '#f0f0f0',
            },
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: isDark ? '#90caf9' : '#1976d2',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#3e3e3e' : '#e0e0e0',
            color: isDark ? '#ffffff' : '#000000',
          },
        },
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h6: {
        fontWeight: 600,
      },
    },
  });
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    return savedMode || 'system';
  });

  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(getSystemPreference);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const effectiveMode = mode === 'system' ? systemPreference : mode;
  const currentTheme = createCustomTheme(effectiveMode);

  return (
    <ThemeContext.Provider value={{ mode, setMode, currentTheme }}>
      <MUIThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
