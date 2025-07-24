import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Router as RouterIcon,
  Visibility,
  VisibilityOff,
  Cable as TestIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getILoConfig, saveILoConfig, testILoConnection, getAppConfig, saveAppConfig, restartServerWithConfig } from '../api';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'app-config' | 'ilo'>('app-config');
  const [sessionTimeout, setSessionTimeout] = useState<number>(30);
  const [appPort, setAppPort] = useState<number>(8443);
  
  // iLO Configuration state
  const [iloHost, setIloHost] = useState('');
  const [iloUsername, setIloUsername] = useState('');
  const [iloPassword, setIloPassword] = useState('');
  const [showIloPassword, setShowIloPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, updateSessionTimeout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    if (user) {
      setSessionTimeout(user.sessionTimeout);
    }
  }, [user]);

  // Load iLO configuration when dialog opens
  React.useEffect(() => {
    if (open) {
      loadILoConfig();
      loadAppConfig();
    }
  }, [open]);

  const loadAppConfig = async () => {
    try {
      const config = await getAppConfig();
      setAppPort(config.port);
      setSessionTimeout(config.sessionTimeout);
    } catch (error) {
      console.error('Failed to load app config:', error);
      setAppPort(8443);
      setSessionTimeout(30);
    }
  };

  const loadILoConfig = async () => {
    try {
      const config = await getILoConfig();
      if (config.configured) {
        setIloHost(config.host);
        setIloUsername(config.username);
        setIloPassword('');
      }
    } catch (error) {
      console.error('Failed to load iLO config:', error);
    }
  };

  React.useEffect(() => {
    if (open) {
      setError('');
      setSuccess('');
      setIloPassword('');
      setActiveTab('app-config');
    }
  }, [open]);

  const handleSessionTimeoutChange = () => {
    setError('');
    setSuccess('');

    updateSessionTimeout(sessionTimeout);
    setSuccess(`Session timeout updated to ${sessionTimeout} minutes`);
  };

  const handleAppConfigChange = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const currentConfig = await getAppConfig();
      const portChanged = currentConfig.port !== appPort;

      await saveAppConfig({
        port: appPort,
        sessionTimeout: sessionTimeout
      });

      if (portChanged) {
        setSuccess(`Configuration saved successfully. Server will restart on port ${appPort}.`);
        
        setTimeout(async () => {
          try {
            await restartServerWithConfig(appPort);
          } catch (error) {
            console.error('Restart request sent:', error);
          }
        }, 1000);
      } else {
        setSuccess('Configuration saved successfully');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleILoConfigSave = async () => {
    setError('');
    setSuccess('');

    if (!iloHost || !iloUsername || !iloPassword) {
      setError('Please fill in all iLO configuration fields');
      return;
    }

    setLoading(true);

    try {
      await saveILoConfig(iloHost, iloUsername, iloPassword);
      setSuccess('iLO configuration saved successfully');
      setIloPassword('');
    } catch (error: any) {
      setError(error.message || 'Failed to save iLO configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setSuccess('');

    if (!iloHost || !iloUsername || !iloPassword) {
      setError('Please fill in all iLO configuration fields before testing');
      return;
    }

    setTestingConnection(true);

    try {
      const result = await testILoConnection(iloHost, iloUsername, iloPassword);

      if (result.success) {
        setSuccess('Connection successful! iLO is accessible.');
      } else {
        setError(result.message || 'Connection failed');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleClose = () => {
    setActiveTab('app-config');
    setError('');
    setSuccess('');
    setLoading(false);
    setIloPassword('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: { xs: '80vh', sm: 600 }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 2
      }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          System Settings
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        p: 0, 
        height: { xs: 'auto', sm: 500 },
        minHeight: { xs: 400, sm: 500 },
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Tab Navigation */}
        <Box sx={{ 
          display: 'flex', 
          borderBottom: `1px solid ${theme.palette.divider}` 
        }}>
          <Button
            onClick={() => setActiveTab('app-config')}
            variant="text"
            sx={{
              flex: 1,
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: activeTab === 'app-config' ? 600 : 400,
              color: activeTab === 'app-config' ? 'primary.main' : 'text.secondary',
              borderBottom: activeTab === 'app-config' ? `2px solid ${theme.palette.primary.main}` : 'none',
              py: 2
            }}
            startIcon={<TimeIcon />}
          >
            App Configuration
          </Button>
          <Button
            onClick={() => setActiveTab('ilo')}
            variant="text"
            sx={{
              flex: 1,
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: activeTab === 'ilo' ? 600 : 400,
              color: activeTab === 'ilo' ? 'primary.main' : 'text.secondary',
              borderBottom: activeTab === 'ilo' ? `2px solid ${theme.palette.primary.main}` : 'none',
              py: 2
            }}
            startIcon={<RouterIcon />}
          >
            iLO Configuration
          </Button>
        </Box>

        {/* Content */}
        <Box sx={{ 
          flex: 1, 
          p: 4, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {activeTab === 'app-config' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                App Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure application settings and security options
              </Typography>

              <Stack spacing={4}>
                {/* Session Management Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                    Session Management
                  </Typography>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>Session Timeout (minutes)</InputLabel>
                    <Select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(Number(e.target.value))}
                      label="Session Timeout (minutes)"
                      disabled={loading}
                    >
                      <MenuItem value={15}>15 minutes</MenuItem>
                      <MenuItem value={30}>30 minutes</MenuItem>
                      <MenuItem value={60}>1 hour</MenuItem>
                      <MenuItem value={120}>2 hours</MenuItem>
                      <MenuItem value={240}>4 hours</MenuItem>
                    </Select>
                  </FormControl>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Sessions will automatically expire after this period of inactivity
                  </Typography>
                </Box>

                <Divider />

                {/* Application Port Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                    Application Port
                  </Typography>
                  
                  <TextField
                    label="Server Port"
                    type="number"
                    value={appPort}
                    onChange={(e) => setAppPort(Number(e.target.value))}
                    fullWidth
                    size="small"
                    disabled={loading}
                    inputProps={{ min: 1024, max: 65535 }}
                    helperText="Port number for the application server (1024-65535)"
                  />

                  <Alert severity="info" sx={{ borderRadius: 2, mb: 2, mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Automatic Restart:</strong> When you change the port, the server will restart automatically to apply the new setting.
                      Make sure the new port is not already in use.
                    </Typography>
                  </Alert>

                  <Typography variant="body2" color="text.secondary">
                    The application will be accessible at <code>https://your-server:{appPort}</code> after restart.
                    Default port is 8443.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {activeTab === 'ilo' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                iLO Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure connection to HPE iLO management interface
              </Typography>

              <Stack spacing={3}>
                <TextField
                  label="iLO Host/IP Address"
                  value={iloHost}
                  onChange={(e) => setIloHost(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={loading}
                  placeholder="192.168.1.100 or ilo.example.com"
                  helperText="Enter the IP address or hostname of your iLO interface"
                />

                <TextField
                  label="iLO Username"
                  value={iloUsername}
                  onChange={(e) => setIloUsername(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={loading}
                  placeholder="administrator"
                  helperText="iLO username with appropriate privileges"
                />

                <TextField
                  label="iLO Password"
                  type={showIloPassword ? "text" : "password"}
                  value={iloPassword}
                  onChange={(e) => setIloPassword(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={loading}
                  placeholder="Enter iLO password"
                  helperText="Password will not be displayed after saving for security"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowIloPassword(!showIloPassword)}
                          edge="end"
                          size="small"
                        >
                          {showIloPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleTestConnection}
                    disabled={testingConnection || loading || !iloHost || !iloUsername || !iloPassword}
                    startIcon={testingConnection ? <CircularProgress size={20} /> : <TestIcon />}
                    sx={{ minWidth: 140 }}
                  >
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                </Box>

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Requirements:</strong><br/>
                    • iLO must be accessible from this server<br/>
                    • User must have "Login" and "iLO Settings" privileges<br/>
                    • HTTPS connection will be used (self-signed certificates accepted)<br/>
                    • Connection will be tested before saving
                  </Typography>
                </Alert>
              </Stack>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${theme.palette.divider}`,
        justifyContent: 'space-between'
      }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {activeTab === 'app-config' ? (
          <Button
            variant="contained"
            onClick={handleAppConfigChange}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <TimeIcon />}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleILoConfigSave}
            disabled={loading || !iloHost || !iloUsername || !iloPassword}
            startIcon={loading ? <CircularProgress size={20} /> : <RouterIcon />}
          >
            {loading ? 'Saving...' : 'Save iLO Config'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
