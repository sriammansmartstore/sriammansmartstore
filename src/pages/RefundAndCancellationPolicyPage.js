import React from 'react';
import { IconButton, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const RefundAndCancellationPolicyPage = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1.5, sm: 2 }, maxWidth: 600, mx: 'auto' }}>
      <IconButton aria-label="back" onClick={() => navigate('/')} sx={{ mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 14, lineHeight: 1.2 }}>Refund and Cancellation Policy</h1>
      <Box sx={{ color: 'text.secondary', fontSize: { xs: '0.98rem', sm: '1.05rem' }, lineHeight: 1.7 }}>
        <p>This refund and cancellation policy outlines how you can cancel or seek a refund for a product/service that you have purchased through the Platform. Under this policy:</p>
        <ul style={{ marginLeft: 24, marginBottom: 16 }}>
          <li>Cancellations will only be considered if the request is made within 10 days of placing the order.</li>
          <li>Cancellation requests may not be entertained if the orders have been communicated to sellers/merchant(s) listed on the Platform and they have initiated the process of shipping, or the product is out for delivery. In such an event, you may choose to reject the product at the doorstep.</li>
          <li>Sri Amman Smart Store does not accept cancellation requests for perishable items like flowers, eatables, etc. However, the refund/replacement can be made if the user establishes that the quality of the product delivered is not good.</li>
          <li>In case of receipt of damaged or defective items, please report to our customer service team. The request would be entertained once the seller/merchant listed on the Platform has checked and determined the same at its own end. This should be reported within 10 days of receipt of products.</li>
          <li>If you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 10 days of receiving the product. The customer service team after looking into your complaint will take an appropriate decision.</li>
          <li>In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them.</li>
          <li>In case of any refunds approved by Sri Amman Smart Store, it will take 10 days for the refund to be processed to you.</li>
        </ul>
      </Box>
    </Box>
  );
};

export default RefundAndCancellationPolicyPage;
