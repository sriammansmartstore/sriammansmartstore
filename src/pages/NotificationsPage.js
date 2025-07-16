import React from "react";
import { Box, Typography } from "@mui/material";
import './NotificationsPage.css';

const notifications = [
  { id: 1, title: "Order Delivered", message: "Your order #1234 has been delivered." },
  { id: 2, title: "Promotion", message: "Get 10% off on your next purchase!" },
];

const NotificationsPage = () => {
  return (
    <Box className="notifications-root">
      <Typography variant="h5" className="notifications-title">Notifications</Typography>
      {notifications.map(note => (
        <Box key={note.id} className="notification-card">
          <Typography variant="h6">{note.title}</Typography>
          <Typography variant="body2">{note.message}</Typography>
        </Box>
      ))}
    </Box>
  );
};
export default NotificationsPage;
