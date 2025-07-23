import React, { useState } from 'react';
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
  Paper
} from '@mui/material';
import { Lock as LockIcon, Person as PersonIcon, Security as SecurityIcon } from '@mui/icons-material';
import HPELogo from './HPELogo';
import { useAuth } from '../context/AuthContext';

export default function FirstTimeSetup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setupFirstUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting to set up first user...', { username: username.trim() });
      const success = await setupFirstUser(username.trim(), password);
      console.log('Setup result:', success);
      
      if (!success) {
        setError('Failed to set up user account. Please check the browser console for details.');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('An error occurred during setup: ' + (error as Error).message);
    } finally {
      setLoading(false);
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
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          {/* Header Section - Company Branding */}
          <Box sx={{
            bgcolor: 'background.paper',
            px: { xs: 6, sm: 8 },
            py: { xs: 6, sm: 7 },
            textAlign: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <HPELogo height={isMobile ? 48 : 56} />
            </Box>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              System Management Dashboard
            </Typography>
          </Box>

          {/* Form Section */}
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 1 
              }}>
                <SecurityIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  First Time Setup
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  mb: 2
                }}
              >
                Create your administrator account to secure access to the dashboard
              </Typography>
              
              {/* Security Requirements */}
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: { xs: '0.75rem', sm: '0.8rem' }
                  }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Password Requirements:
                </Typography>
                <Typography variant="body2" component="div">
                  • At least 8 characters long<br/>
                  • Contains uppercase and lowercase letters<br/>
                  • Contains at least one number<br/>
                  • Contains at least one special character
                </Typography>
              </Alert>
            </Box>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={3}>
                <TextField
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  fullWidth
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                  variant="outlined"
                  helperText="Username must be at least 3 characters long"
                  InputProps={{
                    startAdornment: (
                      <PersonIcon sx={{ 
                        color: 'text.secondary', 
                        mr: 1, 
                        fontSize: 20 
                      }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      }
                    }
                  }}
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  autoComplete="new-password"
                  disabled={loading}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <LockIcon sx={{ 
                        color: 'text.secondary', 
                        mr: 1, 
                        fontSize: 20 
                      }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      }
                    }
                  }}
                />

                <TextField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  autoComplete="new-password"
                  disabled={loading}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <LockIcon sx={{ 
                        color: 'text.secondary', 
                        mr: 1, 
                        fontSize: 20 
                      }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      }
                    }
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)',
                    },
                    '&:disabled': {
                      transform: 'none'
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                      Setting Up Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Stack>
            </Box>
          </CardContent>

          {/* Footer Section */}
          <Box sx={{
            px: { xs: 3, sm: 4 },
            py: 3,
            bgcolor: `${theme.palette.background.default}40`,
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center'
          }}>
            {/* Footer content removed */}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
