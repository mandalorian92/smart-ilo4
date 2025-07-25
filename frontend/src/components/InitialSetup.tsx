import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Container,
  Stack,
  Paper,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import { 
  Router as RouterIcon,
  Lock as LockIcon, 
  Person as PersonIcon, 
  Security as SecurityIcon,
  Visibility,
  VisibilityOff,
  Cable as TestIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import SystemLogo from './SystemLogo';
import { useAuth } from '../context/AuthContext';
import { saveILoConfig, testILoConnection, getILoStatus, setupAdminPassword } from '../api';

const steps = ['iLO Configuration', 'Admin Password', 'Complete'];

interface ILoConfigData {
  host: string;
  username: string;
  password: string;
}

interface AdminPasswordData {
  newPassword: string;
  confirmPassword: string;
}

export default function InitialSetup() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // iLO Configuration state
  const [iloConfig, setIloConfig] = useState<ILoConfigData>({
    host: '',
    username: '',
    password: ''
  });
  const [showIloPassword, setShowIloPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  
  // Admin Password state
  const [adminPassword, setAdminPassword] = useState<AdminPasswordData>({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  
  const { setupFirstUser, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get the temporary password on component mount
  useEffect(() => {
    const tempPass = localStorage.getItem('temp_admin_password');
    if (tempPass) {
      setTempPassword(tempPass);
    }
  }, []);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handleTestConnection = async () => {
    if (!iloConfig.host || !iloConfig.username || !iloConfig.password) {
      setConnectionError('Please fill in all iLO configuration fields');
      return;
    }

    setTestingConnection(true);
    setConnectionError('');
    setConnectionTested(false);
    
    try {
      const result = await testILoConnection(iloConfig.host, iloConfig.username, iloConfig.password);
      if (result.success) {
        setConnectionTested(true);
        setConnectionError('');
      } else {
        setConnectionError(`Connection failed: ${result.message}`);
        setConnectionTested(false);
      }
    } catch (error) {
      setConnectionError('Failed to test connection. Please check your network and credentials.');
      setConnectionTested(false);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleNext = async () => {
    setError('');
    setSuccess('');
    
    if (activeStep === 0) {
      // Step 1: iLO Configuration
      if (!connectionTested) {
        setError('Please test the connection first to ensure iLO configuration is correct');
        return;
      }
      
      setLoading(true);
      try {
        await saveILoConfig(iloConfig.host, iloConfig.username, iloConfig.password);
        setActiveStep(1);
      } catch (error) {
        setError('Failed to save iLO configuration');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // Step 2: Admin Password
      const passwordErrors = validatePassword(adminPassword.newPassword);
      if (passwordErrors.length > 0) {
        setError(passwordErrors.join('. '));
        return;
      }
      
      if (adminPassword.newPassword !== adminPassword.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      setLoading(true);
      try {
        console.log('Setting up admin password...');
        
        // Clear any existing session data to prevent conflicts
        localStorage.removeItem('ilo_user_session');
        sessionStorage.removeItem('ilo_user_session');
        
        let setupSuccess = false;
        
        // Try API-based setup first (if backend supports it)
        try {
          const apiResult = await setupAdminPassword('admin', adminPassword.newPassword, tempPassword);
          if (apiResult.success) {
            setupSuccess = true;
            console.log('Admin password updated via API');
          }
        } catch (apiError) {
          console.log('API setup not available, falling back to localStorage method');
          
          // Fall back to localStorage-based setup
          setupSuccess = await setupFirstUser('admin', adminPassword.newPassword);
          
          if (setupSuccess) {
            console.log('Admin password updated via localStorage');
          }
        }
        
        if (!setupSuccess) {
          throw new Error('Failed to update admin password - both API and localStorage methods failed');
        }
        
        console.log('Admin password updated successfully');
        
        // Clear the temporary password
        localStorage.removeItem('temp_admin_password');
        
        setActiveStep(2);
        setSuccess('Setup completed successfully! You will be logged out in a few seconds...');
        
        // Auto logout after 3 seconds with proper cleanup
        setTimeout(() => {
          console.log('Auto-logout after setup completion');
          logout();
          
          // Force a clean redirect to login page after a brief delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
        }, 3000);
      } catch (error) {
        console.error('Setup error:', error);
        setError(error instanceof Error ? error.message : 'Failed to update admin password');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setError('');
      setSuccess('');
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RouterIcon color="primary" />
                iLO Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure your iLO connection settings to enable system monitoring and fan control.
              </Typography>
            </Box>

            <TextField
              label="iLO Host/IP Address"
              placeholder="192.168.1.100"
              value={iloConfig.host}
              onChange={(e) => {
                setIloConfig({ ...iloConfig, host: e.target.value });
                setConnectionTested(false);
                setConnectionError('');
              }}
              fullWidth
              variant="outlined"
              helperText="Enter the IP address or hostname of your iLO interface"
            />

            <TextField
              label="iLO Username"
              placeholder="Administrator"
              value={iloConfig.username}
              onChange={(e) => {
                setIloConfig({ ...iloConfig, username: e.target.value });
                setConnectionTested(false);
                setConnectionError('');
              }}
              fullWidth
              variant="outlined"
              helperText="Username with administrative privileges on iLO"
            />

            <TextField
              label="iLO Password"
              type={showIloPassword ? 'text' : 'password'}
              value={iloConfig.password}
              onChange={(e) => {
                setIloConfig({ ...iloConfig, password: e.target.value });
                setConnectionTested(false);
                setConnectionError('');
              }}
              fullWidth
              variant="outlined"
              helperText="Password for the iLO administrator account"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowIloPassword(!showIloPassword)}
                      edge="end"
                    >
                      {showIloPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={testingConnection || !iloConfig.host || !iloConfig.username || !iloConfig.password}
              startIcon={testingConnection ? <CircularProgress size={20} /> : <TestIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </Button>

            {connectionTested && (
              <Alert severity="success" icon={<CheckIcon />}>
                iLO connection verified successfully!
              </Alert>
            )}

            {connectionError && (
              <Alert severity="error">
                {connectionError}
              </Alert>
            )}
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" />
                Set Admin Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create a secure password for the admin account. You'll use this to log in after setup.
              </Typography>
              
              {tempPassword && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Current temporary admin password: <code style={{ 
                      backgroundColor: theme.palette.grey[100], 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    }}>{tempPassword}</code>
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    This temporary password will be replaced with your new secure password.
                  </Typography>
                </Alert>
              )}
            </Box>

            <TextField
              label="New Admin Password"
              type={showNewPassword ? 'text' : 'password'}
              value={adminPassword.newPassword}
              onChange={(e) => setAdminPassword({ ...adminPassword, newPassword: e.target.value })}
              fullWidth
              variant="outlined"
              helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Confirm Admin Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={adminPassword.confirmPassword}
              onChange={(e) => setAdminPassword({ ...adminPassword, confirmPassword: e.target.value })}
              fullWidth
              variant="outlined"
              helperText="Re-enter the password to confirm"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {adminPassword.newPassword && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Password Requirements:
                </Typography>
                <Stack spacing={0.5}>
                  {[
                    { text: 'At least 8 characters', valid: adminPassword.newPassword.length >= 8 },
                    { text: 'Contains uppercase letter', valid: /[A-Z]/.test(adminPassword.newPassword) },
                    { text: 'Contains lowercase letter', valid: /[a-z]/.test(adminPassword.newPassword) },
                    { text: 'Contains number', valid: /[0-9]/.test(adminPassword.newPassword) },
                    { text: 'Passwords match', valid: adminPassword.newPassword === adminPassword.confirmPassword && adminPassword.confirmPassword !== '' }
                  ].map((req, index) => (
                    <Typography
                      key={index}
                      variant="caption"
                      sx={{
                        color: req.valid ? 'success.main' : 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {req.valid ? '✓' : '○'} {req.text}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3} alignItems="center">
            <CheckIcon sx={{ fontSize: 64, color: 'success.main' }} />
            <Typography variant="h5" align="center" gutterBottom>
              Setup Complete!
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary">
              Your iLO configuration has been saved and your admin password has been updated.
              You will be automatically logged out to log in with your new credentials.
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              The system is now preparing your dashboard data...
            </Typography>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      px: 2,
      background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)`
    }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          {/* Header Section */}
          <Box sx={{
            bgcolor: 'background.paper',
            px: { xs: 4, sm: 6 },
            py: { xs: 4, sm: 5 },
            textAlign: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <SystemLogo height={isMobile ? 48 : 56} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem' },
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              Welcome to Smart iLO4
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              Let's get your system configured for optimal performance monitoring
            </Typography>

            {/* Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Content Section */}
          <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {renderStepContent()}
          </CardContent>

          {/* Action Buttons */}
          {activeStep < 2 && (
            <Box sx={{
              px: { xs: 4, sm: 6 },
              py: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading || (activeStep === 0 && !connectionTested)}
                sx={{ minWidth: 120 }}
              >
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  activeStep === steps.length - 2 ? 'Complete Setup' : 'Next'
                )}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
