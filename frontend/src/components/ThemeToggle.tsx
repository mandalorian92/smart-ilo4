import React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  SettingsBrightness as SystemIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useTheme, ThemeMode } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { mode, setMode } = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleModeSelect = (selectedMode: ThemeMode) => {
    setMode(selectedMode);
    handleClose();
  };

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <LightIcon />;
      case 'dark':
        return <DarkIcon />;
      case 'system':
        return <SystemIcon />;
      default:
        return <PaletteIcon />;
    }
  };

  const getModeLabel = (themeMode: ThemeMode) => {
    switch (themeMode) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'system':
        return 'System Default';
      default:
        return 'Theme';
    }
  };

  return (
    <>
      <Tooltip title="Change Theme">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          aria-controls={open ? 'theme-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          {getIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="theme-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleModeSelect('light')}
          selected={mode === 'light'}
        >
          <ListItemIcon>
            <LightIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{getModeLabel('light')}</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => handleModeSelect('dark')}
          selected={mode === 'dark'}
        >
          <ListItemIcon>
            <DarkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{getModeLabel('dark')}</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => handleModeSelect('system')}
          selected={mode === 'system'}
        >
          <ListItemIcon>
            <SystemIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{getModeLabel('system')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ThemeToggle;
