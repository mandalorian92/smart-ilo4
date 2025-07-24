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
import { Lock as LockIcon, Person as PersonIcon } from '@mui/icons-material';
import SystemLogo from './SystemLogo';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    
    try {
      const success = await login(username.trim(), password);
      if (!success) {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('An error occurred during login');
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
              <SystemLogo height={isMobile ? 48 : 56} />
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
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: 'text.primary',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Sign In
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Enter your credentials to access the dashboard
              </Typography>
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
                  autoComplete="current-password"
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
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
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
