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

  // Move fetchCart outside useEffect so it can be reused
  const fetchCart = async () => {
    if (!user) return;
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

  useEffect(() => {
    fetchCart();
  }, [user]);


  const handleDelete = async (id) => {
    console.log('Delete button clicked for id:', id);
    if (!user) {
      console.log('No user found, aborting delete.');
      return;
    }
    try {
      await deleteDoc(doc(db, "users", user.uid, "cart", id));
      console.log('Deleted from Firestore:', id);
      await fetchCart();
      console.log('Refetched cart after delete.');
    } catch (err) {
      console.error('Error deleting item from Firestore:', err);
    }
  };

  const handleQuantityChange = async (id, newQty) => {
    if (!user || newQty < 1) return;
    const itemRef = doc(db, "users", user.uid, "cart", id);
    await updateDoc(itemRef, { quantity: newQty });
    setCartItems(items => items.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const total = cartItems.reduce((sum, item) => sum + (item.sellingPrice || item.price) * (item.quantity || item.qty), 0);
  if (!user) {
    return (
      <Box className="cart-root" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <Typography variant="h5" className="cart-title">Your Cart</Typography>
        <Typography variant="body1" sx={{ mt: 4, mb: 2, color: '#d32f2f', fontWeight: 600, textAlign: 'center' }}>
          Please log in to use the cart.
        </Typography>
        <Button variant="contained" color="primary" sx={{ fontWeight: 700, fontSize: '1.08rem', borderRadius: 8, px: 4, py: 1 }} href="/login">
          Log In
        </Button>
      </Box>
    );
  }
  return (
    <Box className="cart-root">
      <Typography variant="h5" className="cart-title">Your Cart</Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : cartItems.length === 0 ? (
        <Typography>No items in cart.</Typography>
      ) : (
        <Box>
          {cartItems.map((item, index) => {
            const qty = item.quantity || item.qty || 1;
            const pricePerUnit = item.sellingPrice || item.price;
            const itemTotal = pricePerUnit * qty;
            return (
              <Box key={`${item.id}-${index}`} className="cart-item-card">
                <img src={item.imageUrls?.[0] || item.image} alt={item.name} className="cart-item-img" />
                <Box className="cart-item-details">
                  <Typography variant="subtitle1" className="cart-item-name">{item.name}</Typography>
                  <Typography variant="body2" className="cart-item-unit">{item.unitSize} {item.unit && item.unit.toUpperCase()}</Typography>
                  <Box className="cart-qty-row">
                    <IconButton size="small" color="primary" onClick={() => handleQuantityChange(item.id, qty - 1)} disabled={qty <= 1} className="cart-qty-btn">
                      <RemoveIcon />
                    </IconButton>
                    <Typography variant="body2" className="cart-qty-val">{qty}</Typography>
                    <IconButton size="small" color="primary" onClick={() => handleQuantityChange(item.id, qty + 1)} className="cart-qty-btn">
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" className="cart-item-price">₹{pricePerUnit} x {qty} = <b>₹{itemTotal}</b></Typography>
                </Box>
                <Box className="cart-item-actions">
                  <IconButton color="error" className="cart-delete-btn" onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item.id); }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
      <Box className="cart-summary">
        <Typography variant="h6" className="cart-total">Total: ₹{total}</Typography>
        <Button variant="contained" className="checkout-btn" href="/checkout">Checkout</Button>
      </Box>
    </Box>
  );
};
export default CartPage;
