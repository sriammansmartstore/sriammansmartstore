import React from "react";
import { Box, Typography } from "@mui/material";

const AboutUsPage = () => (
  <Box sx={{ p: 2, background: "#fff", minHeight: "100vh", borderRadius: 4, boxShadow: '0 4px 16px rgba(67,160,71,0.08)' }}>
    <Typography variant="h5" color="primary" fontWeight={700} mb={2}>About Us</Typography>
    <Typography variant="body1" mb={2}>
      Sri Amman Smart Store is your trusted destination for fresh, organic, and local products. We deliver quality groceries, dairy, and more right to your doorstep. Our mission is to make healthy living easy and accessible for everyone.
    </Typography>
    <Typography variant="body2" color="text.secondary">Contact: support@sriammansmartstore.com</Typography>
  </Box>
);
export default AboutUsPage;
