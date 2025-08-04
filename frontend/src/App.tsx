import React, { useState } from 'react';
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
  Chip,
  Badge,
  Grid
} from "@mui/material";
import HistoryViewer from './components/HistoryViewer';
import { 
  Home as HomeIcon,
  Visibility as MonitoringIcon,
  Tune as ControlIcon,
  BugReport as DebugIcon,
  History as HistoryIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./components/NotificationProvider";
import ActionsMenu from "./components/ActionsMenu";
import Dashboard from "./components/Dashboard";
import HistoryChart from "./components/HistoryChart";
import Controls from "./components/Controls";
import Terminal from "./components/DebugTerminal";
import InformationCard from "./components/InformationCard";
import PowerCard from "./components/PowerCard";
import SensorsHealthOverview from "./components/SensorsHealthOverview";
import RecentActivity from "./components/RecentActivity";
import SplashScreen from "./components/SplashScreen";
import SystemLogo from "./components/SystemLogo";
import LoginPage from "./components/LoginPage";
import InitialSetup from "./components/InitialSetup";
import SettingsDialog from "./components/SettingsDialog";
import AccountsDialog from "./components/AccountsDialog";
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";
import AppFooter from "./components/AppFooter";
import { SPACING } from "./constants/spacing";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = React.memo<TabPanelProps>(function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  // Always render children but control visibility with CSS
  return (
    <div
      role="tabpanel"
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      aria-hidden={value !== index}
      style={{
        display: value === index ? 'block' : 'none'
      }}
      {...other}
    >
      <Box sx={{ py: 3 }}>
        {children}
      </Box>
    </div>
  );
});

// Memoized tab content components to prevent unnecessary re-renders
const OverviewTabContent = React.memo<{}>(function OverviewTabContent() {
  return (
    <Box 
      role="tabpanel"
      aria-labelledby="tab-0"
      aria-describedby="tab-desc-0"
    >
      <div id="tab-desc-0" className="sr-only">
        System overview showing system information and temperature history
      </div>
      
      {/* Top Cards Section */}
      <Box sx={{ mb: SPACING.ROW }}>
        <Grid container spacing={SPACING.CARD}>
          {/* Information Card - First on mobile, left side on desktop */}
          <Grid item xs={12} md={6} lg={4}>
            <InformationCard />
          </Grid>
          
          {/* Power Monitoring Card - Second on mobile, middle on desktop */}
          <Grid item xs={12} md={6} lg={4}>
            <PowerCard />
          </Grid>
          
          {/* System Health Overview Card - Third on mobile, right side on desktop */}
          <Grid item xs={12} md={12} lg={4}>
            <SensorsHealthOverview />
          </Grid>
        </Grid>
      </Box>

      {/* Second Row - System Temperatures and Recent Activity */}
      <Box sx={{ mb: SPACING.ROW }}>
        <Grid container spacing={SPACING.CARD}>
          {/* System Temperatures - Left side */}
          <Grid item xs={12} md={8}>
            <HistoryChart showOnlySystemTemperatures />
          </Grid>
          
          {/* Recent Activity - Right side */}
          <Grid item xs={12} md={4}>
            <RecentActivity />
          </Grid>
        </Grid>
      </Box>
      
      {/* Third Row - Power Supply and Peripheral Temperatures */}
      <Box sx={{ mb: SPACING.ROW }}>
        <Grid container spacing={SPACING.CARD}>
          {/* Power Supply Temperatures - Left side */}
          <Grid item xs={12} md={6}>
            <HistoryChart showOnlyPowerSupply />
          </Grid>
          
          {/* Peripheral Temperatures - Right side */}
          <Grid item xs={12} md={6}>
            <HistoryChart showOnlyPeripheral />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
});

const MonitoringTabContent = React.memo<{}>(function MonitoringTabContent() {
  return (
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
  );
});

interface ControlTabContentProps {
  // Remove onDebugLog prop since we're not using debug logs anymore
}

const ControlTabContent = React.memo<ControlTabContentProps>(function ControlTabContent() {
  return (
    <Box 
      role="tabpanel"
      aria-labelledby="tab-2"
      aria-describedby="tab-desc-2"
    >
      <div id="tab-desc-2" className="sr-only">
        Fan speed control and system configuration options
      </div>
      <Controls />
    </Box>
  );
});

interface LogsTabContentProps {
  // No props needed since Terminal component fetches its own data
}

const LogsTabContent = React.memo<LogsTabContentProps>(function LogsTabContent() {
  return (
    <Box 
      role="tabpanel"
      aria-labelledby="tab-3"
      aria-describedby="tab-desc-3"
    >
      <div id="tab-desc-3" className="sr-only">
        Backend application logs and system messages
      </div>
      <Terminal />
    </Box>
  );
});

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  
  const { user } = useAuth();

  const handleTabChange = (event: React.SyntheticEvent<Element, Event>, newValue: number) => {
    setTabValue(newValue);
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
      label: 'History', 
      icon: <HistoryIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, 
      description: 'Historical data and charts'
    },
    { 
      label: 'Logs', 
      icon: <DebugIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, 
      description: 'Backend logs and system messages'
    }
  ];

  const currentTab = tabs[tabValue];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Session Timeout Warning */}
      <SessionTimeoutWarning />
      
      {/* Settings Dialog */}
      <SettingsDialog 
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Accounts Dialog */}
      <AccountsDialog 
        open={accountsOpen}
        onClose={() => setAccountsOpen(false)}
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
            <SystemLogo height={isMobile ? 28 : isTablet ? 32 : 36} />
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
            {/* Actions Menu */}
            <ActionsMenu 
              onSettingsClick={() => setSettingsOpen(true)} 
              onAccountsClick={() => setAccountsOpen(true)}
            />
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
      <Box component="main" role="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Responsive Container */}
        <Container 
          maxWidth={false}
          sx={{ 
            maxWidth: { xs: '100%', sm: '100%', md: 1200, lg: 1400 },
            pt: { xs: 2, sm: 3, md: 4 },
            px: { xs: 1, sm: 2, md: 3 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* HPE Design System Style Navigation Tabs */}
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            mb: { xs: 2, sm: 3 }
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="iLO4 Dashboard Navigation"
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              sx={{
                '& .MuiTabs-indicator': {
                  height: 2,
                  bgcolor: 'primary.main'
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  minWidth: 'auto',
                  minHeight: 48,
                  px: 2,
                  py: 1.5,
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'text.primary'
                  },
                  '&.Mui-selected': {
                    color: 'primary.main',
                    fontWeight: 600
                  }
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab 
                  key={tab.label}
                  label={tab.label}
                  {...a11yProps(index)}
                  aria-describedby={`tab-desc-${index}`}
                />
              ))}
            </Tabs>
          </Box>

          {/* Accessible Tab Content with Proper ARIA Labels - All content rendered for performance */}
          <Box sx={{ flex: 1 }}>
            <TabPanel value={tabValue} index={0}>
              <OverviewTabContent />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <MonitoringTabContent />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <ControlTabContent />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <HistoryViewer />
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <LogsTabContent />
            </TabPanel>
          </Box>
        </Container>
      </Box>

      {/* App Footer */}
      <AppFooter />
    </Box>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, needsInitialSetup } = useAuth();

  // Prioritize initial setup over login - if iLO needs configuration, show initial setup
  if (needsInitialSetup) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <Box sx={{ flex: 1 }}>
          <InitialSetup />
        </Box>
        <AppFooter />
      </Box>
    );
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
        <NotificationProvider>
          {showSplash ? (
            <SplashScreen onSplashComplete={handleSplashComplete} />
          ) : (
            <AuthenticatedApp />
          )}
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;