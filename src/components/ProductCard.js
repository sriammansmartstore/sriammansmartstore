import React, { useState, useEffect, useContext } from "react";
import {
  Card, CardMedia, CardContent, Typography, IconButton, Button, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import "./../pages/HomePage.css"; // Ensure the CSS is applied


// Helper to get the middle option (or first if only one)
const getMiddleOption = (options) => {
  if (!Array.isArray(options) || options.length === 0) return null;
  const idx = Math.floor(options.length / 2);
  return options[idx];
};

const getDiscount = (mrp, sellingPrice) => {
  if (!mrp || !sellingPrice || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

const ProductCard = ({ product, onAddToCart, onAddToWishlist }) => {
  const [quantity, setQuantity] = useState(1);
  const [showQuantity, setShowQuantity] = useState(false);
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlists, setWishlists] = useState([]);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [selectingWishlist, setSelectingWishlist] = useState(false);
  // Pick the middle option for display if available
  const option = getMiddleOption(product.options) || product.options?.[0] || {};
  const discount = getDiscount(option.mrp, option.sellingPrice);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchWishlists = async () => {
      if (!user) return setWishlists([]);
      try {
        const colRef = collection(db, "users", user.uid, "wishlists");
        const snapshot = await getDocs(colRef);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWishlists(fetched);
      } catch (err) {
        setWishlists([]);
      }
    };
    fetchWishlists();
  }, [user, wishlistDialogOpen]);

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!showQuantity) {
      setShowQuantity(true);
    } else {
      onAddToCart(product, quantity);
      setShowQuantity(false);
      setQuantity(1);
    }
  };

  const handleWishlistIconClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return alert("Please login to use wishlists.");
    setWishlistDialogOpen(true);
    setSelectingWishlist(true);
  };

  const handleSelectWishlist = async (wishlistId) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "wishlists", wishlistId, "products", product.id), {
        ...product,
        addedAt: new Date().toISOString(),
      });
      setWishlistDialogOpen(false);
      if (onAddToWishlist) onAddToWishlist(product);
    } catch (err) {
      alert("Failed to add to wishlist.");
    }
  };

  const handleCreateWishlist = async () => {
    if (!user || !newWishlistName.trim()) return;
    try {
      const colRef = collection(db, "users", user.uid, "wishlists");
      const docRef = await addDoc(colRef, { name: newWishlistName.trim(), createdAt: new Date().toISOString() });
      await setDoc(doc(db, "users", user.uid, "wishlists", docRef.id, "products", product.id), {
        ...product,
        addedAt: new Date().toISOString(),
      });
      setWishlistDialogOpen(false);
      setNewWishlistName("");
      if (onAddToWishlist) onAddToWishlist(product);
    } catch (err) {
      alert("Failed to create wishlist.");
    }
  };

  const handleAddToGeneralWishlist = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "wishlists", "general", "products", product.id), {
        ...product,
        addedAt: new Date().toISOString(),
      });
      setWishlistDialogOpen(false);
      if (onAddToWishlist) onAddToWishlist(product);
    } catch (err) {
      alert("Failed to add to general wishlist.");
    }
  };

  return (
    <Card className="product-card" sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      {/* Discount Ribbon */}
      {discount > 0 && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 3,
          width: 70,
          height: 70,
          pointerEvents: 'none',
        }}>
          <Box sx={{
            position: 'absolute',
            top: 10,
            left: -28,
            width: 120,
            transform: 'rotate(-45deg)',
            background: 'linear-gradient(90deg, #d32f2f 60%, #ff5252 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            textAlign: 'center',
            py: 0.5,
            boxShadow: 2,
            letterSpacing: 0.5,
            borderRadius: 1,
            userSelect: 'none',
          }}>
            {discount}% OFF
          </Box>
        </Box>
      )}
      {/* Wishlist Icon */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <IconButton
          color="secondary"
          onClick={handleWishlistIconClick}
          sx={{ p: 0.5, background: '#fff', boxShadow: 1, borderRadius: '50%' }}
        >
          <FavoriteBorderIcon fontSize="small" />
        </IconButton>
      </Box>
      <Link to={`/product/${product.category}/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <Box sx={{ width: '100%', minHeight: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 0, mt: 0, mb: 0 }}>
          <CardMedia
            component="img"
            image={product.imageUrls?.[0] || "https://via.placeholder.com/180"}
            alt={product.name}
            sx={{ objectFit: "contain", width: '100%', height: 120, maxHeight: 140, background: '#f8f8f8' }}
          />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <CardContent sx={{ p: 1, pb: 0, flex: 1, paddingBottom: '0 !important' }}>
            <Box className="scrolling-text-container">
              <Typography
                className="scrolling-text"
                variant="subtitle1"
                fontWeight={700}
                sx={{ fontSize: '1rem', mb: 0.5, lineHeight: 1.1 }}
              >
                {product.name}
              </Typography>
            </Box>
            {/* Product Pricing Section: Show selling price, MRP (striked out), and discount if any */}
            <Box className="product-card-pricing" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
                <Typography className="selling-price" sx={{ fontWeight: 700, color: '#388e3c', fontSize: '1.1rem', mr: 1 }}>
                  ₹{option.sellingPrice}
                </Typography>
                {option.mrp && option.mrp > option.sellingPrice && (
                  <Typography className="mrp-price" sx={{ textDecoration: 'line-through', color: '#888', fontWeight: 500, fontSize: '1rem', mr: 1 }}>
                    ₹{option.mrp}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Box>
      </Link>
      {/* Add to Cart Section */}
      <Box className="add-to-cart-container" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 40, p: 0, m: 0, mt: 0, gap: 0 }}>
        {showQuantity && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', mb: 0 }}>
            <IconButton size="small" sx={{ p: 0.5, background: '#f5f5f5', borderRadius: 1, flexShrink: 0 }} onClick={e => {
              e.stopPropagation();
              if (quantity <= 1) {
                setShowQuantity(false);
                setQuantity(1);
              } else {
                setQuantity(q => q - 1);
              }
            }}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ mx: 0.5, minWidth: 20, textAlign: 'center', fontSize: '0.92rem', fontWeight: 600 }}>{quantity}</Typography>
            <IconButton size="small" sx={{ p: 0.5, background: '#f5f5f5', borderRadius: 1, flexShrink: 0 }} onClick={e => {
              e.stopPropagation();
              setQuantity(q => q + 1);
            }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        <Button
          variant="contained"
          className="add-to-cart-btn"
          onClick={handleAddToCartClick}
          disabled={product.outOfStock}
        >
          {showQuantity ? 'Add' : 'Add to Cart'}
        </Button>
      </Box>

      {/* Wishlist Dialog */}
      <Dialog open={wishlistDialogOpen} onClose={() => setWishlistDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem', pb: 1 }}>Select Wishlist</DialogTitle>
        <DialogContent sx={{ px: 2, py: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {wishlists.length === 0 ? (
              <>
                <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>No wishlists found.</Typography>
                <Button variant="contained" color="primary" sx={{ mb: 2, borderRadius: 2 }} fullWidth onClick={handleAddToGeneralWishlist}>Add to General Wishlist</Button>
                <Button variant="outlined" color="success" sx={{ borderRadius: 2 }} fullWidth onClick={() => setSelectingWishlist('create')}>Create New Wishlist</Button>
                {selectingWishlist === 'create' && (
                  <Box sx={{ mt: 2 }}>
                    <TextField label="New Wishlist Name" value={newWishlistName} onChange={e => setNewWishlistName(e.target.value)} fullWidth autoFocus sx={{ mb: 2 }} />
                    <Button variant="contained" color="success" fullWidth sx={{ borderRadius: 2 }} onClick={handleCreateWishlist}>Create & Add</Button>
                  </Box>
                )}
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 1, textAlign: 'center', fontWeight: 500 }}>Choose a wishlist to add this product:</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {wishlists.map(wl => (
                    <Box key={wl.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 1, transition: '0.2s', '&:hover': { boxShadow: 3, borderColor: '#43a047', background: '#f9fff9' } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{wl.name || 'Unnamed Wishlist'}</Typography>
                      <Button variant="contained" color="success" size="small" sx={{ borderRadius: 2, ml: 2 }} onClick={() => handleSelectWishlist(wl.id)}>Add</Button>
                    </Box>
                  ))}
                </Box>
                <Button variant="outlined" color="success" sx={{ mt: 2, borderRadius: 2 }} fullWidth onClick={() => setSelectingWishlist('create')}>Create New Wishlist</Button>
                <Button variant="contained" color="primary" sx={{ mt: 1, borderRadius: 2 }} fullWidth onClick={handleAddToGeneralWishlist}>Add to General Wishlist</Button>
                {selectingWishlist === 'create' && (
                  <Box sx={{ mt: 2 }}>
                    <TextField label="New Wishlist Name" value={newWishlistName} onChange={e => setNewWishlistName(e.target.value)} fullWidth autoFocus sx={{ mb: 2 }} />
                    <Button variant="contained" color="success" fullWidth sx={{ borderRadius: 2 }} onClick={handleCreateWishlist}>Create & Add</Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => { setWishlistDialogOpen(false); setSelectingWishlist(false); setNewWishlistName(""); }} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ProductCard;
