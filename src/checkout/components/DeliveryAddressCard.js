import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Card, 
  CardContent, 
  Alert, 
  CircularProgress,
  Grid,
  Snackbar
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../components/NotificationProvider';
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const DeliveryAddressCard = ({ addresses, selectedAddressId, onAddressChange, loading, onAddressAdded }) => {
  const navigate = useNavigate();
  const { notify } = useNotification() || { notify: () => {} };
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddNewAddress = () => {
    navigate('/addresses', { state: { fromCart: true } });
    notify('Add a new delivery address to continue', 'info');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Create a simple address object with coordinates
          const newAddress = {
            fullName: auth.currentUser?.displayName || 'My Location',
            street: 'Near your current location',
            city: '',
            district: '',
            state: '',
            pincode: '',
            contact: auth.currentUser?.phoneNumber || '',
            latitude,
            longitude,
            isCurrentLocation: true,
            createdAt: serverTimestamp(),
            lastUsed: serverTimestamp(),
          };

          // Save to Firebase
          const user = auth.currentUser;
          if (!user) throw new Error('User not authenticated');
          
          const addressRef = doc(collection(db, `users/${user.uid}/addresses`));
          await setDoc(addressRef, newAddress);
          
          notify('Location saved as new address!', 'success');
          if (onAddressAdded) onAddressAdded();
          
        } catch (err) {
          console.error('Error getting location:', err);
          setError(err.message || 'Failed to get your location');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Unable to retrieve your location. Please check your browser permissions.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };
  
  const handleCloseError = () => {
    setError(null);
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
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    startIcon={!loading && <AddIcon />} 
                    onClick={handleAddNewAddress} 
                    disabled={loading || locationLoading}
                    sx={{ 
                      fontWeight: 500, 
                      borderRadius: 2,
                      py: 1.5,
                      whiteSpace: 'nowrap',
                      minHeight: '48px',
                      '& .MuiButton-startIcon': {
                        mr: 0.5,
                        '& > *:nth-of-type(1)': {
                          fontSize: '1.1rem'
                        }
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Add New Address'}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    color="primary"
                    startIcon={!locationLoading && <MyLocationIcon />} 
                    onClick={getCurrentLocation}
                    disabled={loading || locationLoading}
                    sx={{ 
                      fontWeight: 500, 
                      borderRadius: 2,
                      py: 1.5,
                      whiteSpace: 'nowrap',
                      minHeight: '48px',
                      '& .MuiButton-startIcon': {
                        mr: 0.5,
                        '& > *:nth-of-type(1)': {
                          fontSize: '1.1rem'
                        }
                      }
                    }}
                  >
                    {locationLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      'Use My Current Location'
                    )}
                  </Button>
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                {locationLoading ? 'Detecting your location...' : ' '}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default DeliveryAddressCard;
