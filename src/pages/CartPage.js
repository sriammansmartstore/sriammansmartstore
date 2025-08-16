import React, { useContext, useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  CircularProgress, 
  Card, 
  CardContent, 
  Divider, 
  Alert,
  Chip,
  Stack
} from "@mui/material";
import { 
  ArrowBack as ArrowBackIcon, 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon
} from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Move fetchCart outside useEffect so it can be reused
  const fetchCart = async () => {
    if (!user) return;
    try {
      const cartRef = collection(db, "users", user.uid, "cart");
      const snapshot = await getDocs(query(cartRef, orderBy("addedAt", "desc")));
      
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle both old and new data structure
          quantity: data.quantity || 1,
          sellingPrice: data.option?.sellingPrice || data.sellingPrice || data.price,
          mrp: data.option?.mrp || data.mrp,
          unitSize: data.option?.unitSize || data.unitSize,
          unit: data.option?.unit || data.unit
        };
      });
      
      setCartItems(items);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);


  const handleDelete = async (id) => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const docRef = doc(db, "users", user.uid, "cart", id);
      await deleteDoc(docRef);
      await fetchCart();
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
        await fetchCart();
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
  
  if (!user) {
    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 980, mx: 'auto' }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
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
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 980, mx: 'auto' }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>Your Cart</Typography>
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
      ) : cartItems.length === 0 ? (
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
                  transition: 'opacity 0.2s'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Product Image */}
                    <Box 
                      sx={{ 
                        width: { xs: 60, sm: 80 }, 
                        height: { xs: 60, sm: 80 }, 
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
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 0.5,
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          lineHeight: 1.3
                        }}
                      >
                        {item.name}
                      </Typography>
                      
                      {(item.unitSize && item.unit) && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mb: 0.5, fontSize: '0.85rem' }}
                        >
                          {item.unitSize} {item.unit.toUpperCase()}
                        </Typography>
                      )}
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600, 
                          color: 'primary.main',
                          fontSize: '0.85rem'
                        }}
                      >
                        ₹{pricePerUnit} per unit
                      </Typography>
                      
                      {/* Mobile Quantity Controls */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleQuantityChange(item.id, qty - 1)}
                            disabled={updating || qty <= 1}
                            sx={{ 
                              border: '1px solid', 
                              borderColor: 'divider',
                              width: 32,
                              height: 32
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
                              fontSize: '1rem'
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
                              width: 32,
                              height: 32
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
                              fontSize: '1.1rem'
                            }}
                          >
                            ₹{itemTotal}
                          </Typography>
                          
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(item.id)}
                            disabled={updating}
                            sx={{ 
                              color: 'error.main',
                              width: 32,
                              height: 32
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Order Summary - Mobile Optimized */}
          <Card sx={{ borderRadius: 2, boxShadow: 2, mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Order Summary</Typography>
              
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Items ({cartItems.length})</Typography>
                  <Typography variant="body2">₹{total}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Delivery</Typography>
                  <Typography variant="body2" color="success.main">FREE</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Taxes</Typography>
                  <Typography variant="body2">Included</Typography>
                </Box>
              </Stack>
              
              <Divider sx={{ my: 2 }} />
              
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center"
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  borderRadius: 3, 
                  p: 2.5, 
                  mb: 3,
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>Total Amount</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', fontSize: '1.4rem' }}>
                  ₹{total}
                </Typography>
              </Box>
              
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
                  fontWeight: 600, 
                  borderRadius: 2, 
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                {updating ? <CircularProgress size={24} /> : 'Proceed to Checkout'}
              </Button>
            </CardContent>
          </Card>
        </Stack>
      )}
      
      {updating && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Updating cart...
        </Alert>
      )}
    </Box>
  );
};
export default CartPage;
