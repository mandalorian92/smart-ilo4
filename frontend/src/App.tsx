import React, { useState } from "react";
import { Container, Typography, Box, AppBar, Toolbar, useTheme, useMediaQuery, Tabs, Tab } from "@mui/material";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import Dashboard from "./components/Dashboard";
import HistoryChart from "./components/HistoryChart";
import FanControls from "./components/FanControls";
import DebugTerminal from "./components/DebugTerminal";
import SplashScreen from "./components/SplashScreen";
import HPELogo from "./components/HPELogo";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function AppContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDebugLog = (message: string) => {
    setDebugLogs(prev => [...prev, message].slice(-20)); // Keep last 20 logs
  };

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
        {/* Tabs Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="iLO4 Dashboard Tabs"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 1, sm: 2 }
              }
            }}
          >
            <Tab label="Home" {...a11yProps(0)} />
            <Tab label="Monitoring" {...a11yProps(1)} />
            <Tab label="Control" {...a11yProps(2)} />
            <Tab label="Debug" {...a11yProps(3)} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          {/* Home Tab - Temperature History */}
          <HistoryChart />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Monitoring Tab - Fans and Sensor Data */}
          <Dashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Control Tab - Fan Controller and Sensor Configuration */}
          <FanControls onDebugLog={handleDebugLog} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Debug Tab - Debug Terminal */}
          <DebugTerminal debugLogs={debugLogs} />
        </TabPanel>
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