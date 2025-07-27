import React, { useEffect, useState, useMemo, useCallback } from "react";
import { getSensors, getFans } from "../api";
import { 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Box,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Grid,
  LinearProgress,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { searchInRow } from '../utils/searchUtils';
import DataTable, { StatusIndicator, ProgressBar } from './DataTable';
import { SPACING } from '../constants/spacing';

// Circular progress component for gauges (memoized for performance)
const CircularGauge = React.memo((props: {
  value: number;
  maxValue: number;
  size?: number;
  thickness?: number;
  color: string;
  label: string;
  unit: string;
  showValue?: boolean;
}) => {
  const { 
    value, 
    maxValue, 
    size = 120, 
    thickness = 8, 
    color, 
    label, 
    unit,
    showValue = true 
  } = props;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        position: 'relative', 
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={thickness}
        sx={{
          color: theme.palette.grey[300],
          position: 'absolute'
        }}
      />
      <CircularProgress
        variant="determinate"
        value={percentage}
        size={size}
        thickness={thickness}
        sx={{
          color: color,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {showValue && (
          <>
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', sm: '1.1rem' },
                color: theme.palette.text.primary
              }}
            >
              {value}{unit}
            </Typography>
            <Typography
              variant="caption"
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                textAlign: 'center',
                lineHeight: 1
              }}
            >
              {label}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
});

// Temperature card component following design guidelines (memoized for performance)
const TemperatureCard = React.memo((props: { 
  sensor: any; 
  showFahrenheit: boolean;
}) => {
  const { sensor, showFahrenheit } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Memoize temperature calculations to prevent recalculation on every render
  const tempData = useMemo(() => {
    const convertTemperature = (celsius: number) => {
      return showFahrenheit ? Math.round((celsius * 9/5) + 32) : celsius;
    };
    
    const reading = convertTemperature(sensor.reading);
    const critical = sensor.critical ? convertTemperature(sensor.critical) : 100;
    const maxTemp = showFahrenheit ? 200 : 100;
    
    let status: 'ok' | 'warning' | 'error' = 'ok';
    let gaugeColor = theme.palette.success.main;
    
    if (sensor.critical && reading >= critical) {
      status = 'error';
      gaugeColor = theme.palette.error.main;
    } else if (sensor.critical && reading >= (critical - (showFahrenheit ? 27 : 15))) {
      status = 'warning';
      gaugeColor = theme.palette.warning.main;
    }
    
    return { reading, critical, maxTemp, status, gaugeColor };
  }, [sensor.reading, sensor.critical, showFahrenheit, theme.palette]);

  const getTemperatureUnit = () => showFahrenheit ? '°F' : '°C';
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        '&:hover': {
          elevation: 2,
          transform: 'translateY(-4px)',
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
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              component="h3"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontWeight: 600,
                mb: 0.5,
                lineHeight: 1.3,
                color: 'text.primary'
              }}
            >
              {sensor.name}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              {sensor.context === 'CPU' ? 'CPU Sensor' : 
               sensor.context === 'Intake' ? 'Ambient Temperature' :
               sensor.context === 'SystemBoard' ? 'System Board' :
               sensor.context === 'PowerSupply' ? 'Power Supply' :
               sensor.context || 'System Sensor'}
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            flexShrink: 0
          }}>
            <StatusIndicator status={tempData.status} size="medium" />
          </Box>
        </Box>
        
        {/* Gauge Section - Centered Content */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flex: 1,
          py: 2
        }}>
          <CircularGauge
            value={tempData.reading}
            maxValue={tempData.maxTemp}
            size={isMobile ? 100 : 120}
            thickness={8}
            color={tempData.gaugeColor}
            label="Current"
            unit={getTemperatureUnit()}
          />
        </Box>
        
        {/* Footer Section - Content Layout */}
        {sensor.critical && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 2,
            mt: 'auto',
            borderTop: `1px solid ${theme.palette.divider}`
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500
              }}
            >
              Critical Threshold
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.error.main,
                fontSize: '0.875rem'
              }}
            >
              {tempData.critical}{getTemperatureUnit()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// Fan card component following design guidelines (memoized for performance)
const FanCard = React.memo((props: { fan: any }) => {
  const { fan } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Memoize fan calculations to prevent recalculation on every render
  const fanData = useMemo(() => {
    let status: 'ok' | 'warning' | 'error' | 'offline' = 'ok';
    let gaugeColor = theme.palette.success.main;
    
    if (fan.status === 'Absent') {
      status = 'offline';
      gaugeColor = theme.palette.text.disabled;
    } else if (fan.health !== 'OK' || fan.status !== 'Enabled') {
      status = 'warning';
      gaugeColor = theme.palette.warning.main;
    } else if (fan.speed >= 85) {
      status = 'warning';
      gaugeColor = theme.palette.warning.main;
    }
    
    const rpm = Math.round((fan.speed / 100) * 6000); // Estimated RPM
    
    return { status, gaugeColor, rpm };
  }, [fan.speed, fan.health, fan.status, theme.palette]);
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        '&:hover': {
          elevation: 2,
          transform: 'translateY(-4px)',
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
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              component="h3"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontWeight: 600,
                mb: 0.5,
                lineHeight: 1.3,
                color: 'text.primary'
              }}
            >
              {fan.name}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              System Cooling Fan
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            flexShrink: 0
          }}>
            <StatusIndicator status={fanData.status} size="medium" />
          </Box>
        </Box>
        
        {/* Gauge Section - Centered Content */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flex: 1,
          py: 2
        }}>
          <CircularGauge
            value={fan.speed}
            maxValue={100}
            size={isMobile ? 100 : 120}
            thickness={8}
            color={fanData.gaugeColor}
            label="Speed"
            unit="%"
          />
        </Box>
        
        {/* Footer Section - Content Layout */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          pt: 2,
          mt: 'auto',
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}
          >
            Current RPM
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '0.875rem'
            }}
          >
            {fanData.rpm.toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

function Dashboard() {
  // Use system-wide spacing constants for consistency across all tabs
  
  const [sensors, setSensors] = useState<any[]>([]);
  const [fans, setFans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFahrenheit, setShowFahrenheit] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Memoize the fetch function to prevent unnecessary recreations
  const fetchData = useCallback(async () => {
    try {
      const [sensorsData, fansData] = await Promise.all([getSensors(), getFans()]);
      setSensors(sensorsData);
      setFans(fansData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      // Don't show loading on updates, just update data silently
      fetchData();
    }, 30000); // Update every 30 seconds for responsive UI
    return () => clearInterval(interval);
  }, [fetchData]);

  const convertTemperature = useCallback((celsius: number) => {
    return showFahrenheit ? Math.round((celsius * 9/5) + 32) : celsius;
  }, [showFahrenheit]);

  const getTemperatureUnit = useCallback(() => showFahrenheit ? '°F' : '°C', [showFahrenheit]);

  // Memoize filtered data to prevent recalculation on every render
  const filteredData = useMemo(() => {
    const filteredFans = searchQuery.trim() 
      ? fans.filter(row => searchInRow(row, searchQuery, [{ id: 'name' }, { id: 'status' }, { id: 'health' }, { id: 'speed' }]))
      : fans;
      
    const filteredSensors = searchQuery.trim()
      ? sensors.filter(sensor => sensor.reading > 0).filter(row => searchInRow(row, searchQuery, [{ id: 'name' }, { id: 'context' }, { id: 'reading' }, { id: 'critical' }]))
      : sensors.filter(sensor => sensor.reading > 0);
      
    return { filteredFans, filteredSensors };
  }, [fans, sensors, searchQuery]);

  // Memoize event handlers
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleTemperatureUnitToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setShowFahrenheit(event.target.checked);
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Calculate system health overview
  const getSystemHealthStats = () => {
    const tempSensors = sensors.filter(s => s.reading > 0);
    const activeFans = fans.filter(f => f.status !== 'Absent');
    
    const criticalTemps = tempSensors.filter(s => s.critical && s.reading >= s.critical).length;
    const warningTemps = tempSensors.filter(s => s.critical && s.reading >= (s.critical - 15)).length - criticalTemps;
    const highSpeedFans = activeFans.filter(f => f.speed >= 85).length;
    const failedFans = activeFans.filter(f => f.health !== 'OK').length;
    
    const totalIssues = criticalTemps + failedFans;
    const totalWarnings = warningTemps + highSpeedFans;
    const totalHealthy = (tempSensors.length - criticalTemps - warningTemps) + (activeFans.length - failedFans - highSpeedFans);
    
    return {
      critical: totalIssues,
      warning: totalWarnings,
      healthy: totalHealthy,
      total: tempSensors.length + activeFans.length
    };
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  const healthStats = getSystemHealthStats();
  const healthPercentage = healthStats.total > 0 ? (healthStats.healthy / healthStats.total) * 100 : 100;

  return (
    <Box component="section" role="main" aria-label="System Monitoring Dashboard">
      {/* Centralized Search Box */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        mb: SPACING.ROW
      }}>
        <Box sx={{ width: { xs: '100%', sm: '400px', md: '350px' }, maxWidth: 400 }}>
          <TextField
            type="search"
            size="small"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="search"
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.background.paper,
                borderRadius: '24px',
                fontSize: '0.875rem',
                height: '36px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.grey[400],
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 1,
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.grey[300],
                  transition: 'border-color 0.2s ease-in-out',
                },
              },
              '& .MuiInputBase-input': {
                padding: '8px 16px',
                textAlign: 'left',
                fontSize: '0.875rem',
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 0.7,
                  fontStyle: 'normal',
                },
                // Hide the default search input clear button on webkit browsers
                '&::-webkit-search-cancel-button': {
                  display: 'none',
                },
                '&::-webkit-search-decoration': {
                  display: 'none',
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  {searchQuery ? (
                    <IconButton
                      size="small"
                      onClick={handleSearchClear}
                      aria-label="clear search"
                      sx={{ 
                        padding: '2px',
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                          color: theme.palette.text.primary,
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  ) : (
                    <SearchIcon 
                      sx={{ 
                        fontSize: 18, 
                        color: theme.palette.text.secondary,
                        transition: 'color 0.2s ease-in-out'
                      }} 
                    />
                  )}
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* Fan Controllers - Now shown first */}
            <DataTable
        title="Fan Controllers"
        icon={<AirIcon sx={{ color: theme.palette.primary.main }} />}
        originalDataLength={fans.length}
        headerActions={
          <FormControlLabel
            control={
              <Switch 
                checked={showFahrenheit} 
                onChange={handleTemperatureUnitToggle}
                size={isMobile ? "small" : "medium"}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {isMobile ? "°F" : "Show in Fahrenheit"}
              </Typography>
            }
            sx={{ m: 0 }}
          />
        }
        columns={[
          {
            id: 'name',
            label: 'Fan Name',
            width: '25%',
            render: (value, row) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {value}
                </Typography>
              </Box>
            )
          },
          {
            id: 'status',
            label: 'Status',
            width: '15%',
            align: 'center',
            render: (value, row) => {
              let status: 'ok' | 'warning' | 'error' | 'offline' = 'ok';
              if (row.status === 'Absent') status = 'offline';
              else if (row.health !== 'OK' || row.status !== 'Enabled') status = 'warning';
              else if (row.speed >= 85) status = 'warning';
              
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <StatusIndicator status={status} />
                  <Chip 
                    label={row.status} 
                    size="small" 
                    color={status === 'ok' ? 'success' : status === 'warning' ? 'warning' : 'error'}
                    variant="outlined"
                  />
                </Box>
              );
            }
          },
          {
            id: 'speed',
            label: 'Speed',
            width: '20%',
            render: (value, row) => (
              <ProgressBar value={value} maxValue={100} />
            )
          },
          {
            id: 'rpm',
            label: 'RPM',
            width: '15%',
            align: 'center',
            render: (value, row) => {
              const rpm = Math.round((row.speed / 100) * 6000);
              return (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {rpm.toLocaleString()}
                </Typography>
              );
            }
          },
          {
            id: 'health',
            label: 'Health',
            width: '15%',
            align: 'center',
            render: (value, row) => (
              <Chip 
                label={value} 
                size="small" 
                color={value === 'OK' ? 'success' : 'error'}
                sx={{ fontWeight: 500 }}
              />
            )
          }
        ]}
        data={filteredData.filteredFans}
        emptyMessage={searchQuery ? `No fan controllers found for "${searchQuery}"` : "No fan controllers detected"}
      />

      {/* Temperature Sensors - Now shown second */}
      <DataTable
        title="Temperature Sensors"
        icon={<ThermostatIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'primary.main' }} />}
        originalDataLength={sensors.filter(sensor => sensor.reading > 0).length}
        columns={[
          {
            id: 'name',
            label: 'Sensor Name',
            width: '25%',
            render: (value, row) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.context === 'CPU' ? 'CPU Sensor' : 
                   row.context === 'Intake' ? 'Ambient Temperature' :
                   row.context === 'SystemBoard' ? 'System Board' :
                   row.context === 'PowerSupply' ? 'Power Supply' :
                   row.context || 'System Sensor'}
                </Typography>
              </Box>
            )
          },
          {
            id: 'status',
            label: 'Status',
            width: '15%',
            align: 'center',
            render: (value, row) => {
              const reading = showFahrenheit ? Math.round((row.reading * 9/5) + 32) : row.reading;
              const critical = row.critical ? (showFahrenheit ? Math.round((row.critical * 9/5) + 32) : row.critical) : null;
              
              let status: 'ok' | 'warning' | 'error' = 'ok';
              if (critical && reading >= critical) status = 'error';
              else if (critical && reading >= (critical - (showFahrenheit ? 27 : 15))) status = 'warning';
              
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <StatusIndicator status={status} />
                  <Chip 
                    label={status === 'ok' ? 'Normal' : status === 'warning' ? 'Warning' : 'Critical'} 
                    size="small" 
                    color={status === 'ok' ? 'success' : status === 'warning' ? 'warning' : 'error'}
                    variant="outlined"
                  />
                </Box>
              );
            }
          },
          {
            id: 'reading',
            label: 'Current Temp',
            width: '20%',
            align: 'center',
            render: (value, row) => {
              const temp = convertTemperature(value);
              const critical = row.critical ? convertTemperature(row.critical) : 100;
              const maxTemp = showFahrenheit ? 200 : 100;
              
              let color;
              if (row.critical && temp >= critical) color = 'error.main';
              else if (row.critical && temp >= (critical - (showFahrenheit ? 27 : 15))) color = 'warning.main';
              else color = 'success.main';
              
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color }}>
                    {temp}{getTemperatureUnit()}
                  </Typography>
                  <ProgressBar 
                    value={temp} 
                    maxValue={maxTemp} 
                    color={color}
                    showValue={false}
                  />
                </Box>
              );
            }
          },
          {
            id: 'critical',
            label: 'Critical Temp',
            width: '15%',
            align: 'center',
            render: (value, row) => {
              if (!value) return <Typography variant="body2" color="text.secondary">-</Typography>;
              const criticalTemp = convertTemperature(value);
              return (
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>
                  {criticalTemp}{getTemperatureUnit()}
                </Typography>
              );
            }
          },
          {
            id: 'context',
            label: 'Location',
            width: '15%',
            align: 'center',
            render: (value, row) => (
              <Chip 
                label={value || 'System'} 
                size="small" 
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            )
          }
        ]}
        data={filteredData.filteredSensors}
        emptyMessage={searchQuery ? `No temperature sensors found for "${searchQuery}"` : "No temperature sensors detected"}
      />
    </Box>
  );
}

export default Dashboard;