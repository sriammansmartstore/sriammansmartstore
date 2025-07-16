import React from "react";
import { Box, Typography } from "@mui/material";
import './MyOrdersPage.css';

const orders = [
  { id: 1, date: "2025-07-10", items: "Organic Rice, Fresh Vegetables", total: 320, status: "Delivered" },
  { id: 2, date: "2025-07-14", items: "Dairy Products", total: 60, status: "Shipped" },
];

const MyOrdersPage = () => {
  return (
    <Box className="orders-root">
      <Typography variant="h5" className="orders-title">My Orders</Typography>
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
