import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router-dom";
import './MyOrdersPage.css';

const orders = [
  { id: 1, date: "2025-07-10", items: "Organic Rice, Fresh Vegetables", total: 320, status: "Delivered" },
  { id: 2, date: "2025-07-14", items: "Dairy Products", total: 60, status: "Shipped" },
];

const MyOrdersPage = () => {
  const navigate = useNavigate();
  return (
    <Box className="orders-root">
      <Box display="flex" alignItems="center" mb={1}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="orders-title" sx={{ flex: 1 }}>My Orders</Typography>
      </Box>
      {orders.map(order => (
        <Box key={order.id} className="order-card">
          <Typography variant="body1">Date: {order.date}</Typography>
          <Typography variant="body2">Items: {order.items}</Typography>
          <Typography variant="body2">Total: ₹{order.total}</Typography>
          <Typography className="order-status">Status: {order.status}</Typography>
        </Box>
      ))}
    </Box>
  );
};
export default MyOrdersPage;
