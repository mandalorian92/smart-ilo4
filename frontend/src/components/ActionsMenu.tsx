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
  useMediaQuery,
  SvgIcon
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountBox as AccountBoxIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

// Custom Grid Icon Component
const GridIcon: React.FC = () => (
  <SvgIcon viewBox="0 0 24 24">
    <path 
      stroke="currentColor" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      fill="none"
      d="M3 6.2c0-1.12 0-1.68.218-2.108a2 2 0 01.874-.874C4.52 3 5.08 3 6.2 3h.6c1.12 0 1.68 0 2.108.218a2 2 0 01.874.874C10 4.52 10 5.08 10 6.2v.6c0 1.12 0 1.68-.218 2.108a2 2 0 01-.874.874C8.48 10 7.92 10 6.8 10h-.6c-1.12 0-1.68 0-2.108-.218a2 2 0 01-.874-.874C3 8.48 3 7.92 3 6.8v-.6zM14 6.2c0-1.12 0-1.68.218-2.108a2 2 0 01.874-.874C15.52 3 16.08 3 17.2 3h.6c1.12 0 1.68 0 2.108.218a2 2 0 01.874.874C21 4.52 21 5.08 21 6.2v.6c0 1.12 0 1.68-.218 2.108a2 2 0 01-.874.874C19.48 10 18.92 10 17.8 10h-.6c-1.12 0-1.68 0-2.108-.218a2 2 0 01-.874-.874C14 8.48 14 7.92 14 6.8v-.6zM3 17.2c0-1.12 0-1.68.218-2.108a2 2 0 01.874-.874C4.52 14 5.08 14 6.2 14h.6c1.12 0 1.68 0 2.108.218a2 2 0 01.874.874C10 15.52 10 16.08 10 17.2v.6c0 1.12 0 1.68-.218 2.108a2 2 0 01-.874.874C8.48 21 7.92 21 6.8 21h-.6c-1.12 0-1.68 0-2.108-.218a2 2 0 01-.874-.874C3 19.48 3 18.92 3 17.8v-.6zM14 17.2c0-1.12 0-1.68.218-2.108a2 2 0 01.874-.874C15.52 14 16.08 14 17.2 14h.6c1.12 0 1.68 0 2.108.218a2 2 0 01.874.874C21 15.52 21 16.08 21 17.2v.6c0 1.12 0 1.68-.218 2.108a2 2 0 01-.874.874C19.48 21 18.92 21 17.8 21h-.6c-1.12 0-1.68 0-2.108-.218a2 2 0 01-.874-.874C14 19.48 14 18.92 14 17.8v-.6z"
    />
  </SvgIcon>
);

interface ActionsMenuProps {
  onSettingsClick: () => void;
  onAccountsClick: () => void;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({ onSettingsClick, onAccountsClick }) => {
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

  const handleAccountsClick = () => {
    onAccountsClick();
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
          <GridIcon />
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
        {/* Accounts */}
        <MenuItem onClick={handleAccountsClick}>
          <ListItemIcon sx={{ color: 'text.secondary', minWidth: 36 }}>
            <AccountBoxIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Accounts"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          />
        </MenuItem>

        {/* System Settings */}
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon sx={{ color: 'text.secondary', minWidth: 36 }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="System Settings"
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
