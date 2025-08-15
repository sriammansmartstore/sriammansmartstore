import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardMedia, Skeleton, Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const db = getFirestore();
        const categoriesRef = collection(db, "categories");
        const q = query(categoriesRef, orderBy("name"));
        const querySnapshot = await getDocs(q);
        
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
          setCategories(categoriesData);
          setLoadingCategories(false);
          // Automatically select the first category if available
          if (categoriesData.length > 0) {
            setSelectedCategory(categoriesData[0]);
          }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedCategory) {
        console.log('No selectedCategory, skipping fetchProducts');
        return;
      }
      console.log('Fetching products for category:', selectedCategory);
      setLoadingProducts(true);
      try {
        const db = getFirestore();
        // Fetch products from products/{categoryName}/items
        const categoryName = selectedCategory.name;
        const productsRef = collection(db, `products/${categoryName}/items`);
        console.log('Firestore productsRef:', productsRef.path);
        const q = query(productsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        console.log('Products querySnapshot:', querySnapshot);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched productsData:', productsData);
        setProducts(productsData);
        setLoadingProducts(false);
        console.log('Set products and loadingProducts to false');
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  return (
    <Box className="categories-root" sx={{ pb: 10, display: 'flex', flexDirection: 'row', position: 'relative' }}>
      {/* Vertically stacked categories sidebar on the left */}
      <Box
        sx={{
          position: 'sticky',
          top: 70,
          left: 0,
          bgcolor: '#fff',
          boxShadow: 2,
          zIndex: 100,
          px: 1,
          py: 1,
          minWidth: 90,
          maxWidth: 110,
          maxHeight: '80vh',
          overflowY: 'auto',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          borderRight: '3px solid #388e3c',
        }}
      >
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
      {/* Products area */}
  <Box sx={{ flex: '1 1 auto', pl: { xs: 2, md: 2 }, maxWidth: { xs: '100%', md: 'calc(100% - 100px)' } }}>
        {/* Products Grid */}
        <Grid container spacing={2} sx={{ justifyContent: 'center', mb: 2 }}>
          {loadingProducts ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Grid item xs={12} sm={6} md={6} lg={6} xl={6} key={idx}
                sx={{
                  display: 'flex',
                  flexBasis: '45%',
                  maxWidth: '45%',
                  flexGrow: 0
                }}>
                <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2, mb: 2 }} />
              </Grid>
            ))
          ) : products.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No products found for this category.</Typography>
            </Grid>
          ) : (
            products.map(product => (
              <Grid item xs={12} sm={6} md={6} lg={6} xl={6} key={product.id}
                sx={{
                  display: 'flex',
                  flexBasis: '45%',
                  maxWidth: '45%',
                  flexGrow: 0
                }}>
                <ProductCard product={product} />
              </Grid>
            ))
          )}
        </Grid>
      </Box>

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