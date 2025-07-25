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
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { 
  Close as CloseIcon,
  Lock as LockIcon,
  People as PeopleIcon,
  Visibility,
  VisibilityOff,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface AccountsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AccountsDialog({ open, onClose }: AccountsDialogProps) {
  const [activeTab, setActiveTab] = useState<'change-password' | 'users'>('change-password');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, changePassword, createUser, deleteUser, getAllUsers, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [users, setUsers] = useState<any[]>([]);

  React.useEffect(() => {
    if (open && activeTab === 'users') {
      loadUsers();
    }
  }, [open, activeTab]);

  const loadUsers = async () => {
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    }
  };

  const handleClose = () => {
    setActiveTab('change-password');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNewUsername('');
    setNewUserPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
    onClose();
  };

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
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting to change password...');
      console.log('Old password length:', oldPassword.length);
      console.log('New password length:', newPassword.length);
      
      const success = await changePassword(oldPassword, newPassword);
      console.log('Change password result:', success);
      
      if (!success) {
        setError('Failed to change password. Please check your current password is correct.');
        return;
      }
      
      console.log('Password change successful - proceeding with logout');
      setSuccess('Password changed successfully! You will be logged out in 3 seconds for security...');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto logout after 3 seconds for security
      setTimeout(() => {
        console.log('Auto-logout after password change for security');
        logout();
        
        // Force redirect to login page
        setTimeout(() => {
          console.log('Redirecting to login page');
          window.location.href = '/login';
        }, 500);
      }, 3000);
    } catch (error: any) {
      console.error('Password change error:', error);
      setError(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newUserPassword) {
      setError('Username and password are required');
      return;
    }

    const passwordErrors = validatePassword(newUserPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createUser(newUsername, newUserPassword);
      setSuccess('User created successfully');
      setNewUsername('');
      setNewUserPassword('');
      loadUsers();
    } catch (error: any) {
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === user?.username) {
      setError('Cannot delete your own account');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      setLoading(true);
      setError('');

      try {
        await deleteUser(username);
        setSuccess('User deleted successfully');
        loadUsers();
      } catch (error: any) {
        setError(error.message || 'Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
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
          Accounts
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
            onClick={() => setActiveTab('change-password')}
            variant="text"
            sx={{
              flex: 1,
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: activeTab === 'change-password' ? 600 : 400,
              color: activeTab === 'change-password' ? 'primary.main' : 'text.secondary',
              borderBottom: activeTab === 'change-password' ? `2px solid ${theme.palette.primary.main}` : 'none',
              py: 2
            }}
            startIcon={<LockIcon />}
          >
            Change Password
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

          {activeTab === 'change-password' && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Change Password
              </Typography>
              
              <TextField
                label="Current Password"
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        edge="end"
                        size="small"
                      >
                        {showOldPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                size="small"
                helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        size="small"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {newPassword && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Password Requirements:
                  </Typography>
                  <Stack spacing={0.5}>
                    {[
                      { text: 'At least 8 characters', valid: newPassword.length >= 8 },
                      { text: 'Contains uppercase letter', valid: /[A-Z]/.test(newPassword) },
                      { text: 'Contains lowercase letter', valid: /[a-z]/.test(newPassword) },
                      { text: 'Contains number', valid: /[0-9]/.test(newPassword) },
                      { text: 'Passwords match', valid: newPassword === confirmPassword && confirmPassword !== '' }
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
          )}

          {activeTab === 'users' && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                User Management
              </Typography>
              
              {/* Add New User Section */}
              <Paper sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Add New User
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Password"
                    type={showNewUserPassword ? "text" : "password"}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    fullWidth
                    size="small"
                    helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                            edge="end"
                            size="small"
                          >
                            {showNewUserPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  {newUserPassword && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Password Requirements:
                      </Typography>
                      <Stack spacing={0.5}>
                        {[
                          { text: 'At least 8 characters', valid: newUserPassword.length >= 8 },
                          { text: 'Contains uppercase letter', valid: /[A-Z]/.test(newUserPassword) },
                          { text: 'Contains lowercase letter', valid: /[a-z]/.test(newUserPassword) },
                          { text: 'Contains number', valid: /[0-9]/.test(newUserPassword) }
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
                  
                  <Button
                    variant="contained"
                    onClick={handleCreateUser}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Create User
                  </Button>
                </Stack>
              </Paper>

              {/* Users List */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Existing Users
              </Typography>
              
              <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow key={userItem.username}>
                        <TableCell>{userItem.username}</TableCell>
                        <TableCell>
                          <Chip 
                            label={userItem.username === user?.username ? 'Current User' : 'Active'} 
                            size="small" 
                            color={userItem.username === user?.username ? 'primary' : 'success'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleDeleteUser(userItem.username)}
                            disabled={userItem.username === user?.username || loading}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
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
        {activeTab === 'change-password' ? (
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={loading || !oldPassword || !newPassword || !confirmPassword}
            startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
