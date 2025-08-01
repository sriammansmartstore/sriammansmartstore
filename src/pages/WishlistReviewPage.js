import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, Button, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const WishlistReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items = [], wishlistName = "" } = location.state || {};

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: { xs: 2, sm: 3 }, maxWidth: 600, mx: "auto" }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>Review Wishlist: {wishlistName}</Typography>
      </Box>
      {items.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ mt: 8 }}>
          No items selected.
        </Typography>
      ) : (
        <Box>
          {items.map(item => (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, borderRadius: 3, boxShadow: 3, background: 'white', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
              <img src={item.imageUrls?.[0] || "https://via.placeholder.com/80"} alt={item.name} style={{ width: 60, height: 60, objectFit: 'contain', marginRight: 16, borderRadius: 2, border: '1px solid #eee' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: 16 }}>{item.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {item.unitSize ? `${item.unitSize} ${item.unit}` : item.unit || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Qty: <b>{item.quantity}</b></Typography>
                <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 700, fontSize: 16 }}>
                  ₹{item.price * item.quantity}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={items.length === 0}
          onClick={() => {
            // Redirect to main checkout page with wishlist items
            navigate("/checkout", { state: { items, source: "wishlist", wishlistName } });
          }}
        >
          Confirm & Checkout
        </Button>
      </Box>
    </Box>
  );
};

export default WishlistReviewPage;
