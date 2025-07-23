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
  useTheme
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

  if (loading) return <CircularProgress />;

  return (
    <Box>
      {/* Fans Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Fans
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                  <TableCell><strong>Fan</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Speed</strong></TableCell>
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
                    <TableCell>{fan.name}</TableCell>
                    <TableCell>System</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {getFanStatusIcon(fan)}
                        <Typography variant="body2">
                          {fan.health === 'OK' ? 'OK' : fan.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{fan.speed}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Sensor Data Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Sensor Data
          </Typography>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={showFahrenheit} 
                  onChange={(e) => setShowFahrenheit(e.target.checked)}
                  size="small"
                />
              }
              label="Show values in Fahrenheit"
            />
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                  <TableCell><strong>Sensor</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Reading</strong></TableCell>
                  <TableCell><strong>Thresholds</strong></TableCell>
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
                    <TableCell>{sensor.name}</TableCell>
                    <TableCell>
                      {sensor.context === 'CPU' ? 'CPU' : 
                       sensor.context === 'Intake' ? 'Ambient' :
                       sensor.context === 'SystemBoard' ? 'System' :
                       sensor.context === 'PowerSupply' ? 'Power Supply' :
                       sensor.context || 'System'}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {getStatusIcon(sensor)}
                        <Typography variant="body2">
                          {sensor.status === 'OK' ? 'OK' : sensor.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {convertTemperature(sensor.reading)}{getTemperatureUnit()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>
                      {formatThresholds(sensor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;