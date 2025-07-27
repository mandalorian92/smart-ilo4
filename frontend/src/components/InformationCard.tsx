import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  useTheme
} from '@mui/material';
import { Refresh as RefreshIcon, Info as InfoIcon } from '@mui/icons-material';
import { getSystemInformation, refreshSystemInformation, type SystemInformation } from '../api';
import { CARD_STYLES, getGridCardContainerProps } from '../constants/cardStyles';

const InformationCard: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const theme = useTheme();

  const fetchSystemInfo = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log(`${isRefresh ? 'Refreshing' : 'Fetching'} system information...`);
      
      const data = isRefresh 
        ? await refreshSystemInformation()
        : await getSystemInformation();
      
      setSystemInfo(data);
      console.log('System info fetched successfully:', data);
      
    } catch (err) {
      console.error('Error fetching system information:', err);
      const errorMessage = (err as any)?.message || 'Failed to fetch system information. Please check your iLO configuration.';
      setError(errorMessage);
      setSystemInfo(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSystemInfo();
  }, []);

  // Listen for setup completion events
  useEffect(() => {
    const handleSetupComplete = () => {
      console.log('Setup completion event received, fetching system info...');
      setTimeout(() => {
        fetchSystemInfo();
      }, 2000); // Give setup time to complete
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'setupComplete' || e.key === 'authUser') {
        console.log('Setup-related storage change detected');
        setTimeout(() => {
          fetchSystemInfo();
        }, 2000);
      }
    };

    window.addEventListener('setupComplete', handleSetupComplete);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('setupComplete', handleSetupComplete);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleRefresh = () => {
    fetchSystemInfo(true);
  };

  const renderInfoRow = (label: string, value: string) => (
    <Box
      key={label}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        py: 1.5,
        '&:not(:last-child)': {
          borderBottom: `1px solid ${theme.palette.divider}10`
        }
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          color: 'text.secondary',
          minWidth: { xs: '45%', sm: '40%' },
          mr: 2
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 400,
          color: 'text.primary',
          textAlign: 'right',
          flex: 1,
          wordBreak: 'break-word'
        }}
      >
        {value}
      </Typography>
    </Box>
  );

  // Show loading state
  if (loading) {
    return (
      <Card {...getGridCardContainerProps(theme)}>
        <CardContent {...CARD_STYLES.CONTENT}>
          <Box {...CARD_STYLES.HEADER}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon {...CARD_STYLES.HEADER_ICON} />
              <Typography {...CARD_STYLES.TITLE}>
                Information
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flex: 1 
          }}>
            <CircularProgress size={40} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card {...getGridCardContainerProps(theme)}>
        <CardContent {...CARD_STYLES.CONTENT}>
          <Box {...CARD_STYLES.HEADER}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon {...CARD_STYLES.HEADER_ICON} />
              <Typography {...CARD_STYLES.TITLE}>
                Information
              </Typography>
            </Box>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                {...CARD_STYLES.REFRESH_BUTTON}
              >
                {refreshing ? <CircularProgress size={16} /> : <RefreshIcon {...CARD_STYLES.REFRESH_ICON} />}
              </IconButton>
            </Tooltip>
          </Box>
          
          <Alert 
            severity="error" 
            sx={{ borderRadius: 2 }}
            action={
              <IconButton
                color="inherit"
                onClick={handleRefresh}
                disabled={refreshing}
                {...CARD_STYLES.REFRESH_BUTTON}
              >
                {refreshing ? <CircularProgress size={16} /> : <RefreshIcon {...CARD_STYLES.REFRESH_ICON} />}
              </IconButton>
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show success state with system information
  return (
    <Card {...getGridCardContainerProps(theme)}>
      <CardContent {...CARD_STYLES.CONTENT}>
        {/* Header Section */}
        <Box {...CARD_STYLES.HEADER}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon {...CARD_STYLES.HEADER_ICON} />
            <Typography {...CARD_STYLES.TITLE}>
              Information
            </Typography>
          </Box>
          
          <Tooltip title="Refresh">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Information Section */}
        <Box sx={{ flex: 1 }}>
          {systemInfo ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {renderInfoRow('Model', systemInfo.model || 'N/A')}
              {renderInfoRow('Serial Number', systemInfo.serialNumber || 'N/A')}
              {renderInfoRow('iLO Generation', systemInfo.iloGeneration || 'N/A')}
              {renderInfoRow('System ROM', systemInfo.systemRom || 'N/A')}
              {renderInfoRow('iLO Firmware', systemInfo.iloFirmware || 'N/A')}
            </Box>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No system information available. This is normal during initial setup.
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default InformationCard;
