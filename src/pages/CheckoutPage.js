import React, { useContext, useEffect, useState } from "react";
import { Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, CircularProgress, Stack } from "@mui/material";
import './CheckoutPage.css';
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
    <Box className="checkout-root">
      <Typography variant="h5" className="checkout-title">Checkout</Typography>
      <Box className="checkout-summary" sx={{ mb: 2 }}>
        {orderSummary.items.length === 0 ? (
          <Typography variant="body2">No products in cart.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {orderSummary.items.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f7f7f7', borderRadius: 2, p: 1.5, boxShadow: 1, mb: 1 }}>
                {/* Product Image */}
                <Box sx={{ width: 54, height: 54, mr: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, overflow: 'hidden', background: '#fff', boxShadow: 0 }}>
                  <img
                    src={Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? item.imageUrls[0] : (item.imageUrl || 'https://via.placeholder.com/54')}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</Typography>
                 
                  {/* Per-unit price below name */}
                  {(item.price && item.unitSize && item.unit) && (
                    <Typography variant="caption" sx={{ color: '#388e3c', fontWeight: 600, mb: 0.5 }}>
                      ₹{item.price} / {item.unitSize} {item.unit}
                    </Typography>
                  )}
                </Box>
                {/* Centered Qty and Total with more gap */}
                <Box sx={{ textAlign: 'center', minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '1rem' }}>Qty: {item.qty}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#388e3c', fontSize: '1.1rem', letterSpacing: 0.5 }}>{`₹${item.price * item.qty}`}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ mt: 2, mb: 2, px: 2, py: 1, bgcolor: '#e8f5e9', borderRadius: 2, boxShadow: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#388e3c', fontSize: '1.25rem', letterSpacing: 0.5 }}>
            Grand Total: ₹{orderSummary.total}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Select Delivery Address</Typography>
        {loading ? (
          <CircularProgress size={24} />
        ) : addresses.length === 0 ? (
          <Box>
            <Typography variant="body2">No addresses found. Please add an address in your profile.</Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/addresses')}>Add New Address</Button>
          </Box>
        ) : (
          <Box>
            <FormControl fullWidth>
              <InputLabel id="address-select-label">Address</InputLabel>
              <Select
                labelId="address-select-label"
                value={selectedAddress}
                label="Address"
                onChange={handleAddressChange}
              >
                {addresses.map((addr) => (
                  <MenuItem key={addr.id} value={addr.id}>
                    {addr.line1 || addr.door || ""}, {addr.city || addr.town || ""}, {addr.state || ""} - {addr.pincode || ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/addresses')}>Add New Address</Button>
          </Box>
        )}
      </Box>
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Proceed to Payment</Typography>
        <Button
          variant="contained"
          className="place-order-btn"
          fullWidth
          disabled={loading || !selectedAddress}
          onClick={handleProceedToPayment}
        >
          Proceed to Payment
        </Button>
      </Box>
    </Box>
  );
};
export default CheckoutPage;
