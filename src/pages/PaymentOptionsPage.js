import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from "react-router-dom";
import './PaymentOptionsPage.css';
import { getFirestore, collection, addDoc } from "firebase/firestore";

const paymentOptions = [
  { id: 1, name: "Razorpay (UPI, Card, Wallet)", icon: <CreditCardIcon color="primary" />, type: "razorpay" },
  { id: 2, name: "Cash on Delivery", icon: <CurrencyRupeeIcon color="primary" />, type: "cod" },
];

const PaymentOptionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get order details from location.state (passed from checkout)
  const orderSummary = location.state?.orderSummary || {
    items: [],
    total: 0,
  };
  const selectedAddress = location.state?.selectedAddress || null;
  const userProfile = location.state?.userProfile || null;
  const cartItems = location.state?.cartItems || [];

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");

  // Save order to Firestore
  const saveOrder = async (paymentMethod, paymentStatus, razorpayDetails = null) => {
    setLoading(true);
    try {
      const db = getFirestore();
      const newOrderId = `ORD-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      await addDoc(collection(db, "orders"), {
        orderId: newOrderId,
        userProfile,
        address: selectedAddress,
        cartItems,
        total: orderSummary.total,
        paymentMethod,
        paymentStatus,
        razorpayDetails,
        createdAt: new Date().toISOString(),
        status: paymentMethod === "COD" ? "Pending Payment" : "Placed"
      });
      setDialogMsg(paymentMethod === "COD" ? "Order placed! Please pay cash on delivery." : "Payment successful! Your order has been placed.");
      setDialogOpen(true);
    } catch (err) {
      setDialogMsg("Failed to place order. Please try again.");
      setDialogOpen(true);
    }
    setLoading(false);
  };

  // Razorpay payment handler
  const handleRazorpay = async () => {
    setLoading(true);
    const options = {
      key: "rzp_test_YourRazorpayKey", // Replace with your Razorpay key
      amount: orderSummary.total * 100, // Amount in paise
      currency: "INR",
      name: "Sri Amman Smart Store",
      description: "Order Payment",
      handler: function (response) {
        saveOrder("Razorpay", "Paid", response);
        setLoading(false);
      },
      prefill: {
        name: userProfile?.fullName || "",
        email: userProfile?.email || "",
        contact: userProfile?.number || ""
      },
      theme: { color: "#388e3c" }
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function () {
      setDialogMsg("Payment failed. Please try again.");
      setDialogOpen(true);
      setLoading(false);
    });
    rzp.open();
  };

  // Load Razorpay script if not present
  React.useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Cash on Delivery handler
  const handleCOD = async () => {
    await saveOrder("COD", "Pending");
  };

  const handlePay = (opt) => {
    if (opt.type === "razorpay") {
      handleRazorpay();
    } else {
      handleCOD();
    }
  };


  const handleDialogClose = () => {
    setDialogOpen(false);
    navigate("/", { replace: true }); // Redirect to home or orders page
  };

  return (
    <Box className="payment-root">
      <Box display="flex" alignItems="center" mb={1}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="payment-title" sx={{ flex: 1 }}>Select Payment Option</Typography>
      </Box>
      <Box className="payment-options">
        {paymentOptions.map(opt => (
          <Box key={opt.id} className="payment-option-card">
            <Box display="flex" alignItems="center" gap={2}>
              {opt.icon}
              <Typography variant="body1">{opt.name}</Typography>
            </Box>
            <Button
              variant="contained"
              className="pay-btn"
              disabled={loading}
              onClick={() => handlePay(opt)}
            >
              {loading ? <CircularProgress size={20} /> : (opt.type === "online" ? "Pay Online" : "Place Order")}
            </Button>
          </Box>
        ))}
      </Box>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Order Status</DialogTitle>
        <DialogContent>
          <Typography>{dialogMsg}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} autoFocus>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default PaymentOptionsPage;
