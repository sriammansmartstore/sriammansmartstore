import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useNavigate } from 'react-router-dom';

const EmptyCheckout = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: { xs: 0, sm: 2, md: 3 }, minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ borderRadius: { xs: 0, sm: 2 }, boxShadow: { xs: 'none', sm: 2 }, width: '100%', maxWidth: 500, textAlign: 'center' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <ShoppingBagIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Your cart is empty</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Looks like you haven't added anything to your cart yet.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            sx={{ fontWeight: 600, borderRadius: 2, px: 4, py: 1.5 }}
          >
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmptyCheckout;
