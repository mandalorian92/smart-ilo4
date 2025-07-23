import React, { useEffect, useState } from "react";
import { getHistory, getAvailableSensors, getActivePids } from "../api";
import { 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  useTheme,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  useMediaQuery
} from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from "chart.js";
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

type SensorInfo = {
  name: string;
  context: string;
  currentReading: number;
  isActive: boolean;
};

type PidInfo = {
  number: number;
  pgain: number;
  igain: number;
  dgain: number;
  setpoint: number;
  imin: number;
  imax: number;
  lowLimit: number;
  highLimit: number;
  prevDrive: number;
  output: number;
  isActive: boolean;
};

type HistoryPoint = {
  time: string;
  timestamp: number;
  sensors: { [sensorName: string]: number };
};

function HistoryChart() {
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [availableSensors, setAvailableSensors] = useState<SensorInfo[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showFahrenheit, setShowFahrenheit] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Generate distinct colors for each sensor line
  const generateColors = (count: number) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.success.main,
      theme.palette.info.main,
      '#FF6B35', '#F7931E', '#FFD23F', '#9B59B6', '#E74C3C', '#3498DB', 
      '#2ECC71', '#F39C12', '#E67E22', '#95A5A6', '#34495E', '#16A085'
    ];
    return colors.slice(0, count);
  };

  const convertTemperature = (celsius: number) => {
    return showFahrenheit ? Math.round((celsius * 9/5) + 32) : celsius;
  };

  const getTemperatureUnit = () => showFahrenheit ? '°F' : '°C';

  useEffect(() => {
    async function fetchData() {
      try {
        const [histData, sensorsResponse, activePids] = await Promise.all([
          getHistory(),
          getAvailableSensors(),
          getActivePids()
        ]);
        
        setHistoryData(histData);
        
        // Handle the new response format
        const sensorsData = sensorsResponse.sensors || sensorsResponse; // Handle both old and new formats
        setAvailableSensors(sensorsData);
        
        // Only set default sensors on initial load, not on updates
        if (isInitialLoad) {
          // Get sensor numbers that correspond to active PIDs
          const activePidNumbers = activePids.map((pid: PidInfo) => pid.number);
          
          // Find sensors that correspond to active PIDs or have active readings
          const activeSensors = sensorsData
            .filter((sensor: SensorInfo) => {
              // Extract sensor number from name if possible (e.g., "01-Inlet Ambient" -> 1)
              const sensorNumberMatch = sensor.name.match(/^(\d+)-/);
              const sensorNumber = sensorNumberMatch ? parseInt(sensorNumberMatch[1]) : null;
              
              // Include if:
              // 1. Sensor number matches an active PID
              // 2. Sensor has active reading and is important type
              const matchesActivePid = sensorNumber && activePidNumbers.includes(sensorNumber);
              const hasActiveReading = sensor.currentReading > 0;
              const isImportantSensor = 
                sensor.name.toLowerCase().includes('cpu') ||
                sensor.name.toLowerCase().includes('system') ||
                sensor.name.toLowerCase().includes('ambient') ||
                sensor.name.toLowerCase().includes('inlet') ||
                sensor.name.toLowerCase().includes('exhaust') ||
                sensor.name.toLowerCase().includes('chipset');
              
              return matchesActivePid || (hasActiveReading && isImportantSensor);
            })
            .map((sensor: SensorInfo) => sensor.name)
            .slice(0, 6); // Show up to 6 sensors by default
          
          // If no sensors found using PID logic, fall back to CPU sensors
          if (activeSensors.length === 0) {
            const cpuSensors = sensorsData
              .filter((sensor: SensorInfo) => 
                sensor.context === 'CPU' || sensor.name.toLowerCase().includes('cpu')
              )
              .map((sensor: SensorInfo) => sensor.name)
              .slice(0, 3);
            setSelectedSensors(cpuSensors);
          } else {
            setSelectedSensors(activeSensors);
          }
          
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(() => {
      // Update silently without changing selected sensors
      fetchData();
    }, 60000); // Update every minute to match backend collection interval
    return () => clearInterval(interval);
  }, [isInitialLoad]);

  const handleSensorChange = (event: SelectChangeEvent<typeof selectedSensors>) => {
    const value = event.target.value;
    setSelectedSensors(typeof value === 'string' ? value.split(',') : value);
  };

  if (loading) return <CircularProgress />;

  if (historyData.length === 0) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Temperature History
          </Typography>
          <Typography color="text.secondary">
            No history data available yet. Please wait for the system to collect temperature readings.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const labels = historyData.map(point => {
    // Use the timestamp for proper timezone handling
    const date = new Date(point.timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  });

  const colors = generateColors(selectedSensors.length);
  
  const datasets = selectedSensors.map((sensorName, index) => ({
    label: sensorName,
    data: historyData.map(point => {
      const reading = point.sensors[sensorName];
      return reading !== undefined ? convertTemperature(reading) : null;
    }),
    fill: false,
    borderColor: colors[index],
    backgroundColor: colors[index],
    tension: 0.1,
    pointRadius: 2,
    pointHoverRadius: 4,
    borderWidth: 2
  }));

  const chartData = {
    labels,
    datasets
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: !isMobile, // Hide legend on mobile to save space
        labels: {
          color: theme.palette.text.primary,
          usePointStyle: true,
          padding: isMobile ? 10 : 20,
          font: {
            size: isMobile ? 10 : 12
          },
          boxWidth: isMobile ? 10 : 20
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        titleFont: {
          size: isMobile ? 12 : 14
        },
        bodyFont: {
          size: isMobile ? 11 : 13
        },
        callbacks: {
          label: function(context: any) {
            const sensorName = context.dataset.label;
            const value = context.parsed.y;
            return `${sensorName}: ${value}${getTemperatureUnit()}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: !isMobile, // Hide axis titles on mobile
          text: 'Time',
          color: theme.palette.text.primary,
          font: {
            size: isMobile ? 10 : 12
          }
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: isMobile ? 45 : 30,
          font: {
            size: isMobile ? 9 : 11
          }
        },
        grid: {
          color: theme.palette.divider,
          display: !isMobile // Hide grid on mobile for cleaner look
        }
      },
      y: {
        display: true,
        title: {
          display: !isMobile,
          text: `Temperature (${getTemperatureUnit()})`,
          color: theme.palette.text.primary,
          font: {
            size: isMobile ? 10 : 12
          }
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: isMobile ? 9 : 11
          }
        },
        grid: {
          color: theme.palette.divider,
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: isMobile ? 2 : 3, // Smaller points on mobile
        hoverRadius: isMobile ? 4 : 6
      },
      line: {
        borderWidth: isMobile ? 1.5 : 2 // Thinner lines on mobile
      }
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 3,
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.125rem' }
            }}
          >
            Temperature History (Past Hour)
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
                {isMobile ? "°F" : "Show in Fahrenheit"}
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              {isMobile ? "Select Sensors" : "Select Sensors to Display"}
            </InputLabel>
            <Select
              multiple
              value={selectedSensors}
              onChange={handleSensorChange}
              input={<OutlinedInput label={isMobile ? "Select Sensors" : "Select Sensors to Display"} />}
              size={isMobile ? "small" : "medium"}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const sensor = availableSensors.find(s => s.name === value);
                    return (
                      <Chip 
                        key={value} 
                        label={isMobile ? value : `${value} (${sensor?.context || 'Unknown'})`}
                        size="small"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          height: { xs: 20, sm: 24 }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {availableSensors.map((sensor) => (
                <MenuItem key={sensor.name} value={sensor.name}>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {sensor.name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      {sensor.context} - Current: {convertTemperature(sensor.currentReading)}{getTemperatureUnit()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ 
          height: { xs: 300, sm: 350, md: 400 },
          position: 'relative'
        }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
        
        {/* Show legend separately on mobile */}
        {isMobile && selectedSensors.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedSensors.map((sensorName, index) => {
              const colors = generateColors(selectedSensors.length);
              return (
                <Chip
                  key={sensorName}
                  label={sensorName}
                  size="small"
                  sx={{
                    backgroundColor: colors[index],
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default HistoryChart;