import React from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import './CartPage.css';

const cartItems = [
  { id: 1, name: "Organic Rice", price: 120, qty: 2, image: "https://source.unsplash.com/featured/?rice" },
  { id: 2, name: "Fresh Vegetables", price: 80, qty: 1, image: "https://source.unsplash.com/featured/?vegetables" },
];

const CartPage = () => {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  return (
    <Box className="cart-root">
      <Typography variant="h5" className="cart-title">Your Cart</Typography>
      {cartItems.map(item => (
        <Box key={item.id} className="cart-item">
          <img src={item.image} alt={item.name} className="cart-item-img" />
          <Box className="cart-item-details">
            <Typography variant="h6">{item.name}</Typography>
            <Typography variant="body2">Qty: {item.qty}</Typography>
            <Typography variant="body2">Price: ₹{item.price}</Typography>
          </Box>
          <Box className="cart-item-actions">
            <IconButton color="error"><DeleteIcon /></IconButton>
          </Box>
        </Box>
      ))}
      <Box className="cart-summary">
        <Typography variant="h6">Total: ₹{total}</Typography>
        <Button variant="contained" className="checkout-btn" href="/checkout">Checkout</Button>
      </Box>
    </Box>
  );
};
export default CartPage;
