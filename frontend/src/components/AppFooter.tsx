import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { formatVersion, getVersionInfo } from '../utils/version';

interface AppFooterProps {
  sx?: object;
}

const AppFooter: React.FC<AppFooterProps> = ({ sx = {} }) => {
  const theme = useTheme();
  const versionInfo = getVersionInfo();

  return (
    <Box
      component="footer"
      role="contentinfo"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 2,
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        minHeight: 48,
        flexShrink: 0,
        ...sx
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontSize: { xs: '0.75rem', sm: '0.8rem' },
          fontWeight: 500,
          textAlign: 'center'
        }}
      >
        {formatVersion(versionInfo.version)}
      </Typography>
    </Box>
  );
};

export default AppFooter;
