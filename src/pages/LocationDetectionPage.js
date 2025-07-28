
import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import './LocationDetectionPage.css';


// Widget version for embedding
import { useEffect } from "react";
const LocationDetectionWidget = ({ onLocationDetected }) => {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
    // eslint-disable-next-line
  }, []);

  return (
    <Typography variant="caption" sx={{ display: 'block', mt: 1, mb: 0.5, color: error ? 'error.main' : '#388e3c', fontWeight: 400, fontSize: '0.85em' }}>
      {loading ? <CircularProgress size={14} sx={{ verticalAlign: 'middle', mr: 1 }} /> : location ? `Detected: ${location}` : error ? error : "Detecting your area..."}
    </Typography>
  );
};

export default LocationDetectionWidget;
