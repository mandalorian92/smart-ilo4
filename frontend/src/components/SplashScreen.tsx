import React, { useEffect, useState } from 'react';
import { Box, Zoom } from '@mui/material';

interface SplashScreenProps {
  onSplashComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onSplashComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      // Give fade transition time to complete before calling onSplashComplete
      setTimeout(() => {
        onSplashComplete();
      }, 500); // Match the fade transition duration
    }, 1500); // Show for 1.5 seconds

    return () => clearTimeout(timer);
  }, [onSplashComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1f2532',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(1.2)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
      }}
    >
      <Box
        sx={{
          width: '300px',
          height: 'auto',
          maxWidth: '80vw',
        }}
      >
        {/* HPE Logo SVG */}
        <svg
          width="100%"
          height="auto"
          viewBox="0 0 400 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* HPE Green Rectangle */}
          <rect x="50" y="15" width="300" height="20" fill="#01A982" rx="2" />
        </svg>
      </Box>
    </Box>
  );
};

export default SplashScreen;
