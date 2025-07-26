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
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  PowerSettingsNew as PowerIcon,  
  BoltOutlined as BoltIcon,
  ThermostatOutlined as TempIcon 
} from '@mui/icons-material';
import { getPowerInformation, refreshPowerInformation, getILoStatus, type PowerInformation } from '../api';

const PowerCard: React.FC = () => {
  const [powerInfo, setPowerInfo] = useState<PowerInformation | null>(null);
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
      return status.configured;
    } catch (error) {
      console.error('Error checking iLO status:', error);
      return false;
    }
  };

  const fetchPowerInfo = async (isRefresh = false) => {
    console.log(`${isRefresh ? 'Refreshing' : 'Fetching'} power information...`);
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Check if iLO is configured
      const configured = await checkIloStatus();
      setIsIloConfigured(configured);
      
      if (!configured) {
        console.log('iLO not configured yet for power monitoring...');
        setPowerInfo(null);
        return false;
      }
      
      // Fetch power information
      const data = isRefresh 
        ? await refreshPowerInformation()
        : await getPowerInformation();
      
      setPowerInfo(data);
      console.log('Power info fetched successfully:', data);
      setRetryCount(0);
      return true;
      
    } catch (err) {
      console.error('Error fetching power information:', err);
      setError('Failed to fetch power information. Please check your iLO configuration.');
      setPowerInfo(null);
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and setup retry mechanism
  useEffect(() => {
    console.log('PowerCard mounted, starting initial fetch...');
    const attemptFetch = async () => {
      const success = await fetchPowerInfo();
      
      if (!success && !isIloConfigured) {
        setRetryCount(prev => prev + 1);
      }
    };

    attemptFetch();
  }, []);

  // Auto-retry mechanism when iLO is not configured
  useEffect(() => {
    if (!isIloConfigured && !powerInfo && !error && !loading && retryCount < 20) {
      const timeoutId = setTimeout(async () => {
        const success = await fetchPowerInfo();
        
        if (!success && !isIloConfigured) {
          setRetryCount(prev => prev + 1);
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    } else if (retryCount >= 20) {
      setError('Unable to connect to iLO for power monitoring. Please check configuration.');
    }
  }, [retryCount, isIloConfigured, powerInfo, error, loading]);

  // Auto-refresh every 10 seconds when configured
  useEffect(() => {
    if (!isIloConfigured || !powerInfo) return;

    const interval = setInterval(() => {
      fetchPowerInfo(true);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [isIloConfigured, powerInfo]);

  // Listen for setup completion events
  useEffect(() => {
    const handleSetupComplete = () => {
      setTimeout(() => {
        fetchPowerInfo();
      }, 2000);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'setupComplete' || e.key === 'authUser') {
        setTimeout(() => {
          fetchPowerInfo();
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
    setRetryCount(0);
    fetchPowerInfo(true);
  };

  // Calculate power meter percentage
  const getPowerPercentage = () => {
    if (!powerInfo) return 0;
    const { presentPower, minPower, maxPower } = powerInfo;
    const range = maxPower - minPower;
    return range > 0 ? ((presentPower - minPower) / range) * 100 : 0;
  };

  // Get power status color
  const getPowerStatusColor = () => {
    if (!powerInfo) return theme.palette.grey[400];
    const percentage = getPowerPercentage();
    if (percentage < 50) return theme.palette.success.main;
    if (percentage < 80) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const renderPowerMeter = () => {
    if (!powerInfo) return null;

    const percentage = getPowerPercentage();
    const statusColor = getPowerStatusColor();

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
            Present Power Usage
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: statusColor }}>
            {powerInfo.presentPower}W
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              backgroundColor: statusColor,
              borderRadius: 4,
            },
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Min: {powerInfo.minPower}W
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Max: {powerInfo.maxPower}W
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderPowerMetrics = () => {
    if (!powerInfo) return null;

    const metrics = [
      { label: 'Average Power', value: `${powerInfo.averagePower}W`, icon: <BoltIcon sx={{ fontSize: 16 }} /> },
      { label: 'Power Cap', value: powerInfo.powerCap > 0 ? `${powerInfo.powerCap}W` : 'No Limit', icon: <PowerIcon sx={{ fontSize: 16 }} /> },
      { label: 'Server Range', value: `${powerInfo.serverMinPower}W - ${powerInfo.serverMaxPower}W`, icon: <BoltIcon sx={{ fontSize: 16 }} /> },
      { label: 'PSU Capacity', value: `${powerInfo.powerSupplyCapacity}W`, icon: <PowerIcon sx={{ fontSize: 16 }} /> },
    ];

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
          {metrics.map((metric, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.grey[50],
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.palette.grey[200]}`,
              }}
            >
              <Box sx={{ color: 'primary.main' }}>
                {metric.icon}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {metric.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {metric.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        
        {/* Power Micro Version */}
        {powerInfo.powerMicroVersion && (
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.grey[50],
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.palette.grey[200]}`,
            textAlign: 'center'
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Power Micro Version
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {powerInfo.powerMicroVersion}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

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
              <PowerIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }}
              >
                Power Monitoring
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
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          border: `1px solid ${theme.palette.error.main}`,
          borderRadius: 3,
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
              <PowerIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }}
              >
                Power Monitoring
              </Typography>
            </Box>
            <Tooltip title="Refresh power information">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                size="small"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}10`
                  }
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Alert severity="error" sx={{ flex: 1 }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show waiting state when no data
  if (!powerInfo && !loading) {
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
              <PowerIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }}
              >
                Power Monitoring
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            flex: 1,
            gap: 2
          }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              Waiting for iLO configuration...
            </Typography>
            {retryCount > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Retry attempt {retryCount}/20
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Show power information
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
            <PowerIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1rem', sm: '1.125rem' }
              }}
            >
              Power Monitoring
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={powerInfo?.powerRegulation || 'N/A'}
              size="small"
              sx={{
                backgroundColor: `${getPowerStatusColor()}15`,
                color: getPowerStatusColor(),
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
            <Tooltip title="Refresh power information">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                size="small"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}10`
                  }
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {renderPowerMeter()}
        {renderPowerMetrics()}

        {/* Warning section if there are any power warnings */}
        {powerInfo?.warningType !== 'disabled' && (powerInfo?.warningThreshold || 0) > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}10` }}>
            <Typography variant="caption" sx={{ color: 'warning.main' }}>
              Power Warning: {powerInfo?.warningType} at {powerInfo?.warningThreshold}W
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PowerCard;
