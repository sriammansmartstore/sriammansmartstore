import React, { useEffect, useState } from "react";
import { Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, CircularProgress } from "@mui/material";
import './CheckoutPage.css';
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, doc } from "firebase/firestore";

const orderSummary = {
  items: [
    { name: "Organic Rice", qty: 2, price: 120 },
    { name: "Fresh Vegetables", qty: 1, price: 80 },
  ],
  total: 320,
};

const CheckoutPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setAddresses([]);
          setLoading(false);
          return;
        }
        const db = getFirestore();
        const userDoc = doc(db, 'users', user.uid);
        const addressesCol = collection(userDoc, 'addresses');
        const addressesSnap = await getDocs(addressesCol);
        const addrList = addressesSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setAddresses(addrList);
        if (addrList.length > 0) setSelectedAddress(addrList[0].id);
      } catch (err) {
        setAddresses([]);
      }
      setLoading(false);
    };
    fetchAddresses();
  }, []);

  const handleAddressChange = (event) => {
    setSelectedAddress(event.target.value);
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    // Razorpay options
    const options = {
      key: "YOUR_RAZORPAY_KEY_ID", // Replace with your Razorpay key
      amount: orderSummary.total * 100,
      currency: "INR",
      name: "Sri Amman Smart Store",
      description: "Order Payment",
      handler: function (response) {
        setOrderPlaced(true);
        setPaymentLoading(false);
        // You can save order/payment details to Firestore here
      },
      prefill: {
        // You can prefill user details here
      },
      theme: {
        color: "#1976d2",
      },
      method: {
        netbanking: true,
        card: true,
        upi: true,
        wallet: true,
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
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
          <Typography variant="body2">No addresses found. Please add an address in your profile.</Typography>
        ) : (
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
                  {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Payment Options</Typography>
        <Button
          variant="contained"
          className="place-order-btn"
          fullWidth
          disabled={paymentLoading || !selectedAddress}
          onClick={handlePayment}
        >
          {paymentLoading ? <CircularProgress size={24} /> : "Pay & Place Order"}
        </Button>
      </Box>
      {orderPlaced && (
        <Box sx={{ mt: 3, p: 2, bgcolor: "#e0ffe0", borderRadius: 2 }}>
          <Typography variant="h6" color="success.main">Order placed successfully!</Typography>
        </Box>
      )}
    </Box>
  );
};
export default CheckoutPage;
