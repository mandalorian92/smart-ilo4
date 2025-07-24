import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  LinearProgress,
  useTheme,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface HPEDataTableColumn {
  id: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface HPEDataTableProps {
  title: string;
  icon?: React.ReactNode;
  columns: HPEDataTableColumn[];
  data: any[];
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  originalDataLength?: number; // For external search to show "X of Y" format
}

// Status indicator component
function StatusIndicator({ status, size = 'small' }: { status: 'ok' | 'warning' | 'error' | 'offline'; size?: 'small' | 'medium' }) {
  const theme = useTheme();
  
  const getStatusProps = () => {
    switch (status) {
      case 'ok':
        return { icon: CheckCircleIcon, color: theme.palette.success.main, label: 'OK' };
      case 'warning':
        return { icon: WarningIcon, color: theme.palette.warning.main, label: 'Warning' };
      case 'error':
        return { icon: ErrorIcon, color: theme.palette.error.main, label: 'Error' };
      case 'offline':
        return { icon: ErrorIcon, color: theme.palette.text.disabled, label: 'Offline' };
      default:
        return { icon: CheckCircleIcon, color: theme.palette.text.secondary, label: 'Unknown' };
    }
  };

  const { icon: Icon, color, label } = getStatusProps();

  return (
    <Tooltip title={label}>
      <Icon 
        sx={{ 
          fontSize: size === 'small' ? 16 : 20, 
          color: color 
        }} 
      />
    </Tooltip>
  );
}

// Progress bar component for percentages
function ProgressBar({ value, maxValue = 100, color, showValue = true }: {
  value: number;
  maxValue?: number;
  color?: string;
  showValue?: boolean;
}) {
  const theme = useTheme();
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  // Determine color based on value if not provided
  let barColor = color;
  if (!barColor) {
    if (percentage >= 85) barColor = theme.palette.error.main;
    else if (percentage >= 70) barColor = theme.palette.warning.main;
    else barColor = theme.palette.success.main;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              backgroundColor: barColor,
              borderRadius: 4,
            },
          }}
        />
      </Box>
      {showValue && (
        <Box sx={{ minWidth: 45 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
            {Math.round(value)}{maxValue === 100 ? '%' : ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function HPEDataTable({ 
  title, 
  icon, 
  columns, 
  data, 
  emptyMessage = 'No data available',
  searchable = false,
  searchPlaceholder = 'Search...',
  originalDataLength
}: HPEDataTableProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Function to search through row data (only used when searchable is true)
  const searchInRow = (row: any, query: string): boolean => {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return searchTerms.every(term => {
      return columns.some(column => {
        const value = row[column.id];
        if (value === null || value === undefined) return false;
        
        // Convert value to string for searching
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return stringValue.toLowerCase().includes(term);
      });
    });
  };

  // Filter data based on search query (only used when searchable is true)
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return data;
    return data.filter(row => searchInRow(row, searchQuery));
  }, [data, searchQuery, columns, searchable]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Determine what data to use and how to display the counter
  const displayData = searchable ? filteredData : data;
  const isExternallyFiltered = originalDataLength !== undefined && originalDataLength !== data.length;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Table Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3,
        px: 1,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon}
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              fontSize: { xs: '1.3rem', sm: '1.5rem' },
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            {title}
          </Typography>
          <Chip 
            label={
              isExternallyFiltered 
                ? `${data.length} of ${originalDataLength}` 
                : searchable && searchQuery 
                  ? `${displayData.length} of ${data.length}` 
                  : displayData.length
            } 
            size="small" 
            sx={{ 
              backgroundColor: (isExternallyFiltered || (searchable && searchQuery))
                ? theme.palette.secondary.main + '15'
                : theme.palette.primary.main + '15',
              color: (isExternallyFiltered || (searchable && searchQuery))
                ? theme.palette.secondary.main
                : theme.palette.primary.main,
              fontWeight: 600,
              transition: 'all 0.2s ease-in-out'
            }} 
          />
        </Box>
        
        {/* Search Box */}
        {searchable && (
          <Box sx={{ minWidth: 250, maxWidth: 400, flex: '0 1 auto' }}>
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    boxShadow: `0 2px 8px ${theme.palette.primary.main}15`,
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                    boxShadow: `0 4px 12px ${theme.palette.primary.main}20`,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                    transition: 'all 0.2s ease-in-out',
                  },
                },
                '& .MuiInputBase-input': {
                  padding: '10px 12px',
                  '&::placeholder': {
                    color: theme.palette.text.secondary,
                    opacity: 0.8,
                    fontStyle: 'italic',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon 
                      sx={{ 
                        fontSize: 18, 
                        color: searchQuery ? theme.palette.primary.main : theme.palette.text.secondary,
                        mr: 0.5,
                        transition: 'color 0.2s ease-in-out'
                      }} 
                    />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={clearSearch}
                      sx={{ 
                        padding: '4px',
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                          color: theme.palette.primary.main,
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      </Box>

      {/* Table */}
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{ 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'text.primary',
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    py: 2,
                    px: 3,
                    width: column.width,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  align="center"
                  sx={{ py: 6, color: 'text.secondary' }}
                >
                  <Typography variant="body1">
                    {searchable && searchQuery ? `No results found for "${searchQuery}"` : emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((row, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: theme.palette.action.hover,
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.primary.main + '08',
                      cursor: 'pointer'
                    },
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      sx={{
                        py: 2,
                        px: 3,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: '0.875rem'
                      }}
                    >
                      {column.render ? column.render(row[column.id], row) : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// Export utility components for use in other files
export { StatusIndicator, ProgressBar };
