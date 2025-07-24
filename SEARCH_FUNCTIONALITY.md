# Centralized Search Functionality Implementation

## Overview

I've successfully implemented a centralized search functionality for both the Fan Controllers and Temperature Sensors tables in the Dashboard component, following System Design guidelines. The search box is positioned centrally and filters both tables simultaneously.

## Features Implemented

### 1. Centralized Search Box Design
- **Single Search Interface**: One search box controls both tables simultaneously
- **Central Positioning**: Search box is centered on the page for better visual hierarchy
- **Wider Design**: Takes up 70% of screen width on tablets, 50% on desktop, with a maximum width of 600px
- **System Compliant Styling**: Clean, modern design with proper spacing and typography
- **Visual Feedback**: 
  - Border color changes on hover and focus
  - Subtle shadow effects for better depth perception
  - Icon color changes based on search state
- **Responsive Layout**: Adapts to different screen sizes (100% width on mobile)

### 2. Unified Search Functionality
- **Multi-table Search**: Single search query filters both Fan Controllers and Temperature Sensors simultaneously
- **Multi-column Search**: Searches across all visible columns in each table
- **Multi-term Search**: Supports searching with multiple space-separated terms
- **Real-time Filtering**: Results update immediately as you type
- **Case-insensitive**: Search works regardless of letter case
- **Simple Placeholder**: Clean "Search" placeholder text for clarity

### 3. Enhanced User Experience
- **Clear Button**: Easy-to-access X button to clear search
- **Unified Results Counter**: Shows "X of Y" results for each table when searching is active
- **Contextual Empty Messages**: Clear feedback when no matches are found for each table
- **Centralized Control**: One input controls all table filtering for intuitive operation

## Table-Specific Search Behavior

### Fan Controllers Table
- **Searchable Fields**: Fan name, status, health, speed, and RPM values
- **Search Results**: Shows filtered fan results with "X of Y" counter

### Temperature Sensors Table  
- **Searchable Fields**: Sensor name, context/location, temperature readings, and critical values
- **Search Results**: Shows filtered sensor results with "X of Y" counter

## Technical Implementation

### Dashboard Component Updates
- Added centralized `searchQuery` state at the Dashboard level
- Implemented `searchInRow` function for multi-column, multi-term searching
- Added `useMemo` hooks for `filteredFans` and `filteredSensors` for efficient filtering
- Created centralized search box positioned between header and tables
- Updated both tables to use filtered data instead of raw data

### DataTable Component Updates
- Removed individual search functionality in favor of external filtering
- Added `originalDataLength` prop to support "X of Y" counter display
- Enhanced counter logic to show search state across different filtering scenarios
- Maintained backward compatibility with existing searchable prop (unused in current implementation)

### Search Box Positioning
- Centered horizontally with responsive width:
  - Mobile: 100% width
  - Tablet: 70% width  
  - Desktop: 50% width
  - Maximum width: 600px
- Positioned between dashboard header and data tables for optimal user flow

## Usage Example

```tsx
// Centralized search state in Dashboard
const [searchQuery, setSearchQuery] = useState('');

// Filtered data using useMemo for performance
const filteredFans = useMemo(() => {
  if (!searchQuery.trim()) return fans;
  return fans.filter(row => searchInRow(row, searchQuery, fanColumns));
}, [fans, searchQuery]);

// Single search box controlling both tables
<TextField
  placeholder="Search"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  // ... styling and InputProps
/>

// Tables using filtered data
<DataTable
  data={filteredFans}
  originalDataLength={fans.length}
  // ... other props
/>
```

## Search Algorithm

The centralized search implementation:
1. Maintains a single `searchQuery` state at the Dashboard level
2. Splits the search query into individual terms (space-separated)
3. Requires ALL terms to match (AND logic) within each table
4. Searches across ALL specified columns for each table type:
   - **Fans**: name, status, health, speed
   - **Sensors**: name, context, reading, critical
5. Converts all values to strings for consistent searching
6. Performs case-insensitive matching
7. Updates both table results simultaneously

## Design System Compliance

Following System Design principles:
- ✅ Clean, minimal interface with single search control
- ✅ Consistent spacing and typography
- ✅ Proper use of icons and visual hierarchy  
- ✅ Accessible design with proper ARIA labels
- ✅ Responsive behavior across devices
- ✅ Smooth transitions and animations
- ✅ Centralized control for better user experience

## Performance Considerations

- Uses `useMemo` for efficient re-filtering only when data or search query changes
- Separate filtering logic for fans and sensors to optimize performance
- Single search input reduces complexity and improves UX
- Debouncing not implemented as the dataset is relatively small
- Search algorithm is optimized for readability and maintainability

## Future Enhancements

Potential improvements for larger datasets:
- Add debouncing for search input (300ms delay)
- Implement advanced filtering options (by table, status, etc.)
- Add search highlighting in results
- Include search history or saved searches
- Add keyboard shortcuts for search focus/clear
