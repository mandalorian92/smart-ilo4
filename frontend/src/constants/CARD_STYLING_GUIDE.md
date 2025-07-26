# System-Wide Card Styling Guide

This guide explains how to use the centralized card styling system to ensure visual consistency across all tabs and components.

## Overview

All cards in the application should use the standardized card styles defined in `/src/constants/cardStyles.ts`. This ensures:

- Visual consistency across Overview, Control, Monitoring, and Debug tabs
- Consistent hover effects and transitions
- Proper spacing and typography
- Easy maintenance and updates
- **Consistent empty/no-data state styling**

## Card Spacing Standards

### **Card Gaps (Technical term: Grid spacing)**

All card gaps follow the **Overview tab** as the system-wide standard:

- **Between cards in same row**: `SPACING.CARD` (16px mobile, 24px desktop)
- **Between card rows/sections**: `SPACING.ROW` (24px)

```tsx
// Correct usage for card rows
<Box sx={{ mb: SPACING.ROW }}>
  <Grid container spacing={SPACING.CARD}>
    {/* Cards go here */}
  </Grid>
</Box>

// Next row
<Box sx={{ mb: SPACING.ROW }}>
  <Grid container spacing={SPACING.CARD}>
    {/* More cards */}
  </Grid>
</Box>
```

### **Card Internal Spacing**

- **Main card padding**: `SPACING.CARD_CONTENT.MAIN` (24px mobile, 32px desktop)
- **Nested card padding**: `SPACING.CARD_CONTENT.NESTED` (16px mobile, 24px desktop)
- **Component internal gaps**: `SPACING.COMPONENT.*` (8px/16px/24px)

## Empty State Standards

### **System-Wide Empty State Styling**

All empty/no-data states use the centralized empty state system:

```tsx
import { CARD_STYLES } from '../constants/cardStyles';

// For empty state displays (no data available)
<Box sx={CARD_STYLES.EMPTY_STATE}>
  <YourIcon sx={CARD_STYLES.EMPTY_STATE_ICON} />
  <Typography sx={CARD_STYLES.EMPTY_STATE_TEXT}>
    No data available
  </Typography>
  <Typography sx={CARD_STYLES.EMPTY_STATE_SUBTEXT}>
    Optional additional info (like "auto-refreshes every 2 minutes")
  </Typography>
</Box>
```

**Key Empty State Features:**
- **Perfect flex centering**: Uses flexbox with `height: '100%'` and `justifyContent: 'center'` for true center alignment
- **Consistent icon sizing**: 40px mobile, 48px desktop
- **Clean layout**: No unnecessary padding or subtext
- **Typography hierarchy**: Clear main message
- **Theme-aware colors**: Uses secondary text colors with proper opacity
- **Parent container**: Requires parent with `display: 'flex'` and `flexDirection: 'column'`

## Card Style Constants

### Main Card Properties

```tsx
import { CARD_STYLES, getCardContainerProps } from '../constants/cardStyles';

// For main cards (like Overview tab cards)
<Card {...getCardContainerProps(theme)}>
  <CardContent {...CARD_STYLES.CONTENT}>
    {/* Card content */}
  </CardContent>
</Card>
```

### Nested Card Properties

```tsx
import { getNestedCardProps } from '../constants/cardStyles';

// For cards within cards (like individual fan cards)
<Card {...getNestedCardProps(theme)}>
  <CardContent {...CARD_STYLES.NESTED_CONTENT}>
    {/* Nested card content */}
  </CardContent>
</Card>
```

## Typography Standards

### Card Headers

```tsx
// Standard card header layout
<Box {...CARD_STYLES.HEADER}>
  <Box>
    <Typography {...CARD_STYLES.TITLE} component="h2">
      Card Title
    </Typography>
    <Typography {...CARD_STYLES.SUBTITLE}>
      Card description or subtitle
    </Typography>
  </Box>
  {/* Optional header actions */}
</Box>
```

### Header Icons

```tsx
// For icons in card headers
<IconComponent {...CARD_STYLES.HEADER_ICON} />
```

## Complete Example

```tsx
import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import { CARD_STYLES, getCardContainerProps } from '../constants/cardStyles';
import { SPACING } from '../constants/spacing';

function MyCard() {
  const theme = useTheme();
  
  return (
    <Card {...getCardContainerProps(theme)}>
      <CardContent {...CARD_STYLES.CONTENT}>
        {/* Header Section */}
        <Box {...CARD_STYLES.HEADER}>
          <Box>
            <Typography {...CARD_STYLES.TITLE} component="h2">
              My Card Title
            </Typography>
            <Typography {...CARD_STYLES.SUBTITLE}>
              Description of what this card does
            </Typography>
          </Box>
        </Box>
        
        {/* Content Section */}
        <Box sx={{ flex: 1 }}>
          {/* Your card content here */}
        </Box>
      </CardContent>
    </Card>
  );
}
```

## Benefits

1. **Consistency**: All cards look and behave the same way
2. **Maintainability**: Changes to card styling are centralized
3. **Responsive**: Built-in responsive behavior across all screen sizes
4. **Accessibility**: Consistent hover states and focus indicators
5. **Theme Integration**: Automatically adapts to light/dark themes

## Implementation Status

### ✅ Completed
- **Overview tab cards**: InformationCard, PowerCard, SystemHealthOverview
- **Controls tab cards**: FanPresets, FanControlCard, SensorConfiguration
- All card states (loading, error, waiting, success) use system-wide styling
- Consistent hover effects, borders, padding, and typography across all cards

### 🔄 Ready for Implementation
- Monitoring tab cards
- Debug tab cards
- Any new cards added to the system

## Usage Notes

- Always import both `CARD_STYLES` and the theme from useTheme
- Use `getCardContainerProps(theme)` for main cards
- Use `getNestedCardProps(theme)` for cards within cards
- Follow the header structure for consistency
- Use SPACING constants for internal card spacing
