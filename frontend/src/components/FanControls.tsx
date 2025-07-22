import React, { useEffect, useState } from "react";
import { getSensors, getFans, overrideSensor, resetSensors } from "../api";
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
  Paper
} from "@mui/material";

function FanControls() {
  const [fans, setFans] = useState<any[]>([]);
  const [fanSpeeds, setFanSpeeds] = useState<Record<string, number>>({});
  const [editAllMode, setEditAllMode] = useState(false);
  const [globalSpeed, setGlobalSpeed] = useState(21);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFans() {
      try {
        const data = await getFans();
        setFans(data);
        const speeds: Record<string, number> = {};
        data.forEach((fan: any) => speeds[fan.name] = fan.speed);
        setFanSpeeds(speeds);
      } catch (error) {
        console.error('Failed to fetch fans:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFans();
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
    // TODO: Implement actual fan speed setting via API
    console.log('Updating fan speeds:', fanSpeeds);
    alert('Fan speeds updated!');
  };

  const handleReset = () => {
    // Reset to original speeds
    const originalSpeeds: Record<string, number> = {};
    fans.forEach(fan => originalSpeeds[fan.name] = fan.speed);
    setFanSpeeds(originalSpeeds);
  };

  const handleUnlock = () => {
    alert('This would unlock manual fan control via SSH to iLO');
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleUpdate}
            sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#229954' } }}
          >
            Update
          </Button>
          <Button
            variant="contained"
            onClick={handleReset}
            sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            onClick={handleUnlock}
            sx={{ bgcolor: '#34495e', '&:hover': { bgcolor: '#2c3e50' } }}
          >
            Unlock
          </Button>
        </Box>
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
