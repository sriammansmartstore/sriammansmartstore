import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import './CartPage.css';
import { db } from "../firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";

const CartPage = () => {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCart = async () => {
      try {
        const cartRef = collection(db, "users", user.uid, "cart");
        const snapshot = await getDocs(cartRef);
        setCartItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user]);

  const handleDelete = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "cart", id));
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + (item.sellingPrice || item.price) * (item.quantity || item.qty), 0);
  return (
    <Box className="cart-root">
      <Typography variant="h5" className="cart-title">Your Cart</Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : cartItems.length === 0 ? (
        <Typography>No items in cart.</Typography>
      ) : cartItems.map(item => (
        <Box key={item.id} className="cart-item">
          <img src={item.imageUrls?.[0] || item.image} alt={item.name} className="cart-item-img" />
          <Box className="cart-item-details">
            <Typography variant="h6">{item.name}</Typography>
            <Typography variant="body2">Qty: {item.quantity || item.qty}</Typography>
            <Typography variant="body2">Price: ₹{item.sellingPrice || item.price}</Typography>
          </Box>
          <Box className="cart-item-actions">
            <IconButton color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
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
