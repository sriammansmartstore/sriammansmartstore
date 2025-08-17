import React, { useState, useEffect } from "react";
import { Box, Typography, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Card, CardContent, Link, Alert, Divider, Radio, RadioGroup, FormControlLabel, FormControl } from "@mui/material";

import { useNotification } from '../components/NotificationProvider';
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import './PaymentOptionsPage.css';
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from 'firebase/auth';
import OrderSuccessAnimation from '../animations/OrderSuccessAnimation';

const paymentOptions = [
  { id: 'upi', name: 'UPI', icon: <QrCode2Icon fontSize="small" color="action" />, type: 'upi', subtitle: 'Pay via UPI apps (GPay, PhonePe, BHIM, etc.)' },
  { id: 'netbanking', name: 'Netbanking', icon: <AccountBalanceIcon fontSize="small" color="action" />, type: 'netbanking', subtitle: 'Pay using your internet banking' },
  { id: 'card', name: 'Cards', icon: <CreditCardIcon fontSize="small" color="action" />, type: 'card', subtitle: 'Pay with credit/debit cards' },
  { id: 'wallet', name: 'Wallet', icon: <AccountBalanceWalletIcon fontSize="small" color="action" />, type: 'wallet', subtitle: 'Pay with popular wallets' },
  { id: 'cod', name: 'Cash on Delivery', icon: <CurrencyRupeeIcon fontSize="small" color="success" />, type: 'cod', subtitle: 'Pay with cash on delivery' },
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
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState('Order Confirmed!');
  const [successSubtitle, setSuccessSubtitle] = useState('Thank you for your purchase.');

  // Ensure the page starts at the top when opened from Checkout
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      // Fallbacks for some browsers
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    } catch (_) {}
  }, []);

  // Derive a display phone number for the verified banner from the most reliable sources
  const displayVerifiedNumber = (
    verifiedPhoneNumber ||
    (auth && auth.currentUser ? auth.currentUser.phoneNumber : null) ||
    (phoneVerified ? (phone?.startsWith('+') ? phone : (countryCode + (phone || ''))) : null) ||
    userProfile?.number ||
    ''
  );

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
          setInlineMessage(null);
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

  // Reset transient flags when switching payment method
  useEffect(() => {
    // Ensure the action button never remains stuck after switching methods
    if (loading) setLoading(false);
  }, [selectedPayment]);

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

  // Show modern success animation and redirect to Orders page
  setSuccessTitle(paymentMethod === "COD" ? "Order Placed" : "Payment Successful");
  setSuccessSubtitle(paymentMethod === "COD" ? "Please pay cash on delivery." : "Your order has been placed.");
  setShowSuccess(true);
  // Tap-to-continue flow: store the order id and let the success overlay navigate on tap
  setLatestOrderId(ref.id);
    } catch (err) {
      setDialogMsg("Failed to place order. Please try again.");
      setDialogOpen(true);
    }
    setLoading(false);
  };

  // Razorpay payment handler
  const handleRazorpay = async () => {
    try {
      setLoading(true);
      const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_YourRazorpayKey";
      if (!keyId || keyId.includes('YourRazorpayKey')) {
        setDialogMsg("Razorpay key is not configured. Please set REACT_APP_RAZORPAY_KEY_ID in your .env and reload.");
        setDialogOpen(true);
        setLoading(false);
        return;
      }
      const options = {
        key: keyId,
        amount: orderSummary.total * 100, // Amount in paise
        currency: "INR",
        name: "Sri Amman Smart Store",
        description: "Order Payment",
        handler: function (response) {
          saveOrder("Razorpay", "Paid", response);
          setLoading(false);
        },
        // Ensure loading is cleared if user closes the modal without paying
        modal: {
          ondismiss: function () {
            setLoading(false);
            try { notify('Payment cancelled', 'info'); } catch (_) {}
          },
          escape: true,
          confirm_close: true
        },
        prefill: {
          name: userProfile?.fullName || "",
          email: userProfile?.email || "",
          contact: userProfile?.number || ""
        },
        theme: { color: "#388e3c" }
      };
      const rzp = new window.Razorpay(options);
      // Handle explicit failure from gateway
      rzp.on('payment.failed', function () {
        setDialogMsg("Payment failed. Please try again.");
        setDialogOpen(true);
        setLoading(false);
      });
      // Handle user closing the modal without completing payment
      rzp.on('modal.closed', function () {
        // Stop spinner so user can choose another method
        setLoading(false);
      });
      // Optional: external wallet selection should not keep loading
      rzp.on && rzp.on('external_wallet', function () {
        setLoading(false);
      });
      rzp.open();
    } catch (e) {
      console.error('Razorpay open/init failed:', e);
      setDialogMsg("Unable to start payment. Please try again.");
      setDialogOpen(true);
      setLoading(false);
    }
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
          setInlineMessage(null);
          // Success toast suppressed to avoid duplicate banners
          return;
        }
      }

      let verifier = recaptchaVerifier;
      if (!verifier) {
        verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            setInlineMessage({ type: 'warning', text: 'Security verification expired. Please try again.' });
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
        setInlineMessage(null);
        setShowPaymentOptions(true);
        setEditingPhone(false);
        // Success toast suppressed to avoid duplicate banners
        if (recaptchaVerifier) {
          try { recaptchaVerifier.clear(); } catch (e) { console.debug('Error clearing recaptcha after verify:', e); }
          setRecaptchaVerifier(null);
        }
      } else {
        const res = await confirmationResult.confirm(otp);
        setPhoneVerified(true);
        setVerifiedPhoneNumber(countryCode + phone);
        setInlineMessage(null);
        setShowPaymentOptions(true);
        setEditingPhone(false);
        // Clear reCAPTCHA instance after successful verification
        if (recaptchaVerifier) {
          try { recaptchaVerifier.clear(); } catch (e) { console.debug('Error clearing recaptcha after verify:', e); }
          setRecaptchaVerifier(null);
        }
      }
    } catch (err) {
      // Use debug to avoid alarming logs when provider is already linked
      console.debug('OTP verify handler caught:', err);
      if (err && (err.code === 'auth/provider-already-linked' || (err.message && err.message.includes('provider-already-linked')))) {
        // Treat as success if phone provider already linked to this account
        setPhoneVerified(true);
        setVerifiedPhoneNumber(countryCode + phone);
        setInlineMessage(null);
        setShowPaymentOptions(true);
        setEditingPhone(false);
        if (recaptchaVerifier) {
          try { recaptchaVerifier.clear(); } catch (e) { console.debug('Error clearing recaptcha after verify:', e); }
          setRecaptchaVerifier(null);
        }
      } else if (err && (err.code === 'auth/credential-already-in-use' || (err.message && err.message.includes('credential-already-in-use')))) {
        const msg = 'This phone number is already linked to another account. Please sign in with that number or use a different phone.';
        setInlineMessage({ type: 'error', text: msg });
        notify(msg, 'error');
      } else {
        let verifyErrorMessage = 'Verification failed. Please check the OTP and try again.';
        setInlineMessage({ type: 'error', text: verifyErrorMessage });
        notify('OTP verification failed', 'error');
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 0, sm: 2, md: 3 }, maxWidth: '100%', mx: 'auto', minHeight: '100vh' }}>
      {/* Title (no back button) */}
      <Box mb={{ xs: 2, sm: 3 }} sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 0 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Payment & Verification</Typography>
      </Box>

      <Box sx={{ maxWidth: { sm: 1200 }, mx: { xs: 0, sm: 'auto' } }}>
        {/* Phone Verification Section */}
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Card sx={{ borderRadius: { xs: 0, sm: 2 }, boxShadow: 2, width: '100%' }}>
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

                  {/* Invisible reCAPTCHA container (hidden) */}
                  <Box id="recaptcha-container" sx={{ display: 'none' }} />

                </Box>
              )}

              {phoneVerified && (
                <Box sx={{ mt: 1 }}>
                  <Alert severity="success" sx={{ borderRadius: 2, mb: 1 }}>
                    Phone verified: {displayVerifiedNumber}.
                  </Alert>
                  <Button
                    variant="text"
                    onClick={handleLinkAnotherNumber}
                    disabled={loading}
                    sx={{ borderRadius: 2, fontWeight: 500 }}
                  >
                    Link another phone number
                  </Button>
                </Box>
              )}

              {inlineMessage && !phoneVerified && (
                <Alert severity={inlineMessage.type} sx={{ mt: 2, borderRadius: 2 }}>{inlineMessage.text}</Alert>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                By verifying you agree to our <Link component={RouterLink} to="/terms">Terms</Link> and <Link component={RouterLink} to="/privacy">Privacy Policy</Link>.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Order Summary */}
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Card sx={{ borderRadius: { xs: 0, sm: 2 }, boxShadow: 2, width: '100%' }}>
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
                borderRadius: 2,
                p: 2.5
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Grand Total</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.4rem' }}>
                    ₹{orderSummary.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {showPaymentOptions && (
          <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Card sx={{ borderRadius: { xs: 0, sm: 2 }, boxShadow: 2, width: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Payment Options</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Choose a payment method. You will be prompted to complete payment for online methods.</Typography>

                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup
                    aria-label="payment-method"
                    name="payment-method"
                    value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  >
                    {paymentOptions.map(opt => (
                      <FormControlLabel
                        key={opt.id}
                        value={opt.type}
                        control={<Radio />}
                        labelPlacement="start"
                        label={
                          <Box display="flex" alignItems="center" gap={1.25}>
                            {opt.icon}
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{opt.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{opt.subtitle}</Typography>
                            </Box>
                          </Box>
                        }
                        sx={{
                          m: 0,
                          py: 1,
                          px: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%'
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                <Button
                  fullWidth
                  color="success"
                  variant="contained"
                  disabled={loading}
                  onClick={() => (selectedPayment === 'cod' ? handleCOD() : handleRazorpay())}
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    fontWeight: 800,
                    py: 1.3,
                    boxShadow: '0 6px 16px rgba(56,142,60,0.35)'
                  }}
                >
                  {loading ? <CircularProgress size={22} /> : 'PLACE ORDER'}
                </Button>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Need help? <Link component={RouterLink} to="/contact">Contact us</Link></Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">By placing an order you agree to our policies. <Link component={RouterLink} to="/refund-cancellation">Refund &amp; Cancellation</Link> • <Link component={RouterLink} to="/shipping">Shipping policy</Link> • <Link component={RouterLink} to="/return">Return policy</Link></Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
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
      {showSuccess && (
        <OrderSuccessAnimation
          title={successTitle}
          subtitle={successSubtitle}
          orderId={latestOrderId}
        />
      )}
    </Box>
  );
};

export default PaymentOptionsPage;