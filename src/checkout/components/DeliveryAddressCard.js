import React from 'react';
import { Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../components/NotificationProvider';

const DeliveryAddressCard = ({ addresses, selectedAddressId, onAddressChange, loading }) => {
  const navigate = useNavigate();
  const { notify } = useNotification() || { notify: () => {} };

  const handleAddNewAddress = () => {
    navigate('/addresses', { state: { fromCart: true } });
    notify('Add a new delivery address to continue', 'info');
  };

  return (
    <Card sx={{ borderRadius: { xs: 0, sm: 2 }, boxShadow: { xs: 'none', sm: 2 } }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Delivery Address</Typography>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
        ) : addresses.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            No addresses found. Please add one to continue.
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNewAddress} sx={{ mt: 2, fontWeight: 600, borderRadius: 2 }}>
              Add New Address
            </Button>
          </Alert>
        ) : (
          <Box>
            <FormControl fullWidth sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <InputLabel id="address-select-label">Select Delivery Address</InputLabel>
              <Select
                labelId="address-select-label"
                value={selectedAddressId}
                label="Select Delivery Address"
                onChange={onAddressChange}
              >
                {addresses.map((addr) => (
                  <MenuItem key={addr.id} value={addr.id}>
                    <Box>
                      {/* Primary: Full Name */}
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {addr.fullName || "Unnamed Recipient"}
                      </Typography>
                      {/* Secondary: Father/Spouse Name, if present */}
                      {addr.fatherOrSpouse && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {addr.fatherOrSpouse}
                        </Typography>
                      )}
                      {/* Address lines */}
                      <Typography variant="body2" color="text.secondary">
                        {(addr.door || "") + (addr.street ? `, ${addr.street}` : "")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(addr.town || addr.city || "") + (addr.district ? `, ${addr.district}` : "")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(addr.state || "") + (addr.pincode ? ` - ${addr.pincode}` : "")}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddNewAddress} sx={{ fontWeight: 500, borderRadius: 2 }}>
              Add Another Address
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryAddressCard;
