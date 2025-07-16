
import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import './LocationDetectionPage.css';

// Widget version for embedding
const LocationDetectionWidget = ({ onLocationDetected }) => {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const detectLocation = () => {
    setLoading(true);
    setError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude, longitude } = pos.coords;
          try {
            // Use Nominatim OpenStreetMap reverse geocoding API
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
              headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            let area =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.hamlet ||
              data.address?.county ||
              data.address?.state ||
              data.address?.suburb ||
              data.address?.municipality ||
              data.address?.region ||
              data.address?.country ||
              data.display_name ||
              "Unknown area";
            // fallback: try to extract a city-like name from display_name if all else fails
            if (area === "Unknown area" && data.display_name) {
              const parts = data.display_name.split(",");
              area = parts.length > 1 ? parts[parts.length - 4]?.trim() || parts[parts.length - 3]?.trim() : data.display_name;
            }
            setLocation(area);
            if (onLocationDetected) onLocationDetected(area);
          } catch (e) {
            setError("Failed to fetch area name. Please try again.");
          }
          setLoading(false);
        },
        () => {
          setError("Location detection failed.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported.");
      setLoading(false);
    }
  };

  return (
    <Box className="location-widget-root">
      <Box className="location-box">
        <Typography variant="body1">
          {loading ? <CircularProgress size={20} /> : location ? `Detected: ${location}` : error ? error : "Detect your area for better service!"}
        </Typography>
      </Box>
      <Button variant="contained" className="detect-btn" onClick={detectLocation} disabled={loading}>
        {loading ? "Detecting..." : "Detect Location"}
      </Button>
    </Box>
  );
};

export default LocationDetectionWidget;
