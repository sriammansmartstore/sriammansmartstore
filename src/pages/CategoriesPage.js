import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardMedia, Skeleton, Dialog, DialogTitle, DialogContent } from "@mui/material";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import ProductCard from "../components/ProductCard";
import SortFilterBar from "../components/SortFilterBar";
import './CategoriesPage.css';

const CategoriesPage = () => {
  const [sortFilterOpen, setSortFilterOpen] = useState(false);
  // Sort/filter state
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState({ price: [0, 10000], discount: [0, 100], rating: [0, 5], unit: [], brand: [], available: false });
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
        // Try products/{categoryId}/items first, then fallback to products/{categoryName}/items
        const catId = selectedCategory.id;
        const catName = selectedCategory.name;

        let productsData = [];
        let usedPath = '';

        // Attempt with ID
        try {
          const refById = collection(db, `products/${catId}/items`);
          const qById = query(refById, orderBy('createdAt', 'desc'));
          const snapById = await getDocs(qById);
          usedPath = refById.path;
          if (!snapById.empty) {
            productsData = snapById.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log('[CategoriesPage] Loaded via ID path:', usedPath, 'count:', productsData.length);
          } else {
            console.warn('[CategoriesPage] No products at ID path, trying name path...', usedPath);
          }
        } catch (innerErr) {
          console.warn('[CategoriesPage] Error using ID path, will try name path next.', innerErr);
        }

        // Fallback with Name if needed
        if (productsData.length === 0 && catName) {
          const refByName = collection(db, `products/${catName}/items`);
          const qByName = query(refByName, orderBy('createdAt', 'desc'));
          const snapByName = await getDocs(qByName);
          usedPath = refByName.path;
          productsData = snapByName.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log('[CategoriesPage] Loaded via Name path:', usedPath, 'count:', productsData.length);
        }

        // Final fallback: fetch without orderBy in case createdAt is missing/unindexed
        if (productsData.length === 0) {
          try {
            if (catId) {
              const refByIdNoOrder = collection(db, `products/${catId}/items`);
              const snapByIdNoOrder = await getDocs(refByIdNoOrder);
              if (!snapByIdNoOrder.empty) {
                productsData = snapByIdNoOrder.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log('[CategoriesPage] Fallback without orderBy via ID path:', refByIdNoOrder.path, 'count:', productsData.length);
              }
            }
            if (productsData.length === 0 && catName) {
              const refByNameNoOrder = collection(db, `products/${catName}/items`);
              const snapByNameNoOrder = await getDocs(refByNameNoOrder);
              if (!snapByNameNoOrder.empty) {
                productsData = snapByNameNoOrder.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log('[CategoriesPage] Fallback without orderBy via Name path:', refByNameNoOrder.path, 'count:', productsData.length);
              }
            }
          } catch (noOrderErr) {
            console.warn('[CategoriesPage] Error during fallback without orderBy', noOrderErr);
          }
        }

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

  // Filter and sort products for selected category
  const getFilteredProducts = () => {
    let filtered = [...products];
    // Only apply price filter if user changed from default
    if (filters.price[0] > 0 || filters.price[1] < 10000) {
      filtered = filtered.filter(p => (p.sellingPrice || p.price) >= filters.price[0] && (p.sellingPrice || p.price) <= filters.price[1]);
    }
    // Only apply discount filter if user changed from default
    if (filters.discount[0] > 0 || filters.discount[1] < 100) {
      filtered = filtered.filter(p => {
        const mrp = p.mrp || 0, sp = p.sellingPrice || p.price || 0;
        const discount = mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
        return discount >= filters.discount[0] && discount <= filters.discount[1];
      });
    }
    // Only apply rating filter if user changed from default
    if (filters.rating[0] > 0 || filters.rating[1] < 5) {
      filtered = filtered.filter(p => (p.rating || 0) >= filters.rating[0] && (p.rating || 0) <= filters.rating[1]);
    }
    // Only apply unit filter if user selected units
    if (filters.unit.length > 0) filtered = filtered.filter(p => filters.unit.includes(p.unit));
    // Only apply brand filter if user selected brands
    if (filters.brand.length > 0) filtered = filtered.filter(p => filters.brand.includes(p.brand));
    // Only apply availability filter if user checked it
    if (filters.available) filtered = filtered.filter(p => p.available !== false);

    // Sort
    switch (sort) {
      case "priceLowHigh": filtered.sort((a, b) => (a.sellingPrice || a.price) - (b.sellingPrice || b.price)); break;
      case "priceHighLow": filtered.sort((a, b) => (b.sellingPrice || b.price) - (a.sellingPrice || a.price)); break;
      case "newest": filtered.sort((a, b) => (b.createdAt?.toDate?.() || new Date(b.createdAt)) - (a.createdAt?.toDate?.() || new Date(a.createdAt))); break;
      case "oldest": filtered.sort((a, b) => (a.createdAt?.toDate?.() || new Date(a.createdAt)) - (b.createdAt?.toDate?.() || new Date(b.createdAt))); break;
      case "nameAZ": filtered.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
      case "nameZA": filtered.sort((a, b) => (b.name || "").localeCompare(a.name || "")); break;
      case "discount": filtered.sort((a, b) => {
        const dA = a.mrp && a.sellingPrice ? ((a.mrp - a.sellingPrice) / a.mrp) : 0;
        const dB = b.mrp && b.sellingPrice ? ((b.mrp - b.sellingPrice) / b.mrp) : 0;
        return dB - dA;
      }); break;
      case "rating": filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: break;
    }
    return filtered;
  };
  const filteredProducts = getFilteredProducts();
  const isScrollable = loadingProducts || filteredProducts.length > 0;
  return (
    <Box className="categories-root" sx={{ pb: 2, display: 'flex', flexDirection: 'row', position: 'relative', gap: 2 }}>
      {/* Vertically stacked categories sidebar on the left */}
      <Box
        sx={{
          position: 'sticky',
          left: 0,
          bgcolor: '#fff',
          boxShadow: 2,
          zIndex: 100,
          px: 1,
          py: 1,
          minWidth: 90,
          maxWidth: 110,
          maxHeight: 'calc(100vh - 90px)',
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
      {/* Products area (scrollable) */}
      <Box
        sx={{
          flex: '1 1 auto',
          pl: { xs: 1, md: 2 },
          maxWidth: { xs: '100%', md: 'calc(100% - 120px)' },
          maxHeight: isScrollable ? 'calc(100vh - 90px)' : 'none',
          overflowY: isScrollable ? 'auto' : 'visible',
          pt: 0,
          pr: 1,
        }}
      >
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
          ) : filteredProducts.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', pt: 2, pb: 3 }}>
                <Typography color="text.secondary" align="center">
                  No products found for this category.
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredProducts.map(product => (
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