import React, { useEffect, useState } from "react";
import { Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, CircularProgress, Stack } from "@mui/material";
import './CheckoutPage.css';
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// orderSummary will be calculated from cartItems

const CheckoutPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setAddresses([]);
          setCartItems([]);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        const db = getFirestore();
        // Fetch addresses from subcollection
        const addressesCol = collection(db, "users", user.uid, "addresses");
        const addressesSnap = await getDocs(addressesCol);
        const addrList = addressesSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setAddresses(addrList);
        if (addrList.length > 0) setSelectedAddress(addrList[0].id);

        // Fetch cart items
        const cartCol = collection(db, "users", user.uid, "cart");
        const cartSnap = await getDocs(cartCol);
        setCartItems(cartSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));

        // Fetch user profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserProfile(userDoc.data());
      } catch (err) {
        setAddresses([]);
        setCartItems([]);
        setUserProfile(null);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddressChange = (event) => {
    setSelectedAddress(event.target.value);
  };

  // Helper to get selected address object
  const getSelectedAddressObj = () => addresses.find(addr => addr.id === selectedAddress);

  // Calculate order summary from cartItems
  const orderSummary = {
    items: cartItems.map(item => ({ name: item.name, qty: item.quantity || item.qty, price: item.sellingPrice || item.price })),
    total: cartItems.reduce((sum, item) => sum + (item.sellingPrice || item.price) * (item.quantity || item.qty), 0),
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
      <Box className="checkout-summary">
        {orderSummary.items.map((item, idx) => (
          <Typography key={idx} variant="body1">{item.qty} x {item.name} - ₹{item.price * item.qty}</Typography>
        ))}
        <Typography variant="h6" sx={{ mt: 2 }}>Total: ₹{orderSummary.total}</Typography>
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
