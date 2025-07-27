import React, { useEffect, useState } from "react";
import { getHistory, getAvailableSensors } from "../api";
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
import { SPACING } from '../constants/spacing';
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

function HistoryChart({ 
  showOnlySystemTemperatures = false, 
  showOnlyPowerSupplyAndPeripheral = false,
  showOnlyPowerSupply = false,
  showOnlyPeripheral = false
}: {
  showOnlySystemTemperatures?: boolean;
  showOnlyPowerSupplyAndPeripheral?: boolean;
  showOnlyPowerSupply?: boolean;
  showOnlyPeripheral?: boolean;
}) {
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
    const powerSupplySensors: SensorInfo[] = [];
    const peripheralSensors: SensorInfo[] = [];

    sensors.forEach(sensor => {
      const sensorName = sensor.name.toLowerCase();
      const sensorContext = sensor.context?.toLowerCase() || '';
      
      // Power Supply sensors (check this first before other categorizations)
      if (sensorName.includes('power') || 
          sensorName.includes('psu') ||
          sensorContext.includes('powersupply') ||
          sensorContext.includes('power supply') ||
          sensorName.includes('supply') ||
          sensorName.includes('voltage') ||
          sensorName.includes('regulator') ||
          sensorName.includes('vrm') ||
          sensorName.includes('vr ') ||
          sensorName.startsWith('vr') ||
          sensorContext.includes('voltage')) {
        powerSupplySensors.push(sensor);
      }
      // System sensors: CPU, RAM, iLO, and Inlet Ambient sensors
      else if (sensorName.includes('cpu') || 
               sensorName.includes('inlet') || 
               sensorName.includes('ambient') ||
               sensorContext.includes('cpu') ||
               sensorContext.includes('intake') ||
               sensorName.includes('ilo') ||
               sensorName.includes('ram') ||
               sensorName.includes('memory')) {
        systemSensors.push(sensor);
      }
      // Everything else goes to peripheral sensors
      else {
        // Extract sensor number from name (e.g., "01-Inlet Ambient" -> 1) for fallback categorization
        const sensorNumberMatch = sensor.name.match(/^(\d+)-/);
        const sensorNumber = sensorNumberMatch ? parseInt(sensorNumberMatch[1]) : null;
        
        // System sensors: sensors 01 to 17 (fallback for legacy categorization)
        if (sensorNumber && sensorNumber >= 1 && sensorNumber <= 17) {
          systemSensors.push(sensor);
        } else {
          peripheralSensors.push(sensor);
        }
      }
    });

    return { systemSensors, powerSupplySensors, peripheralSensors };
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [histData, sensorsResponse] = await Promise.all([
          getHistory(),
          getAvailableSensors()
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
    }, 60000); // Update every 1 minute for sensor data
    return () => clearInterval(interval);
  }, [isInitialLoad]);

  if (loading) return <CircularProgress />;

  if (historyData.length === 0) {
    return (
      <Card sx={{ mb: SPACING.COMPONENT.LARGE }}>
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
  const { systemSensors, powerSupplySensors, peripheralSensors } = categorizeSensors(availableSensors);

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
        mode: 'nearest' as const,
        intersect: true,
        titleFont: {
          size: isMobile ? 12 : 14
        },
        bodyFont: {
          size: isMobile ? 11 : 13
        },
        callbacks: {
          title: function(context: any) {
            // Show the time for the hovered point
            return context[0]?.label || '';
          },
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
      mode: 'nearest' as const,
      intersect: true,
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
  const powerSupplyChartData = createChartData(powerSupplySensors);
  const peripheralChartData = createChartData(peripheralSensors);

  const renderTemperatureCard = (
    title: string,
    chartData: any,
    sensors: SensorInfo[],
    isFirst: boolean = false
  ) => (
    <Card sx={{ 
      height: '450px', // Fixed height for consistency
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardContent sx={{ 
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
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
              height: { xs: 250, sm: 300, md: 350 },
              position: 'relative',
              flex: 1
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
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            minHeight: 200
          }}>
            <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
              No sensors available for this category
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {showOnlySystemTemperatures ? (
        renderTemperatureCard("System Temperatures", systemChartData, systemSensors, true)
      ) : showOnlyPowerSupply ? (
        renderTemperatureCard("Power Supply Temperatures", powerSupplyChartData, powerSupplySensors)
      ) : showOnlyPeripheral ? (
        renderTemperatureCard("Peripheral Temperatures", peripheralChartData, peripheralSensors)
      ) : showOnlyPowerSupplyAndPeripheral ? (
        <>
          {renderTemperatureCard("Power Supply Temperatures", powerSupplyChartData, powerSupplySensors)}
          {renderTemperatureCard("Peripheral Temperatures", peripheralChartData, peripheralSensors)}
        </>
      ) : (
        <>
          {renderTemperatureCard("System Temperatures", systemChartData, systemSensors, true)}
          {renderTemperatureCard("Power Supply Temperatures", powerSupplyChartData, powerSupplySensors)}
          {renderTemperatureCard("Peripheral Temperatures", peripheralChartData, peripheralSensors)}
        </>
      )}
    </Box>
  );
}

export default HistoryChart;