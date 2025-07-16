import React from "react";
import { Box, Typography, Grid, Card } from "@mui/material";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import SpaIcon from "@mui/icons-material/Spa";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import './CategoriesPage.css';

const categories = [
  { id: 1, name: "Groceries", icon: <LocalGroceryStoreIcon className="category-icon" /> },
  { id: 2, name: "Organic", icon: <SpaIcon className="category-icon" /> },
  { id: 3, name: "Dairy & Bakery", icon: <LocalDiningIcon className="category-icon" /> },
];

const CategoriesPage = () => {
  return (
    <Box className="categories-root">
      <Typography variant="h5" fontWeight={700} color="primary" mb={2}>Shop by Category</Typography>
      <Grid container spacing={2}>
        {categories.map(cat => (
          <Grid item xs={12} sm={6} md={4} key={cat.id}>
            <Card className="category-card">
              {cat.icon}
              <Typography className="category-title" variant="h6">{cat.name}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
export default CategoriesPage;
