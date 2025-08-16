import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Grid, CircularProgress, Snackbar, Alert } from "@mui/material";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy, doc, setDoc } from "firebase/firestore";
import ProductCard from "../components/ProductCard";
import { AuthContext } from "../context/AuthContext";
import "./HomePage.css";

const CategoryProductsPage = () => {
  const { categoryName } = useParams();
  const decodedCategoryName = decodeURIComponent(categoryName);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Fetch products from products/{category}/items for the selected category
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const itemsRef = collection(db, "products", decodedCategoryName, "items");
        const q = query(itemsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetched);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [decodedCategoryName]);

  return (
    <Box className="home-root">
      <Typography className="section-title" variant="h6">
        Products in: {decodedCategoryName}
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Typography>No products found for this category.</Typography>
      ) : (
        <Grid container spacing={2} sx={{ justifyContent: "center" }}>
          {products.map(product => (
            <Grid item xs={12} sm={6} md={6} lg={6} xl={6} key={product.id}
              sx={{ display: "flex", flexBasis: "45%", maxWidth: "45%", flexGrow: 0 }}>
              <ProductCard 
                product={product} 
              />
            </Grid>
          ))}
        </Grid>
      )}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Added to cart!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoryProductsPage;
