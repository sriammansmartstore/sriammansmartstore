import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import './LocationDetectionPage.css';

const LocationDetectionPage = () => {
  const [location, setLocation] = useState("");
  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocation(`Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`);
        },
        () => setLocation("Location detection failed."),
      );
    } else {
      setLocation("Geolocation not supported.");
    }
  };
  return (
    <Box className="location-root">
      <Typography variant="h5" className="location-title">Auto Detect Location</Typography>
      <Box className="location-box">
        <Typography variant="body1">{location || "Click below to detect your location."}</Typography>
      </Box>
      <Button variant="contained" className="detect-btn" onClick={detectLocation}>Detect Location</Button>
    </Box>
  );
};
export default LocationDetectionPage;
