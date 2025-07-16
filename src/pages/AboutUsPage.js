import React from "react";
import { Box, Typography } from "@mui/material";
import { IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router-dom";

const AboutUsPage = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2, background: "#fff", minHeight: "100vh", borderRadius: 4, boxShadow: '0 4px 16px rgba(67,160,71,0.08)' }}>
      <Box display="flex" alignItems="center" mb={1}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" color="primary" fontWeight={700} sx={{ flex: 1 }}>About Us</Typography>
      </Box>
      <Typography variant="body1" mb={2}>
        Sri Amman Smart Store is your trusted destination for fresh, organic, and local products. We deliver quality groceries, dairy, and more right to your doorstep. Our mission is to make healthy living easy and accessible for everyone.
      </Typography>
      <Typography variant="body2" color="text.secondary">Contact: support@sriammansmartstore.com</Typography>
    </Box>
  );
};
export default AboutUsPage;
