import React from "react";
import { Box, Typography, Button } from "@mui/material";
import './WishlistPage.css';

const wishlistItems = [
  { id: 1, name: "Organic Rice", price: 120, image: "https://source.unsplash.com/featured/?rice" },
  { id: 2, name: "Fresh Vegetables", price: 80, image: "https://source.unsplash.com/featured/?vegetables" },
];

const WishlistPage = () => {
  return (
    <Box className="wishlist-root">
      <Typography variant="h5" className="wishlist-title">Your Wishlist</Typography>
      {wishlistItems.map(item => (
        <Box key={item.id} className="wishlist-item">
          <img src={item.image} alt={item.name} className="wishlist-item-img" />
          <Box className="wishlist-item-details">
            <Typography variant="h6">{item.name}</Typography>
            <Typography variant="body2">Price: ₹{item.price}</Typography>
          </Box>
          <Box className="wishlist-item-actions">
            <Button variant="contained" className="add-to-cart-btn" size="small">Add to Cart</Button>
          </Box>
        </Box>
      ))}
    </Box>
  );
};
export default WishlistPage;
