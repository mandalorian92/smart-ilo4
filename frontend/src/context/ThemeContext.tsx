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
  
  // HPE Official Colors from Design System
  const hpeColors = {
    // Light theme colors
    light: {
      green: '#17eba0',
      purple: '#f740ff',
      teal: '#82fff2',
      blue: '#00c8ff',
      red: '#fc6161',
      orange: '#ffbc44',
      yellow: '#ffeb59',
    },
    // Dark theme colors
    dark: {
      green: '#008567',
      purple: '#6633bc',
      teal: '#117b82',
      blue: '#007390',
      red: '#a2423d',
      orange: '#964310',
      yellow: '#8d741c',
    },
    // Keep the existing dark blue for app bar
    appBarDark: '#1f2532',
  };

  const currentColors = isDark ? hpeColors.dark : hpeColors.light;
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: currentColors.green,
        light: isDark ? hpeColors.light.green : '#4df0b8',
        dark: isDark ? '#005a46' : hpeColors.dark.green,
      },
      secondary: {
        main: currentColors.blue,
        light: isDark ? hpeColors.light.blue : '#33d4ff',
        dark: isDark ? '#004d66' : hpeColors.dark.blue,
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
        main: currentColors.green,
        light: isDark ? hpeColors.light.green : '#4df0b8',
        dark: isDark ? '#005a46' : hpeColors.dark.green,
      },
      warning: {
        main: currentColors.orange,
        light: isDark ? hpeColors.light.orange : '#ffcd70',
        dark: isDark ? '#6d2f0b' : hpeColors.dark.orange,
      },
      error: {
        main: currentColors.red,
        light: isDark ? hpeColors.light.red : '#fd8b8b',
        dark: isDark ? '#723028' : hpeColors.dark.red,
      },
      info: {
        main: currentColors.blue,
        light: isDark ? hpeColors.light.blue : '#33d4ff',
        dark: isDark ? '#004d66' : hpeColors.dark.blue,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#008567' : '#17eba0', // Dark theme: HPE Dark Green, Light theme: HPE Bright Green
            color: '#ffffff',
            transition: 'background-color 0.3s ease', // Smooth transition when switching themes
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
            color: currentColors.green, // Use HPE Green for sliders
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
