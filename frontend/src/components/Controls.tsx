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
import { useNotifications } from './NotificationProvider';

function Controls() {
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
      showNotification('warning', 'Please select a sensor first');
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
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box component="section" role="main" aria-label="Sensor Override Controls">
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
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
          Sensor Override System
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            mb: 0
          }}
        >
          Override individual sensor readings and reset system configurations
        </Typography>
      </Box>

      {/* Sensor Override Controls - Content Layout */}
      <Card 
        elevation={0}
        sx={{ 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header Section */}
          <Box sx={{ mb: 3 }}>
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
              Sensor Override
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: 'text.secondary'
              }}
            >
              Temporarily override sensor readings for testing and calibration
            </Typography>
          </Box>
          
          {/* Content Section - Form Controls */}
          <Grid container spacing={3} alignItems="end">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="sensor-select-label">Select Sensor</InputLabel>
                <Select
                  labelId="sensor-select-label"
                  value={selected}
                  label="Select Sensor"
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {sensors.map((s) => (
                    <MenuItem key={s.name} value={s.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {s.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Current: {s.reading}°C)
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                label="Override Value"
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                fullWidth
                variant="outlined"
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
            </Grid>
            
            <Grid item xs={12} sm={2}>
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
                Override
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={3}>
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
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Controls;