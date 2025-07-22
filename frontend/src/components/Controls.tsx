import React, { useEffect, useState } from "react";
import { getSensors, overrideSensor, resetSensors } from "../api";
import { Card, CardContent, Typography, Button, MenuItem, Select, TextField, Grid, CircularProgress } from "@mui/material";

function Controls() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [value, setValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSensors() {
      setLoading(true);
      const data = await getSensors();
      setSensors(data);
      setLoading(false);
    }
    fetchSensors();
  }, []);

  const handleOverride = async () => {
    if (!selected) return;
    await overrideSensor(selected, value);
    alert("Sensor overridden");
  };

  const handleReset = async () => {
    await resetSensors();
    alert("Sensors reset to default");
  };

  if (loading) return <CircularProgress />;

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Override Sensors / Reset
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              displayEmpty
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Select Sensor</MenuItem>
              {sensors.map((s) => (
                <MenuItem key={s.name} value={s.name}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item>
            <TextField
              type="number"
              label="Override Value"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={handleOverride} disabled={!selected}>
              Override
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" color="secondary" onClick={handleReset}>
              Reset Sensors
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default Controls;