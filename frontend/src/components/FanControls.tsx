import React, { useEffect, useState } from "react";
import { 
  getSensors, 
  getFans, 
  overrideSensor, 
  resetSensors, 
  setAllFanSpeeds,
  unlockFanControl,
  lockFanAtSpeed,
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
      // Wait a bit longer for iLO to settle, then refresh
      await new Promise(resolve => setTimeout(resolve, 1000)); // Additional 1 second wait
      await fetchFans(true, true); // Get fresh data, indicate this is after an update
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

  const fetchFans = async (bustCache = false, isAfterUpdate = false) => {
    try {
      // Add cache busting parameter when needed
      const url = bustCache ? `/fans?_t=${Date.now()}` : '/fans';
      const data = await getFans();
      setFans(data);
      
      const speeds: Record<string, number> = {};
      data.forEach((fan: any) => speeds[fan.name] = Math.max(10, fan.speed)); // Ensure minimum 10%
      
      // If this refresh is after an update and we're in Edit All mode,
      // we should make sure all sliders show the same value
      if (isAfterUpdate && editAllMode) {
        // In Edit All mode after update, set all fan speeds to match the global speed
        // This prevents the "drift" issue where one slider shows different value
        addDebugLog(`Edit All mode: synchronizing all sliders to ${globalSpeed}%`);
        data.forEach((fan: any) => speeds[fan.name] = globalSpeed);
      }
      
      setFanSpeeds(speeds);
      
      // Update global speed to match if all fans are at the same speed
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
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Fan Controller
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Typography>
        
        {/* Control Panel Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${theme.palette.divider}`
        }}>
          <FormControlLabel
            control={
              <Switch 
                checked={editAllMode} 
                onChange={(e) => setEditAllMode(e.target.checked)}
                size="medium"
              />
            }
            label={
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Edit All Fans
              </Typography>
            }
          />
          
          {/* Preset Buttons - Modern Chip Style */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={() => handlePresetSpeed('quiet')}
              variant="outlined"
              size="small"
              color="info"
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 'auto',
                px: 2
              }}
            >
              Quiet
            </Button>
            <Button 
              onClick={() => handlePresetSpeed('normal')}
              variant="outlined"
              size="small"
              color="success"
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 'auto',
                px: 2
              }}
            >
              Normal
            </Button>
            <Button 
              onClick={() => handlePresetSpeed('turbo')}
              variant="outlined"
              size="small"
              color="error"
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 'auto',
                px: 2
              }}
            >
              Turbo
            </Button>
          </Box>
        </Box>

        {/* Fan Controls Grid */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.secondary }}>
            Individual Fan Controls
          </Typography>
          <Grid container spacing={2}>
            {fans.map((fan) => (
              <Grid item xs={12} key={fan.name}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        minWidth: 100, 
                        fontWeight: 500,
                        color: theme.palette.text.primary 
                      }}
                    >
                      {fan.name}
                    </Typography>
                    <Slider
                      value={Math.max(10, fanSpeeds[fan.name] || fan.speed)}
                      onChange={(_, value) => handleFanSpeedChange(fan.name, value as number)}
                      min={10}
                      max={100}
                      sx={{ 
                        flex: 1,
                        mx: 1,
                        '& .MuiSlider-thumb': { 
                          width: 20, 
                          height: 20,
                          '&:hover': {
                            boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`
                          }
                        },
                        '& .MuiSlider-track': { 
                          height: 6,
                          borderRadius: 3
                        },
                        '& .MuiSlider-rail': { 
                          height: 6,
                          borderRadius: 3,
                          opacity: 0.3
                        }
                      }}
                    />
                    <TextField
                      value={Math.max(10, fanSpeeds[fan.name] || fan.speed)}
                      onChange={(e) => handleFanSpeedChange(fan.name, Math.max(10, parseInt(e.target.value) || 10))}
                      type="number"
                      inputProps={{ min: 10, max: 100 }}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        width: 80,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': { 
                            borderColor: theme.palette.divider 
                          },
                          '&:hover fieldset': { 
                            borderColor: theme.palette.primary.main 
                          },
                          '&.Mui-focused fieldset': { 
                            borderColor: theme.palette.primary.main 
                          }
                        }
                      }}
                      InputProps={{
                        endAdornment: <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mr: 1 }}>%</Typography>
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Action Buttons - Modern Layout */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'flex-end',
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Button
            variant="outlined"
            onClick={handleUnlock}
            disabled={loading}
            size="large"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 3
            }}
          >
            Unlock Fans
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={loading}
            size="large"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {loading ? 'Updating...' : 'Apply Changes'}
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
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Debug Terminal
        </Typography>
        
        <Paper 
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
            p: 2, 
            height: 300, 
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            color: theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark,
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
                         theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark,
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
