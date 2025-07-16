import React from "react";
import { Box, Typography } from "@mui/material";
import { List, ListItem, ListItemText, IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router-dom";
import './NotificationsPage.css';

const notifications = [
  { id: 1, title: "Order Delivered", message: "Your order #1234 has been delivered." },
  { id: 2, title: "Promotion", message: "Get 10% off on your next purchase!" },
];

const NotificationsPage = () => {
  const navigate = useNavigate();
  return (
    <Box className="notifications-root">
      <Box display="flex" alignItems="center" mb={1}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="notifications-title" sx={{ flex: 1 }}>Notifications</Typography>
      </Box>
      <List>
        {notifications.map(note => (
          <ListItem key={note.id}>
            <ListItemText primary={note.title} secondary={note.message} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
export default NotificationsPage;
