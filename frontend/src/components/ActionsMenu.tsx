import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Help as HelpIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

interface ActionsMenuProps {
  onSettingsClick: () => void;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({ onSettingsClick }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { logout } = useAuth();
  const { mode, setMode } = useCustomTheme();
  const isDarkMode = mode === 'dark' || (mode === 'system' && theme.palette.mode === 'dark');

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = () => {
    onSettingsClick();
    handleClose();
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleThemeToggle = () => {
    const nextMode = isDarkMode ? 'light' : 'dark';
    setMode(nextMode);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          onClick={handleClick}
          size={isMobile ? "small" : "medium"}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
              bgcolor: `${theme.palette.primary.main}08`
            },
            '&[aria-expanded="true"]': {
              color: 'primary.main',
              bgcolor: `${theme.palette.primary.main}08`
            }
          }}
          aria-controls={open ? 'actions-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-label="Actions menu"
        >
          <MoreVertIcon />
        </IconButton>
      </Tooltip>

      <Menu
        id="actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 180,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            boxShadow: `0 8px 24px ${theme.palette.primary.main}15`,
            bgcolor: 'background.paper',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'text.primary',
              '&:hover': {
                bgcolor: `${theme.palette.primary.main}08`,
                color: 'primary.main',
                '& .MuiListItemIcon-root': {
                  color: 'primary.main'
                }
              },
              '&.Mui-focusVisible': {
                bgcolor: `${theme.palette.primary.main}08`,
                color: 'primary.main',
                '& .MuiListItemIcon-root': {
                  color: 'primary.main'
                }
              }
            }
          }
        }}
        MenuListProps={{
          'aria-labelledby': 'actions-button',
          dense: false
        }}
      >
        {/* Settings */}
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon sx={{ color: 'text.secondary', minWidth: 36 }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Settings"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          />
        </MenuItem>

        {/* Theme Toggle */}
        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon sx={{ color: 'text.secondary', minWidth: 36 }}>
            {isDarkMode ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText 
            primary={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          />
        </MenuItem>

        {/* Divider */}
        <Divider sx={{ my: 0.5 }} />

        {/* Help */}
        <MenuItem onClick={handleClose}>
          <ListItemIcon sx={{ color: 'text.secondary', minWidth: 36 }}>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Help"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          />
        </MenuItem>

        {/* Notifications */}
        <MenuItem onClick={handleClose}>
          <ListItemIcon sx={{ color: 'text.secondary', minWidth: 36 }}>
            <NotificationsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Notifications"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          />
        </MenuItem>

        {/* Divider */}
        <Divider sx={{ my: 0.5 }} />

        {/* Logout */}
        <MenuItem 
          onClick={handleLogout}
          sx={{
            color: 'error.main !important',
            '&:hover': {
              bgcolor: `${theme.palette.error.main}08 !important`,
              color: 'error.main !important',
              '& .MuiListItemIcon-root': {
                color: 'error.main !important'
              }
            }
          }}
        >
          <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ActionsMenu;
