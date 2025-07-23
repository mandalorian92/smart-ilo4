import React, { useEffect, useState } from "react";
import { getSensors, getFans } from "../api";
import { 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Grid
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

function Dashboard() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [fans, setFans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFahrenheit, setShowFahrenheit] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    async function fetchData() {
      try {
        const [sensorsData, fansData] = await Promise.all([getSensors(), getFans()]);
        setSensors(sensorsData);
        setFans(fansData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(() => {
      // Don't show loading on updates, just update data silently
      fetchData();
    }, 5000); // Update every 5 seconds for faster updates
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (sensor: any) => {
    const reading = sensor.reading;
    const critical = sensor.critical;
    const fatal = sensor.fatal;
    
    // If we have thresholds, use them
    if (critical && reading >= critical) {
      return <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />; // Red X for critical
    }
    
    if (critical && reading >= (critical - 15)) {
      return <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />; // Yellow warning for 15°C below caution
    }
    
    // Green check for OK status
    return <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />;
  };

  const getFanStatusIcon = (fan: any) => {
    if (fan.health === 'OK' && fan.status === 'Enabled') {
      return <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />;
    } else if (fan.status === 'Absent') {
      return <ErrorIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />;
    } else {
      return <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />;
    }
  };

  const convertTemperature = (celsius: number) => {
    if (showFahrenheit) {
      return Math.round((celsius * 9/5) + 32);
    }
    return celsius;
  };

  const getTemperatureUnit = () => showFahrenheit ? '°F' : '°C';

  const formatThresholds = (sensor: any) => {
    const critical = sensor.critical;
    const fatal = sensor.fatal;
    
    if (critical && fatal) {
      return `Caution: ${convertTemperature(critical)}${getTemperatureUnit()}; Critical: ${convertTemperature(fatal)}${getTemperatureUnit()}`;
    } else if (critical) {
      return `Caution: ${convertTemperature(critical)}${getTemperatureUnit()}; Critical: N/A`;
    } else {
      return 'N/A';
    }
  };

  // Filter sensors and fans based on backend data (no additional filtering needed)
  const filteredSensors = sensors;
  const filteredFans = fans;

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
      {/* Fans Table */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ height: 'fit-content' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                fontSize: { xs: '1rem', sm: '1.125rem' }
              }}
            >
              Fans
            </Typography>
            
            <TableContainer 
              component={Paper} 
              variant="outlined"
              sx={{
                '& .MuiTable-root': {
                  minWidth: { xs: 'auto', sm: 650 }
                }
              }}
            >
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Fan
                      </Typography>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Location
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Typography variant="subtitle2" fontWeight="bold">
                        Status
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight="bold">
                        Speed
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFans.map((fan, index) => (
                    <TableRow key={fan.name} sx={{ 
                      '&:nth-of-type(even)': { 
                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50] 
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          fontWeight: 500
                        }}>
                          {fan.name}
                        </Typography>
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Typography variant="body2">System</Typography>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          {getFanStatusIcon(fan)}
                          {!isMobile && (
                            <Typography variant="body2">
                              {fan.health === 'OK' ? 'OK' : fan.status}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="600">
                          {fan.speed}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Sensor Data Table */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ height: 'fit-content' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: 2,
              gap: { xs: 1, sm: 0 }
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }}
              >
                Sensor Data
              </Typography>

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
                    {isMobile ? "°F" : "Show values in Fahrenheit"}
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Box>
            
            <TableContainer 
              component={Paper} 
              variant="outlined"
              sx={{
                '& .MuiTable-root': {
                  minWidth: { xs: 'auto', sm: 650 }
                }
              }}
            >
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Sensor
                      </Typography>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Location
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Typography variant="subtitle2" fontWeight="bold">
                        Status
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight="bold">
                        Reading
                      </Typography>
                    </TableCell>
                    {!isMobile && !isTablet && (
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Thresholds
                        </Typography>
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSensors.map((sensor, index) => (
                    <TableRow key={sensor.name} sx={{ 
                      '&:nth-of-type(even)': { 
                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50] 
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          fontWeight: 500
                        }}>
                          {sensor.name}
                        </Typography>
                        {isMobile && (
                          <Typography variant="caption" color="text.secondary">
                            {sensor.context === 'CPU' ? 'CPU' : 
                             sensor.context === 'Intake' ? 'Ambient' :
                             sensor.context === 'SystemBoard' ? 'System' :
                             sensor.context === 'PowerSupply' ? 'Power Supply' :
                             sensor.context || 'System'}
                          </Typography>
                        )}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Typography variant="body2">
                            {sensor.context === 'CPU' ? 'CPU' : 
                             sensor.context === 'Intake' ? 'Ambient' :
                             sensor.context === 'SystemBoard' ? 'System' :
                             sensor.context === 'PowerSupply' ? 'Power Supply' :
                             sensor.context || 'System'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          {getStatusIcon(sensor)}
                          {!isMobile && (
                            <Typography variant="body2">
                              {sensor.status === 'OK' ? 'OK' : sensor.status}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="600">
                          {convertTemperature(sensor.reading)}{getTemperatureUnit()}
                        </Typography>
                      </TableCell>
                      {!isMobile && !isTablet && (
                        <TableCell>
                          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                            {formatThresholds(sensor)}
                          </Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default Dashboard;