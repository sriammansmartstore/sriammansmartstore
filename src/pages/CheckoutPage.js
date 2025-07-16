import React from "react";
import { Box, Typography, Button } from "@mui/material";
import './CheckoutPage.css';

const orderSummary = {
  items: [
    { name: "Organic Rice", qty: 2, price: 120 },
    { name: "Fresh Vegetables", qty: 1, price: 80 },
  ],
  total: 320,
};

const CheckoutPage = () => {
  return (
    <Box className="checkout-root">
      <Typography variant="h5" className="checkout-title">Checkout</Typography>
      <Box className="checkout-summary">
        {orderSummary.items.map((item, idx) => (
          <Typography key={idx} variant="body1">{item.qty} x {item.name} - ₹{item.price * item.qty}</Typography>
        ))}
        <Typography variant="h6" sx={{ mt: 2 }}>Total: ₹{orderSummary.total}</Typography>
      </Box>
      <Button variant="contained" className="place-order-btn" fullWidth>Place Order</Button>
    </Box>
  );
};
export default CheckoutPage;
