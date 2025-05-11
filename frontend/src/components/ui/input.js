import React from 'react';
import { TextField } from '@mui/material';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <TextField
      ref={ref}
      type={type}
      variant="outlined"
      fullWidth
      InputProps={{
        sx: {
          backgroundColor: '#1a2332',
          borderRadius: '8px',
          '& fieldset': {
            borderColor: '#2d3748',
          },
          '&:hover fieldset': {
            borderColor: '#4a5568 !important',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#3182ce !important',
          },
          input: {
            color: 'white',
            padding: '12px 16px',
            '&::placeholder': {
              color: '#718096',
              opacity: 1,
            },
          },
        },
      }}
      className={`${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input }; 