import React, { useEffect, useState } from "react";
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
  Tooltip
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import RefreshIcon from '@mui/icons-material/Refresh';

// Circular progress component for gauges
function CircularGauge({ 
  value, 
  maxValue, 
  size = 120, 
  thickness = 8, 
  color, 
  label, 
  unit,
  showValue = true 
}: {
  value: number;
  maxValue: number;
  size?: number;
  thickness?: number;
  color: string;
  label: string;
  unit: string;
  showValue?: boolean;
}) {
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
}

// Status indicator component
function StatusIndicator({ status, size = 'small' }: { status: 'ok' | 'warning' | 'error' | 'offline', size?: 'small' | 'medium' }) {
  const theme = useTheme();
  const iconSize = size === 'small' ? 16 : 20;
  
  const statusConfig = {
    ok: { icon: CheckCircleIcon, color: theme.palette.success.main },
    warning: { icon: WarningIcon, color: theme.palette.warning.main },
    error: { icon: ErrorIcon, color: theme.palette.error.main },
    offline: { icon: ErrorIcon, color: theme.palette.text.disabled }
  };
  
  const { icon: Icon, color } = statusConfig[status];
  
  return <Icon sx={{ color, fontSize: iconSize }} />;
}

// Temperature card component following design guidelines
function TemperatureCard({ 
  sensor, 
  showFahrenheit 
}: { 
  sensor: any; 
  showFahrenheit: boolean;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const convertTemperature = (celsius: number) => {
    return showFahrenheit ? Math.round((celsius * 9/5) + 32) : celsius;
  };
  
  const getTemperatureUnit = () => showFahrenheit ? '°F' : '°C';
  
  const reading = convertTemperature(sensor.reading);
  const critical = sensor.critical ? convertTemperature(sensor.critical) : 100;
  const maxTemp = showFahrenheit ? 200 : 100;
  
  // Determine status and color
  let status: 'ok' | 'warning' | 'error' = 'ok';
  let gaugeColor = theme.palette.success.main;
  
  if (sensor.critical && reading >= critical) {
    status = 'error';
    gaugeColor = theme.palette.error.main;
  } else if (sensor.critical && reading >= (critical - (showFahrenheit ? 27 : 15))) {
    status = 'warning';  
    gaugeColor = theme.palette.warning.main;
  }
  
  // Simulate trend (in real implementation, this would come from historical data)
  const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'flat';
  const TrendIcon = trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : TrendingFlatIcon;
  
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
            <StatusIndicator status={status} size="medium" />
            <TrendIcon 
              sx={{ 
                fontSize: 20, 
                color: trend === 'up' ? theme.palette.error.main : 
                       trend === 'down' ? theme.palette.success.main : 
                       theme.palette.text.secondary 
              }} 
            />
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
            value={reading}
            maxValue={maxTemp}
            size={isMobile ? 100 : 120}
            thickness={8}
            color={gaugeColor}
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
              {convertTemperature(sensor.critical)}{getTemperatureUnit()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Fan card component following design guidelines  
function FanCard({ fan }: { fan: any }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Determine status and color
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
  
  // Simulate trend and RPM (in real implementation, this would come from historical data)
  const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'flat';
  const TrendIcon = trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : TrendingFlatIcon;
  const rpm = Math.round((fan.speed / 100) * 6000); // Estimated RPM
  
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
            <StatusIndicator status={status} size="medium" />
            <TrendIcon 
              sx={{ 
                fontSize: 20, 
                color: trend === 'up' ? theme.palette.warning.main : 
                       trend === 'down' ? theme.palette.success.main : 
                       theme.palette.text.secondary 
              }} 
            />
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
            color={gaugeColor}
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
            {rpm.toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [fans, setFans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFahrenheit, setShowFahrenheit] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      // Don't show loading on updates, just update data silently
      fetchData();
    }, 5000); // Update every 5 seconds for faster updates
    return () => clearInterval(interval);
  }, []);

  const convertTemperature = (celsius: number) => {
    return showFahrenheit ? Math.round((celsius * 9/5) + 32) : celsius;
  };

  const getTemperatureUnit = () => showFahrenheit ? '°F' : '°C';

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
      {/* Dashboard Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 600,
              mb: 0.5
            }}
          >
            System Monitoring
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            Last updated: {lastUpdate.toLocaleTimeString()}
            <Tooltip title="Refresh data">
              <IconButton 
                size="small" 
                onClick={fetchData}
                sx={{ ml: 1 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
        </Box>
        
        <FormControlLabel
          control={
            <Switch 
              checked={showFahrenheit} 
              onChange={(e) => setShowFahrenheit(e.target.checked)}
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
      </Box>

      {/* System Health Overview */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card 
            elevation={2}
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}05)`
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.3rem' },
                  fontWeight: 600,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <SpeedIcon /> System Health Overview
              </Typography>
              
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={5}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    py: 2
                  }}>
                    <CircularGauge
                      value={Math.round(healthPercentage)}
                      maxValue={100}
                      size={isMobile ? 120 : 140}
                      thickness={4}
                      color={
                        healthPercentage >= 90 ? theme.palette.success.main :
                        healthPercentage >= 70 ? theme.palette.warning.main :
                        theme.palette.error.main
                      }
                      label="System Health"
                      unit="%"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={7}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          border: `2px solid ${theme.palette.success.main}`,
                          backgroundColor: `${theme.palette.success.main}08`,
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: `${theme.palette.success.main}12`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${theme.palette.success.main}25`
                          }
                        }}
                      >
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            color: theme.palette.success.main,
                            fontWeight: 'bold',
                            fontSize: { xs: '2rem', sm: '2.5rem' },
                            mb: 1
                          }}
                        >
                          {healthStats.healthy}
                        </Typography>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 500,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}
                        >
                          Healthy
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          border: `2px solid ${theme.palette.warning.main}`,
                          backgroundColor: `${theme.palette.warning.main}08`,
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: `${theme.palette.warning.main}12`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${theme.palette.warning.main}25`
                          }
                        }}
                      >
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            color: theme.palette.warning.main,
                            fontWeight: 'bold',
                            fontSize: { xs: '2rem', sm: '2.5rem' },
                            mb: 1
                          }}
                        >
                          {healthStats.warning}
                        </Typography>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 500,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}
                        >
                          Warning
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          border: `2px solid ${theme.palette.error.main}`,
                          backgroundColor: `${theme.palette.error.main}08`,
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: `${theme.palette.error.main}12`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${theme.palette.error.main}25`
                          }
                        }}
                      >
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            color: theme.palette.error.main,
                            fontWeight: 'bold',
                            fontSize: { xs: '2rem', sm: '2.5rem' },
                            mb: 1
                          }}
                        >
                          {healthStats.critical}
                        </Typography>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 500,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}
                        >
                          Critical
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Temperature Sensors */}
      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h5" 
          component="h2"
          sx={{ 
            fontSize: { xs: '1.3rem', sm: '1.5rem' },
            fontWeight: 600,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: 'text.primary'
          }}
        >
          <ThermostatIcon sx={{ fontSize: { xs: 24, sm: 28 } }} /> 
          Temperature Sensors
        </Typography>
        
        <Grid 
          container 
          spacing={{ xs: 3, sm: 4, md: 3 }}
          component="section"
          sx={{ 
            '& .MuiGrid-item': {
              display: 'flex'
            }
          }}
        >
          {sensors.filter(sensor => sensor.reading > 0).map((sensor, index) => (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              lg={3}
              key={sensor.name}
            >
              <TemperatureCard sensor={sensor} showFahrenheit={showFahrenheit} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Fan Controllers */}
      <Box>
        <Typography 
          variant="h5" 
          component="h2"
          sx={{ 
            fontSize: { xs: '1.3rem', sm: '1.5rem' },
            fontWeight: 600,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: 'text.primary'
          }}
        >
          <AirIcon sx={{ fontSize: { xs: 24, sm: 28 } }} /> 
          Fan Controllers
        </Typography>
        
        <Grid 
          container 
          spacing={{ xs: 3, sm: 4, md: 3 }}
          component="section"
          sx={{ 
            '& .MuiGrid-item': {
              display: 'flex'
            }
          }}
        >
          {fans.map((fan, index) => (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              lg={3}
              key={fan.name}
            >
              <FanCard fan={fan} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;