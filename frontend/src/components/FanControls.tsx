import React, { useEffect, useState } from "react";
import { 
  getSensors, 
  getFans, 
  overrideSensor, 
  resetSensors, 
  setAllFanSpeeds,
  unlockFanControl,
  lockFanAtSpeed,
  resetFans,
  invalidateFanCache
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
  Snackbar,
  useTheme
} from "@mui/material";

function FanControls() {
  const [fans, setFans] = useState<any[]>([]);
  const [fanSpeeds, setFanSpeeds] = useState<Record<string, number>>({});
  const [editAllMode, setEditAllMode] = useState(false);
  const [globalSpeed, setGlobalSpeed] = useState(25);
  const [loading, setLoading] = useState(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const theme = useTheme();

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-20)); // Keep last 20 logs
  };

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
    if (editAllMode) {
      // When edit all is enabled, update global speed and all fans
      setGlobalSpeed(speed);
      const newSpeeds: Record<string, number> = {};
      fans.forEach(fan => newSpeeds[fan.name] = speed);
      setFanSpeeds(newSpeeds);
    } else {
      // When edit all is disabled, only update the specific fan
      setFanSpeeds(prev => ({ ...prev, [fanName]: speed }));
    }
  };

  const handleGlobalSpeedChange = (speed: number) => {
    setGlobalSpeed(speed);
    if (editAllMode) {
      // When edit all is enabled, update all fan speeds to match global speed
      const newSpeeds: Record<string, number> = {};
      fans.forEach(fan => newSpeeds[fan.name] = speed);
      setFanSpeeds(newSpeeds);
    }
  };

  const handlePresetSpeed = (preset: 'quiet' | 'normal' | 'turbo') => {
    const speedMap = {
      quiet: 25,  // 25% minimum
      normal: 60, // 60% normal
      turbo: 100  // 100% maximum
    };
    handleGlobalSpeedChange(speedMap[preset]);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      addDebugLog('Starting fan speed update...');
      
      if (editAllMode) {
        // If in edit all mode, set all fans to the global speed
        addDebugLog(`Setting all fans to ${globalSpeed}% (PWM: ${Math.round((globalSpeed / 100) * 255)})`);
        await setAllFanSpeeds(globalSpeed);
        addDebugLog('✓ All fans updated successfully');
        showNotification(`All fans set to ${globalSpeed}%`, 'success');
      } else {
        // Set individual fan speeds
        addDebugLog('Setting individual fan speeds:');
        for (const [fanName, speed] of Object.entries(fanSpeeds)) {
          const fanIndex = fans.findIndex(f => f.name === fanName);
          if (fanIndex >= 0) {
            const pwmValue = Math.round((speed / 100) * 255);
            addDebugLog(`- Fan ${fanIndex} (${fanName}): ${speed}% (PWM: ${pwmValue})`);
            await lockFanAtSpeed(fanIndex, speed);
          }
        }
        addDebugLog('✓ Individual fan speeds updated successfully');
        showNotification('Fan speeds updated successfully', 'success');
      }
      
      // Wait a moment for iLO to process the changes, then refresh fan data
      addDebugLog('Waiting for iLO to process changes...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      addDebugLog('Invalidating backend cache...');
      await invalidateFanCache();
      
      addDebugLog('Refreshing fan data...');
      await fetchFans(true); // Bust cache to get fresh data
      addDebugLog('✓ Fan data refreshed');
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      addDebugLog(`✗ Error: ${errorMsg}`);
      console.error('Failed to update fan speeds:', error);
      showNotification(`Failed to update fan speeds: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      addDebugLog('Resetting fan overrides...');
      await resetFans();
      
      // Reset to original speeds
      const originalSpeeds: Record<string, number> = {};
      fans.forEach(fan => originalSpeeds[fan.name] = Math.max(10, fan.speed));
      setFanSpeeds(originalSpeeds);
      
      addDebugLog('✓ Fan overrides reset successfully');
      showNotification('Fan overrides reset successfully', 'success');
      await fetchFans();
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      addDebugLog(`✗ Reset error: ${errorMsg}`);
      console.error('Failed to reset fans:', error);
      showNotification(`Failed to reset fans: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setLoading(true);
      addDebugLog('Unlocking fan control via SSH...');
      addDebugLog('SSH Command: fan p global unlock');
      await unlockFanControl();
      addDebugLog('✓ Fan control unlocked successfully');
      showNotification('Fan control unlocked successfully', 'success');
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      addDebugLog(`✗ Unlock error: ${errorMsg}`);
      console.error('Failed to unlock fan control:', error);
      showNotification(`Failed to unlock fan control: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFans = async (bustCache = false) => {
    try {
      // Add cache busting parameter when needed
      const url = bustCache ? `/fans?_t=${Date.now()}` : '/fans';
      const data = await getFans();
      setFans(data);
      const speeds: Record<string, number> = {};
      data.forEach((fan: any) => speeds[fan.name] = Math.max(10, fan.speed)); // Ensure minimum 10%
      setFanSpeeds(speeds);
      
      // Also update global speed to match if all fans are at the same speed
      const speedValues = Object.values(speeds);
      const uniqueSpeeds = Array.from(new Set(speedValues));
      if (uniqueSpeeds.length === 1) {
        setGlobalSpeed(uniqueSpeeds[0]);
      }
    } catch (error) {
      addDebugLog(`✗ Failed to fetch fans: ${(error as Error).message}`);
      console.error('Failed to fetch fans:', error);
    }
  };

  return (
    <>
    <Card sx={{ mb: 4, bgcolor: '#2c3e50', color: 'white' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ color: '#2ecc71', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#2ecc71', mr: 2, borderRadius: 1 }} />
          iLO Fan Controller
          {loading && <CircularProgress size={20} sx={{ ml: 2, color: '#2ecc71' }} />}
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
                  value={Math.max(10, fanSpeeds[fan.name] || fan.speed)}
                  onChange={(_, value) => handleFanSpeedChange(fan.name, value as number)}
                  min={10}
                  max={100}
                  sx={{ 
                    mx: 2, 
                    flex: 1,
                    color: '#3498db',
                    '& .MuiSlider-thumb': { color: '#3498db' },
                    '& .MuiSlider-track': { color: '#3498db' },
                    '& .MuiSlider-rail': { color: '#555' }
                  }}
                  disabled={false} // Always enabled - logic handled in handleFanSpeedChange
                />
                <TextField
                  value={Math.max(10, fanSpeeds[fan.name] || fan.speed)}
                  onChange={(e) => handleFanSpeedChange(fan.name, Math.max(10, parseInt(e.target.value) || 10))}
                  type="number"
                  inputProps={{ min: 10, max: 100 }}
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
                  disabled={false} // Always enabled - logic handled in handleFanSpeedChange
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

    {/* Debug Terminal Card */}
    <Card sx={{ 
      mb: 4, 
      bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
      border: `1px solid ${theme.palette.divider}`
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          color: theme.palette.mode === 'dark' ? '#00ff00' : '#2e7d32',
          fontFamily: 'monospace' 
        }}>
          Debug Terminal
        </Typography>
        
        <Paper 
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#fafafa',
            p: 2, 
            height: 300, 
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            color: theme.palette.mode === 'dark' ? '#00ff00' : '#2e7d32',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          {debugLogs.length === 0 ? (
            <Typography sx={{ 
              color: theme.palette.text.secondary, 
              fontFamily: 'monospace' 
            }}>
              Waiting for fan control operations...
            </Typography>
          ) : (
            debugLogs.map((log, index) => (
              <Typography 
                key={index} 
                sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.875rem',
                  color: log.includes('✗') ? theme.palette.error.main : 
                         log.includes('✓') ? theme.palette.success.main : 
                         log.includes('SSH Command:') ? theme.palette.warning.main : 
                         theme.palette.mode === 'dark' ? '#00ff00' : '#2e7d32',
                  mb: 0.5
                }}
              >
                {log}
              </Typography>
            ))
          )}
        </Paper>
      </CardContent>
    </Card>
    </>
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
