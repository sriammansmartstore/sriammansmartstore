import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import './CartPage.css';
import { db } from "../firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
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

  const handleQuantityChange = async (id, newQty) => {
    if (!user || newQty < 1) return;
    const itemRef = doc(db, "users", user.uid, "cart", id);
    await updateDoc(itemRef, { quantity: newQty });
    setCartItems(items => items.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const total = cartItems.reduce((sum, item) => sum + (item.sellingPrice || item.price) * (item.quantity || item.qty), 0);
  return (
    <Box className="cart-root">
      <Typography variant="h5" className="cart-title">Your Cart</Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : cartItems.length === 0 ? (
        <Typography>No items in cart.</Typography>
      ) : cartItems.map(item => {
        const qty = item.quantity || item.qty || 1;
        const pricePerUnit = item.sellingPrice || item.price;
        const itemTotal = pricePerUnit * qty;
        return (
          <Box key={item.id} className="cart-item">
            <img src={item.imageUrls?.[0] || item.image} alt={item.name} className="cart-item-img" />
            <Box className="cart-item-details">
              <Typography variant="h6">{item.name}</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton size="small" color="primary" onClick={() => handleQuantityChange(item.id, qty - 1)} disabled={qty <= 1} sx={{ border: '1px solid #ccc', background: '#f5f5f5' }}>
                  <RemoveIcon />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center', fontWeight: 500 }}>{qty}</Typography>
                <IconButton size="small" color="primary" onClick={() => handleQuantityChange(item.id, qty + 1)} sx={{ border: '1px solid #ccc', background: '#f5f5f5' }}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Typography variant="body2">Price: ₹{pricePerUnit} x {qty} = <b>₹{itemTotal}</b></Typography>
            </Box>
            <Box className="cart-item-actions">
              <IconButton color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
            </Box>
          </Box>
        );
      })}
      <Box className="cart-summary">
        <Typography variant="h6">Total: ₹{total}</Typography>
        <Button variant="contained" className="checkout-btn" href="/checkout">Checkout</Button>
      </Box>
    </Box>
  );
};
export default CartPage;
