import React, { useEffect, useState } from "react";
import { getSensors, overrideSensor, resetSensors } from "../api";
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  MenuItem, 
  Select, 
  TextField, 
  Grid, 
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery
} from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import { SPACING } from '../constants/spacing';
import { useNotifications } from './NotificationProvider';
import FanControls from './FanControls';

// Sensor Override Controls component
function SensorOverrideControls() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [value, setValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotifications();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    async function fetchSensors() {
      setLoading(true);
      try {
        const data = await getSensors();
        setSensors(data);
      } catch (error) {
        console.error('Failed to fetch sensors:', error);
        showNotification('error', 'Failed to fetch sensors');
      } finally {
        setLoading(false);
      }
    }
    fetchSensors();
  }, []);

  const handleOverride = async () => {
    if (!selected) {
      showNotification('warning', 'Please select a sensor');
      return;
    }

    try {
      await overrideSensor(selected, value);
      showNotification('success', `Sensor ${selected} overridden to ${value}°C`);
    } catch (error) {
      console.error('Failed to override sensor:', error);
      showNotification('error', 'Failed to override sensor');
    }
  };

  const handleReset = async () => {
    try {
      await resetSensors();
      showNotification('success', 'All sensors reset to default values');
    } catch (error) {
      console.error('Failed to reset sensors:', error);
      showNotification('error', 'Failed to reset sensors');
    }
  };

  if (loading) return (
    <Card 
      elevation={0}
      sx={{ 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        height: '100%'
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 }, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </CardContent>
    </Card>
  );

  return (
    <Card 
      elevation={0}
      sx={{ 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header Section */}
        <Box sx={{ mb: SPACING.COMPONENT.LARGE }}>
          <Typography 
            variant="h6" 
            component="h2"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 600,
              mb: 0.5,
              color: 'text.primary'
            }}
          >
            Sensor Configuration
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              color: 'text.secondary'
            }}
          >
            Override individual sensor readings and reset system configurations
          </Typography>
        </Box>

        {/* Content Section - Form */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="sensor-select-label">Select Sensor</InputLabel>
            <Select
              labelId="sensor-select-label"
              value={selected}
              label="Select Sensor"
              onChange={(e) => setSelected(e.target.value as string)}
              size="medium"
            >
              {sensors.map((sensor) => (
                <MenuItem key={sensor.name} value={sensor.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {sensor.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Current: {sensor.reading}°C)
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Override Value"
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            fullWidth
            variant="outlined"
            size="medium"
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>°C</Typography>
            }}
            inputProps={{ step: 0.1 }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                pr: 0.5
              }
            }}
          />

          <Button
            variant="contained"
            onClick={handleOverride}
            disabled={!selected}
            fullWidth
            size="large"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              py: 1.5,
              fontSize: '1rem',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
          >
            Override Sensor
          </Button>

          {/* Reset Button Section */}
          <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              variant="outlined"
              onClick={handleReset}
              fullWidth
              size="large"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
              startIcon={<RefreshIcon />}
            >
              Reset All Sensors
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Main Controls component with proper two-row layout
function Controls({ onDebugLog }: { onDebugLog?: (message: string) => void }) {
  return (
    <Box component="section" role="main" aria-label="System Controls">
      {/* Page Header */}
      <Box sx={{ mb: SPACING.ROW }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem' },
            fontWeight: 600,
            mb: 0.5,
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <SettingsIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
          System Controls
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            mb: 0
          }}
        >
          Fan control and sensor override management
        </Typography>
      </Box>

      {/* First Row - Fan Control Presets */}
      <Box sx={{ mb: SPACING.ROW }}>
        <FanControls onDebugLog={onDebugLog} />
      </Box>

      {/* Second Row - Sensor Configuration */}
      <Box sx={{ mb: SPACING.ROW }}>
        <Grid container spacing={SPACING.CARD}>
          {/* Sensor Configuration Card - Full width for now */}
          <Grid item xs={12}>
            <SensorOverrideControls />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Controls;
