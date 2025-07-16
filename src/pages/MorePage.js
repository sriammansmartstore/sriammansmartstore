import React from "react";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const moreLinks = [
  { label: "Addresses", path: "/addresses" },
  { label: "User Settings", path: "/settings" },
  { label: "My Orders", path: "/orders" },
  { label: "Payment Options", path: "/payment" },
  { label: "Location Detection", path: "/location" },
  { label: "Notifications", path: "/notifications" },
  { label: "About Us", path: "/about" },
  { label: "Report a Problem", path: "/report" },
];

const MorePage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 64, // height of AppBar
      left: 0,
      right: 0,
      bottom: 56, // height of bottom nav
      p: 2,
      background: '#fff',
      borderRadius: 0,
      boxShadow: '0 4px 16px rgba(67,160,71,0.08)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      zIndex: 1200,
      overflow: 'hidden',
    }}>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <Typography variant="h5" color="primary" fontWeight={700} mb={2}>Account & Settings</Typography>
        <List>
          {moreLinks.map(link => (
            <ListItem key={link.path} disablePadding>
              <ListItemButton onClick={() => navigate(link.path)}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>
      <Button variant="contained" color="error" sx={{ mb: 1, fontWeight: 700 }} onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );
};
export default MorePage;
