import React, { useState, useEffect } from "react";
import { Box, Typography, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Card, CardContent, Grid, Link, Alert, Divider } from "@mui/material";
import { useNotification } from '../components/NotificationProvider';
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import './PaymentOptionsPage.css';
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from 'firebase/auth';

const paymentOptions = [
  { id: 1, name: "Razorpay (UPI, Card, Wallet)", icon: <CreditCardIcon color="primary" />, type: "razorpay" },
  { id: 2, name: "Cash on Delivery", icon: <CurrencyRupeeIcon color="primary" />, type: "cod" },
];

const PaymentOptionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotification() || { notify: () => {} };
  
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
  const [latestOrderId, setLatestOrderId] = useState(null);
  const [phone, setPhone] = useState(userProfile?.number || "");
  const [countryCode, setCountryCode] = useState("+91");
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [inlineMessage, setInlineMessage] = useState(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [lastRequestedPhone, setLastRequestedPhone] = useState(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState(null);

  // If the signed-in user already has a phone credential, treat as verified
  useEffect(() => {
    try {
      if (auth && auth.currentUser) {
        const currentPhone = auth.currentUser.phoneNumber || null;
        const providerPhone = (auth.currentUser.providerData || []).find(p => p.providerId === 'phone');
        if (currentPhone || providerPhone) {
          const existingVerifiedPhone = currentPhone || providerPhone?.phoneNumber || userProfile?.number;
          setPhoneVerified(true);
          setVerifiedPhoneNumber(existingVerifiedPhone); // Store the verified phone
          setPhone(existingVerifiedPhone || ''); // Set the phone field to show the verified number
          setInlineMessage({ type: 'success', text: 'Phone number already verified.' });
          setShowPaymentOptions(true);
          setEditingPhone(false);
        } else {
          // No phone verification found, allow user to verify
          setPhoneVerified(false);
          setEditingPhone(true);
          setShowPaymentOptions(false);
        }
      } else {
        // No user signed in, allow phone verification
        setPhoneVerified(false);
        setEditingPhone(true);
        setShowPaymentOptions(false);
      }
    } catch (e) {
      console.debug('Phone verification check failed', e);
      // On error, allow phone verification
      setPhoneVerified(false);
      setEditingPhone(true);
      setShowPaymentOptions(false);
    }
  }, []);

  // Show payment options when phone is verified
  useEffect(() => {
    if (phoneVerified) {
      setShowPaymentOptions(true);
      setEditingPhone(false);
    }
  }, [phoneVerified]);

  // Cleanup function to clear recaptcha on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {
          console.debug('Error clearing recaptcha on unmount:', e);
        }
      }
    };
  }, [recaptchaVerifier]);

  // Save order to Firestore
  const saveOrder = async (paymentMethod, paymentStatus, razorpayDetails = null) => {
  setLoading(true);
    try {
      const db = getFirestore();
      const newOrderId = `ORD-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      // Prioritize verified phone number, then current phone input, then userProfile phone
      const finalPhoneNumber = verifiedPhoneNumber || (phoneVerified ? (countryCode + phone) : null) || userProfile?.number;
      
      const updatedUserProfile = {
        ...userProfile,
        number: finalPhoneNumber
      };
      
      console.log('Order phone number debug:', {
        verifiedPhoneNumber,
        phoneVerified,
        currentPhone: phone,
        userProfilePhone: userProfile?.number,
        finalPhoneNumber
      });
      
      const orderData = {
        orderId: newOrderId,
        userProfile: updatedUserProfile,
        address: selectedAddress,
        cartItems,
        total: orderSummary.total,
        paymentMethod,
        paymentStatus,
        razorpayDetails,
        verifiedPhoneNumber, // Store the verified phone number separately for reference
        createdAt: serverTimestamp(),
        status: paymentMethod === "COD" ? "Pending Payment" : "Placed"
      };

  const ref = await addDoc(collection(db, "orders"), orderData);
      // Also write a copy under users/{uid}/orders if we have uid
      try {
        const uid = userProfile?.uid;
        if (uid) {
          await setDoc(doc(db, 'users', uid, 'orders', ref.id), { id: ref.id, ...orderData });
          console.debug('[Orders] duplicated order to users/{uid}/orders with id=', ref.id);
        }
      } catch (e) {
        console.error('Failed to write user subcollection order copy', e);
      }

  setLatestOrderId(ref.id);
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
    // require phone verification before confirming COD
    if (!phoneVerified) {
      const txt = 'Please verify your mobile number before placing the order.';
  setInlineMessage({ type: 'warning', text: txt });
      notify(txt, 'warning');
      return;
    }
    await saveOrder("COD", "Pending");
  };

  const handlePay = (opt) => {
    if (!phoneVerified) {
      const txt = 'Please verify your mobile number before proceeding to payment.';
  setInlineMessage({ type: 'warning', text: txt });
      notify(txt, 'warning');
      return;
    }
    if (opt.type === "razorpay") {
      handleRazorpay();
    } else {
      handleCOD();
    }
  };


  const handleDialogClose = () => {
    setDialogOpen(false);
    const highlightId = latestOrderId;
    setLatestOrderId(null);
    if (highlightId) {
      navigate('/orders', { state: { highlightOrderId: highlightId } });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleLinkAnotherNumber = () => {
    setEditingPhone(true);
    setShowPaymentOptions(false);
    setPhoneVerified(false);
    setInlineMessage(null);
    setOtp('');
    setOtpSent(false);
    setPhone('');
    setVerifiedPhoneNumber(null);
    setConfirmationResult(null);
    setVerificationId(null);
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (e) {
        console.debug('Error clearing recaptcha:', e);
      }
      setRecaptchaVerifier(null);
    }
  };

  const sendOtp = async () => {
    try {
      if (!phone || phone.length < 6) { 
        setInlineMessage({ type: 'error', text: 'Please enter a valid mobile number.' }); 
        notify('Please enter a valid mobile number', 'warning');
        return; 
      }
      const fullPhone = phone.startsWith('+') ? phone : (countryCode + phone);

      if (auth && auth.currentUser) {
        const currentPhone = auth.currentUser.phoneNumber;
        if (currentPhone && currentPhone === fullPhone) {
          setPhoneVerified(true);
          setInlineMessage({ type: 'success', text: 'Phone already verified.' });
          notify('Phone already verified.', 'success');
          return;
        }
      }

      let verifier = recaptchaVerifier;
      if (!verifier) {
        verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
          size: 'normal',
          callback: (response) => console.log('reCAPTCHA solved:', response),
          'expired-callback': () => {
            setInlineMessage({ type: 'warning', text: 'Security verification expired. Please complete the verification again.' });
            notify('Security verification expired', 'warning');
          }
        });
        await verifier.render();
        setRecaptchaVerifier(verifier);
      }
      
      setInlineMessage({ type: 'info', text: 'Sending OTP...' });
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirmationResult(confirmation);
      setVerificationId(confirmation?.verificationId || null);
      setOtpSent(true);
      setInlineMessage({ type: 'info', text: 'OTP sent. Enter the code to verify.' });
      notify('OTP sent successfully', 'success');
    } catch (err) {
      console.error('OTP send failed', err);
      let errorMessage = 'Failed to send OTP. Please try again.';
      setInlineMessage({ type: 'error', text: errorMessage });
      notify(errorMessage, 'error');
    }
  };

  const verifyOtp = async () => {
    if (!confirmationResult && !verificationId) { 
      setInlineMessage({ type: 'error', text: 'No OTP request found.' }); 
      notify('No OTP request found', 'error');
      return; 
    }
    setVerifying(true);
    
    try {
      const vid = verificationId || confirmationResult?.verificationId;
      if (!vid) throw new Error('Missing verification id');
      const credential = PhoneAuthProvider.credential(vid, otp);
      
      if (auth && auth.currentUser) {
        await linkWithCredential(auth.currentUser, credential);
        setPhoneVerified(true);
        setVerifiedPhoneNumber(countryCode + phone);
        setInlineMessage({ type: 'success', text: 'Phone verified. You may proceed to place the order.' });
        setShowPaymentOptions(true);
        setEditingPhone(false);
        notify('Phone verified successfully!', 'success');
      } else {
        const res = await confirmationResult.confirm(otp);
        setPhoneVerified(true);
        setVerifiedPhoneNumber(countryCode + phone);
        setInlineMessage({ type: 'success', text: 'Phone verified.' });
        setShowPaymentOptions(true);
        setEditingPhone(false);
        notify('Phone verified successfully!', 'success');
      }
    } catch (err) {
      console.error('OTP verify failed', err);
      let verifyErrorMessage = 'Verification failed. Please check the OTP and try again.';
      setInlineMessage({ type: 'error', text: verifyErrorMessage });
      notify('OTP verification failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: '100%', mx: 'auto', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 3 }} sx={{ maxWidth: 1200, mx: 'auto' }}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>Payment & Verification</Typography>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Phone Verification Section */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Contact & Verification</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Verify your mobile number with OTP (reCAPTCHA protected) before placing the order.</Typography>
              
              {!phoneVerified && (
                <Box>
                  <TextField
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                    variant="outlined"
                    disabled={loading || phoneVerified}
                    placeholder="Enter your 10-digit mobile number"
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': { borderRadius: 2 }
                    }}
                  />

                  {otpSent && (
                    <TextField
                      label="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      fullWidth
                      variant="outlined"
                      disabled={loading || phoneVerified}
                      placeholder="Enter 6-digit OTP"
                      inputProps={{ maxLength: 6 }}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                    />
                  )}

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {!otpSent ? (
                      <Button
                        variant="contained"
                        onClick={sendOtp}
                        disabled={loading || !phone || phoneVerified}
                        sx={{ 
                          borderRadius: 2,
                          fontWeight: 600,
                          px: { xs: 2, sm: 3 },
                          py: { xs: 1, sm: 1.2 }
                        }}
                      >
                        {loading ? <CircularProgress size={20} /> : 'Send OTP'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={verifyOtp}
                        disabled={loading || !otp || phoneVerified}
                        sx={{ 
                          borderRadius: 2,
                          fontWeight: 600,
                          px: { xs: 2, sm: 3 },
                          py: { xs: 1, sm: 1.2 }
                        }}
                      >
                        {verifying ? <CircularProgress size={20} /> : 'Verify OTP'}
                      </Button>
                    )}

                    <Button
                      variant="text"
                      onClick={handleLinkAnotherNumber}
                      disabled={loading}
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 500
                      }}
                    >
                      Link another phone number
                    </Button>
                  </Box>

                  {editingPhone && !phoneVerified && !otpSent && (
                    <Box id="recaptcha-container" sx={{ mt: 1, mb: 1, minHeight: '78px' }} />
                  )}
                </Box>
              )}

              {inlineMessage && <Alert severity={inlineMessage.type} sx={{ mt: 2, borderRadius: 2 }}>{inlineMessage.text}</Alert>}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                By verifying you agree to our <Link component={RouterLink} to="/terms">Terms</Link> and <Link component={RouterLink} to="/privacy">Privacy Policy</Link>.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 2, position: { lg: 'sticky' }, top: 20 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Order Summary</Typography>
              
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
        </Grid>

        {showPaymentOptions && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Payment Options</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Choose a payment method. You will be prompted to complete payment for online methods.</Typography>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {paymentOptions.map(opt => (
                    <Grid item xs={12} key={opt.id}>
                      <Card variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap={{ xs: 'wrap', sm: 'nowrap' }} gap={2}>
                          <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1, minWidth: 0 }}>
                            {opt.icon}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1rem' } }}>{opt.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>{opt.type === 'cod' ? 'Pay with cash on delivery' : 'Secure online payment'}</Typography>
                            </Box>
                          </Box>
                          <Button 
                            variant="contained" 
                            disabled={loading} 
                            onClick={() => handlePay(opt)}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                              px: { xs: 2, sm: 3 },
                              py: { xs: 1, sm: 1.2 },
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              minWidth: { xs: '100%', sm: 'auto' },
                              mt: { xs: 1, sm: 0 }
                            }}
                          >
                            {loading ? <CircularProgress size={20} /> : (opt.type === "online" ? "Pay Online" : "Place Order")}
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Need help? <Link component={RouterLink} to="/contact">Contact us</Link></Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">By placing an order you agree to our policies. <Link component={RouterLink} to="/refund-cancellation">Refund &amp; Cancellation</Link> • <Link component={RouterLink} to="/shipping">Shipping policy</Link> • <Link component={RouterLink} to="/return">Return policy</Link></Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

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
