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

  // Function to categorize sensors
  const categorizeSensors = (sensors: SensorInfo[]) => {
    const systemSensors: SensorInfo[] = [];
    const peripheralSensors: SensorInfo[] = [];

    sensors.forEach(sensor => {
      // Extract sensor number from name (e.g., "01-Inlet Ambient" -> 1)
      const sensorNumberMatch = sensor.name.match(/^(\d+)-/);
      const sensorNumber = sensorNumberMatch ? parseInt(sensorNumberMatch[1]) : null;
      
      // System sensors: sensors 01 to 17
      if (sensorNumber && sensorNumber >= 1 && sensorNumber <= 17) {
        systemSensors.push(sensor);
      } else {
        peripheralSensors.push(sensor);
      }
    });

    return { systemSensors, peripheralSensors };
  };

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
        
        setIsInitialLoad(false);
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

  if (loading) return <CircularProgress />;

  if (historyData.length === 0) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Temperature
          </Typography>
          <Typography color="text.secondary">
            No history data available yet. Please wait for the system to collect temperature readings.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Categorize sensors
  const { systemSensors, peripheralSensors } = categorizeSensors(availableSensors);

  // Prepare chart data labels with improved time formatting
  const labels = historyData.map(point => {
    const date = new Date(point.timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
      // Removed timeZoneName to avoid timezone display
    });
  });

  // Create chart data for system sensors
  const createChartData = (sensors: SensorInfo[]) => {
    const colors = generateColors(sensors.length);
    
    const datasets = sensors.map((sensor, index) => ({
      label: sensor.name,
      data: historyData.map(point => {
        const reading = point.sensors[sensor.name];
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

    return {
      labels,
      datasets
    };
  };

  // Chart options with improved time grid
  const createChartOptions = (title: string) => ({
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
          },
          // Show every 5 minutes instead of every minute
          maxTicksLimit: 12, // Limit to about 12 ticks (every 5 minutes for an hour)
          autoSkip: true
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
  });

  const systemChartData = createChartData(systemSensors);
  const peripheralChartData = createChartData(peripheralSensors);

  const renderTemperatureCard = (
    title: string,
    chartData: any,
    sensors: SensorInfo[],
    isFirst: boolean = false
  ) => (
    <Card sx={{ mb: 4 }}>
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
            {title}
          </Typography>
          {/* Only show temperature unit toggle on the first card */}
          {isFirst && (
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
          )}
        </Box>
        
        {sensors.length > 0 ? (
          <>
            <Box sx={{ 
              height: { xs: 300, sm: 350, md: 400 },
              position: 'relative'
            }}>
              <Line data={chartData} options={createChartOptions(title)} />
            </Box>
            
            {/* Show legend separately on mobile */}
            {isMobile && sensors.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {sensors.map((sensor, index) => {
                  const colors = generateColors(sensors.length);
                  return (
                    <Chip
                      key={sensor.name}
                      label={sensor.name}
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
          </>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No sensors available for this category
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {renderTemperatureCard("System Temperatures", systemChartData, systemSensors, true)}
      {renderTemperatureCard("Peripherals Temperatures", peripheralChartData, peripheralSensors)}
    </Box>
  );
}

export default HistoryChart;