import React from 'react';
import { Box } from '@mui/material';

interface HPELogoProps {
  height?: number;
}

const HPELogo: React.FC<HPELogoProps> = ({ height = 48 }) => {
  // Calculate width to maintain proper aspect ratio (about 4:1 based on the image)
  const width = height * 4;
  const strokeWidth = height * 0.45; // Much thicker frame - increased from 0.15 to 0.45 (3x thicker)
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: height 
    }}>
      {/* Logo SVG - Green rectangular frame (border only) */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 400 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Green rectangular frame - stroke only */}
        <rect 
          x={strokeWidth/2} 
          y={strokeWidth/2} 
          width={400 - strokeWidth} 
          height={100 - strokeWidth} 
          fill="none"
          stroke="#01A982" 
          strokeWidth={strokeWidth}
        />
      </svg>
    </Box>
  );
};

export default HPELogo;
