import React, { useEffect, useState } from "react";
import { 
  getSensors, 
  getFans, 
  getFansFresh,
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
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { useNotifications } from './NotificationProvider';
import { SPACING } from '../constants/spacing';
import { CARD_STYLES, getCardContainerProps, getNestedCardProps } from '../constants/cardStyles';

// Quick Presets Component - Separate card for preset buttons
function FanPresets() {
  const [fans, setFans] = useState<any[]>([]);
  const [fanSpeeds, setFanSpeeds] = useState<Record<string, number>>({});
  const [globalSpeed, setGlobalSpeed] = useState(25);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotifications();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchFans();
    
    // Set up automatic refresh every 30 seconds for responsive UI
    const interval = setInterval(() => {
      fetchFans();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchFans = async (bustCache = false) => {
    try {
      const data = bustCache ? await getFansFresh() : await getFans();
      setFans(data);
      const speeds: Record<string, number> = {};
      data.forEach((fan: any) => {
        speeds[fan.name] = Math.max(10, fan.speed);
      });
      setFanSpeeds(speeds);
    } catch (error) {
      console.error('Failed to fetch fans:', error);
    }
  };

  const applyPreset = async (speed: number) => {
    try {
      setLoading(true);
      
      // Apply the preset speed to all fans
      setGlobalSpeed(speed);
      const newSpeeds: Record<string, number> = {};
      fans.forEach(fan => newSpeeds[fan.name] = speed);
      setFanSpeeds(newSpeeds);
      
      const presetName = speed === 20 ? 'Quiet' : speed === 45 ? 'Normal' : 'Turbo';
      
      // Apply to system
      await setAllFanSpeeds(speed);
      showNotification('success', `${presetName} preset applied (${speed}%)`);
      
      // Wait for iLO to process changes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Invalidate cache and refresh fan data with fresh data
      await invalidateFanCache();
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchFans(true); // Force cache-busting refresh
      
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      showNotification('error', `Failed to apply preset: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      {...getCardContainerProps(theme)}
    >
      <CardContent {...CARD_STYLES.CONTENT}>
        {/* Single Row Layout - Title/Description on left, Buttons on right */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: SPACING.COMPONENT.LARGE, sm: SPACING.COMPONENT.LARGE }
        }}>
          {/* Left Side - Title and Description */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              {...CARD_STYLES.TITLE}
            >
              Quick Presets
            </Typography>
            <Typography 
              {...CARD_STYLES.SUBTITLE}
            >
              Apply predefined fan speed configurations to all fans
            </Typography>
          </Box>
          
          {/* Right Side - Preset Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: SPACING.COMPONENT.MEDIUM,
            flexWrap: 'wrap',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
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
        </Box>
      </CardContent>
    </Card>
  );
}

// Individual Fan Controls Component - Separate card for detailed fan control
function FanControlCard() {
  const [fans, setFans] = useState<any[]>([]);
  const [fanSpeeds, setFanSpeeds] = useState<Record<string, number>>({});
  const [editAllMode, setEditAllMode] = useState(true);
  const [globalSpeed, setGlobalSpeed] = useState(25);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInteracting, setUserInteracting] = useState<Record<string, boolean>>({});
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { showNotification } = useNotifications();

  useEffect(() => {
    fetchFans().finally(() => setLoading(false));
    
    // Set up automatic refresh every 30 seconds for responsive UI
    const interval = setInterval(() => {
      // Don't show loading on automatic updates, just update data silently
      fetchFans();
    }, 30000);
    
    return () => clearInterval(interval);
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
    
    // Show notification
    showNotification('success', `${presetName} preset applied (${speed}%)`);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      
      if (editAllMode) {
        // If in edit all mode, set all fans to the global speed
        await setAllFanSpeeds(globalSpeed);
        showNotification('success', `All fans set to ${globalSpeed}%`);
      } else {
        // Set individual fan speeds
        for (const [fanName, speed] of Object.entries(fanSpeeds)) {
          const fanIndex = fans.findIndex(f => f.name === fanName);
          if (fanIndex >= 0) {
            await lockFanAtSpeed(fanIndex, speed);
          }
        }
        showNotification('success', 'Fan speeds updated successfully');
      }
      
      // Wait a moment for iLO to process the changes, then refresh fan data
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
      
      await invalidateFanCache();
      
      // Wait a bit for iLO to settle, then refresh
      await new Promise(resolve => setTimeout(resolve, 500)); // Reduced wait time
      await fetchFans(true, true); // Get fresh data, indicate this is after an update
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      console.error('Failed to update fan speeds:', error);
      showNotification('error', `Failed to update fan speeds: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setLoading(true);
      await unlockFanControl();
      showNotification('success', 'Fan control unlocked successfully');
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      console.error('Failed to unlock fan control:', error);
      showNotification('error', `Failed to unlock fan control: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFans(true); // Bust cache to get fresh data
      showNotification('success', 'Fan data refreshed successfully');
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      console.error('Failed to refresh fan data:', error);
      showNotification('error', `Failed to refresh fan data: ${errorMsg}`);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchFans = async (bustCache = false, isAfterUpdate = false) => {
    try {
      // Use fresh data API when cache busting is requested
      const data = bustCache ? await getFansFresh() : await getFans();
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
      console.error('Failed to fetch fans:', error);
    }
  };

  return (
    <Card 
      {...getCardContainerProps(theme)}
    >
        <CardContent {...CARD_STYLES.CONTENT}>
          {/* Header Section */}
          <Box {...CARD_STYLES.HEADER}>
            <Box>
              <Typography 
                {...CARD_STYLES.TITLE}
                component="h2"
              >
                Fan Control
              </Typography>
              <Typography 
                {...CARD_STYLES.SUBTITLE}
              >
                Fine-tune individual fan speeds for optimal cooling performance
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: SPACING.COMPONENT.SMALL, alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: SPACING.COMPONENT.SMALL }}>
                <Tooltip title="Refresh fan data">
                  <IconButton
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    {...CARD_STYLES.REFRESH_BUTTON}
                  >
                    {refreshing ? <CircularProgress size={16} /> : <RefreshIcon {...CARD_STYLES.REFRESH_ICON} />}
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
          <Grid container spacing={SPACING.COMPONENT.LARGE}>
            {fans.map((fan) => (
              <Grid item xs={12} key={fan.name}>
                <Card 
                  {...getNestedCardProps(theme)}
                >
                  <CardContent {...CARD_STYLES.NESTED_CONTENT}>
                    {/* Fan Card Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: SPACING.COMPONENT.MEDIUM
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
                      gap: SPACING.COMPONENT.LARGE
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
            gap: SPACING.COMPONENT.MEDIUM, 
            justifyContent: 'flex-end',
            pt: SPACING.COMPONENT.LARGE,
            mt: SPACING.COMPONENT.LARGE,
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
  );
}

function SafeSensorLimits({ onDebugLog }: { onDebugLog?: (message: string) => void }) {
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [lowLimit, setLowLimit] = useState(20);
  const { showNotification } = useNotifications();

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
      showNotification('warning', 'Please select a sensor first');
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
      showNotification('success', `Low limit set to ${lowLimit}% for ${selectedSensor}`);
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as Error).message;
      addDebugLog(`✗ Sensor configuration failed: ${errorMsg}`);
      console.error('Failed to set low limit:', error);
      showNotification('error', 'Failed to set sensor low limit');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Card 
      {...getCardContainerProps(theme)}
    >
      <CardContent {...CARD_STYLES.CONTENT}>
        {/* Header Section */}
        <Box sx={{ mb: SPACING.COMPONENT.LARGE }}>
          <Typography 
            {...CARD_STYLES.TITLE}
            component="h2"
          >
            Sensor Configuration
          </Typography>
          <Typography 
            {...CARD_STYLES.SUBTITLE}
          >
            Configure threshold limits for environmental sensors
          </Typography>
        </Box>

        {/* Content Section - Form */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Grid container spacing={SPACING.COMPONENT.MEDIUM} alignItems="stretch">
            <Grid item xs={12}>
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

            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
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
                  height: '56px', // Match TextField height
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
        </Box>
      </CardContent>
    </Card>
  );
}

// Sensor Configuration Component (SafeSensorLimits)
function SensorConfiguration() {
  return <SafeSensorLimits />;
}

// Export individual components for flexible usage
export { FanPresets, FanControlCard, SensorConfiguration };

// For backward compatibility, export a combined component
export default function FanControls() {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: SPACING.ROW,
      width: '100%' 
    }}>
      <FanPresets />
      <FanControlCard />
      <SensorConfiguration />
    </Box>
  );
}
