

import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, TextField, Grid, Snackbar, Alert, IconButton, Button, AppBar, Toolbar } from "@mui/material";
import { styled } from "@mui/material/styles";
import './HomePage.css';
import LocationDetectionWidget from "./LocationDetectionPage";
import ProductCard from "../components/ProductCard";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from "react-router-dom";

const Banner = styled(Box)(({ theme }) => ({
  background: "linear-gradient(90deg, #388e3c 60%, #43a047 100%)",
  color: "#fff",
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  textAlign: "center",
}));

const HomePage = () => {
  const [area, setArea] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  // Example deliverable check: you can replace this with your own logic
  const isDeliverable = area && typeof area === 'string' && area.toLowerCase().includes("coimbatore");

  useEffect(() => {
    // Fetch products from Firestore (modular v9+ syntax)
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetched);
        console.log("Fetched products:", fetched);
      } catch (err) {
        setProducts([]);
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (product, quantity) => {
    if (!user) return alert("Please login to add to cart.");
    try {
      await setDoc(doc(db, "users", user.uid, "cart", product.id), {
        ...product,
        quantity,
      });
      setCart(prev => {
        const exists = prev.find(item => item.id === product.id);
        if (exists) {
          return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
        }
        return [...prev, { ...product, quantity }];
      });
      setSnackbarOpen(true);
    } catch (err) {
      alert("Failed to add to cart.");
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!user) return alert("Please login to add to wishlist.");
    try {
      await setDoc(doc(db, "users", user.uid, "wishlist", product.id), {
        ...product,
      });
      setWishlist(prev => prev.some(item => item.id === product.id) ? prev : [...prev, product]);
    } catch (err) {
      alert("Failed to add to wishlist.");
    }
  };

  return (
    <Box className="home-root">
      <TextField className="search-bar" label="Search products" variant="outlined" size="small" fullWidth />
      {/* Only show detected location and deliverable/not text below search bar */}
      {area && (
        <Box sx={{ mb: 1, mt: 0.5, px: 0 }}>
          <Typography variant="caption" sx={{ color: '#388e3c', fontWeight: 400, fontSize: '0.72rem', lineHeight: 1.2, p: 0, m: 0 }}>
            {area}
          </Typography>
          <Typography variant="caption" sx={{ color: isDeliverable ? '#388e3c' : 'red', fontWeight: 500, fontSize: '0.72rem', lineHeight: 1.2, p: 0, m: 0, display: 'block' }}>
            {isDeliverable ? 'Delivery available in your area' : 'Sorry, delivery not available in your area'}
          </Typography>
        </Box>
      )}
      <LocationDetectionWidget onLocationDetected={setArea} />
      <Typography variant="h5" className="section-title" sx={{ mt: 3, mb: 2 }}>All Products</Typography>
      {loading ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary">Loading products...</Typography>
        </Box>
      ) : products.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary">No products found.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3} className="featured-products">
          {products.map(product => (
            <Grid item xs={12} sm={6} md={6} key={product.id}>
              <ProductCard
                product={product}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
              />
            </Grid>
          ))}
        </Grid>
      )}
      <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Added to cart!
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default HomePage;
