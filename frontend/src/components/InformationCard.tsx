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
import { getSystemInformation, refreshSystemInformation, type SystemInformation } from '../api';

const InformationCard: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchSystemInfo = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const data = isRefresh 
        ? await refreshSystemInformation()
        : await getSystemInformation();
      
      setSystemInfo(data);
    } catch (err) {
      console.error('Error fetching system information:', err);
      setError('Failed to fetch system information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemInfo();
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
          
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
