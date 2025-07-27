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
  }
} as const;

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
