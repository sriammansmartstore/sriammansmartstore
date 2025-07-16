import React from "react";
import { Box, Typography, Button } from "@mui/material";
import './AddressesPage.css';

const addresses = [
  { id: 1, name: "Home", details: "123 Main St, Coimbatore, TN" },
  { id: 2, name: "Office", details: "456 Business Rd, Coimbatore, TN" },
];

const AddressesPage = () => {
  return (
    <Box className="addresses-root">
      <Typography variant="h5" className="addresses-title">Your Addresses</Typography>
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
