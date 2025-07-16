import React from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router-dom";
import './AddressesPage.css';

const addresses = [
  { id: 1, name: "Home", details: "123 Main St, Coimbatore, TN" },
  { id: 2, name: "Office", details: "456 Business Rd, Coimbatore, TN" },
];

const AddressesPage = () => {
  const navigate = useNavigate();
  return (
    <Box className="addresses-root">
      <Box display="flex" alignItems="center" mb={1}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="addresses-title" sx={{ flex: 1 }}>Your Addresses</Typography>
      </Box>
      <Button variant="contained" className="add-address-btn">Add New Address</Button>
      {addresses.map(addr => (
        <Box key={addr.id} className="address-card">
          <Box>
            <Typography variant="h6">{addr.name}</Typography>
            <Typography variant="body2">{addr.details}</Typography>
          </Box>
          <Button variant="outlined" color="primary" size="small">Edit</Button>
        </Box>
      ))}
    </Box>
  );
};
export default AddressesPage;
