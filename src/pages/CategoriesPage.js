import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardMedia, Skeleton, Dialog, DialogTitle, DialogContent, Drawer, List, ListItemButton, ListItemText, ListItemAvatar, Avatar, IconButton } from "@mui/material";
import { Button } from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs, query, orderBy, where } from "firebase/firestore";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Auto-open category drawer on first load
  useEffect(() => {
    setDrawerOpen(true);
  }, []);

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
          // Build a query with filters/sort where possible
          const qById = buildQueryWithCriteria(refById);
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
          const qByName = buildQueryWithCriteria(refByName);
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

        // Client-side post-filters for what Firestore can't do (discount calc, unit/brand arrays, upper bounds)
        let finalData = productsData;
        // Apply price upper bound if server query couldn't include both bounds
        if (filters.price[0] > 0 || filters.price[1] < 10000) {
          finalData = finalData.filter(p => (p.sellingPrice || p.price) >= filters.price[0] && (p.sellingPrice || p.price) <= filters.price[1]);
        }
        // Rating upper bound
        if (filters.rating[1] < 5) {
          finalData = finalData.filter(p => (p.rating || 0) <= filters.rating[1]);
        }
        // Unit and brand filters
        if (filters.unit.length > 0) finalData = finalData.filter(p => filters.unit.includes(p.unit));
        if (filters.brand.length > 0) finalData = finalData.filter(p => filters.brand.includes(p.brand));
        // Discount range (requires computation)
        if (filters.discount[0] > 0 || filters.discount[1] < 100) {
          finalData = finalData.filter(p => {
            const mrp = p.mrp || 0, sp = p.sellingPrice || p.price || 0;
            const dis = mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
            return dis >= filters.discount[0] && dis <= filters.discount[1];
          });
        }
        // Client-side sort when unsupported (discount)
        if (sort === 'discount') {
          finalData.sort((a, b) => {
            const dA = a.mrp && a.sellingPrice ? ((a.mrp - a.sellingPrice) / a.mrp) : 0;
            const dB = b.mrp && b.sellingPrice ? ((b.mrp - b.sellingPrice) / b.mrp) : 0;
            return dB - dA;
          });
        }

        console.log('Fetched productsData:', finalData);
        setProducts(finalData);
        setLoadingProducts(false);
        console.log('Set products and loadingProducts to false');
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, sort, filters.available, filters.price, filters.rating]);

  // Helper to build server-side Firestore query based on current sort/filters
  const buildQueryWithCriteria = (baseRef) => {
    const whereClauses = [];
    let qOrderBy = null;
    let qDirection = 'desc';

    // Availability
    if (filters.available) whereClauses.push(where('available', '==', true));
    // Rating lower bound
    if (filters.rating[0] > 0) whereClauses.push(where('rating', '>=', filters.rating[0]));
    // Price range lower bound (upper bound might be applied client-side if needed due to index constraints)
    if (filters.price[0] > 0) whereClauses.push(where('sellingPrice', '>=', filters.price[0]));
    // We will still attempt to add upper bound; if missing index, Firestore will error in console; users can add index later
    if (filters.price[1] < 10000) whereClauses.push(where('sellingPrice', '<=', filters.price[1]));

    switch (sort) {
      case 'priceLowHigh': qOrderBy = 'sellingPrice'; qDirection = 'asc'; break;
      case 'priceHighLow': qOrderBy = 'sellingPrice'; qDirection = 'desc'; break;
      case 'newest': qOrderBy = 'createdAt'; qDirection = 'desc'; break;
      case 'oldest': qOrderBy = 'createdAt'; qDirection = 'asc'; break;
      case 'nameAZ': qOrderBy = 'name'; qDirection = 'asc'; break;
      case 'nameZA': qOrderBy = 'name'; qDirection = 'desc'; break;
      case 'rating': qOrderBy = 'rating'; qDirection = 'desc'; break;
      default: qOrderBy = 'createdAt'; qDirection = 'desc'; break;
    }

    let qRef = query(baseRef, ...whereClauses);
    qRef = query(qRef, orderBy(qOrderBy, qDirection));
    return qRef;
  };

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
    <div className="categories-root">
      {/* Right-attached rectangular tab to open category drawer (mid-right) */}
      <Box
        role="button"
        aria-label="open categories"
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1300,
          width: 26,
          height: 116,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #43a047 0%, #2e7d32 100%)',
          color: '#fff',
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          borderLeft: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { filter: 'brightness(1.05)' }
        }}
      >
        <ChevronLeftIcon sx={{ color: '#fff' }} />
      </Box>

      {/* Right side drawer for category selection */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="persistent"
        ModalProps={{ keepMounted: true, hideBackdrop: true, disableEscapeKeyDown: true, disableScrollLock: true }}
        PaperProps={{ sx: { width: { xs: '50vw', sm: '50vw' }, maxWidth: 520, top: { xs: 56, sm: 64 }, bottom: { xs: 120, sm: 120 }, overflow: 'auto' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#388e3c' }}>Select Category</Typography>
          <IconButton size="small" onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List sx={{ py: 0 }}>
          {loadingCategories ? (
            Array(8).fill().map((_, i) => (
              <Box key={`cat-skel-${i}`} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1.5 }} />
                <Skeleton variant="text" width={160} height={24} />
              </Box>
            ))
          ) : (
            categories.map((cat) => (
              <ListItemButton
                key={cat.id}
                selected={selectedCategory?.id === cat.id}
                onClick={() => { setSelectedCategory(cat); setDrawerOpen(false); }}
              >
                <ListItemAvatar>
                  <Avatar src={cat.imageUrl} alt={cat.name}>
                    <CategoryIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={cat.name} secondary={cat.description ? String(cat.description).slice(0, 48) : null} />
              </ListItemButton>
            ))
          )}
        </List>
      </Drawer>
      {/* Removed top categories bar to match Home layout */}

      {/* Main Content Area */}
      <div className="categories-main">
        {/* Header */}
        <div className="categories-header">
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold', 
            color: '#388e3c',
            fontSize: '1.1rem'
          }}>
            {selectedCategory?.name || 'Categories'}
          </Typography>
        </div>

        {/* Products Container */}
        <div className="products-container">
          <Grid container spacing={2} sx={{ justifyContent: 'center', alignItems: 'flex-start' }}>
            {loadingProducts ? (
              Array(8).fill().map((_, index) => (
                <Grid item xs={6} sm={6} md={6} key={`product-skeleton-${index}`}>
                  <Box sx={{ width: '100%', bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 1 }}>
                    <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2 }} />
                    <Skeleton width="80%" height={16} sx={{ mt: 1 }} />
                    <Skeleton width="60%" height={14} />
                  </Box>
                </Grid>
              ))
            ) : filteredProducts.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', textAlign: 'center', p: 3 }}>
                  <Typography color="text.secondary" variant="body2">
                    No products found for this category.
                  </Typography>
                </Box>
              </Grid>
            ) : (
              filteredProducts.map(product => (
                <Grid item xs={6} sm={6} md={6} key={product.id}>
                  <Box sx={{ width: '100%' }}>
                    <ProductCard product={product} />
                  </Box>
                </Grid>
              ))
            )}
          </Grid>
        </div>
      </div>

      {/* Fixed Sort/Filter Bar - Above Bottom Nav */}
      <div className="sort-filter-fixed">
        <SortFilterBar 
          sort={sort}
          setSort={setSort}
          filters={filters}
          setFilters={setFilters}
          units={[]}
          brands={[]}
          minPrice={0}
          maxPrice={10000}
          minDiscount={0}
          maxDiscount={100}
          minRating={0}
          maxRating={5}
          onApply={() => { /* Re-fetch using Firestore with current criteria */ setLoadingProducts(true); setTimeout(() => setLoadingProducts(false), 0); /* trigger useEffect via state changes already wired */ }}
        />
      </div>

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
    </div>
  );
};

export default CategoriesPage;