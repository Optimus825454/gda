import React from 'react';
import { FormLabel } from '@mui/material';

const Label = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <FormLabel
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </FormLabel>
  );
});

Label.displayName = 'Label';

export { Label }; 