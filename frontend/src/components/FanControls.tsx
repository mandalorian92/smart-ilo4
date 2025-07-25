import React, { useEffect, useState } from "react";
import { 
  getSensors, 
  getFans, 
  setAllFanSpeeds,
  unlockFanControl,
  lockFanAtSpeed,
  invalidateFanCache,
  setSensorLowLimit
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
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";function FanControls({ onDebugLog }: { onDebugLog?: (message: string) => void }) {
  const [fans, setFans] = useState<any[]>([]);
  const [fanSpeeds, setFanSpeeds] = useState<Record<string, number>>({});
  const [editAllMode, setEditAllMode] = useState(true);
  const [globalSpeed, setGlobalSpeed] = useState(25);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const [userInteracting, setUserInteracting] = useState<Record<string, boolean>>({});
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logMessage].slice(-20)); // Keep last 20 logs
    
    // Call the external callback if provided
    if (onDebugLog) {
      onDebugLog(logMessage);
    }
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

  const applyPreset = (speed: number) => {
    // Apply the preset speed to all fans
    setGlobalSpeed(speed);
    const newSpeeds: Record<string, number> = {};
    fans.forEach(fan => newSpeeds[fan.name] = speed);
    setFanSpeeds(newSpeeds);
    
    // Enable edit all mode for clarity
    setEditAllMode(true);
    
    // Add debug logging for preset application
    const presetName = speed === 20 ? 'Quiet' : speed === 45 ? 'Normal' : 'Turbo';
    addDebugLog(`${presetName} preset applied - setting all fans to ${speed}%`);
    addDebugLog(`Edit All mode automatically enabled for preset application`);
    
    // Show notification
    showNotification(`${presetName} preset applied (${speed}%)`, 'success');
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

  const handleRefresh = async () => {
    setRefreshing(true);
    addDebugLog('Refreshing fan data...');
    try {
      await fetchFans(true); // Bust cache to get fresh data
      showNotification('Fan data refreshed successfully', 'success');
      addDebugLog('✓ Fan data refreshed successfully');
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      addDebugLog(`✗ Refresh error: ${errorMsg}`);
      console.error('Failed to refresh fan data:', error);
      showNotification(`Failed to refresh fan data: ${errorMsg}`, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchFans = async (bustCache = false, isAfterUpdate = false) => {
    try {
      // Add cache busting parameter when needed
      const url = bustCache ? `/fans?_t=${Date.now()}` : '/fans';
      const data = await getFans();
      setFans(data);
      
      const speeds: Record<string, number> = {};
      data.forEach((fan: any) => {
        // Only update fan speed if user is not currently interacting with that fan's slider
        if (userInteracting[fan.name]) {
          // Preserve the current slider value while user is interacting
          speeds[fan.name] = fanSpeeds[fan.name] || Math.max(10, fan.speed);
        } else {
          // Update with fresh data when user is not interacting
          speeds[fan.name] = Math.max(10, fan.speed);
        }
      });
      
      // If this refresh is after an update and we're in Edit All mode,
      // we should make sure all sliders show the same value
      if (isAfterUpdate && editAllMode) {
        // In Edit All mode after update, set all fan speeds to match the global speed
        // This prevents the "drift" issue where one slider shows different value
        addDebugLog(`Edit All mode: synchronizing all sliders to ${globalSpeed}%`);
        data.forEach((fan: any) => {
          // Only sync non-interacting sliders
          if (!userInteracting[fan.name]) {
            speeds[fan.name] = globalSpeed;
          }
        });
      }
      
      setFanSpeeds(speeds);
      
      // Update global speed to match if all fans are at the same speed (excluding interacting ones)
      const nonInteractingSpeeds = Object.entries(speeds)
        .filter(([fanName]) => !userInteracting[fanName])
        .map(([, speed]) => speed);
      
      if (nonInteractingSpeeds.length > 0) {
        const uniqueSpeeds = Array.from(new Set(nonInteractingSpeeds));
        if (uniqueSpeeds.length === 1) {
          setGlobalSpeed(uniqueSpeeds[0]);
        }
      }
    } catch (error) {
      addDebugLog(`✗ Failed to fetch fans: ${(error as Error).message}`);
      console.error('Failed to fetch fans:', error);
    }
  };

  return (
    <Box component="section" role="main" aria-label="Fan Control System">
      {/* System Page Header */}
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
            alignItems: 'center'
          }}
        >
          Fan Control System
          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            mb: 0
          }}
        >
          Monitor and control system cooling fans with precision speed management
        </Typography>
      </Box>

      {/* Fan Speed Presets - System Action Bar */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 4,
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
              Quick Presets
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: 'text.secondary'
              }}
            >
              Apply predefined fan speed configurations
            </Typography>
          </Box>
          
          {/* Content Section - Preset Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            <Button 
              onClick={() => applyPreset(20)}
              variant="outlined"
              size={isMobile ? "medium" : "large"}
              color="info"
              disabled={loading}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1.5,
                minWidth: 120,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            >
              Quiet
            </Button>
            <Button 
              onClick={() => applyPreset(45)}
              variant="outlined"
              size={isMobile ? "medium" : "large"}
              color="success"
              disabled={loading}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1.5,
                minWidth: 120,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            >
              Normal
            </Button>
            <Button 
              onClick={() => applyPreset(95)}
              variant="outlined"
              size={isMobile ? "medium" : "large"}
              color="error"
              disabled={loading}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1.5,
                minWidth: 120,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            >
              Turbo
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Individual Fan Controls - System Content Grid */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 4,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header Section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 3
          }}>
            <Box>
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
                Fan Control
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  color: 'text.secondary'
                }}
              >
                Fine-tune individual fan speeds for optimal cooling performance
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Refresh fan data">
                  <IconButton
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    {refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={editAllMode} 
                      onChange={(e) => setEditAllMode(e.target.checked)}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      Edit All
                    </Typography>
                  }
                />
              </Box>
            </Box>
          </Box>
          
          {/* Content Section - Fan Control Grid */}
          <Grid container spacing={3}>
            {fans.map((fan) => (
              <Grid item xs={12} key={fan.name}>
                <Card 
                  elevation={0}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 4px 12px ${theme.palette.primary.main}15`
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Fan Card Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'text.primary'
                        }}
                      >
                        {fan.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.875rem'
                        }}
                      >
                        Current: {fan.speed}% • Status: {fan.health}
                      </Typography>
                    </Box>
                    
                    {/* Fan Control Content */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 3
                    }}>
                      <Slider
                        value={Math.max(10, fanSpeeds[fan.name] || fan.speed)}
                        onChange={(_, value) => handleFanSpeedChange(fan.name, value as number)}
                        onChangeCommitted={() => {
                          // Clear interaction state when user finishes dragging
                          setUserInteracting(prev => ({ ...prev, [fan.name]: false }));
                        }}
                        onMouseDown={() => {
                          // Set interaction state when user starts dragging
                          setUserInteracting(prev => ({ ...prev, [fan.name]: true }));
                        }}
                        onTouchStart={() => {
                          // Set interaction state for touch devices
                          setUserInteracting(prev => ({ ...prev, [fan.name]: true }));
                        }}
                        min={10}
                        max={100}
                        sx={{ 
                          flex: 1,
                          '& .MuiSlider-thumb': { 
                            width: 24, 
                            height: 24,
                            '&:hover': {
                              boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`
                            }
                          },
                          '& .MuiSlider-track': { 
                            height: 8,
                            borderRadius: 4
                          },
                          '& .MuiSlider-rail': { 
                            height: 8,
                            borderRadius: 4,
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
                          width: 100,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          },
                          '& .MuiInputBase-input': {
                            textAlign: 'center',
                            fontSize: '0.875rem'
                          }
                        }}
                        InputProps={{
                          endAdornment: <Typography variant="body2" sx={{ 
                            color: 'text.secondary', 
                            fontSize: '0.75rem'
                          }}>%</Typography>
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Footer Section - Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2, 
            justifyContent: 'flex-end',
            pt: 3,
            mt: 3,
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
                px: 4,
                py: 1.5,
                fontSize: '1rem'
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
                px: 4,
                py: 1.5,
                boxShadow: 2,
                fontSize: '1rem',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              {loading ? 'Applying Changes...' : 'Apply Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* System Design Toast Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={8000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            minWidth: '384px', // System medium width
            borderRadius: '8px',
            boxShadow: theme.shadows[8],
            backgroundColor: 'background.paper',
            color: 'text.primary',
            border: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity} 
          variant="outlined"
          sx={{ 
            width: '100%',
            minWidth: '384px',
            backgroundColor: 'background.paper',
            border: `1px solid ${
              notification.severity === 'success' ? theme.palette.success.main :
              notification.severity === 'error' ? theme.palette.error.main :
              notification.severity === 'warning' ? theme.palette.warning.main :
              theme.palette.info.main
            }`,
            '& .MuiAlert-icon': {
              fontSize: '20px'
            },
            '& .MuiAlert-message': {
              fontSize: '0.875rem',
              fontWeight: 500
            },
            '& .MuiAlert-action': {
              padding: 0,
              '& .MuiIconButton-root': {
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function SafeSensorLimits({ onDebugLog }: { onDebugLog?: (message: string) => void }) {
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [lowLimit, setLowLimit] = useState(20);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    // Call the external callback if provided
    if (onDebugLog) {
      onDebugLog(logMessage);
    }
  };

  useEffect(() => {
    async function fetchSensors() {
      try {
        const data = await getSensors();
        // Filter out CPU, RAM, and Power Supply sensors
        const safeSensors = data.filter((sensor: any) => {
          const name = sensor.name.toLowerCase();
          return !name.includes('cpu') && 
                 !name.includes('ram') && 
                 !name.includes('memory') &&
                 !name.includes('power') &&
                 !name.includes('pwr') &&
                 !name.includes('supply') &&
                 !name.includes('dimm');
        });
        setSensors(safeSensors);
      } catch (error) {
        console.error('Failed to fetch sensors:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSensors();
  }, []);

  const handleSetLowLimit = async () => {
    if (!selectedSensor) {
      addDebugLog('❌ Sensor configuration failed: No sensor selected');
      setNotification({
        open: true,
        message: 'Please select a sensor first',
        severity: 'warning'
      });
      return;
    }

    try {
      const sensorIndex = sensors.findIndex(s => s.name === selectedSensor);
      const sensorId = sensorIndex + 1;
      const iloValue = lowLimit * 100;
      
      addDebugLog(`Starting sensor configuration for: ${selectedSensor}`);
      addDebugLog(`Sensor ID: ${sensorId}, Low limit: ${lowLimit}%, iLO value: ${iloValue}`);
      
      await setSensorLowLimit(sensorId, iloValue);
      
      addDebugLog(`✓ Sensor configuration successful: ${selectedSensor} low limit set to ${lowLimit}%`);
      setNotification({
        open: true,
        message: `Low limit set to ${lowLimit}% for ${selectedSensor}`,
        severity: 'success'
      });
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      addDebugLog(`✗ Sensor configuration failed: ${errorMsg}`);
      console.error('Failed to set low limit:', error);
      setNotification({
        open: true,
        message: 'Failed to set sensor low limit',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
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
            Sensor Configuration
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              color: 'text.secondary'
            }}
          >
            Configure threshold limits for environmental sensors
          </Typography>
        </Box>

        {/* Content Section - Form */}
        <Grid container spacing={3} alignItems="end">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="sensor-select-label">Select Sensor</InputLabel>
              <Select
                labelId="sensor-select-label"
                value={selectedSensor}
                label="Select Sensor"
                onChange={(e) => setSelectedSensor(e.target.value)}
                sx={{ 
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }
                }}
              >
                {sensors.map((sensor) => (
                  <MenuItem key={sensor.name} value={sensor.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {sensor.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({sensor.reading}°C)
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Low Limit"
              type="number"
              value={lowLimit}
              onChange={(e) => setLowLimit(parseInt(e.target.value) || 20)}
              fullWidth
              variant="outlined"
              InputProps={{
                endAdornment: <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>%</Typography>
              }}
              inputProps={{ min: 10, max: 100, step: 1 }}
              sx={{
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                  pr: 0.5
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              onClick={handleSetLowLimit}
              disabled={!selectedSensor}
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
              Set Limit
            </Button>
          </Grid>
        </Grid>

        {/* HPE Design System Toast Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={8000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            '& .MuiSnackbarContent-root': {
              minWidth: '384px', // HPE medium width
              borderRadius: '8px',
              boxShadow: theme.shadows[8],
              backgroundColor: 'background.paper',
              color: 'text.primary',
              border: `1px solid ${theme.palette.divider}`
            }
          }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity} 
            variant="outlined"
            sx={{ 
              width: '100%',
              minWidth: '384px',
              backgroundColor: 'background.paper',
              border: `1px solid ${
                notification.severity === 'success' ? theme.palette.success.main :
                notification.severity === 'error' ? theme.palette.error.main :
                notification.severity === 'warning' ? theme.palette.warning.main :
                theme.palette.info.main
              }`,
              '& .MuiAlert-icon': {
                fontSize: '20px'
              },
              '& .MuiAlert-message': {
                fontSize: '0.875rem',
                fontWeight: 500
              },
              '& .MuiAlert-action': {
                padding: 0,
                '& .MuiIconButton-root': {
                  padding: '4px',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }
              }
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}

export default function Controls({ onDebugLog }: { onDebugLog?: (message: string) => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <FanControls onDebugLog={onDebugLog} />
      <SafeSensorLimits onDebugLog={onDebugLog} />
    </Box>
  );
}
