import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import WishlistWidget from './WishlistWidget';
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
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
  // wishlist state moved to WishlistWidget
  const [quantity, setQuantity] = useState(1);
  const [showQuantity, setShowQuantity] = useState(false);
  // Pick the middle option for display if available
  const hasMultipleOptions = Array.isArray(product.options) && product.options.length > 1;
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const option = product.options?.[selectedOptionIdx] || product.options?.[0] || {};
  const discount = getDiscount(option.mrp, option.sellingPrice);
  const { user } = useContext(AuthContext);

  // wishlist fetching moved into WishlistWidget

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
      const extractMrp = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.mrp != null) return obj.mrp;
        if (obj.mrp12 != null) return obj.mrp12;
        const dynKey = Object.keys(obj).find(k => /^mrp\d+$/i.test(k));
        return dynKey ? obj[dynKey] : null;
      };
      const mrpValue = extractMrp(optionToAdd) ?? extractMrp(product);
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
        await updateDoc(cartDoc.ref, { 
          quantity: latestQuantity, 
          addedAt: new Date().toISOString(),
          // Ensure pricing fields are persisted/updated
          mrp: mrpValue,
          sellingPrice: optionToAdd.sellingPrice ?? product.sellingPrice ?? null,
          price: optionToAdd.sellingPrice ?? product.sellingPrice ?? null
        });
      } else {
        const { id, ...productWithoutId } = product;
        await addDoc(cartRef, {
          productId: product.id,
          ...productWithoutId,
          ...optionToAdd,
          quantity: latestQuantity,
          addedAt: new Date().toISOString(),
          // Explicitly store pricing for checkout computations
          mrp: mrpValue,
          sellingPrice: optionToAdd.sellingPrice ?? product.sellingPrice ?? null,
          price: optionToAdd.sellingPrice ?? product.sellingPrice ?? null
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

  // wishlist handlers moved to WishlistWidget

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
  {/* Wishlist widget */}
  <WishlistWidget product={product} selectedOption={option} onAdd={onAddToWishlist} />
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

  {/* wishlist UI moved to WishlistWidget */}
    </Card>
  );
};

export default ProductCard;