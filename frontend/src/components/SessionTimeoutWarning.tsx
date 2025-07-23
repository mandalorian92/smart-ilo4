import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
  useTheme
} from '@mui/material';
import { Warning as WarningIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function SessionTimeoutWarning() {
  const { timeRemaining, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [warningTime, setWarningTime] = useState(0);
  const theme = useTheme();

  // Show warning when 2 minutes (120 seconds) remain
  const WARNING_THRESHOLD = 120;

  useEffect(() => {
    if (timeRemaining <= WARNING_THRESHOLD && timeRemaining > 0 && !open) {
      setOpen(true);
      setWarningTime(timeRemaining);
    } else if (timeRemaining === 0) {
      setOpen(false);
    }
  }, [timeRemaining, open]);

  const handleExtendSession = () => {
    setOpen(false);
    // In a real application, you might want to make an API call to extend the session
    // For now, we'll just close the dialog and let the natural session continue
  };

  const handleLogoutNow = () => {
    setOpen(false);
    logout();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progressValue = warningTime > 0 ? ((warningTime - timeRemaining) / warningTime) * 100 : 0;

  if (!open || timeRemaining <= 0) return null;

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `2px solid ${theme.palette.warning.main}`
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1
        }}>
          <WarningIcon sx={{ color: 'warning.main', fontSize: 28 }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Session Expiring Soon
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
            Your session will expire automatically for security reasons.
          </Typography>
          <Typography variant="body2">
            You will be logged out in <strong>{formatTime(timeRemaining)}</strong> unless you choose to continue.
          </Typography>
        </Alert>

        {/* Time Remaining Visual */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          mb: 2,
          p: 2,
          bgcolor: 'background.default',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`
        }}>
          <TimeIcon sx={{ color: 'text.secondary' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Time Remaining
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {formatTime(timeRemaining)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: timeRemaining <= 30 ? 'error.main' : 'warning.main',
                  borderRadius: 3
                }
              }}
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Choose "Continue Session" to extend your current session, or "Logout" to securely end your session now.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3,
        gap: 1,
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button
          onClick={handleLogoutNow}
          variant="outlined"
          color="error"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Logout Now
        </Button>
        <Button
          onClick={handleExtendSession}
          variant="contained"
          color="primary"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
}
