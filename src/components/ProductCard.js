import React, { useState, useEffect } from "react";
import { Card, CardMedia, CardContent, Typography, IconButton, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { Link } from "react-router-dom";

import { db } from "../firebase";
import { doc, setDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const getDiscount = (mrp, sellingPrice) => {
  if (!mrp || !sellingPrice || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [showQuantity, setShowQuantity] = useState(false);
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlists, setWishlists] = useState([]);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [selectingWishlist, setSelectingWishlist] = useState(false);
  const discount = getDiscount(product.mrp, product.sellingPrice);
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

  // Wishlist logic
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
      await setDoc(doc(db, "users", user.uid, "wishlists", wishlistId, "items", product.id), {
        ...product,
        addedAt: new Date().toISOString(),
      });
      setWishlistDialogOpen(false);
    } catch (err) {
      alert("Failed to add to wishlist.");
    }
  };

  const handleCreateWishlist = async () => {
    if (!user || !newWishlistName.trim()) return;
    try {
      const colRef = collection(db, "users", user.uid, "wishlists");
      const docRef = await addDoc(colRef, { name: newWishlistName.trim(), createdAt: new Date().toISOString() });
      await setDoc(doc(db, "users", user.uid, "wishlists", docRef.id, "items", product.id), {
        ...product,
        addedAt: new Date().toISOString(),
      });
      setWishlistDialogOpen(false);
      setNewWishlistName("");
    } catch (err) {
      alert("Failed to create wishlist.");
    }
  };

  const handleAddToGeneralWishlist = async () => {
    if (!user) return;
    try {
      // General wishlist id is 'general'
      await setDoc(doc(db, "users", user.uid, "wishlists", "general", "items", product.id), {
        ...product,
        addedAt: new Date().toISOString(),
      });
      setWishlistDialogOpen(false);
    } catch (err) {
      alert("Failed to add to general wishlist.");
    }
  };

  return (
    <Card className="product-card" sx={{ position: "relative", boxShadow: 3, borderRadius: 3, cursor: "pointer", transition: "0.2s", '&:hover': { boxShadow: 6 }, minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <IconButton
          color="secondary"
          onClick={handleWishlistIconClick}
          sx={{ p: 0.5, background: '#fff', boxShadow: 1, borderRadius: '50%' }}
        >
          <FavoriteBorderIcon fontSize="small" />
        </IconButton>
      </Box>
      <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <CardMedia
          component="img"
          height="120"
          image={product.imageUrls?.[0] || "https://via.placeholder.com/180"}
          alt={product.name}
          sx={{ objectFit: "cover", borderRadius: '12px', width: '100%', height: '120px' }}
        />
        <CardContent sx={{ p: 1, pb: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1rem', mb: 0.5, lineHeight: 1.1 }}>{product.name}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through", fontSize: '0.85rem' }}>₹{product.mrp}</Typography>
            <Typography variant="body2" color="primary" fontWeight={700} sx={{ fontSize: '1rem' }}>₹{product.sellingPrice}</Typography>
            {discount > 0 && (
              <Typography variant="caption" sx={{ color: "#d32f2f", fontWeight: 700, ml: 0.5, fontSize: '0.8rem' }}>{discount}% OFF</Typography>
            )}
          </Box>
        </CardContent>
      </Link>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, mt: 1, px: 1, pb: 1 }}>
        {showQuantity && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1, width: '100%' }}>
            <IconButton size="small" sx={{ p: 0.5 }} onClick={e => { e.stopPropagation(); setQuantity(q => Math.max(1, q - 1)); }}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ mx: 1, minWidth: 24, textAlign: 'center', fontSize: '1rem', fontWeight: 600 }}>{quantity}</Typography>
            <IconButton size="small" sx={{ p: 0.5 }} onClick={e => { e.stopPropagation(); setQuantity(q => q + 1); }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        <Button
          variant="contained"
          color={showQuantity ? "success" : "primary"}
          startIcon={<AddShoppingCartIcon />}
          onClick={handleAddToCartClick}
          sx={{ borderRadius: 2, width: '100%', minHeight: 36, fontSize: '0.95rem', fontWeight: 700, transition: 'background 0.2s', mb: 0.5 }}
        >{showQuantity ? "Confirm Add" : "Add to Cart"}</Button>
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
