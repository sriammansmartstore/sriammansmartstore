import React, { useState, useEffect, useContext } from "react";
import {
  Card, CardMedia, CardContent, Typography, IconButton, Button, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { updateDoc } from "firebase/firestore";
import { query, where } from "firebase/firestore";
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
  // Prevent multiple rapid cart updates
  const pendingQuantityRef = React.useRef(null);
  const [updatingQuantity, setUpdatingQuantity] = useState(false);
  const [alreadyWishlistedName, setAlreadyWishlistedName] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showQuantity, setShowQuantity] = useState(false);
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlists, setWishlists] = useState([]);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [selectingWishlist, setSelectingWishlist] = useState(false);
  // Pick the middle option for display if available
  const hasMultipleOptions = Array.isArray(product.options) && product.options.length > 1;
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const option = product.options?.[selectedOptionIdx] || product.options?.[0] || {};
  const discount = getDiscount(option.mrp, option.sellingPrice);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchWishlists = async () => {
      if (!user) {
        setWishlists([]);
        setIsWishlisted(false);
        setAlreadyWishlistedName("");
        return;
      }
      try {
        const colRef = collection(db, "users", user.uid, "wishlists");
        const snapshot = await getDocs(colRef);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWishlists(fetched);
        // Check if product is in any wishlist
        let found = false;
        let foundName = "";
        for (const wl of snapshot.docs) {
          const prodRef = collection(db, "users", user.uid, "wishlists", wl.id, "products");
          const prodSnap = await getDocs(prodRef);
          if (prodSnap.docs.some(d => d.id === product.id)) {
            found = true;
            foundName = wl.data().name || wl.id;
            break;
          }
        }
        setIsWishlisted(found);
        setAlreadyWishlistedName(found ? foundName : "");
      } catch (err) {
        setWishlists([]);
        setIsWishlisted(false);
        setAlreadyWishlistedName("");
      }
    };
    fetchWishlists();
  }, [user, wishlistDialogOpen, product.id]);

  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [addQuantity, setAddQuantity] = useState(1);

  const handleAddToCartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please login to add to cart.");
      return;
    }
    if (hasMultipleOptions) {
      setShowOptionsDialog(true);
      return;
    }
    setShowQuantity(true);
  };

  const updateCartQuantity = async (newQuantity) => {
    // Queue updates, only process the latest
    if (updatingQuantity) {
      pendingQuantityRef.current = newQuantity;
      return;
    }
    setUpdatingQuantity(true);
    let latestQuantity = newQuantity;
    try {
      const optionToAdd = product.options?.[selectedOptionIdx] || product.options?.[0] || {};
      const cartRef = collection(db, "users", user.uid, "cart");
      // Find existing cart item for this product and option
      const q = query(
        cartRef,
        where('productId', '==', product.id),
        where('unit', '==', optionToAdd.unit),
        where('unitSize', '==', optionToAdd.unitSize)
      );
      const cartSnap = await getDocs(q);
      if (!cartSnap.empty) {
        const cartDoc = cartSnap.docs[0];
        await updateDoc(cartDoc.ref, { quantity: latestQuantity, addedAt: new Date().toISOString() });
      } else {
        const { id, ...productWithoutId } = product;
        await addDoc(cartRef, {
          productId: product.id,
          ...productWithoutId,
          ...optionToAdd,
          quantity: latestQuantity,
          addedAt: new Date().toISOString(),
        });
      }
      setAddQuantity(latestQuantity);
      if (onAddToCart) onAddToCart(product, latestQuantity);
    } catch (err) {
      alert("Failed to update cart quantity.");
    } finally {
      setUpdatingQuantity(false);
      // If another update was queued, process it
      if (pendingQuantityRef.current !== null && pendingQuantityRef.current !== latestQuantity) {
        const nextQty = pendingQuantityRef.current;
        pendingQuantityRef.current = null;
        updateCartQuantity(nextQty);
      }
    }
  };

  const handleWishlistIconClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return alert("Please login to use wishlists.");
    if (isWishlisted && alreadyWishlistedName) {
      alert(`Product already in wishlist: ${alreadyWishlistedName}`);
      return;
    }
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
      // Add avatar for new wishlists (optional, can customize)
      const docRef = await addDoc(colRef, {
        name: newWishlistName.trim(),
        createdAt: new Date().toISOString(),
        avatar: { type: "icon", value: "⭐" }
      });
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
    console.log('Add to General Wishlist button clicked');
    if (!user) return;
    try {
      const generalWishlistRef = doc(db, "users", user.uid, "wishlists", "general");
      await setDoc(generalWishlistRef, {
        name: "General",
        createdAt: new Date().toISOString(),
        avatar: { type: "icon", value: "⭐" }
      }, { merge: true });
      console.log('General wishlist created or updated:', generalWishlistRef.path);
      await setDoc(doc(db, "users", user.uid, "wishlists", "general", "products", product.id), {
        ...product,
        addedAt: new Date().toISOString(),
      });
      console.log('Product added to General wishlist:', product.id);
      setWishlistDialogOpen(false);
      if (onAddToWishlist) onAddToWishlist(product);
    } catch (err) {
      alert("Failed to add to general wishlist. " + (err?.message || ""));
    }
  };

  return (
    <Card className="product-card" sx={{ height: '100%', position: 'relative', overflow: 'hidden', maxWidth: 180, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      {/* Discount Ribbon */}
      {discount > 0 && (
        <Box
          className="product-card-badge-container"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 3,
            width: 56,
            height: 56,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <Box
            className="product-card-badge"
            sx={{
              position: 'absolute',
              top: 8,
              left: -18,
              width: 90,
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
              overflow: 'hidden',
            }}
          >
            {discount}% OFF
          </Box>
        </Box>
      )}
      {/* Wishlist Icon */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <IconButton
          onClick={handleWishlistIconClick}
          sx={{ p: 0.5, background: '#fff', boxShadow: 1, borderRadius: '50%' }}
        >
          {isWishlisted
            ? <FavoriteIcon fontSize="small" sx={{ color: '#d32f2f' }} />
            : <FavoriteBorderIcon fontSize="small" sx={{ color: '#d32f2f' }} />}
        </IconButton>
      </Box>
      <Link to={`/product/${product.category}/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <Box sx={{ width: '100%', minHeight: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 0, mt: 0, mb: 0 }}>
          <CardMedia
            component="img"
            image={product.imageUrls?.[0] || "https://via.placeholder.com/180"}
            alt={product.name}
            sx={{ objectFit: "contain", width: '100%', height: 120, maxHeight: 140, background: '#f8f8f8', maxWidth: 160 }}
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
        {/* Show Add to Cart button only if not showing quantity selector for single option products */}
        {(!showQuantity || hasMultipleOptions) && (
          <Button
            variant="contained"
            className="add-to-cart-btn"
            onClick={handleAddToCartClick}
            disabled={product.outOfStock}
          >
            {hasMultipleOptions ? 'Choose Options' : 'Add to Cart'}
          </Button>
        )}
        {/* Show quantity controls only for single option products after adding to cart */}
        {showQuantity && !hasMultipleOptions && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', mb: 0 }}>
            <IconButton size="small" sx={{ p: 0.5, background: '#f5f5f5', borderRadius: 1, flexShrink: 0 }} onClick={async e => {
              e.stopPropagation();
              if (addQuantity <= 1 || updatingQuantity) {
                setShowQuantity(false);
                setAddQuantity(1);
              } else {
                const newQty = addQuantity - 1;
                setAddQuantity(newQty);
                await updateCartQuantity(newQty);
              }
            }}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ mx: 0.5, minWidth: 20, textAlign: 'center', fontSize: '0.92rem', fontWeight: 600 }}>{addQuantity}</Typography>
            <IconButton size="small" sx={{ p: 0.5, background: '#f5f5f5', borderRadius: 1, flexShrink: 0 }} onClick={async e => {
              e.stopPropagation();
              if (updatingQuantity) return;
              const newQty = addQuantity + 1;
              setAddQuantity(newQty);
              await updateCartQuantity(newQty);
            }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      {/* Options Dialog for products with multiple options */}
      <Dialog open={showOptionsDialog} onClose={() => setShowOptionsDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', pb: 1 }}>Choose Option</DialogTitle>
        <DialogContent sx={{ px: 2, py: 1 }}>
          {Array.isArray(product.options) && product.options.length > 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {product.options.map((opt, idx) => (
                <Box key={idx} sx={{ border: selectedOptionIdx === idx ? '2px solid #388e3c' : '1px solid #eee', borderRadius: 2, p: 1, cursor: 'pointer', boxShadow: selectedOptionIdx === idx ? 2 : 0, bgcolor: selectedOptionIdx === idx ? '#e3f2fd' : '#fff' }} onClick={() => setSelectedOptionIdx(idx)}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{opt.unitSize} {opt.unit} - ₹{opt.sellingPrice}</Typography>
                  {opt.mrp && opt.mrp > opt.sellingPrice && (
                    <Typography sx={{ textDecoration: 'line-through', color: '#888', fontWeight: 500, fontSize: '0.95rem' }}>MRP: ₹{opt.mrp}</Typography>
                  )}
                  </Box>
              ))}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', mb: 1, mt: 1 }}>
                <IconButton size="small" sx={{ p: 0.5, background: '#f5f5f5', borderRadius: 1, flexShrink: 0 }} onClick={() => setAddQuantity(q => Math.max(1, q - 1))}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ mx: 0.5, minWidth: 20, textAlign: 'center', fontSize: '0.92rem', fontWeight: 600 }}>{addQuantity}</Typography>
                <IconButton size="small" sx={{ p: 0.5, background: '#f5f5f5', borderRadius: 1, flexShrink: 0 }} onClick={() => setAddQuantity(q => q + 1)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ borderRadius: 2, mt: 1 }}
                onClick={async () => {
                  setShowOptionsDialog(false);
                  setShowQuantity(true);
                  await updateCartQuantity(addQuantity);
                }}
              >
                Add to Cart
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setShowOptionsDialog(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
        </DialogActions>
      </Dialog>
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
