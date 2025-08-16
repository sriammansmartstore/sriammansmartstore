import React, { useState, useEffect, useContext, useRef } from "react";
import { Box, Typography, Grid, Snackbar, Alert, TextField, InputAdornment, IconButton } from "@mui/material";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import BannerSlideshow from "../components/BannerSlideshow";
import SortFilterBar from "../components/SortFilterBar";
import MicIcon from "@mui/icons-material/Mic";
import './HomePage.css';
import LocationDetectionWidget from "./LocationDetectionPage";
import ProductCard from "../components/ProductCard";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { doc, setDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Banner = styled(Box)(({ theme }) => ({
  background: "linear-gradient(90deg, #388e3c 60%, #43a047 100%)",
  color: "#fff",
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  textAlign: "center",
}));

const HomePage = () => {
  // Helper to prevent rendering objects as children
  const safeRender = (value) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      console.error('Attempted to render object as React child:', value);
      return null;
    }
    return value;
  };
  const [sortFilterOpen, setSortFilterOpen] = useState(false);
  // Listen for S/F button event from BottomNavbar
  useEffect(() => {
    const handler = () => setSortFilterOpen((open) => !open);
    window.addEventListener('toggle-sort-filter', handler);
    return () => window.removeEventListener('toggle-sort-filter', handler);
  }, []);
  // Sort/filter state
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState({ price: [0, 10000], discount: [0, 100], rating: [0, 5], unit: [], brand: [], available: false });
  const [area, setArea] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [listening, setListening] = useState(false);
  const searchInputRef = useRef(null);

  // Listen for voice search event or localStorage value
  useEffect(() => {
    // On mount, check if a voice search query exists
    const voiceQuery = localStorage.getItem('voice_search_query');
    if (voiceQuery) {
      setSearch(voiceQuery);
      localStorage.removeItem('voice_search_query');
    }
    // Listen for custom event
    const handler = (e) => {
      if (e.detail) setSearch(e.detail);
    };
    window.addEventListener('voice-search', handler);
    return () => window.removeEventListener('voice-search', handler);
  }, []);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Voice search handler
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      setSearch(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      alert('Voice search failed: ' + event.error);
    };
    recognition.onend = () => {
      setListening(false);
    };
  };

  // Function to focus search bar (will be called from BottomNavbar)
  const focusSearchBar = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Listen for search focus event from BottomNavbar
  useEffect(() => {
    const handleSearchFocus = () => {
      focusSearchBar();
    };
    const handleClearSearch = () => {
      setSearch('');
    };
    window.addEventListener('focus-search', handleSearchFocus);
    window.addEventListener('clear-search', handleClearSearch);
    return () => {
      window.removeEventListener('focus-search', handleSearchFocus);
      window.removeEventListener('clear-search', handleClearSearch);
    };
  }, []);

  // Example deliverable check
  const isDeliverable = area && typeof area === 'string' && area.toLowerCase().includes("coimbatore");

  useEffect(() => {
    // Fetch all products from all categories' items subcollections
    const fetchProducts = async () => {
      try {
        // 1. Get all categories
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const categories = categoriesSnapshot.docs.map(doc => doc.data().name);
        let allProducts = [];
        // 2. For each category, fetch products from products/{category}/items
        for (const category of categories) {
          const itemsRef = collection(db, "products", category, "items");
          const q = query(itemsRef, orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), category }));
          allProducts = allProducts.concat(products);
        }
        // 3. Sort all products by createdAt (desc)
        allProducts.sort((a, b) => (b.createdAt?.toDate?.() || new Date(b.createdAt)) - (a.createdAt?.toDate?.() || new Date(a.createdAt)));
        setProducts(allProducts);
        console.log("Fetched all products:", allProducts);
      } catch (err) {
        setProducts([]);
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter and sort products based on search
  // Filter and sort products based on search, sort, and filters
  const getFilteredProducts = () => {
    let filtered = [...products];
    // Only apply search if user entered something
    if (search.trim()) {
      const searchText = search.trim().toLowerCase();
      function getScore(product) {
        let score = 0;
        if (product.name && product.name.toLowerCase().includes(searchText)) score += 10;
        if (product.nameTamil && product.nameTamil.toLowerCase().includes(searchText)) score += 10;
        if (product.category && product.category.toLowerCase().includes(searchText)) score += 5;
        if (product.keywords) {
          const keywordsArr = product.keywords.split(',').map(k => k.trim().toLowerCase());
          if (keywordsArr.some(k => k.includes(searchText))) score += 7;
        }
        if (product.description && product.description.toLowerCase().includes(searchText)) score += 2;
        return score;
      }
      filtered = filtered.map(p => ({ ...p, _score: getScore(p) })).filter(p => p._score > 0);
    }

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

  return (
    <Box className="home-root" sx={{ position: 'relative', pb: 10 }}>
      
     
             <TextField
        className="search-bar"
        label="Search products"
        variant="outlined"
        size="small"
        fullWidth
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoComplete="off"
        inputRef={searchInputRef}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleVoiceSearch}
                edge="end"
                sx={{
                  color: listening ? '#d32f2f' : '#388e3c',
                  '&:hover': {
                    backgroundColor: listening ? 'rgba(211, 47, 47, 0.04)' : 'rgba(56, 142, 60, 0.04)'
                  }
                }}
              >
                <MicIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1 }}
      />
      {/* Only show detected location and deliverable/not text below search bar */}
      <LocationDetectionWidget onLocationDetected={setArea} />
      {area && (
        <Box sx={{ mb: 1, mt: 0.5, px: 0 }}>
          <Typography variant="caption" sx={{ color: isDeliverable ? '#388e3c' : 'red', fontWeight: 500, fontSize: '0.72rem', lineHeight: 1.2, p: 0, m: 0, display: 'block' }}>
            {isDeliverable ? 'Delivery available in your area' : 'Sorry, delivery not available in your area'}
          </Typography>
        </Box>
      )}
 <BannerSlideshow />
     
      {loading ? (
        <Typography>Loading products...</Typography>
      )  : (
        <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={6} lg={6} xl={6} key={product.id}
              sx={{
                display: 'flex',
                flexBasis: '45%',
                maxWidth: '45%',
                flexGrow: 0
              }}>
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

export default HomePage;