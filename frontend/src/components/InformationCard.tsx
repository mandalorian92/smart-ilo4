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
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import { Refresh as RefreshIcon, Info as InfoIcon } from '@mui/icons-material';
import { getSystemInformation, refreshSystemInformation, getILoStatus, type SystemInformation } from '../api';

const InformationCard: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIloConfigured, setIsIloConfigured] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const checkIloStatus = async (): Promise<boolean> => {
    try {
      const status = await getILoStatus();
      console.log('iLO Status Check:', status);
      return status.configured;
    } catch (error) {
      console.error('Error checking iLO status:', error);
      return false;
    }
  };

  const fetchSystemInfo = async (isRefresh = false) => {
    console.log(`${isRefresh ? 'Refreshing' : 'Fetching'} system information...`);
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Check if iLO is configured
      console.log('Checking iLO status...');
      const configured = await checkIloStatus();
      console.log('iLO status result:', { configured });
      setIsIloConfigured(configured);
      
      if (!configured) {
        console.log('iLO not configured yet, will retry...');
        setSystemInfo(null);
        return false; // Return false to indicate not ready
      }
      
      // Fetch system information
      console.log('iLO configured, fetching system data...');
      const data = isRefresh 
        ? await refreshSystemInformation()
        : await getSystemInformation();
      
      setSystemInfo(data);
      console.log('System info fetched successfully:', data);
      console.log('Component state after fetch - systemInfo:', data, 'isIloConfigured:', configured);
      setRetryCount(0); // Reset retry count on success
      return true; // Return true to indicate success
      
    } catch (err) {
      console.error('Error fetching system information:', err);
      setError('Failed to fetch system information. Please check your iLO configuration.');
      setSystemInfo(null);
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('fetchSystemInfo finally block executed');
    }
  };

  // Initial fetch and setup retry mechanism
  useEffect(() => {
    console.log('InformationCard mounted, starting initial fetch...');
    const attemptFetch = async () => {
      const success = await fetchSystemInfo();
      console.log('Initial fetch result:', { success, isIloConfigured });
      
      if (!success && !isIloConfigured) {
        console.log('Initial fetch failed, iLO not configured. Setting up retry...');
        // If not configured, set up retry
        setRetryCount(prev => prev + 1);
      } else if (success) {
        console.log('Initial fetch successful!');
      }
    };

    attemptFetch();
  }, []);

  // Auto-retry mechanism when iLO is not configured
  useEffect(() => {
    console.log('Retry useEffect triggered with state:', {
      isIloConfigured,
      hasSystemInfo: !!systemInfo,
      hasError: !!error,
      loading,
      retryCount
    });

    // Only retry if we don't have system info, no error, and iLO is not configured
    // Also limit retries to prevent infinite loops
    if (!isIloConfigured && !systemInfo && !error && !loading && retryCount < 20) {
      console.log(`Setting up retry attempt #${retryCount + 1} in 3 seconds...`);
      
      const timeoutId = setTimeout(async () => {
        console.log(`Executing retry attempt #${retryCount + 1}`);
        const success = await fetchSystemInfo();
        
        if (!success && !isIloConfigured) {
          console.log('Retry failed, incrementing retry count');
          setRetryCount(prev => prev + 1);
        } else if (success) {
          console.log('Retry successful!');
        }
      }, 3000); // Retry every 3 seconds

      return () => {
        console.log('Clearing retry timeout');
        clearTimeout(timeoutId);
      };
    } else if (retryCount >= 20) {
      console.log('Maximum retry attempts reached, stopping auto-retry');
      setError('Unable to connect to iLO after multiple attempts. Please check configuration and try refreshing manually.');
    } else {
      console.log('Not setting up retry because conditions not met');
    }
  }, [retryCount, isIloConfigured, systemInfo, error, loading]);

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
    setRetryCount(0); // Reset retry count
    fetchSystemInfo(true);
  };

  // Debug logging
  console.log('InformationCard render state:', {
    loading,
    systemInfo: !!systemInfo,
    systemInfoData: systemInfo,
    error: !!error,
    errorMessage: error,
    isIloConfigured,
    retryCount
  });

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
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 8px 24px ${theme.palette.primary.main}15`
          }
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }}
              >
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

  // Show waiting state when no data and no error
  if (!systemInfo && !error && !loading) {
    return (
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }}
              >
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
          
          <Alert 
            severity="info" 
            sx={{ borderRadius: 2 }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            }
          >
            Waiting for iLO configuration... (Attempt #{retryCount + 1})
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }}
              >
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
          
          <Alert 
            severity="error" 
            sx={{ borderRadius: 2 }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render success state with system information
  console.log('Rendering success state with systemInfo:', systemInfo);

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 8px 24px ${theme.palette.primary.main}15`
        }
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header Section - Content Layout */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1rem', sm: '1.125rem' }
              }}
            >
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
          {systemInfo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {renderInfoRow('Model', systemInfo.model)}
              {renderInfoRow('Serial Number', systemInfo.serialNumber)}
              {renderInfoRow('iLO Generation', systemInfo.iloGeneration)}
              {renderInfoRow('System ROM', systemInfo.systemRom)}
              {renderInfoRow('iLO Firmware', systemInfo.iloFirmware)}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default InformationCard;
