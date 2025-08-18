import React, { useContext, useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  CircularProgress, 
  Card, 
  CardContent, 
  Alert,
  Chip,
  Stack
} from "@mui/material";
import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon
} from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Subscribe to cart changes in real time to avoid stale or empty flashes
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const cartRef = collection(db, "users", user.uid, "cart");
    const q = query(cartRef, orderBy("addedAt", "desc"));

    const extractMrp = (obj) => {
      if (!obj || typeof obj !== 'object') return undefined;
      if (obj.mrp != null) return obj.mrp;
      if (obj.mrp12 != null) return obj.mrp12;
      const dynKey = Object.keys(obj).find(k => /^mrp\d+$/i.test(k));
      return dynKey ? obj[dynKey] : undefined;
    };

    const unsub = onSnapshot(q, (snapshot) => {
      try {
        const items = snapshot.docs.map(d => {
          const data = d.data();
          const unit = data.option?.unit || data.unit;
          const unitSize = data.option?.unitSize || data.unitSize;
          const matchedOption = Array.isArray(data.options)
            ? data.options.find(o => o && o.unit === unit && o.unitSize === unitSize)
            : undefined;
          const normalizedMrp = extractMrp(matchedOption)
            ?? extractMrp(data.option)
            ?? extractMrp(data)
            ?? extractMrp(data.options?.[0]);
          return {
            id: d.id,
            ...data,
            quantity: data.quantity || 1,
            sellingPrice: data.option?.sellingPrice || data.sellingPrice || data.price,
            mrp: normalizedMrp,
            unitSize: data.option?.unitSize || data.unitSize,
            unit: data.option?.unit || data.unit
          };
        });
        setCartItems(items);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    }, (err) => {
      console.error('Error subscribing to cart:', err);
      setCartItems([]);
      setLoading(false);
      setHasFetched(true);
    });

    return () => unsub();
  }, [user]);

  // Debounce empty-state display to prevent brief flashes
  useEffect(() => {
    if (!hasFetched) {
      setShowEmpty(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowEmpty(cartItems.length === 0);
    }, 150);
    return () => clearTimeout(timer);
  }, [hasFetched, cartItems.length]);


  const handleDelete = async (id) => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const docRef = doc(db, "users", user.uid, "cart", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting item from cart:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleQuantityChange = async (id, newQty) => {
    if (!user || newQty < 0) return;
    
    setUpdating(true);
    try {
      const item = cartItems.find(item => item.id === id);
      if (!item) return;
      
      const itemRef = doc(db, "users", user.uid, "cart", id);
      
      if (newQty === 0) {
        await deleteDoc(itemRef);
      } else {
        await updateDoc(itemRef, { 
          quantity: newQty,
          lastUpdated: serverTimestamp()
        });
        setCartItems(items => items.map(i => i.id === id ? { ...i, quantity: newQty } : i));
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    } finally {
      setUpdating(false);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.sellingPrice || item.price) * (item.quantity || item.qty), 0);
  
  // While AuthContext is initializing, avoid showing empty/login flicker
  if (user === undefined) {
    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 980, mx: 'auto' }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 980, mx: 'auto' }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>Your Cart</Typography>
        </Box>
        <Card sx={{ borderRadius: 2, boxShadow: 2, textAlign: 'center', py: 4 }}>
          <CardContent>
            <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Sign in to view your cart</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please log in to access your saved items and continue shopping.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/login')}
              sx={{ fontWeight: 600, borderRadius: 2, px: 4, py: 1.5 }}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }
  return (
    // Single-column, mobile-first layout similar to CheckoutPage
    <Box sx={{
      bgcolor: 'grey.50',
      minHeight: '100vh',
      px: { xs: 2, sm: 3, md: 4 },
      py: { xs: 2, sm: 3 },
    }}>
      {/* Header */}
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Your Cart</Typography>
        {cartItems.length > 0 && (
          <Chip 
            label={`${cartItems.length} item${cartItems.length > 1 ? 's' : ''}`} 
            color="primary" 
            size="small" 
          />
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : showEmpty ? (
        <Card sx={{ borderRadius: 2, boxShadow: 2, textAlign: 'center', py: 4 }}>
          <CardContent>
            <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Your cart is empty</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add some items to your cart to get started.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/')}
              sx={{ fontWeight: 600, borderRadius: 2, px: 4, py: 1.5 }}
            >
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {/* Cart Items - Mobile First Design */}
          {cartItems.map((item, index) => {
            const qty = item.quantity || item.qty || 1;
            const pricePerUnit = item.sellingPrice || item.price;
            const itemTotal = pricePerUnit * qty;
            
            return (
              <Card 
                key={`${item.id}-${index}`} 
                sx={{ 
                  borderRadius: 2, 
                  boxShadow: 1,
                  opacity: updating ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                  position: 'relative'
                }}
              >
                {/* Top-right delete */}
                <IconButton
                  size="small"
                  aria-label="Remove item"
                  onClick={() => handleDelete(item.id)}
                  disabled={updating}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: 'error.main',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                {/* Unit price below bin icon */}
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: 44,
                    right: 8,
                    color: 'text.secondary',
                    bgcolor: 'rgba(255,255,255,0.85)',
                    px: 0.5,
                    borderRadius: 0.5,
                    fontWeight: 600
                  }}
                >
                  ₹{pricePerUnit} per unit
                </Typography>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    {/* Product Image */}
                    <Box 
                      sx={{ 
                        width: { xs: 52, sm: 64 }, 
                        height: { xs: 52, sm: 64 }, 
                        borderRadius: 2, 
                        overflow: 'hidden',
                        bgcolor: 'grey.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <img 
                        src={item.imageUrls?.[0] || item.image || 'https://via.placeholder.com/80'} 
                        alt={item.name} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain' 
                        }} 
                      />
                    </Box>
                    
                    {/* Product Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600, 
                              mb: 0.25,
                              fontSize: { xs: '0.9rem', sm: '0.95rem' },
                              lineHeight: 1.3
                            }}
                          >
                            {item.name}
                          </Typography>
                          {(item.unitSize && item.unit) && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ mb: 0.25, fontSize: '0.8rem' }}
                            >
                              {item.unitSize} {item.unit.toUpperCase()}
                            </Typography>
                          )}
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: 'primary.main',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            ml: 1
                          }}
                        >
                          {/* Unit price moved below bin icon */}
                        </Typography>
                      </Box>
                      
                      {/* Mobile Quantity Controls */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleQuantityChange(item.id, qty - 1)}
                            disabled={updating || qty <= 1}
                            sx={{ 
                              border: '1px solid', 
                              borderColor: 'divider',
                              width: 28,
                              height: 28
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              mx: 1.5, 
                              minWidth: 24, 
                              textAlign: 'center', 
                              fontWeight: 600,
                              fontSize: '0.95rem'
                            }}
                          >
                            {qty}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleQuantityChange(item.id, qty + 1)}
                            disabled={updating}
                            sx={{ 
                              border: '1px solid', 
                              borderColor: 'divider',
                              width: 28,
                              height: 28
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 700, 
                              color: 'success.main',
                              fontSize: '1rem'
                            }}
                          >
                            ₹{itemTotal}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}

          {/* Proceed CTA only (no order summary card) */}
          <Box sx={{ mt: 1 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={updating || cartItems.length === 0}
              onClick={() => navigate('/checkout', { 
                state: { 
                  cartItems,
                  orderSummary: {
                    items: cartItems.map(item => ({
                      ...item,
                      qty: item.quantity || item.qty || 1,
                      price: item.sellingPrice || item.price
                    })),
                    total
                  }
                }
              })}
              sx={{ 
                fontWeight: 700,
                borderRadius: 2, 
                py: 1.5,
                fontSize: '1.05rem'
              }}
            >
              {updating ? <CircularProgress size={24} /> : 'Proceed to Checkout'}
            </Button>
          </Box>
        </Stack>
      )}
      
      {updating && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Updating cart...
        </Alert>
      )}
      </Box>
    </Box>
  );
};
export default CartPage;
