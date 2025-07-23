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
  IconButton
} from '@mui/material';
import { 
  Close as CloseIcon,
  Lock as LockIcon,
  AccessTime as TimeIcon,
  Security as SecurityIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'session' | 'users'>('password');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState<number>(30);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, changePassword, updateSessionTimeout, createUser, deleteUser, getAllUsers } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    if (user) {
      setSessionTimeout(user.sessionTimeout);
    }
  }, [user]);

  React.useEffect(() => {
    if (open) {
      setError('');
      setSuccess('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNewUsername('');
      setNewUserPassword('');
      setActiveTab('password');
    }
  }, [open]);

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

  const handlePasswordChange = async () => {
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from the current password');
      return;
    }

    setLoading(true);

    try {
      const success = await changePassword(oldPassword, newPassword);
      if (success) {
        setSuccess('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError('Current password is incorrect');
      }
    } catch (error) {
      setError('An error occurred while changing the password');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionTimeoutChange = () => {
    setError('');
    setSuccess('');

    updateSessionTimeout(sessionTimeout);
    setSuccess(`Session timeout updated to ${sessionTimeout} minutes`);
  };

  const handleCreateUser = async () => {
    setError('');
    setSuccess('');

    if (!newUsername || !newUserPassword) {
      setError('Please fill in both username and password');
      return;
    }

    const passwordErrors = validatePassword(newUserPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    setLoading(true);

    try {
      const success = await createUser(newUsername, newUserPassword);
      if (success) {
        setSuccess(`User "${newUsername}" created successfully`);
        setNewUsername('');
        setNewUserPassword('');
      } else {
        setError('Username already exists');
      }
    } catch (error) {
      setError('An error occurred while creating the user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const success = await deleteUser(userId);
      if (success) {
        setSuccess(`User "${username}" deleted successfully`);
      } else {
        setError('Cannot delete this user');
      }
    } catch (error) {
      setError('An error occurred while deleting the user');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const timeoutOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
    { value: 480, label: '8 hours' }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          m: isMobile ? 0 : 2
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        p: { xs: 2, sm: 3 },
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Settings
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Tab Navigation */}
        <Box sx={{ 
          display: 'flex', 
          borderBottom: `1px solid ${theme.palette.divider}` 
        }}>
          <Button
            onClick={() => setActiveTab('password')}
            variant="text"
            sx={{
              flex: 1,
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: activeTab === 'password' ? 600 : 400,
              color: activeTab === 'password' ? 'primary.main' : 'text.secondary',
              borderBottom: activeTab === 'password' ? `2px solid ${theme.palette.primary.main}` : 'none',
              py: 2
            }}
            startIcon={<SecurityIcon />}
          >
            Password
          </Button>
          <Button
            onClick={() => setActiveTab('session')}
            variant="text"
            sx={{
              flex: 1,
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: activeTab === 'session' ? 600 : 400,
              color: activeTab === 'session' ? 'primary.main' : 'text.secondary',
              borderBottom: activeTab === 'session' ? `2px solid ${theme.palette.primary.main}` : 'none',
              py: 2
            }}
            startIcon={<TimeIcon />}
          >
            Session
          </Button>
          <Button
            onClick={() => setActiveTab('users')}
            variant="text"
            sx={{
              flex: 1,
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: activeTab === 'users' ? 600 : 400,
              color: activeTab === 'users' ? 'primary.main' : 'text.secondary',
              borderBottom: activeTab === 'users' ? `2px solid ${theme.palette.primary.main}` : 'none',
              py: 2
            }}
            startIcon={<PeopleIcon />}
          >
            Users
          </Button>
        </Box>

        {/* Content */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 2
              }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 2,
                borderRadius: 2
              }}
            >
              {success}
            </Alert>
          )}

          {activeTab === 'password' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Change Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your account password to maintain security
              </Typography>

              <Stack spacing={3}>
                <TextField
                  label="Current Password"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  fullWidth
                  variant="outlined"
                  disabled={loading}
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
                      borderRadius: 2
                    }
                  }}
                />

                <TextField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  variant="outlined"
                  disabled={loading}
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
                      borderRadius: 2
                    }
                  }}
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  variant="outlined"
                  disabled={loading}
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
                      borderRadius: 2
                    }
                  }}
                />

                <Alert severity="info" sx={{ borderRadius: 2 }}>
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
              </Stack>
            </Box>
          )}

          {activeTab === 'session' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Session Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure automatic logout settings for enhanced security
              </Typography>

              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Session Timeout</InputLabel>
                  <Select
                    value={sessionTimeout}
                    label="Session Timeout"
                    onChange={(e) => setSessionTimeout(e.target.value as number)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  >
                    {timeoutOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {user && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>Current session timeout:</strong><br />
                      {user.sessionTimeout} minutes (session will auto-logout after this period of inactivity)
                    </Typography>
                  </Alert>
                )}

                <Typography variant="body2" color="text.secondary">
                  You will be automatically logged out after the specified period of inactivity.
                  Changing this setting will apply to your current session immediately.
                </Typography>
              </Stack>
            </Box>
          )}

          {activeTab === 'users' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                User Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create and manage user accounts for system access
              </Typography>

              <Stack spacing={3}>
                {/* Create New User Section */}
                <Box sx={{ 
                  p: 2, 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 2 
                }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Create New User
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      fullWidth
                      variant="outlined"
                      disabled={loading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      fullWidth
                      variant="outlined"
                      disabled={loading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <Button
                      onClick={handleCreateUser}
                      variant="contained"
                      disabled={loading || !newUsername || !newUserPassword}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500
                      }}
                    >
                      {loading ? <CircularProgress size={20} /> : 'Create User'}
                    </Button>
                  </Stack>
                </Box>

                {/* Existing Users List */}
                <Box sx={{ 
                  p: 2, 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 2 
                }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Existing Users
                  </Typography>
                  <Stack spacing={1}>
                    {getAllUsers().map((userItem) => (
                      <Box
                        key={userItem.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          bgcolor: userItem.id === user?.id ? 'action.selected' : 'background.paper',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1
                        }}
                      >
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {userItem.username}
                            {userItem.isDefault && (
                              <Typography component="span" variant="caption" sx={{ 
                                ml: 1, 
                                color: 'primary.main',
                                bgcolor: 'primary.50',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1
                              }}>
                                Default Admin
                              </Typography>
                            )}
                            {userItem.id === user?.id && (
                              <Typography component="span" variant="caption" sx={{ 
                                ml: 1, 
                                color: 'success.main',
                                bgcolor: 'success.50',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1
                              }}>
                                You
                              </Typography>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(userItem.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        {!userItem.isDefault && userItem.id !== user?.id && (
                          <Button
                            onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                            variant="outlined"
                            color="error"
                            size="small"
                            disabled={loading}
                            sx={{ 
                              borderRadius: 1,
                              textTransform: 'none',
                              minWidth: 'auto',
                              px: 2
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> The default admin user cannot be deleted and provides system access recovery.
                    You cannot delete your own account while logged in.
                  </Typography>
                </Alert>
              </Stack>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, sm: 3 },
        borderTop: `1px solid ${theme.palette.divider}`,
        gap: 1
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Cancel
        </Button>
        
        {activeTab === 'password' ? (
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={loading || !oldPassword || !newPassword || !confirmPassword}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        ) : activeTab === 'session' ? (
          <Button
            onClick={handleSessionTimeoutChange}
            variant="contained"
            disabled={!user || sessionTimeout === user.sessionTimeout}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Apply Changes
          </Button>
        ) : (
          // Users tab - no main action button needed since actions are inline
          null
        )}
      </DialogActions>
    </Dialog>
  );
}
