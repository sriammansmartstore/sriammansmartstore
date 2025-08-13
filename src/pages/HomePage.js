import React, { useState, useEffect, useContext, useRef } from "react";
import { Box, Typography, Grid, Snackbar, Alert, TextField, InputAdornment, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
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
  const [area, setArea] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
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
  const getFilteredProducts = () => {
    if (!search.trim()) return products;
    const searchText = search.trim().toLowerCase();
    // Score function: higher score = more relevant
    function getScore(product) {
      let score = 0;
      // Name exact/partial match
      if (product.name && product.name.toLowerCase().includes(searchText)) score += 10;
      if (product.nameTamil && product.nameTamil.toLowerCase().includes(searchText)) score += 10;
      // Category match
      if (product.category && product.category.toLowerCase().includes(searchText)) score += 5;
      // Keywords match (comma separated string)
      if (product.keywords) {
        const keywordsArr = product.keywords.split(',').map(k => k.trim().toLowerCase());
        if (keywordsArr.some(k => k.includes(searchText))) score += 7;
      }
      // Description match
      if (product.description && product.description.toLowerCase().includes(searchText)) score += 2;
      return score;
    }
    // Filter products with score > 0, then sort by score desc, then createdAt desc
    return products
      .map(p => ({ ...p, _score: getScore(p) }))
      .filter(p => p._score > 0)
      .sort((a, b) => b._score - a._score || (b.createdAt?.toDate?.() || new Date(b.createdAt)) - (a.createdAt?.toDate?.() || new Date(a.createdAt)));
  };

  const filteredProducts = getFilteredProducts();

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

  // ...existing code...

  return (
    <Box className="home-root">
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

      <Typography className="section-title" variant="h6">All Products</Typography>

      {loading ? (
        <Typography>Loading products...</Typography>
      ) : filteredProducts.length === 0 ? (
        <Typography>No products found.</Typography>
      ) : (
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
                onAddToWishlist={handleAddToWishlist}
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