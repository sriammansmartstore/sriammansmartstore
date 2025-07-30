import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, Grid, Card, CardMedia, Skeleton, IconButton, Dialog, DialogTitle, DialogContent, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import ProductCard from "../components/ProductCard";
import './CategoriesPage.css';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showScroller, setShowScroller] = useState(true);
  const lastScrollY = useRef(window.scrollY);
  const navigate = useNavigate();
  // Hide/show categories scroller on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        // Scrolling down
        setShowScroller(false);
      } else {
        // Scrolling up
        setShowScroller(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const db = getFirestore();
        const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(cats);
        // Select first category by default
        if (cats.length > 0) setSelectedCategory(cats[0]);
      } catch (err) {
        setCategories([]);
      }
      setLoadingCategories(false);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // Fetch products for selected category
    const fetchProducts = async () => {
      if (!selectedCategory) {
        setProducts([]);
        return;
      }
      setLoadingProducts(true);
      try {
        const db = getFirestore();
        const itemsRef = collection(db, "products", selectedCategory.name, "items");
        const q = query(itemsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetched);
      } catch (err) {
        setProducts([]);
      }
      setLoadingProducts(false);
    };
    fetchProducts();
  }, [selectedCategory]);

  return (
    <Box className="categories-root" sx={{ pb: 10 }}>
      <Typography variant="h5" fontWeight={700} color="primary" mb={0.5} sx={{ letterSpacing: 0.5 }}>
        {selectedCategory ? selectedCategory.name : "Products"}
      </Typography>

      {/* Products Grid */}
      <Grid container spacing={2} sx={{ justifyContent: 'center', mb: 2 }}>
        {loadingProducts ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Grid item xs={12} sm={6} md={4} lg={4} xl={4} key={idx}>
              <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2, mb: 2 }} />
            </Grid>
          ))
        ) : products.length === 0 ? (
          <Grid item xs={12}><Typography>Loading Products...</Typography></Grid>
        ) : (
          products.map(product => (
            <Grid item xs={12} sm={6} md={4} lg={4} xl={4} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))
        )}
      </Grid>

      {/* Horizontally scrollable categories bar */}
      {showScroller && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 56, // adjust if you have a bottom nav bar
            left: 0,
            right: 0,
            bgcolor: '#fff',
            boxShadow: 2,
            zIndex: 100,
            px: 1,
            py: 0.5,
            minHeight: 64,
          }}
        >
          <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1 }}>
            {loadingCategories ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} variant="rectangular" width={54} height={54} sx={{ borderRadius: 2 }} />
              ))
            ) : categories.length === 0 ? (
              <Typography>No categories found.</Typography>
            ) : (
              categories.map(cat => (
                <Card
                  key={cat.id}
                  className="category-card"
                  sx={{
                    minWidth: 54,
                    maxWidth: 80,
                    cursor: 'pointer',
                    border: selectedCategory?.id === cat.id ? '2px solid #1976d2' : '1px solid #eee',
                    boxShadow: selectedCategory?.id === cat.id ? 3 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 0.5,
                    bgcolor: selectedCategory?.id === cat.id ? '#e3f2fd' : '#fff',
                  }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <CardMedia
                    component="img"
                    image={cat.imageUrl}
                    alt={cat.name}
                    sx={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 2, mb: 0.5, background: '#f7f7f7' }}
                  />
                  <Typography variant="body2" fontWeight={600} color="primary" sx={{ textAlign: 'center', fontSize: 12 }}>
                    {cat.name}
                  </Typography>
                </Card>
              ))
            )}
          </Box>
        </Box>
      )}

      {/* Category Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedCategory?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <CardMedia
              component="img"
              image={selectedCategory?.imageUrl}
              alt={selectedCategory?.name}
              sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, mb: 2, background: '#f7f7f7' }}
            />
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem', textAlign: 'center' }}>
              {selectedCategory?.description}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CategoriesPage;