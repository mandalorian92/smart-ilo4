import React, { useEffect, useState } from "react";
import { getSensors, getFans } from "../api";
import { Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";

function Dashboard() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [fans, setFans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [sensorsData, fansData] = await Promise.all([getSensors(), getFans()]);
      setSensors(sensorsData);
      setFans(fansData);
      setLoading(false);
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Live Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Sensors</Typography>
            <ul>
              {sensors.map((s) => (
                <li key={s.name}>
                  {s.name}: {s.reading}°C ({s.status})
                </li>
              ))}
            </ul>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Fan Speeds</Typography>
            <ul>
              {fans.map((f) => (
                <li key={f.name}>
                  {f.name}: {f.speed}%
                </li>
              ))}
            </ul>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default Dashboard;