// System-wide spacing constants for consistent UI design
// These values align with Material-UI's spacing system where 1 unit = 8px
// All spacing values are derived from the Overview tab as the standard

export const SPACING = {
  // Card spacing (used in Grid containers between cards within the same row)
  // This controls horizontal gaps between cards and vertical gaps on mobile
  CARD: { xs: 2, sm: 3 }, // 16px on mobile, 24px on desktop
  
  // Row spacing (vertical gaps between different sections/rows of cards)
  // This controls the space between card rows (e.g., between Overview tab rows)
  ROW: 3, // 24px - matches Overview tab standard
  
  // Component internal spacing
  COMPONENT: {
    SMALL: 1,   // 8px - for tight spacing
    MEDIUM: 2,  // 16px - for standard spacing  
    LARGE: 3,   // 24px - for section spacing
  },
  
  // Card-specific spacing
  CARD_CONTENT: {
    // Main card content padding (matches Overview tab)
    MAIN: { xs: 3, sm: 4 }, // 24px on mobile, 32px on desktop
    // Nested card content padding
    NESTED: { xs: 2, sm: 3 }, // 16px on mobile, 24px on desktop
  },
  
  // Card heights for consistency
  HEIGHTS: {
    OVERVIEW_CARDS: '450px', // For temperature charts and activity cards
    GRID_CARDS_MIN: '300px', // Minimum height for cards in grid layouts
  }
} as const;

// Type for component props
export type SpacingValue = number | { xs: number; sm: number };

// Usage Guidelines:
// - Use SPACING.CARD for Grid container spacing prop
// - Use SPACING.ROW for vertical gaps between card sections/rows  
// - Use SPACING.COMPONENT.* for internal component spacing
// - Use SPACING.CARD_CONTENT.* for CardContent padding
