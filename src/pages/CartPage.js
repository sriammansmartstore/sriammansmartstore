import React, { useContext, useState, useMemo, useCallback } from "react";
import { Box, Typography, Button, CircularProgress, Alert, Container } from "@mui/material";
import { useNotification } from '../components/NotificationProvider';
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Component and Hook Imports
import OrderSummaryCard from "../checkout/components/OrderSummaryCard";
import DeliveryAddressCard from "../checkout/components/DeliveryAddressCard";
import { useCheckoutData } from "../hooks/useCheckoutData";
import { calculateOrderSummary } from "../utils/orderUtils";

const CartPage = () => {
  const { user } = useContext(AuthContext);
  const { notify } = useNotification() || { notify: () => {} };
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [cartVersion, setCartVersion] = useState(0); // Used to force re-render on cart updates
  const navigate = useNavigate();
  const location = useLocation();

  const { userProfile, addresses, cartItems, loading, error, refreshData } = useCheckoutData(setSelectedAddressId);

  const itemsToProcess = useMemo(() =>
    location.state?.source === "wishlist" ? location.state.items : cartItems,
    [location.state, cartItems, cartVersion]
  );
  
  const orderSummary = useMemo(() => {
    console.log('Cart items in CartPage:', itemsToProcess);
    return calculateOrderSummary(itemsToProcess);
  }, [itemsToProcess]);

  const selectedAddressObject = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId),
    [addresses, selectedAddressId]
  );

  const handleProceedToPayment = useCallback(() => {
    if (!selectedAddressId) {
      notify('Please select a delivery address to continue', 'warning');
      return;
    }
    navigate("/payment", {
      state: {
        orderSummary,
        selectedAddress: selectedAddressObject,
        userProfile,
        cartItems: itemsToProcess,
      },
    });
  }, [selectedAddressId, orderSummary, selectedAddressObject, userProfile, itemsToProcess, navigate, notify]);

  const handleCartUpdate = useCallback(() => {
    // Force a refresh of cart data
    setCartVersion(prev => prev + 1);
    refreshData();
  }, [refreshData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (orderSummary.items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Typography color="text.secondary" paragraph>
          Looks like you haven't added anything to your cart yet.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/')}
          endIcon={<ArrowForwardIcon />}
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    // Single-column, mobile-first layout: components stacked vertically
    <Box sx={{
      bgcolor: 'grey.50',
      minHeight: '100vh',
      px: { xs: 2, sm: 3, md: 4 },
      py: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header with item count on the right */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          pt: 2,
          px: { xs: 0, sm: 2 }
        }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            Shopping Cart
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {orderSummary.items.length} {orderSummary.items.length === 1 ? 'item' : 'items'} in cart
          </Typography>
        </Box>

        {/* Order summary with quantity selector and delete functionality */}
        <Box sx={{ mb: { xs: 2, sm: 3 }, px: { xs: 0, sm: 2 } }}>
          <OrderSummaryCard 
            summary={{
              ...orderSummary,
              items: itemsToProcess // Ensure we're passing the full items with their IDs
            }} 
            onUpdateCart={handleCartUpdate}
            showQuantityControls={true}
            showDeleteButton={true}
          />
        </Box>

        {/* Delivery address */}
        <Box sx={{ mb: { xs: 2, sm: 3 }, px: { xs: 0, sm: 2 } }}>
          <DeliveryAddressCard
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onAddressChange={(e) => setSelectedAddressId(e.target.value)}
            loading={loading}
          />
        </Box>

        {/* Checkout button */}
        <Box sx={{ 
          position: 'sticky', 
          bottom: 16,
          px: { xs: 0, sm: 2 },
          width: '100%',
          zIndex: 10,
          backgroundColor: 'transparent'
        }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleProceedToPayment}
            disabled={!selectedAddressId || loading}
            sx={{
              py: 1.5,
              px: 3,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: 3,
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Proceed to Pay ${orderSummary.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}`
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CartPage;