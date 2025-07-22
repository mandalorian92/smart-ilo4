import React, { useEffect, useState } from "react";
import { getHistory } from "../api";
import { Card, CardContent, Typography, CircularProgress } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function HistoryChart() {
  const [data, setData] = useState<{ time: string; avgTemp: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const hist = await getHistory();
      setData(hist);
      setLoading(false);
    }
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <CircularProgress />;

  const chartData = {
    labels: data.map((d) => d.time),
    datasets: [
      {
        label: "Avg Temp (°C)",
        data: data.map((d) => d.avgTemp),
        fill: false,
        borderColor: "#1976d2",
        tension: 0.1
      }
    ]
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Past Hour Temperature
        </Typography>
        <Line data={chartData} />
      </CardContent>
    </Card>
  );
}

export default HistoryChart;