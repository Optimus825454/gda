import React from 'react';
import { Select as MuiSelect, MenuItem, FormControl } from '@mui/material';

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <FormControl fullWidth>
      <MuiSelect
        ref={ref}
        className={`rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        {children}
      </MuiSelect>
    </FormControl>
  );
});

Select.displayName = 'Select';

export { Select }; 