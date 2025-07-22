import React from "react";
import { Container, Typography, Box, AppBar, Toolbar } from "@mui/material";
import Dashboard from "./components/Dashboard";
import HistoryChart from "./components/HistoryChart";
import Controls from "./components/Controls";

function App() {
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">iLO4 Fan Controller Dashboard</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Dashboard />
        <HistoryChart />
        <Controls />
      </Container>
    </Box>
  );
}

export default App;