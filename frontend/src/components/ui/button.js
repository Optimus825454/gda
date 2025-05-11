import React from 'react';
import { Button as MuiButton } from '@mui/material';

const Button = React.forwardRef(({ className, variant = 'contained', color = 'primary', children, ...props }, ref) => {
  const getButtonStyles = () => {
    const baseStyles = 'rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200';
    
    const variantStyles = {
      buy: 'bg-green-500 hover:bg-green-600 text-white',
      sell: 'bg-red-500 hover:bg-red-600 text-white',
      contained: 'bg-blue-600 hover:bg-blue-700 text-white',
      outlined: 'border-2 border-gray-700 hover:border-gray-600 bg-transparent text-gray-300 hover:text-white',
      text: 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white'
    };

    return `${baseStyles} ${variantStyles[variant] || variantStyles.contained} ${className || ''}`;
  };

  return (
    <MuiButton
      ref={ref}
      variant={variant === 'text' ? 'text' : 'contained'}
      className={getButtonStyles()}
      disableElevation
      {...props}
    >
      {children}
    </MuiButton>
  );
});

Button.displayName = 'Button';

export { Button }; 