import React, { useEffect, useState } from "react";
import { 
  getSensors, 
  getFans, 
  overrideSensor, 
  resetSensors, 
  setAllFanSpeeds,
  unlockFanControl,
  lockFanAtSpeed,
  resetFans
} from "../api";
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
  Slider,
  Box,
  FormControl,
  InputLabel,
  ButtonGroup,
  Divider,
  Switch,
  FormControlLabel,
  Paper,
  Alert,
  Snackbar
} from "@mui/material";

function FanControls() {
  const [fans, setFans] = useState<any[]>([]);
  const [fanSpeeds, setFanSpeeds] = useState<Record<string, number>>({});
  const [editAllMode, setEditAllMode] = useState(false);
  const [globalSpeed, setGlobalSpeed] = useState(21);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    fetchFans().finally(() => setLoading(false));
  }, []);

  const handleFanSpeedChange = (fanName: string, speed: number) => {
    setFanSpeeds(prev => ({ ...prev, [fanName]: speed }));
  };

  const handleGlobalSpeedChange = (speed: number) => {
    setGlobalSpeed(speed);
    const newSpeeds: Record<string, number> = {};
    fans.forEach(fan => newSpeeds[fan.name] = speed);
    setFanSpeeds(newSpeeds);
  };

  const handlePresetSpeed = (preset: 'quiet' | 'normal' | 'turbo') => {
    const speedMap = {
      quiet: 15,
      normal: 50,
      turbo: 100
    };
    handleGlobalSpeedChange(speedMap[preset]);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      
      if (editAllMode) {
        // If in edit all mode, set all fans to the global speed
        await setAllFanSpeeds(globalSpeed);
        showNotification(`All fans set to ${globalSpeed}%`, 'success');
      } else {
        // Set individual fan speeds
        for (const [fanName, speed] of Object.entries(fanSpeeds)) {
          const fanIndex = fans.findIndex(f => f.name === fanName);
          if (fanIndex >= 0) {
            await lockFanAtSpeed(fanIndex, speed);
          }
        }
        showNotification('Fan speeds updated successfully', 'success');
      }
      
      // Refresh fan data
      await fetchFans();
    } catch (error) {
      console.error('Failed to update fan speeds:', error);
      showNotification(`Failed to update fan speeds: ${(error as any).response?.data?.error || (error as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await resetFans();
      
      // Reset to original speeds
      const originalSpeeds: Record<string, number> = {};
      fans.forEach(fan => originalSpeeds[fan.name] = fan.speed);
      setFanSpeeds(originalSpeeds);
      
      showNotification('Fan overrides reset successfully', 'success');
      await fetchFans();
    } catch (error) {
      console.error('Failed to reset fans:', error);
      showNotification(`Failed to reset fans: ${(error as any).response?.data?.error || (error as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setLoading(true);
      await unlockFanControl();
      showNotification('Fan control unlocked successfully', 'success');
    } catch (error) {
      console.error('Failed to unlock fan control:', error);
      showNotification(`Failed to unlock fan control: ${(error as any).response?.data?.error || (error as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFans = async () => {
    try {
      const data = await getFans();
      setFans(data);
      const speeds: Record<string, number> = {};
      data.forEach((fan: any) => speeds[fan.name] = fan.speed);
      setFanSpeeds(speeds);
    } catch (error) {
      console.error('Failed to fetch fans:', error);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Card sx={{ mb: 4, bgcolor: '#2c3e50', color: 'white' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ color: '#2ecc71', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#2ecc71', mr: 2, borderRadius: 1 }} />
          iLO Fan Controller
        </Typography>
        
        {/* Edit All Toggle */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={editAllMode} 
                onChange={(e) => setEditAllMode(e.target.checked)}
                sx={{ 
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#2ecc71' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2ecc71' }
                }}
              />
            }
            label="Edit All"
            sx={{ color: 'white' }}
          />
        </Box>

        {/* Preset Buttons */}
        <Box sx={{ mb: 3 }}>
          <ButtonGroup variant="contained" sx={{ mb: 2 }}>
            <Button 
              onClick={() => handlePresetSpeed('quiet')}
              sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}
            >
              Quiet
            </Button>
            <Button 
              onClick={() => handlePresetSpeed('normal')}
              sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#229954' } }}
            >
              Normal
            </Button>
            <Button 
              onClick={() => handlePresetSpeed('turbo')}
              sx={{ bgcolor: '#e74c3c', '&:hover': { bgcolor: '#c0392b' } }}
            >
              Turbo
            </Button>
          </ButtonGroup>
        </Box>

        {/* Fan Controls */}
        <Box sx={{ mb: 3 }}>
          {fans.map((fan) => (
            <Box key={fan.name} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 80, color: 'white' }}>
                  {fan.name}
                </Typography>
                <Slider
                  value={fanSpeeds[fan.name] || fan.speed}
                  onChange={(_, value) => handleFanSpeedChange(fan.name, value as number)}
                  min={0}
                  max={100}
                  sx={{ 
                    mx: 2, 
                    flex: 1,
                    color: '#3498db',
                    '& .MuiSlider-thumb': { color: '#3498db' },
                    '& .MuiSlider-track': { color: '#3498db' },
                    '& .MuiSlider-rail': { color: '#555' }
                  }}
                  disabled={!editAllMode}
                />
                <TextField
                  value={fanSpeeds[fan.name] || fan.speed}
                  onChange={(e) => handleFanSpeedChange(fan.name, parseInt(e.target.value) || 0)}
                  type="number"
                  inputProps={{ min: 0, max: 100 }}
                  size="small"
                  sx={{ 
                    width: 60,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                      '&:hover fieldset': { borderColor: '#3498db' },
                      '&.Mui-focused fieldset': { borderColor: '#3498db' },
                      color: 'white'
                    },
                    '& .MuiInputBase-input': { color: 'white' }
                  }}
                  disabled={!editAllMode}
                />
                <Typography sx={{ ml: 1, color: 'white' }}>%</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={loading}
            sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#229954' } }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Update'}
          </Button>
          <Button
            variant="contained"
            onClick={handleReset}
            disabled={loading}
            sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            onClick={handleUnlock}
            disabled={loading}
            sx={{ bgcolor: '#34495e', '&:hover': { bgcolor: '#2c3e50' } }}
          >
            Unlock
          </Button>
        </Box>

        <Divider sx={{ my: 3, borderColor: '#555' }} />

        {/* Advanced Controls */}
        <Typography variant="h6" sx={{ mb: 2, color: '#f39c12' }}>
          Advanced Controls
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, color: '#bdc3c7' }}>
          These controls interact directly with iLO4 via SSH. Use with caution.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => showNotification('Feature coming soon: PID low limit adjustment', 'info')}
            sx={{ 
              borderColor: '#f39c12', 
              color: '#f39c12',
              '&:hover': { borderColor: '#e67e22', backgroundColor: 'rgba(243, 156, 18, 0.1)' }
            }}
          >
            Adjust PID Low Limits
          </Button>
          <Button
            variant="outlined"
            onClick={() => showNotification('Feature coming soon: Fan info display', 'info')}
            sx={{ 
              borderColor: '#9b59b6', 
              color: '#9b59b6',
              '&:hover': { borderColor: '#8e44ad', backgroundColor: 'rgba(155, 89, 182, 0.1)' }
            }}
          >
            Show Fan Info
          </Button>
          <Button
            variant="outlined"
            onClick={() => showNotification('Feature coming soon: Group analysis', 'info')}
            sx={{ 
              borderColor: '#e74c3c', 
              color: '#e74c3c',
              '&:hover': { borderColor: '#c0392b', backgroundColor: 'rgba(231, 76, 60, 0.1)' }
            }}
          >
            Analyze Groups
          </Button>
        </Box>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={closeNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={closeNotification} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}

function SensorControls() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [value, setValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSensors() {
      try {
        const data = await getSensors();
        setSensors(data);
      } catch (error) {
        console.error('Failed to fetch sensors:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSensors();
  }, []);

  const handleOverride = async () => {
    if (!selected) return;
    try {
      await overrideSensor(selected, value);
      alert("Sensor overridden successfully");
    } catch (error) {
      alert("Failed to override sensor");
    }
  };

  const handleReset = async () => {
    try {
      await resetSensors();
      alert("All sensor overrides reset");
    } catch (error) {
      alert("Failed to reset sensors");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Override Sensors / Reset
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Override temperature sensor readings for testing automation logic. 
          Values are in Celsius (e.g., 35, 40, 60).
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Select Sensor</InputLabel>
              <Select
                value={selected}
                label="Select Sensor"
                onChange={(e) => setSelected(e.target.value)}
              >
                {sensors.map((sensor) => (
                  <MenuItem key={sensor.name} value={sensor.name}>
                    {sensor.name} ({sensor.reading}°C)
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
              onChange={(e) => setValue(parseInt(e.target.value) || 0)}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
              helperText="Temperature in °C"
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleOverride}
                disabled={!selected}
              >
                Override
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
              >
                Reset Sensors
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function Controls() {
  return (
    <Box>
      <FanControls />
      <SensorControls />
    </Box>
  );
}
