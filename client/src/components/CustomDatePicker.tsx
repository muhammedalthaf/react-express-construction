import React from 'react';
import { TextField } from '@mui/material';

interface CustomDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: boolean;
  helperText?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText = ''
}) => {
  return (
    <TextField
      label={label}
      type="date"
      fullWidth
      margin="normal"
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        onChange(date);
      }}
      error={error}
      helperText={helperText}
      InputLabelProps={{
        shrink: true,
      }}
    />
  );
};

export default CustomDatePicker; 