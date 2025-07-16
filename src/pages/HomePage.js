import React from "react";
import { Box, Typography, Button, TextField, Grid, Card, CardContent, CardMedia } from "@mui/material";
import { styled } from "@mui/material/styles";
import './HomePage.css';

const Banner = styled(Box)(({ theme }) => ({
  background: "linear-gradient(90deg, #388e3c 60%, #43a047 100%)",
  color: "#fff",
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  textAlign: "center",
}));

const featuredProducts = [
  { id: 1, name: "Organic Rice", price: "₹120", image: "https://source.unsplash.com/featured/?rice" },
  { id: 2, name: "Fresh Vegetables", price: "₹80", image: "https://source.unsplash.com/featured/?vegetables" },
  { id: 3, name: "Dairy Products", price: "₹60", image: "https://source.unsplash.com/featured/?milk" },
];

const HomePage = () => {
  return (
    <Box className="home-root">
      <Banner>
        <Typography variant="h4" fontWeight={700}>Welcome to Sri Amman Smart Store</Typography>
        <Typography variant="subtitle1">Shop fresh, organic, and local products delivered to your doorstep!</Typography>
        <Box mt={2}>
          <TextField className="search-bar" label="Search products" variant="outlined" size="small" fullWidth />
        </Box>
      </Banner>
      <Typography variant="h5" className="section-title">Featured Products</Typography>
      <Grid container spacing={2} className="featured-products">
        {featuredProducts.map(product => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card className="product-card">
              <CardMedia
                component="img"
                height="140"
                image={product.image}
                alt={product.name}
              />
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body2" color="text.secondary">{product.price}</Typography>
                <Button variant="contained" color="primary" fullWidth sx={{ mt: 1 }}>Add to Cart</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
export default HomePage;
