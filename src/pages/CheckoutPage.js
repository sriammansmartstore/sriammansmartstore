import React, { useContext, useEffect, useState } from "react";
import { Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, CircularProgress, Card, CardContent, Grid, Divider, Alert, Chip, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import AddIcon from "@mui/icons-material/Add";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { getFirestore, collection, onSnapshot, doc, getDoc, getDocs } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";

// orderSummary will be calculated from cartItems

const CheckoutPage = () => {
  const { user } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setCartItems([]);
      setUserProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Real-time listener for addresses
    const addressesCol = collection(db, "users", user.uid, "addresses");
    const unsubscribeAddresses = onSnapshot(addressesCol, (snapshot) => {
      const addrList = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setAddresses(addrList);
      if (addrList.length > 0) setSelectedAddress(addrList[0].id);
    });
    // One-time fetch for cart items
    const cartCol = collection(db, "users", user.uid, "cart");
    getDocs(cartCol).then(cartSnap => {
      setCartItems(cartSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
    });
    // One-time fetch for user profile
    getDoc(doc(db, "users", user.uid)).then(userDoc => {
      setUserProfile(userDoc.data());
      setLoading(false);
    });
    return () => unsubscribeAddresses();
  }, [user]);

  const handleAddressChange = (event) => {
    setSelectedAddress(event.target.value);
  };

  // Helper to get selected address object
  const getSelectedAddressObj = () => addresses.find(addr => addr.id === selectedAddress);

  // If coming from wishlist review, use those items instead of cart
  const wishlistItems = location.state?.source === "wishlist" ? location.state.items : null;
  const orderSummary = wishlistItems
    ? {
        items: wishlistItems.map(item => {
          // Try to get option details if present
          let selectedOption = null;
          if (Array.isArray(item.options)) {
            // Try to match selected unit/unitSize if present
            selectedOption = item.options.find(opt =>
              (item.unit && opt.unit === item.unit) && (item.unitSize && opt.unitSize == item.unitSize)
            ) || item.options[0];
          } else {
            selectedOption = {};
          }
          return {
            name: item.name,
            qty: item.quantity || item.qty || 1,
            price: selectedOption.sellingPrice || item.price || item.sellingPrice || 0,
            unit: selectedOption.unit || item.unit || '',
            unitSize: selectedOption.unitSize || item.unitSize || '',
            imageUrls: item.imageUrls,
            imageUrl: item.imageUrl,
          };
        }),
        total: wishlistItems.reduce((sum, item) => {
          let selectedOption = null;
          if (Array.isArray(item.options)) {
            selectedOption = item.options.find(opt =>
              (item.unit && opt.unit === item.unit) && (item.unitSize && opt.unitSize == item.unitSize)
            ) || item.options[0];
          } else {
            selectedOption = {};
          }
          let price = selectedOption.sellingPrice || item.price || item.sellingPrice || 0;
          let qty = item.quantity || item.qty || 1;
          return sum + price * qty;
        }, 0),
      }
    : {
        items: cartItems.map(item => {
          // Try to get option details if present
          let selectedOption = null;
          if (Array.isArray(item.options)) {
            selectedOption = item.options.find(opt =>
              (item.unit && opt.unit === item.unit) && (item.unitSize && opt.unitSize == item.unitSize)
            ) || item.options[0];
          } else {
            selectedOption = {};
          }
          return {
            name: item.name,
            qty: item.quantity || item.qty || 1,
            price: selectedOption.sellingPrice || item.price || item.sellingPrice || 0,
            unit: selectedOption.unit || item.unit || '',
            unitSize: selectedOption.unitSize || item.unitSize || '',
            imageUrls: item.imageUrls,
            imageUrl: item.imageUrl,
          };
        }),
        total: cartItems.reduce((sum, item) => {
          let selectedOption = null;
          if (Array.isArray(item.options)) {
            selectedOption = item.options.find(opt =>
              (item.unit && opt.unit === item.unit) && (item.unitSize && opt.unitSize == item.unitSize)
            ) || item.options[0];
          } else {
            selectedOption = {};
          }
          let price = selectedOption.sellingPrice || item.price || item.sellingPrice || 0;
          let qty = item.quantity || item.qty || 1;
          return sum + price * qty;
        }, 0),
      };

  // Redirect to PaymentOptionsPage with order details
  const handleProceedToPayment = () => {
    navigate("/payment", {
      state: {
        orderSummary,
        selectedAddress: getSelectedAddressObj(),
        userProfile,
        cartItems,
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 980, mx: 'auto' }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>Checkout</Typography>
        {orderSummary.items.length > 0 && (
          <Chip 
            label={`${orderSummary.items.length} item${orderSummary.items.length > 1 ? 's' : ''}`} 
            color="primary" 
            size="small" 
          />
        )}
      </Box>

      {orderSummary.items.length === 0 ? (
        <Card sx={{ borderRadius: 2, boxShadow: 2, textAlign: 'center', py: 4 }}>
          <CardContent>
            <ShoppingBagIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>No items to checkout</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your cart is empty. Add some items to proceed with checkout.
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
        <Grid container spacing={3}>
          {/* Order Summary */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Order Summary</Typography>
                <Box>
                  {orderSummary.items.map((item, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                        {/* Product Image */}
                        <Box 
                          sx={{ 
                            width: 64, 
                            height: 64, 
                            mr: 2, 
                            borderRadius: 2, 
                            overflow: 'hidden',
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <img
                            src={Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? item.imageUrls[0] : (item.imageUrl || 'https://via.placeholder.com/64')}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </Box>
                        
                        {/* Product Details */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {item.name}
                          </Typography>
                          {(item.unitSize && item.unit) && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {item.unitSize} {item.unit.toUpperCase()}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            ₹{item.price} per unit
                          </Typography>
                        </Box>
                        
                        {/* Quantity and Total */}
                        <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Qty: {item.qty}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>
                            ₹{item.price * item.qty}
                          </Typography>
                        </Box>
                      </Box>
                      {index < orderSummary.items.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ 
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', 
                  borderRadius: 3, 
                  p: 2.5,
                  boxShadow: '0 4px 20px rgba(255, 107, 107, 0.25)'
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>Grand Total</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', fontSize: '1.4rem' }}>
                      ₹{orderSummary.total}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            {/* Delivery Address */}
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Delivery Address</Typography>
                </Box>
                
                {loading ? (
                  <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : addresses.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>No addresses found. Please add a delivery address to continue.</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/addresses')}
                      sx={{ fontWeight: 600 }}
                    >
                      Add New Address
                    </Button>
                  </Alert>
                ) : (
                  <Box>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="address-select-label">Select Delivery Address</InputLabel>
                      <Select
                        labelId="address-select-label"
                        value={selectedAddress}
                        label="Select Delivery Address"
                        onChange={handleAddressChange}
                      >
                        {addresses.map((addr) => (
                          <MenuItem key={addr.id} value={addr.id}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {addr.line1 || addr.door || ""}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {addr.city || addr.town || ""}, {addr.state || ""} - {addr.pincode || ""}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {selectedAddress && (
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Selected Address:</Typography>
                        {(() => {
                          const addr = addresses.find(a => a.id === selectedAddress);
                          return addr ? (
                            <Typography variant="body2" color="text.secondary">
                              {addr.line1 || addr.door || ""}, {addr.city || addr.town || ""}, {addr.state || ""} - {addr.pincode || ""}
                            </Typography>
                          ) : null;
                        })()}
                      </Box>
                    )}
                    
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/addresses')}
                      sx={{ fontWeight: 500 }}
                    >
                      Add New Address
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Payment Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2, boxShadow: 2, position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Payment Summary</Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Items ({orderSummary.items.length})</Typography>
                    <Typography variant="body2">₹{orderSummary.total}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Delivery</Typography>
                    <Typography variant="body2" color="success.main">FREE</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Taxes</Typography>
                    <Typography variant="body2">Included</Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Total Amount</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    ₹{orderSummary.total}
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || !selectedAddress || paymentLoading}
                  onClick={handleProceedToPayment}
                  sx={{ 
                    fontWeight: 600, 
                    borderRadius: 2, 
                    py: 1.5,
                    fontSize: '1.1rem',
                    mb: 2
                  }}
                >
                  {paymentLoading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
                </Button>
                
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                  By proceeding, you agree to our terms and conditions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CheckoutPage;
