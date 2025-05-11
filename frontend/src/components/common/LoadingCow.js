import React from 'react';
import { Box, keyframes } from '@mui/material';
import { FaCow } from 'react-icons/fa6';

// Yürüme animasyonu
const walk = keyframes`
  0% {
    transform: translateX(-50%) translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateX(-25%) translateY(-5px) rotate(5deg);
  }
  50% {
    transform: translateX(0%) translateY(0px) rotate(0deg);
  }
  75% {
    transform: translateX(25%) translateY(-5px) rotate(-5deg);
  }
  100% {
    transform: translateX(50%) translateY(0px) rotate(0deg);
  }
`;

// Gölge animasyonu
const shadow = keyframes`
  0%, 100% {
    transform: scaleX(1);
    opacity: 0.3;
  }
  50% {
    transform: scaleX(0.7);
    opacity: 0.1;
  }
`;

const LoadingCow = ({ size = 40, color = '#8B4513' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        position: 'relative',
        animation: `${walk} 2s infinite linear`,
        '& svg': {
          fontSize: size,
          color: color,
        }
      }}
    >
      <FaCow />
      <Box
        sx={{
          width: size * 0.8,
          height: size * 0.1,
          borderRadius: '50%',
          backgroundColor: '#0000001a',
          marginTop: '5px',
          animation: `${shadow} 2s infinite linear`,
        }}
      />
    </Box>
  );
};

export default LoadingCow; 