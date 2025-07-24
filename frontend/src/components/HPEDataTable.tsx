import React from 'react';
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
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

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

// Trend indicator component
function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const theme = useTheme();
  
  const getTrendProps = () => {
    switch (trend) {
      case 'up':
        return { icon: TrendingUpIcon, color: theme.palette.error.main, label: 'Trending Up' };
      case 'down':
        return { icon: TrendingDownIcon, color: theme.palette.success.main, label: 'Trending Down' };
      case 'flat':
        return { icon: TrendingFlatIcon, color: theme.palette.text.secondary, label: 'Stable' };
      default:
        return { icon: TrendingFlatIcon, color: theme.palette.text.secondary, label: 'Unknown' };
    }
  };

  const { icon: Icon, color, label } = getTrendProps();

  return (
    <Tooltip title={label}>
      <Icon sx={{ fontSize: 16, color }} />
    </Tooltip>
  );
}

export default function HPEDataTable({ title, icon, columns, data, emptyMessage = 'No data available' }: HPEDataTableProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4 }}>
      {/* Table Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 3,
        px: 1
      }}>
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
          label={data.length} 
          size="small" 
          sx={{ 
            backgroundColor: theme.palette.primary.main + '15',
            color: theme.palette.primary.main,
            fontWeight: 600
          }} 
        />
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
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  align="center"
                  sx={{ py: 6, color: 'text.secondary' }}
                >
                  <Typography variant="body1">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
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
export { StatusIndicator, ProgressBar, TrendIndicator };
