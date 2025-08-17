import React from 'react';
import { Box, Typography, Chip, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const CheckoutHeader = ({ itemCount = 0 }) => {
  const navigate = useNavigate();
  return (
    <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 3 }} sx={{ px: { xs: 2, sm: 0 } }}>
      <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>Checkout</Typography>
      {itemCount > 0 && (
        <Chip 
          label={`${itemCount} item${itemCount > 1 ? 's' : ''}`} 
          color="primary" 
          size="small" 
        />
      )}
    </Box>
  );
};

export default CheckoutHeader;
