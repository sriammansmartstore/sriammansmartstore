import React, { useContext, useState, useMemo } from "react";
import { Box, Grid, CircularProgress, Alert } from "@mui/material";
import { useNotification } from '../components/NotificationProvider';
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

// Component and Hook Imports
import CheckoutHeader from "../checkout/components/CheckoutHeader";
import OrderSummaryCard from "../checkout/components/OrderSummaryCard";
import DeliveryAddressCard from "../checkout/components/DeliveryAddressCard";
import PaymentSummaryCard from "../checkout/components/PaymentSummaryCard";
import EmptyCheckout from "../checkout/components/EmptyCheckout";
import { useCheckoutData } from "../hooks/useCheckoutData";
import { calculateOrderSummary } from "../utils/orderUtils";

const CheckoutPage = () => {
  const { user } = useContext(AuthContext);
  const { notify } = useNotification() || { notify: () => {} };
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { userProfile, addresses, cartItems, loading, error } = useCheckoutData(setSelectedAddressId);

  const itemsToProcess = useMemo(() =>
    location.state?.source === "wishlist" ? location.state.items : cartItems,
    [location.state, cartItems]
  );
  
  const orderSummary = useMemo(() => calculateOrderSummary(itemsToProcess), [itemsToProcess]);

  const selectedAddressObject = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId),
    [addresses, selectedAddressId]
  );

  const handleProceedToPayment = () => {
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
  };

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
    return <EmptyCheckout />;
  }

  return (
    // Single-column, mobile-first layout: components stacked vertically
    <Box sx={{
      bgcolor: 'grey.50',
      minHeight: '100vh',
      px: { xs: 0, sm: 2, md: 3 },
      py: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <CheckoutHeader itemCount={orderSummary.items.length} />

        {/* Order summary */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <OrderSummaryCard summary={orderSummary} />
        </Box>

        {/* Delivery address */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <DeliveryAddressCard
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onAddressChange={(e) => setSelectedAddressId(e.target.value)}
            loading={loading}
          />
        </Box>

        {/* Payment summary */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <PaymentSummaryCard
            summary={orderSummary}
            onProceed={handleProceedToPayment}
            isProceedDisabled={!selectedAddressId}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CheckoutPage;
