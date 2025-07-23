import React, { useState } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  AppBar, 
  Toolbar, 
  useTheme, 
  useMediaQuery, 
  Tabs, 
  Tab,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Chip,
  Badge
} from "@mui/material";
import { 
  Home as HomeIcon,
  Visibility as MonitoringIcon,
  Tune as ControlIcon,
  BugReport as DebugIcon,
  NavigateNext as NavigateNextIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ThemeToggle from "./components/ThemeToggle";
import Dashboard from "./components/Dashboard";
import HistoryChart from "./components/HistoryChart";
import FanControls from "./components/FanControls";
import DebugTerminal from "./components/DebugTerminal";
import SplashScreen from "./components/SplashScreen";
import HPELogo from "./components/HPELogo";
import LoginPage from "./components/LoginPage";
import FirstTimeSetup from "./components/FirstTimeSetup";
import SettingsDialog from "./components/SettingsDialog";
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { user, logout } = useAuth();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDebugLog = (message: string) => {
    setDebugLogs(prev => [...prev, message].slice(-20)); // Keep last 20 logs
  };

  const handleLogout = () => {
    logout();
  };

  // Define tab configuration following design guidelines
  const tabs = [
    { 
      label: 'Overview', 
      icon: <HomeIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, 
      description: 'System overview and temperature history'
    },
    { 
      label: 'Monitoring', 
      icon: <MonitoringIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, 
      description: 'Real-time system monitoring'
    },
    { 
      label: 'Control', 
      icon: <ControlIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, 
      description: 'Fan speed control and configuration'
    },
    { 
      label: 'Debug', 
      icon: <DebugIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, 
      description: 'Debug terminal and system logs',
      badge: debugLogs.length > 0 ? debugLogs.length : undefined
    }
  ];

  const currentTab = tabs[tabValue];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Session Timeout Warning */}
      <SessionTimeoutWarning />
      
      {/* Settings Dialog */}
      <SettingsDialog 
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Design System Compliant Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}
      >
        {/* Main Toolbar */}
        <Toolbar 
          sx={{ 
            minHeight: { xs: 56, sm: 64, md: 72 }, 
            px: { xs: 2, sm: 3, md: 4 },
            justifyContent: 'space-between'
          }}
        >
          {/* Left Section - Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <HPELogo height={isMobile ? 28 : isTablet ? 32 : 36} />
          </Box>

          {/* Center Section - User Info and Session (on larger screens) */}
          {!isMobile && user && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              flex: 1,
              justifyContent: 'center',
              maxWidth: 400
            }}>
              <Chip
                size="small"
                label={`Welcome, ${user.username}`}
                color="primary"
                variant="outlined"
                sx={{ 
                  fontWeight: 500,
                  bgcolor: `${theme.palette.primary.main}08`,
                  borderColor: theme.palette.primary.main
                }}
              />
            </Box>
          )}

          {/* Right Section - Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {/* Settings Button */}
            <Tooltip title="Settings">
              <IconButton
                onClick={() => setSettingsOpen(true)}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: `${theme.palette.primary.main}08`
                  }
                }}
              >
                <SettingsIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            {/* Logout Button */}
            <Tooltip title="Logout">
              <IconButton
                onClick={handleLogout}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main',
                    bgcolor: `${theme.palette.error.main}08`
                  }
                }}
              >
                <LogoutIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>
            
            {/* Theme Toggle */}
            <ThemeToggle />
          </Box>
        </Toolbar>

        {/* Secondary Toolbar - Breadcrumbs and Context */}
        <Box sx={{ 
          px: { xs: 2, sm: 3, md: 4 },
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            minHeight: 40
          }}>
            {/* Breadcrumbs */}
            <Breadcrumbs 
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="Navigation breadcrumb"
              sx={{ 
                '& .MuiBreadcrumbs-separator': {
                  color: 'text.disabled'
                }
              }}
            >
              <Link 
                underline="hover" 
                color="inherit" 
                href="#"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                Dashboard
              </Link>
              <Typography 
                color="text.primary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: 500
                }}
              >
                {currentTab.icon}
                <Box component="span" sx={{ ml: 0.5 }}>
                  {currentTab.label}
                </Box>
              </Typography>
            </Breadcrumbs>

            {/* Current Section Description */}
            {!isMobile && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.75rem',
                  fontStyle: 'italic'
                }}
              >
                {currentTab.description}
              </Typography>
            )}
          </Box>
        </Box>
      </AppBar>
      
      {/* Main Content Area */}
      <Box component="main" role="main">
        {/* Responsive Container */}
        <Container 
          maxWidth={false}
          sx={{ 
            maxWidth: { xs: '100%', sm: '100%', md: 1200, lg: 1400 },
            pt: { xs: 2, sm: 3, md: 4 },
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          {/* Design System Compliant Navigation Tabs */}
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            mb: { xs: 2, sm: 3 },
            bgcolor: 'background.paper',
            borderRadius: '8px 8px 0 0',
            overflow: 'hidden'
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="iLO4 Dashboard Navigation"
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              sx={{
                minHeight: { xs: 48, sm: 56 },
                '& .MuiTabs-root': {
                  bgcolor: 'background.paper'
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  bgcolor: 'primary.main'
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  minWidth: { xs: 'auto', sm: 120 },
                  minHeight: { xs: 48, sm: 56 },
                  px: { xs: 1.5, sm: 2, md: 3 },
                  py: { xs: 1, sm: 1.5 },
                  gap: { xs: 0.5, sm: 1 },
                  color: 'text.secondary',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: `${theme.palette.primary.main}08`
                  },
                  '&.Mui-selected': {
                    color: 'primary.main',
                    fontWeight: 600,
                    bgcolor: `${theme.palette.primary.main}12`
                  },
                  '&.Mui-focusVisible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2
                  }
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab 
                  key={tab.label}
                  icon={
                    tab.badge ? (
                      <Badge badgeContent={tab.badge} color="error" variant="dot">
                        {tab.icon}
                      </Badge>
                    ) : tab.icon
                  }
                  iconPosition="start"
                  label={tab.label}
                  {...a11yProps(index)}
                  aria-describedby={`tab-desc-${index}`}
                />
              ))}
            </Tabs>
          </Box>

          {/* Accessible Tab Content with Proper ARIA Labels */}
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
            <TabPanel value={tabValue} index={0}>
              {/* Overview Tab - Temperature History */}
              <Box 
                role="tabpanel"
                aria-labelledby="tab-0"
                aria-describedby="tab-desc-0"
              >
                <div id="tab-desc-0" className="sr-only">
                  System overview showing temperature history and trends
                </div>
                <HistoryChart />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Monitoring Tab - Real-time Dashboard */}
              <Box 
                role="tabpanel"
                aria-labelledby="tab-1"
                aria-describedby="tab-desc-1"
              >
                <div id="tab-desc-1" className="sr-only">
                  Real-time monitoring dashboard with sensor data and system health
                </div>
                <Dashboard />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* Control Tab - Fan Controller */}
              <Box 
                role="tabpanel"
                aria-labelledby="tab-2"
                aria-describedby="tab-desc-2"
              >
                <div id="tab-desc-2" className="sr-only">
                  Fan speed control and system configuration options
                </div>
                <FanControls onDebugLog={handleDebugLog} />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {/* Debug Tab - Debug Terminal */}
              <Box 
                role="tabpanel"
                aria-labelledby="tab-3"
                aria-describedby="tab-desc-3"
              >
                <div id="tab-desc-3" className="sr-only">
                  Debug terminal showing system logs and diagnostic information
                </div>
                <DebugTerminal debugLogs={debugLogs} />
              </Box>
            </TabPanel>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isFirstTimeSetup } = useAuth();

  if (isFirstTimeSetup) {
    return <FirstTimeSetup />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppContent />;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        {showSplash ? (
          <SplashScreen onSplashComplete={handleSplashComplete} />
        ) : (
          <AuthenticatedApp />
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;