import React from "react";
import { Box, Typography, Button } from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router-dom";
import './PaymentOptionsPage.css';

const paymentOptions = [
  { id: 1, name: "Credit/Debit Card", icon: <CreditCardIcon color="primary" /> },
  { id: 2, name: "UPI/Wallet", icon: <AccountBalanceWalletIcon color="primary" /> },
  { id: 3, name: "Cash on Delivery", icon: <CurrencyRupeeIcon color="primary" /> },
];

const PaymentOptionsPage = () => {
  const navigate = useNavigate();
  return (
    <Box className="payment-root">
      <Box display="flex" alignItems="center" mb={1}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="payment-title" sx={{ flex: 1 }}>Select Payment Option</Typography>
      </Box>
      <Box className="payment-options">
        {paymentOptions.map(opt => (
          <Box key={opt.id} className="payment-option-card">
            <Box display="flex" alignItems="center" gap={2}>
              {opt.icon}
              <Typography variant="body1">{opt.name}</Typography>
            </Box>
            <Button variant="contained" className="pay-btn">Pay</Button>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
export default PaymentOptionsPage;
