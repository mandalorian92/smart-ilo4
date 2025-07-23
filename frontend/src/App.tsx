import React, { useState } from "react";
import { Container, Typography, Box, AppBar, Toolbar } from "@mui/material";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import Dashboard from "./components/Dashboard";
import HistoryChart from "./components/HistoryChart";
import FanControls from "./components/FanControls";
import SplashScreen from "./components/SplashScreen";

function AppContent() {
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            iLO4 Fan Controller Dashboard
          </Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Dashboard />
        <HistoryChart />
        <FanControls />
      </Container>
    </Box>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      {showSplash ? (
        <SplashScreen onSplashComplete={handleSplashComplete} />
      ) : (
        <AppContent />
      )}
    </ThemeProvider>
  );
}

export default App;