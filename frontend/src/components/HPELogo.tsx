import React from 'react';
import { Box, useTheme } from '@mui/material';

interface HPELogoProps {
  height?: number;
}

const HPELogo: React.FC<HPELogoProps> = ({ height = 48 }) => { // Increased default from 32 to 48 (50% larger)
  const theme = useTheme();
  const textColor = theme.palette.mode === 'dark' ? '#ffffff' : '#2c2c2c';
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: height }}>
      <svg
        width={height * 3.5} // Maintain aspect ratio
        height={height}
        viewBox="0 0 140 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* HPE Logo - Simplified version */}
        {/* Main HPE text */}
        <text
          x="0"
          y="28"
          fill={textColor}
          fontSize="30" // Increased from 20 to 30 (50% larger)
          fontFamily="MetricHPE, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontWeight="700"
          letterSpacing="0.75px" // Increased from 0.5px to 0.75px (50% larger)
        >
          HPE
        </text>
        
        {/* Green accent bar - Always HPE green */}
        <rect
          x="0"
          y="32"
          width="63" // Increased from 42 to 63 (50% larger)
          height="4.5" // Increased from 3 to 4.5 (50% larger)
          fill="#01A982"
          rx="2.25" // Increased from 1.5 to 2.25 (50% larger)
        />
        
        {/* Product name */}
        <text
          x="75" // Moved from 50 to 75 to accommodate larger HPE text
          y="20"
          fill={textColor}
          fontSize="16.5" // Increased from 11 to 16.5 (50% larger)
          fontFamily="MetricHPE, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontWeight="500"
          opacity="0.9"
        >
          iLO
        </text>
        <text
          x="75" // Moved from 50 to 75 to accommodate larger HPE text
          y="32"
          fill={textColor}
          fontSize="12" // Increased from 8 to 12 (50% larger)
          fontFamily="MetricHPE, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontWeight="400"
          opacity="0.7"
        >
          Fan Controller
        </text>
      </svg>
    </Box>
  );
};

export default HPELogo;
