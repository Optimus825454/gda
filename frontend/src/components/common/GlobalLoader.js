import React from 'react';
import { Backdrop, Box, Typography, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLoading } from '../../contexts/LoadingContext';

// Renk değiştiren animasyon için keyframes
const colorCycle = keyframes`
  0% { color: #FFD700; } /* Altın Sarısı */
  25% { color: #FF6347; } /* Domates Kırmızısı */
  50% { color: #ADFF2F; } /* Yeşil Sarı */
  75% { color: #1E90FF; } /* Dodger Mavisi */
  100% { color: #FFD700; } /* Altın Sarısı */
`;

// İnek ikonunun belirli parçaları için animasyon
const CowPartAnimation = styled('path')({
  animation: `${colorCycle} 4s linear infinite`,
});

// Basit bir SVG İnek İkonu
const CowIcon = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    width="100px" 
    height="100px"
    {...props}
  >
    {/* Kafa (Animasyon için stil doğrudan path'e uygulanabilir veya farklı bir renk döngüsü kullanılabilir) */}
    <path 
      fill="#8B4513" 
      d="M42,20 C30,20 20,30 20,42 S30,64 42,64 H58 C70,64 80,54 80,42 S70,20 58,20 H42 Z"
      style={{ animation: `${colorCycle} 4s linear infinite alternate` }} // Kafa için farklı bir animasyon
    />
    {/* Gözler */}
    <circle fill="#FFFFFF" cx="35" cy="38" r="5" />
    <circle fill="#000000" cx="35" cy="38" r="2" />
    <circle fill="#FFFFFF" cx="65" cy="38" r="5" />
    <circle fill="#000000" cx="65" cy="38" r="2" />
    {/* Burun */}
    <path 
      fill="#FFC0CB" 
      d="M45,50 C40,60 60,60 55,50 Z"
      style={{ animation: `${colorCycle} 4s linear infinite alternate`, animationDelay: '1s' }}
    />
    {/* Kulaklar */}
    <path 
      fill="#D2B48C" // Ten rengi kulaklar
      d="M20,35 Q25,25 30,30 Z"
      style={{ animation: `${colorCycle} 4s linear infinite alternate`, animationDelay: '0.5s' }}
    />
    <path 
      fill="#D2B48C" // Ten rengi kulaklar
      d="M80,35 Q75,25 70,30 Z"
      style={{ animation: `${colorCycle} 4s linear infinite alternate`, animationDelay: '1.5s' }}
    />
    {/* Benekler (renkleri sabit kalabilir veya onlar da anime edilebilir) */}
    <circle fill="#4F2A0F" cx="50" cy="30" r="5" /> 
    <circle fill="#4F2A0F" cx="28" cy="50" r="4" />
    <circle fill="#4F2A0F" cx="72" cy="50" r="4" />
  </svg>
);

const GlobalLoader = () => {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <Backdrop
      sx={{ 
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 100,
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
      open={isLoading}
    >
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center"
      >
        <CowIcon sx={{ mb: 2 }} />
        <Typography variant="h6" component="div" sx={{ animation: `${colorCycle} 4s linear infinite alternate` }}>
          {loadingMessage}
        </Typography>
      </Box>
    </Backdrop>
  );
};

export default GlobalLoader; 