import React from 'react';
import { IconButton, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const ShippingPolicyPage = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1.5, sm: 2 }, maxWidth: 600, mx: 'auto' }}>
      <IconButton aria-label="back" onClick={() => navigate('/')} sx={{ mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 14, lineHeight: 1.2 }}>Shipping Policy</h1>
      <Box sx={{ color: 'text.secondary', fontSize: { xs: '0.98rem', sm: '1.05rem' }, lineHeight: 1.7 }}>
        <p>The orders for the user are shipped through registered domestic courier companies and/or speed post only. Orders are shipped within 7 days from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation and delivering of the shipment, subject to courier company/post office norms.</p>
        <ul style={{ marginLeft: 24, marginBottom: 16 }}>
          <li>Platform Owner shall not be liable for any delay in delivery by the courier company/postal authority.</li>
          <li>Delivery of all orders will be made to the address provided by the buyer at the time of purchase.</li>
          <li>Delivery of our services will be confirmed on your email ID as specified at the time of registration.</li>
          <li>If there are any shipping cost(s) levied by the seller or the Platform Owner (as the case be), the same is not refundable.</li>
        </ul>
      </Box>
    </Box>
  );
};

export default ShippingPolicyPage;
