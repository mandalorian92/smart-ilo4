import React, { useState, useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  Typography, 
  Paper,
  useTheme,
  Box,
  IconButton,
  Tooltip,
  CircularProgress
} from "@mui/material";
import { 
  Refresh as RefreshIcon,
  Clear as ClearIcon 
} from "@mui/icons-material";
import { getRecentBackendLogs, clearBackendLogs, LogEntry } from "../api";
import { useNotifications } from './NotificationProvider';
import { CARD_STYLES, getCardContainerProps } from '../constants/cardStyles';
import { SPACING } from '../constants/spacing';

function Terminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const { showNotification } = useNotifications();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async (showRefreshState = false) => {
    try {
      if (showRefreshState) setRefreshing(true);
      
      const backendLogs = await getRecentBackendLogs(100); // Get last 100 logs
      setLogs(backendLogs);
      
      if (showRefreshState) {
        showNotification('success', 'Logs refreshed');
      }
    } catch (error) {
      console.error('Failed to fetch backend logs:', error);
      if (showRefreshState) {
        showNotification('error', 'Failed to refresh logs');
      }
    } finally {
      setLoading(false);
      if (showRefreshState) setRefreshing(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await clearBackendLogs();
      setLogs([]);
      showNotification('success', 'Logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
      showNotification('error', 'Failed to clear logs');
    }
  };

  const handleRefresh = () => {
    fetchLogs(true);
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchLogs();
    
    const interval = setInterval(() => {
      fetchLogs();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return theme.palette.error.main;
      case 'warn':
        return theme.palette.warning.main;
      case 'info':
      default:
        return theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark;
    }
  };

  const getLogPrefix = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return '[ERROR]';
      case 'warn':
        return '[WARN] ';
      case 'info':
      default:
        return '[INFO] ';
    }
  };

  return (
    <Card {...getCardContainerProps(theme)}>
      <CardContent {...CARD_STYLES.CONTENT}>
        {/* Header */}
        <Box {...CARD_STYLES.HEADER}>
          <Box>
            <Typography 
              {...CARD_STYLES.TITLE}
              component="h2"
            >
              Terminal
            </Typography>
            <Typography 
              {...CARD_STYLES.SUBTITLE}
            >
              Real-time backend application logs and system messages
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: SPACING.COMPONENT.SMALL }}>
            <Tooltip title="Clear logs">
              <IconButton
                onClick={handleClearLogs}
                disabled={loading}
                {...CARD_STYLES.REFRESH_BUTTON}
              >
                <ClearIcon {...CARD_STYLES.REFRESH_ICON} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh logs">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing || loading}
                {...CARD_STYLES.REFRESH_BUTTON}
              >
                {refreshing ? <CircularProgress size={16} /> : <RefreshIcon {...CARD_STYLES.REFRESH_ICON} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Terminal Content */}
        <Paper 
          ref={scrollRef}
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
            p: 2, 
            height: { xs: 300, sm: 400, md: 500 }, 
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            border: `1px solid ${theme.palette.divider}`,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.divider,
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: theme.palette.action.hover,
            }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Typography sx={{ 
              color: theme.palette.text.secondary, 
              fontFamily: 'monospace',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontStyle: 'italic'
            }}>
              No logs available. Logs will appear here as the backend application runs.
            </Typography>
          ) : (
            logs.map((log, index) => (
              <Typography 
                key={`${log.timestamp}-${index}`}
                sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  color: getLogColor(log.level),
                  mb: 0.25,
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                <Box component="span" sx={{ color: theme.palette.text.secondary, opacity: 0.7 }}>
                  {formatTimestamp(log.timestamp)}
                </Box>
                {' '}
                <Box component="span" sx={{ fontWeight: 'bold' }}>
                  {getLogPrefix(log.level)}
                </Box>
                {log.message}
              </Typography>
            ))
          )}
        </Paper>
      </CardContent>
    </Card>
  );
}

export default Terminal;
