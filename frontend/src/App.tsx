import React, { useState } from "react";
import { Container, Typography, Box, AppBar, Toolbar, useTheme, useMediaQuery } from "@mui/material";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import Dashboard from "./components/Dashboard";
import HistoryChart from "./components/HistoryChart";
import FanControls from "./components/FanControls";
import SplashScreen from "./components/SplashScreen";
import HPELogo from "./components/HPELogo";

function AppContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box>
      {/* Responsive App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar 
          sx={{ 
            minHeight: { xs: 56, sm: 64 }, 
            px: { xs: 2, sm: 3 },
            py: 1
          }}
        >
          <HPELogo height={isMobile ? 40 : 54} />
          <Box sx={{ flexGrow: 1 }} />
          <ThemeToggle />
        </Toolbar>
      </AppBar>
      
      {/* Responsive Container */}
      <Container 
        maxWidth={false}
        sx={{ 
          maxWidth: { xs: '100%', sm: '100%', md: 1200, lg: 1400 },
          mt: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: { xs: 2, sm: 3, md: 4 } 
        }}>
          <Dashboard />
          <HistoryChart />
          <FanControls />
        </Box>
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