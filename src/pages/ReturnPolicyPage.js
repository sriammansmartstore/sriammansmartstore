import React from 'react';
import { IconButton, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const ReturnPolicyPage = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1.5, sm: 2 }, maxWidth: 600, mx: 'auto' }}>
      <IconButton aria-label="back" onClick={() => navigate(-1)} sx={{ mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 14, lineHeight: 1.2 }}>Return Policy</h1>
      <Box sx={{ color: 'text.secondary', fontSize: { xs: '0.98rem', sm: '1.05rem' }, lineHeight: 1.7 }}>
        <p>We offer refund/exchange within first 10 days from the date of your purchase. If 10 days have passed since your purchase, you will not be offered a return, exchange or refund of any kind.</p>
        <ul style={{ marginLeft: 24, marginBottom: 16 }}>
          <li>To become eligible for a return or an exchange:
            <ul style={{ marginLeft: 16 }}>
              <li>The purchased item should be unused and in the same condition as you received it.</li>
              <li>The item must have original packaging.</li>
              <li>If the item was purchased on a sale, then the item may not be eligible for a return/exchange.</li>
              <li>Only such items are replaced by us (based on an exchange request), if such items are found defective or damaged.</li>
            </ul>
          </li>
          <li>There may be a certain category of products/items that are exempted from returns or refunds. Such categories will be identified to you at the time of purchase.</li>
          <li>For accepted exchange/return requests:
            <ul style={{ marginLeft: 16 }}>
              <li>Once your returned product/item is received and inspected by us, we will send you an email to notify you about receipt of the returned/exchanged product.</li>
              <li>If approved after quality check, your request (i.e. return/exchange) will be processed in accordance with our policies.</li>
            </ul>
          </li>
        </ul>
      </Box>
    </Box>
  );
};

export default ReturnPolicyPage;
