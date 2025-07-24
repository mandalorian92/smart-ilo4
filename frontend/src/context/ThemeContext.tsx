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
  
  // Official System Colors from Design System
  const systemColors = {
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

  const currentColors = isDark ? systemColors.dark : systemColors.light;
  
  return createTheme({
    breakpoints: {
      values: {
        xs: 0,     // Mobile devices
        sm: 600,   // Small tablets
        md: 900,   // Large tablets / Small laptops
        lg: 1200,  // Desktop
        xl: 1536,  // Large screens
      },
    },
    spacing: 8, // Base spacing unit (8px)
    palette: {
      mode,
      primary: {
        main: currentColors.green,
        light: isDark ? systemColors.light.green : '#4df0b8',
        dark: isDark ? '#005a46' : systemColors.dark.green,
      },
      secondary: {
        main: currentColors.blue,
        light: isDark ? systemColors.light.blue : '#33d4ff',
        dark: isDark ? '#004d66' : systemColors.dark.blue,
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
        light: isDark ? systemColors.light.green : '#4df0b8',
        dark: isDark ? '#005a46' : systemColors.dark.green,
      },
      warning: {
        main: currentColors.orange,
        light: isDark ? systemColors.light.orange : '#ffcd70',
        dark: isDark ? '#6d2f0b' : systemColors.dark.orange,
      },
      error: {
        main: currentColors.red,
        light: isDark ? systemColors.light.red : '#fd8b8b',
        dark: isDark ? '#723028' : systemColors.dark.red,
      },
      info: {
        main: currentColors.blue,
        light: isDark ? systemColors.light.blue : '#33d4ff',
        dark: isDark ? '#004d66' : systemColors.dark.blue,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff', // System recommendation: White in light, dark in dark mode
            color: isDark ? '#ffffff' : '#2c2c2c', // High contrast text
            borderBottom: `1px solid ${isDark ? '#2e2e2e' : '#e0e0e0'}`, // Subtle border
            borderRadius: '0 0 12px 12px', // Rounded bottom corners for modern look
            boxShadow: isDark 
              ? '0 1px 3px rgba(0, 0, 0, 0.5)' 
              : '0 1px 3px rgba(0, 0, 0, 0.12)', // Subtle shadow
            transition: 'background-color 0.3s ease, color 0.3s ease', // Smooth transition when switching themes
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            borderRadius: 8, // HPE standard border radius
            border: `1px solid ${isDark ? '#2e2e2e' : '#e0e0e0'}`,
            boxShadow: isDark 
              ? '0px 1px 3px rgba(0, 0, 0, 0.3)'
              : '0px 1px 3px rgba(0, 0, 0, 0.12)',
            '&:hover': {
              boxShadow: isDark 
                ? '0px 2px 6px rgba(0, 0, 0, 0.4)'
                : '0px 2px 6px rgba(0, 0, 0, 0.15)',
            },
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
            color: currentColors.green, // Use System Green for sliders
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 4, // System standard border radius
            fontWeight: 600,
            minHeight: 40,
            padding: '8px 24px',
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
            },
          },
          outlined: {
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
            },
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
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 4, // System standard border radius
              '& fieldset': {
                borderWidth: 2,
                borderColor: isDark ? '#3e3e3e' : '#d0d0d0',
              },
              '&:hover fieldset': {
                borderColor: currentColors.green,
                borderWidth: 2,
              },
              '&.Mui-focused fieldset': {
                borderColor: currentColors.green,
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8, // System standard border radius
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          },
          outlined: {
            border: `1px solid ${isDark ? '#2e2e2e' : '#e0e0e0'}`,
          },
        },
      },
    },
    typography: {
      fontFamily: '"SystemFont", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      h1: {
        fontWeight: 600,
        fontSize: '2.125rem',
        lineHeight: 1.2,
        letterSpacing: '-0.01562em',
        '@media (max-width:600px)': {
          fontSize: '1.75rem',
        },
      },
      h2: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.3,
        letterSpacing: '-0.00833em',
        '@media (max-width:600px)': {
          fontSize: '1.25rem',
        },
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
        letterSpacing: '0em',
        '@media (max-width:600px)': {
          fontSize: '1.125rem',
        },
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.4,
        letterSpacing: '0.00735em',
        '@media (max-width:600px)': {
          fontSize: '1rem',
        },
      },
      h5: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5,
        letterSpacing: '0em',
        '@media (max-width:600px)': {
          fontSize: '0.9rem',
        },
      },
      h6: {
        fontWeight: 600,
        fontSize: '0.875rem',
        lineHeight: 1.5,
        letterSpacing: '0.0075em',
        '@media (max-width:600px)': {
          fontSize: '0.8rem',
        },
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: 1.5,
        '@media (max-width:600px)': {
          fontSize: '0.9rem',
        },
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.5,
        '@media (max-width:600px)': {
          fontSize: '0.8rem',
        },
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
        '@media (max-width:600px)': {
          fontSize: '0.9rem',
        },
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        '@media (max-width:600px)': {
          fontSize: '0.8rem',
        },
      },
      button: {
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.75,
        letterSpacing: '0.02857em',
        textTransform: 'none' as const,
        '@media (max-width:600px)': {
          fontSize: '0.8rem',
        },
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.66,
        '@media (max-width:600px)': {
          fontSize: '0.7rem',
        },
      },
      overline: {
        fontSize: '0.75rem',
        lineHeight: 2.66,
        letterSpacing: '0.08333em',
        textTransform: 'uppercase' as const,
        '@media (max-width:600px)': {
          fontSize: '0.7rem',
        },
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
