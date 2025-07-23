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
  FormControlLabel
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
  const [showFahrenheit, setShowFahrenheit] = useState(false);
  const theme = useTheme();

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
        const [histData, sensorsData] = await Promise.all([
          getHistory(),
          getAvailableSensors()
        ]);
        
        setHistoryData(histData);
        setAvailableSensors(sensorsData);
        
        // Auto-select CPU sensors by default
        const defaultSensors = sensorsData
          .filter((sensor: SensorInfo) => 
            sensor.context === 'CPU' || sensor.name.toLowerCase().includes('cpu')
          )
          .map((sensor: SensorInfo) => sensor.name)
          .slice(0, 3); // Limit to first 3 CPU sensors
        
        setSelectedSensors(defaultSensors);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(() => {
      // Update silently without showing loading
      fetchData();
    }, 60000); // Update every minute to match backend collection interval
    return () => clearInterval(interval);
  }, []);

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
        labels: {
          color: theme.palette.text.primary,
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
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
          display: true,
          text: 'Time',
          color: theme.palette.text.primary
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: 45
        },
        grid: {
          color: theme.palette.divider,
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: `Temperature (${getTemperatureUnit()})`,
          color: theme.palette.text.primary
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Temperature History (Past Hour)
          </Typography>
          <FormControlLabel
            control={
              <Switch 
                checked={showFahrenheit} 
                onChange={(e) => setShowFahrenheit(e.target.checked)}
                size="small"
              />
            }
            label="Show in Fahrenheit"
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Sensors to Display</InputLabel>
            <Select
              multiple
              value={selectedSensors}
              onChange={handleSensorChange}
              input={<OutlinedInput label="Select Sensors to Display" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const sensor = availableSensors.find(s => s.name === value);
                    return (
                      <Chip 
                        key={value} 
                        label={`${value} (${sensor?.context || 'Unknown'})`}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {availableSensors.map((sensor) => (
                <MenuItem key={sensor.name} value={sensor.name}>
                  <Box>
                    <Typography variant="body2">
                      {sensor.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sensor.context} - Current: {convertTemperature(sensor.currentReading)}{getTemperatureUnit()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ height: 400 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default HistoryChart;