// System-wide card style constants for consistent UI design
// These properties are used across all card components to maintain visual consistency

import { SxProps, Theme } from '@mui/material/styles';
import { SPACING } from './spacing';

export const CARD_STYLES = {
  // Main card container properties (matches Overview tab cards)
  CONTAINER: {
    variant: 'outlined' as const,
    sx: (theme: Theme): SxProps<Theme> => ({
      height: '100%',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 3,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 8px 24px ${theme.palette.primary.main}15`
      }
    })
  },

  // Grid card container properties (enforces consistent height in grid layouts)
  GRID_CONTAINER: {
    variant: 'outlined' as const,
    sx: (theme: Theme): SxProps<Theme> => ({
      height: '100%',
      minHeight: SPACING.HEIGHTS.GRID_CARDS_MIN, // Ensures consistent minimum height
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 3,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 8px 24px ${theme.palette.primary.main}15`
      }
    })
  },

  // Card content properties (matches Overview tab cards)
  CONTENT: {
    sx: { 
      p: SPACING.CARD_CONTENT.MAIN, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column' 
    }
  },

  // Header section properties (consistent across all cards)
  HEADER: {
    sx: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      mb: SPACING.COMPONENT.LARGE
    }
  },

  // Title typography properties (consistent sizing and weight)
  TITLE: {
    variant: 'h6' as const,
    sx: {
      fontWeight: 600,
      color: 'text.primary',
      fontSize: { xs: '1rem', sm: '1.125rem' },
      mb: 0.5
    }
  },

  // Subtitle/description typography properties
  SUBTITLE: {
    variant: 'body2' as const,
    sx: { 
      fontSize: { xs: '0.8rem', sm: '0.875rem' },
      color: 'text.secondary'
    }
  },

  // Icon properties for card headers
  HEADER_ICON: {
    sx: { 
      color: 'primary.main', 
      fontSize: 20 
    }
  },

  // Manual refresh button properties (standardized across all cards)
  REFRESH_BUTTON: {
    size: 'small' as const,
    sx: {
      color: 'primary.main',
      '&:hover': {
        backgroundColor: 'primary.main',
        opacity: 0.1
      },
      '&:disabled': {
        color: 'text.disabled'
      }
    }
  },

  // Refresh icon properties (consistent sizing)
  REFRESH_ICON: {
    sx: {
      fontSize: 18
    }
  },

  // Empty state properties (centered no data display)
  EMPTY_STATE: {
    sx: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      textAlign: 'center'
    }
  },

  // Empty state icon properties
  EMPTY_STATE_ICON: {
    sx: {
      fontSize: { xs: 40, sm: 48 },
      color: 'text.secondary',
      mb: 2,
      opacity: 0.6
    }
  },

  // Empty state text properties
  EMPTY_STATE_TEXT: {
    variant: 'body1' as const,
    sx: {
      color: 'text.secondary',
      fontSize: { xs: '0.875rem', sm: '1rem' },
      mb: 1
    }
  },

  // Empty state subtext properties (for additional info like "auto-refreshes")
  EMPTY_STATE_SUBTEXT: {
    variant: 'caption' as const,
    sx: {
      color: 'text.secondary',
      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
      opacity: 0.8
    }
  },

  // Nested card properties (for cards within cards)
  NESTED: {
    elevation: 0 as const,
    sx: (theme: Theme): SxProps<Theme> => ({
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 2,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 4px 12px ${theme.palette.primary.main}15`
      }
    })
  },

  // Nested card content properties (smaller padding than main cards)
  NESTED_CONTENT: {
    sx: { 
      p: SPACING.CARD_CONTENT.NESTED
    }
  },

  // Time range selector properties (consistent across all chart cards)
  TIME_RANGE_SELECTOR: {
    size: 'small' as const,
    sx: {
      minWidth: 120,
      '& .MuiSelect-select': {
        padding: '8px 12px',
        fontSize: '0.875rem'
      }
    }
  },

  // Chart container properties (consistent chart display area)
  CHART_CONTAINER: {
    sx: {
      flex: 1,
      minHeight: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const
    }
  },

  // Loading state properties (centered spinner)
  LOADING: {
    sx: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 200,
    }
  },

  // Error state properties (centered error message)
  ERROR: {
    sx: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 200,
      color: 'error.main',
      textAlign: 'center',
    }
  }
} as const;

// Time range options for all temperature cards
export const TIME_RANGE_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 1440, label: '1 day' },
];

// Default time range (15 minutes)
export const DEFAULT_TIME_RANGE = 15;

// Chart color palette for consistent styling
export const CHART_COLORS = {
  primary: 'rgb(54, 162, 235)',
  secondary: 'rgb(255, 99, 132)',
  success: 'rgb(75, 192, 192)',
  warning: 'rgb(255, 205, 86)',
  info: 'rgb(153, 102, 255)',
  danger: 'rgb(255, 99, 132)',
  // Background colors with transparency
  primaryBackground: 'rgba(54, 162, 235, 0.2)',
  secondaryBackground: 'rgba(255, 99, 132, 0.2)',
  successBackground: 'rgba(75, 192, 192, 0.2)',
  warningBackground: 'rgba(255, 205, 86, 0.2)',
  infoBackground: 'rgba(153, 102, 255, 0.2)',
  dangerBackground: 'rgba(255, 99, 132, 0.2)',
};

// Chart configuration options for temperature charts
export const getChartOptions = (yAxisLabel: string = 'Temperature (°C)', timeRange: number = 15) => {
  // Determine time unit and display format based on time range
  let timeUnit: 'minute' | 'hour' | 'day' = 'minute';
  let displayFormat = 'HH:mm';
  let stepSize = 1;

  if (timeRange <= 30) {
    // For 5, 15, 30 minutes - show every minute
    timeUnit = 'minute';
    displayFormat = 'HH:mm';
    stepSize = timeRange <= 15 ? 1 : 2; // Show every minute for ≤15min, every 2min for 30min
  } else if (timeRange <= 180) {
    // For 1-3 hours - show every 5-15 minutes
    timeUnit = 'minute';
    displayFormat = 'HH:mm';
    stepSize = timeRange <= 60 ? 5 : 15;
  } else if (timeRange <= 1440) {
    // For up to 24 hours - show every hour
    timeUnit = 'hour';
    displayFormat = 'HH:mm';
    stepSize = 1;
  } else {
    // For more than 24 hours - show every few hours or days
    timeUnit = timeRange <= 4320 ? 'hour' : 'day'; // 72 hours = 3 days
    displayFormat = timeUnit === 'hour' ? 'MMM dd HH:mm' : 'MMM dd';
    stepSize = timeUnit === 'hour' ? 6 : 1;
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: timeUnit,
          stepSize: stepSize,
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          maxTicksLimit: 12, // Limit number of ticks to prevent overcrowding
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: yAxisLabel,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };
};

// Helper function to get card container props
export const getCardContainerProps = (theme: Theme) => ({
  variant: CARD_STYLES.CONTAINER.variant,
  sx: CARD_STYLES.CONTAINER.sx(theme)
});

// Helper function to get grid card container props (with consistent height)
export const getGridCardContainerProps = (theme: Theme) => ({
  variant: CARD_STYLES.GRID_CONTAINER.variant,
  sx: CARD_STYLES.GRID_CONTAINER.sx(theme)
});

// Helper function to get nested card props
export const getNestedCardProps = (theme: Theme) => ({
  elevation: CARD_STYLES.NESTED.elevation,
  sx: CARD_STYLES.NESTED.sx(theme)
});

// Type definitions for consistent usage
export type CardContainerProps = {
  variant: 'outlined';
  sx: SxProps<Theme>;
};

export type NestedCardProps = {
  elevation: 0;
  sx: SxProps<Theme>;
};
