import React, { useEffect, useState, useCallback } from "react";
import { getRecentSystemLogs, SystemLogRecord } from "../api";
import { 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Button
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import { useNotifications } from './NotificationProvider';
import { CARD_STYLES } from '../constants/cardStyles';

// Activity item component following HPE design patterns
interface ActivityItemProps {
  record: SystemLogRecord;
  theme: any;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ record, theme }) => {
  // Get status icon and color based on severity
  const getStatusIcon = () => {
    switch (record.severity) {
      case 'Critical':
        return <ErrorIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />;
      case 'Caution':
        return <WarningIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />;
      case 'OK':
        return <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />;
      case 'Informational':
      default:
        return <InfoIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />;
    }
  };

  const getSeverityColor = () => {
    switch (record.severity) {
      case 'Critical':
        return theme.palette.error.main;
      case 'Caution':
        return theme.palette.warning.main;
      case 'OK':
        return theme.palette.success.main;
      case 'Informational':
      default:
        return theme.palette.info.main;
    }
  };

  // Format timestamp
  const formatTimestamp = () => {
    try {
      // Convert the date/time format from iLO to a proper Date
      const dateTime = new Date(`${record.date} ${record.time}`);
      if (isNaN(dateTime.getTime())) {
        return `${record.date} ${record.time}`;
      }
      return dateTime.toLocaleString();
    } catch {
      return `${record.date} ${record.time}`;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        py: 2,
        px: 1,
        borderRadius: 1,
        transition: 'background-color 0.2s ease',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.02)' 
            : 'rgba(0, 0, 0, 0.02)'
        },
        '&:not(:last-child)': {
          borderBottom: `1px solid ${theme.palette.divider}20`
        }
      }}
    >
      {/* Status Icon */}
      <Box sx={{ mt: 0.5 }}>
        {getStatusIcon()}
      </Box>
      
      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              flex: 1,
              lineHeight: 1.4
            }}
          >
            {record.description}
          </Typography>
          <Chip
            label={record.severity}
            size="small"
            sx={{
              fontSize: '0.7rem',
              height: 20,
              backgroundColor: `${getSeverityColor()}15`,
              color: getSeverityColor(),
              fontWeight: 500,
              flexShrink: 0
            }}
          />
        </Box>
        
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem'
          }}
        >
          {formatTimestamp()}
        </Typography>
      </Box>
    </Box>
  );
};

const RecentActivity: React.FC = () => {
  const [logs, setLogs] = useState<SystemLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotifications();

  const fetchLogs = useCallback(async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const systemLogs = await getRecentSystemLogs();
      // Ensure we always have an array
      setLogs(Array.isArray(systemLogs) ? systemLogs : []);
      
      if (showRefreshingState) {
        showNotification('success', 'Recent activity refreshed');
      }
    } catch (error: any) {
      console.error('Error fetching recent activity:', error);
      const errorMessage = error.message || 'Failed to fetch recent activity';
      setError(errorMessage);
      // Set logs to empty array on error
      setLogs([]);
      
      if (showRefreshingState) {
        showNotification('error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchLogs();
    
    // Set up auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchLogs(true); // Show refreshing state for auto-refresh
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleManualRefresh = () => {
    fetchLogs(true);
  };

  // Loading state
  if (loading) {
    return (
      <Card
        variant="outlined"
        sx={{
          height: '450px', // Match HistoryChart height
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardContent sx={{ 
          p: { xs: 2, sm: 3 }, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card
        variant="outlined"
        sx={{
          height: '450px', // Match HistoryChart height
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardContent sx={{ 
          p: { xs: 2, sm: 3 }, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }}
              >
                Recent Activity
              </Typography>
            </Box>
            <Tooltip title="Refresh activity">
              <IconButton
                onClick={handleManualRefresh}
                disabled={refreshing}
                size="small"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}10`
                  }
                }}
              >
                {refreshing ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Error message */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            gap: 2
          }}>
            <ErrorIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.5 }} />
            <Typography variant="body2" color="error">
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              Try Again
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        height: '450px', // Match HistoryChart height
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 4px 12px ${theme.palette.primary.main}15`
        }
      }}
    >
      <CardContent sx={{ 
        p: { xs: 2, sm: 3 }, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1rem', sm: '1.125rem' }
              }}
            >
              Recent Activity
            </Typography>
          </Box>
          <Tooltip title="Refresh activity">
            <IconButton
              onClick={handleManualRefresh}
              disabled={refreshing}
              size="small"
              sx={{
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}10`
                }
              }}
            >
              {refreshing ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {Array.isArray(logs) && logs.length > 0 ? (
            <Stack spacing={0}>
              {logs.map((record, index) => (
                <ActivityItem 
                  key={`${record.number}-${index}`} 
                  record={record} 
                  theme={theme}
                />
              ))}
            </Stack>
          ) : (
            <Box sx={CARD_STYLES.EMPTY_STATE.sx}>
              <HistoryIcon sx={CARD_STYLES.EMPTY_STATE_ICON.sx} />
              <Typography variant={CARD_STYLES.EMPTY_STATE_TEXT.variant} sx={CARD_STYLES.EMPTY_STATE_TEXT.sx}>
                No recent activity found
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
