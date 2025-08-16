import React, { useState, useEffect } from "react";
import { Box, Typography, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Card, CardContent, Grid, Link, Alert } from "@mui/material";
import { useNotification } from '../components/NotificationProvider';
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
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
  // single inline notification shown below the phone input
  const [inlineMessage, setInlineMessage] = useState(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [lastRequestedPhone, setLastRequestedPhone] = useState(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState(null); // Track the newly verified phone number
  const { notify } = useNotification() || { notify: () => {} };

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

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 980, mx: 'auto' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>Payment & Verification</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Contact & Verification</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Verify your mobile number with OTP (reCAPTCHA protected) before placing the order.</Typography>
              <TextField fullWidth label="Mobile Number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))} placeholder="Enter mobile (without country code)" sx={{ mb: 1 }} InputProps={{ readOnly: !editingPhone }} />
              {!editingPhone && (
                <Button variant="text" size="small" onClick={() => {
                  // allow linking another phone number
                  setEditingPhone(true);
                  setShowPaymentOptions(false);
                  setPhoneVerified(false);
                  setInlineMessage(null);
                  setOtp('');
                  setOtpSent(false);
                  setPhone(''); // Clear the phone number field
                  setVerifiedPhoneNumber(null); // Clear the verified phone number
                  setConfirmationResult(null);
                  setVerificationId(null);
                  // Clear any existing recaptcha
                  if (recaptchaVerifier) {
                    try {
                      recaptchaVerifier.clear();
                    } catch (e) {
                      console.debug('Error clearing recaptcha:', e);
                    }
                    setRecaptchaVerifier(null);
                  }
                }}>Link another phone number</Button>
              )}
              {editingPhone && !phoneVerified && !otpSent && (
                <Box id="recaptcha-container" sx={{ mt: 1, mb: 1, minHeight: '78px' }} />
              )}
              {phoneVerified ? null : (editingPhone && !otpSent ? (
                <Button variant="contained" fullWidth onClick={async () => {
                  try {
                      if (!phone || phone.length < 6) { setInlineMessage({ type: 'error', text: 'Please enter a valid mobile number.' }); return; }
                    const fullPhone = phone.startsWith('+') ? phone : (countryCode + phone);

                    // If current user already has this phone linked, skip sending OTP
                    if (auth && auth.currentUser) {
                      const currentPhone = auth.currentUser.phoneNumber;
                      const hasPhoneProvider = (auth.currentUser.providerData || []).some(p => p.providerId === 'phone');
                      if (currentPhone && currentPhone === fullPhone) {
                        setPhoneVerified(true);
                        setInlineMessage({ type: 'success', text: 'Phone already verified.' });
                        notify('Phone already verified.', 'success');
                        return;
                      }
                      if (hasPhoneProvider && !currentPhone) {
                        // provider exists but no phoneNumber on profile — treat as verified to avoid re-linking
                        setPhoneVerified(true);
                        setInlineMessage({ type: 'success', text: 'Phone verification present on account.' });
                        notify('Phone verification present on account.', 'success');
                        return;
                      }
                    }

                    let verifier = recaptchaVerifier;
                    try {
                      if (!verifier) {
                        verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
                          size: 'normal',
                          callback: (response) => {
                            console.log('reCAPTCHA solved:', response);
                          },
                          'expired-callback': () => {
                            console.log('reCAPTCHA expired');
                            setInlineMessage({ type: 'warning', text: 'Security verification expired. Please complete the verification again.' });
                            notify('Security verification expired', 'warning');
                          },
                          'error-callback': (error) => {
                            console.error('reCAPTCHA error:', error);
                            setInlineMessage({ type: 'error', text: 'Security verification encountered an issue. Please refresh the page and try again.' });
                            notify('Security verification error', 'error');
                          }
                        });
                        
                        // Add timeout for render operation
                        const renderPromise = verifier.render();
                        const timeoutPromise = new Promise((_, reject) => 
                          setTimeout(() => reject(new Error('Security verification is taking longer than expected. Please check your internet connection.')), 10000)
                        );
                        
                        await Promise.race([renderPromise, timeoutPromise]);
                        setRecaptchaVerifier(verifier);
                      }
                      setInlineMessage({ type: 'info', text: 'Verifying reCAPTCHA...' });
                      if (typeof verifier.verify === 'function') {
                        await verifier.verify();
                      }
                      setInlineMessage({ type: 'info', text: 'Sending OTP...' });
                      
                      // Add timeout for OTP sending
                      const otpPromise = signInWithPhoneNumber(auth, fullPhone, verifier);
                      const otpTimeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('SMS delivery is taking longer than expected. Please check your network connection and try again.')), 15000)
                      );
                      
                      const confirmation = await Promise.race([otpPromise, otpTimeoutPromise]);
                      setConfirmationResult(confirmation);
                      setVerificationId(confirmation?.verificationId || null);
                      setOtpSent(true);
                      setInlineMessage({ type: 'info', text: 'OTP sent. Enter the code to verify.' });
                    } catch (err) {
                      console.error('OTP send failed', err);
                      let errorMessage = 'Failed to send OTP. ';
                      
                      if (err.message && (err.message.includes('timeout') || err.message.includes('longer than expected'))) {
                        errorMessage += 'The request is taking longer than usual. Please check your internet connection and try again.';
                      } else if (err.code === 'auth/invalid-app-credential') {
                        errorMessage += 'Firebase configuration issue. Please check Firebase project settings.';
                      } else if (err.code === 'auth/too-many-requests') {
                        errorMessage += 'Too many requests. Please try again later.';
                      } else if (err.code === 'auth/invalid-phone-number') {
                        errorMessage += 'Invalid phone number format.';
                      } else if (err.code === 'auth/missing-phone-number') {
                        errorMessage += 'Phone number is required.';
                      } else if (err.code === 'auth/captcha-check-failed') {
                        errorMessage += 'reCAPTCHA verification failed. Please try again.';
                      } else {
                        errorMessage += 'Please try again.';
                      }
                      
                      try {
                        if (verifier && typeof verifier.clear === 'function') verifier.clear();
                        if (window.grecaptcha && window.recaptchaWidgetId != null) {
                          try { window.grecaptcha.reset(window.recaptchaWidgetId); } catch (e) {}
                        }
                      } catch(e){}
                      setRecaptchaVerifier(null);
                      setInlineMessage({ type: 'error', text: errorMessage });
                    }
                  } catch (err) {
                    console.error('OTP send failed', err);
                    setInlineMessage({ type: 'error', text: 'Failed to send OTP. Try again.' });
                  }
                }}>
                  Send OTP
                </Button>
              ) : (
                <Box>
                  <TextField fullWidth label="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} sx={{ mb: 1 }} />
                  <Button variant="contained" fullWidth onClick={async () => {
                    if (!confirmationResult && !verificationId) { setInlineMessage({ type: 'error', text: 'No OTP request found.' }); return; }
                    setVerifying(true);
                    
                    // Add timeout for verification process
                    const verifyTimeout = setTimeout(() => {
                      setVerifying(false);
                      setInlineMessage({ 
                        type: 'warning', 
                        text: 'Verification is taking longer than expected. Please check your network connection and try again.' 
                      });
                      notify('Verification timeout - please try again', 'warning');
                    }, 30000); // 30 second timeout
                    
                    try {
                      const vid = verificationId || confirmationResult?.verificationId;
                      if (!vid) throw new Error('Missing verification id');
                      const credential = PhoneAuthProvider.credential(vid, otp);
                      if (auth && auth.currentUser) {
                        // Link the phone credential to the currently signed-in user (won't replace their session)
                        try {
                          await linkWithCredential(auth.currentUser, credential);
                          console.debug('Phone linked to current user');
                          setPhoneVerified(true);
                          setVerifiedPhoneNumber(countryCode + phone); // Store the verified phone number
                          setInlineMessage({ type: 'success', text: 'Phone verified. You may proceed to place the order.' });
                          setShowPaymentOptions(true);
                          setEditingPhone(false);
                          // persist verified phone in Firestore under users/{uid}/verifiedPhones
                          try {
                            const db = getFirestore();
                            const uid = auth.currentUser.uid;
                            if (uid) {
                              const sanitized = (countryCode + phone).replace(/[^0-9+]/g, '');
                              const vpRef = doc(db, 'users', uid, 'verifiedPhones', sanitized);
                              await setDoc(vpRef, { phone: (countryCode + phone), verifiedAt: serverTimestamp() });
                            }
                          } catch (e) { console.error('Failed to save verified phone', e); }
                        } catch (linkErr) {
                          console.error('Link failed', linkErr);
                          // If provider already linked, treat as success
                          if (linkErr && (linkErr.code === 'auth/provider-already-linked' || (linkErr.message && linkErr.message.indexOf('provider-already-linked') !== -1))) {
                            // already linked to this account
                            setPhoneVerified(true);
                            setInlineMessage({ type: 'success', text: 'Phone was already linked to your account.' });
                            setShowPaymentOptions(true);
                            setEditingPhone(false);
                            try {
                              const db = getFirestore();
                              const uid = auth.currentUser.uid;
                              if (uid) {
                                const sanitized = (countryCode + phone).replace(/[^0-9+]/g, '');
                                const vpRef = doc(db, 'users', uid, 'verifiedPhones', sanitized);
                                await setDoc(vpRef, { phone: (countryCode + phone), verifiedAt: serverTimestamp() });
                              }
                            } catch (e) { console.error('Failed to save verified phone', e); }
                          } else if (linkErr && (linkErr.code === 'auth/credential-already-in-use' || (linkErr.message && linkErr.message.indexOf('credential-already-in-use') !== -1))) {
                            // phone credential already linked to another account
                            console.warn('Phone credential already in use by another account', linkErr);
                            setInlineMessage({ type: 'error', text: 'This phone number is already linked to another account. Please sign in with that number or use a different phone.' });
                          } else {
                            throw linkErr;
                          }
                        }
                      } else {
                        // No existing signed-in user: fall back to confirmationResult (this will sign in)
                        const res = await confirmationResult.confirm(otp);
                        console.debug('Phone verification (signed in):', res);
                        setPhoneVerified(true);
                        setVerifiedPhoneNumber(countryCode + phone); // Store the verified phone number
                        setInlineMessage({ type: 'success', text: 'Phone verified.' });
                        setShowPaymentOptions(true);
                        setEditingPhone(false);
                      }
                    } catch (err) {
                      console.error('OTP verify failed', err);
                      let verifyErrorMessage = 'Verification failed. ';
                      if (err.message && err.message.includes('invalid-verification-code')) {
                        verifyErrorMessage += 'Please check the OTP and try again.';
                      } else if (err.message && err.message.includes('expired')) {
                        verifyErrorMessage += 'The OTP has expired. Please request a new one.';
                      } else {
                        verifyErrorMessage += 'Please try again or request a new OTP.';
                      }
                      setInlineMessage({ type: 'error', text: verifyErrorMessage });
                      notify('OTP verification failed', 'error');
                    } finally {
                      clearTimeout(verifyTimeout);
                      setVerifying(false);
                    }
                  }}>{verifying ? <CircularProgress size={20} /> : 'Verify OTP'}</Button>
                </Box>
              ))}
              {/* single inline message area below phone input and OTP UI */}
              {inlineMessage && <Alert severity={inlineMessage.type} sx={{ mt: 2 }}>{inlineMessage.text}</Alert>}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>By verifying you agree to our <Link component={RouterLink} to="/terms">Terms</Link> and <Link component={RouterLink} to="/privacy">Privacy Policy</Link>.</Typography>
            </CardContent>
          </Card>
        </Grid>

        {showPaymentOptions && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Payment Options</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Choose a payment method. You will be prompted to complete payment for online methods.</Typography>
                <Grid container spacing={2}>
                  {paymentOptions.map(opt => (
                    <Grid item xs={12} key={opt.id}>
                      <Card variant="outlined" sx={{ p: 1 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            {opt.icon}
                            <Box>
                              <Typography variant="subtitle1">{opt.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{opt.type === 'cod' ? 'Pay with cash on delivery' : 'Secure online payment'}</Typography>
                            </Box>
                          </Box>
                          <Button variant="contained" disabled={loading} onClick={() => handlePay(opt)}>
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
  {/* notifications shown via NotificationProvider */}
    </Box>
  );

};

export default PaymentOptionsPage;
