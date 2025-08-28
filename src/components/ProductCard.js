import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { db } from "../firebase";
import { getDiscount } from "../utils/productUtils";
import { updateDoc, query, where, collection, getDocs, addDoc } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import AuthRequiredPrompt from './AuthRequiredPrompt';
import "./../pages/HomePage.css"; // Ensure the CSS is applied

// Helper to get the middle option (or first if only one)
const getMiddleOption = (options) => {
  if (!Array.isArray(options) || options.length === 0) return null;
  const idx = Math.floor(options.length / 2);
  return options[idx];
};

const ProductCard = ({ product, onAddToCart, onAddToWishlist }) => {
  const navigate = useNavigate();
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
  // cart state awareness
  const [inCartAnyVariant, setInCartAnyVariant] = useState(false);
  const [hasCurrentVariantInCart, setHasCurrentVariantInCart] = useState(false);
  const [currentVariantQty, setCurrentVariantQty] = useState(0);

  // wishlist fetching moved into WishlistWidget
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [addQuantity, setAddQuantity] = useState(1);

  const handleAddToCartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user is not logged in, show auth dialog
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    if (hasMultipleOptions) {
      setShowOptionsDialog(true);
      return;
    }
    setShowQuantity(true);
  };

  const updateCartQuantity = async (newQuantity) => {
    if (!user || updatingQuantity) {
      pendingQuantityRef.current = newQuantity;
      return;
    }
    setUpdatingQuantity(true);
    const latestQuantity = Math.max(1, newQuantity);
    const optionToAdd = product.options?.[selectedOptionIdx] || product.options?.[0] || {};
    
    // Skip if no valid option
    if (!optionToAdd.unit || !optionToAdd.unitSize) {
      alert("Product option missing unit/unitSize. Cannot update cart.");
      setUpdatingQuantity(false);
      return;
    }

    try {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const q = query(
        cartRef,
        where('productId', '==', product.id),
        where('unit', '==', optionToAdd.unit),
        where('unitSize', '==', optionToAdd.unitSize)
      );
      
      const cartSnap = await getDocs(q);
      
      // Always create a new cart item with a unique ID
      const { id: _, ...productWithoutId } = product;
      const cartItem = {
        productId: product.id,
        ...productWithoutId,
        ...optionToAdd,
        quantity: latestQuantity,
        addedAt: new Date().toISOString(),
        mrp: optionToAdd.mrp,
        sellingPrice: optionToAdd.sellingPrice ?? product.sellingPrice ?? null,
        price: optionToAdd.sellingPrice ?? product.sellingPrice ?? null,
        // Add a unique identifier for this specific product + option combination
        cartItemId: `${product.id}_${optionToAdd.unit}_${optionToAdd.unitSize}`
      };

      if (!cartSnap.empty) {
        // Update existing cart item with the same product + option
        const cartDoc = cartSnap.docs[0];
        await updateDoc(cartDoc.ref, { 
          quantity: latestQuantity,
          addedAt: new Date().toISOString(),
          mrp: optionToAdd.mrp,
          sellingPrice: optionToAdd.sellingPrice ?? product.sellingPrice ?? null,
          price: optionToAdd.sellingPrice ?? product.sellingPrice ?? null
        });
        console.log('Updated existing cart item with new quantity');
      } else {
        // Add as new cart item
        await addDoc(cartRef, cartItem);
        console.log('Added new cart item with unique option');
      }

      setAddQuantity(latestQuantity);
      if (onAddToCart) onAddToCart(product, latestQuantity);
    } catch (err) {
      console.error('Error updating cart:', err);
      alert("Failed to update cart. Please try again.");
    } finally {
      setUpdatingQuantity(false);
      // Process any queued updates
      if (pendingQuantityRef.current !== null && pendingQuantityRef.current !== latestQuantity) {
        const nextQty = pendingQuantityRef.current;
        pendingQuantityRef.current = null;
        updateCartQuantity(nextQty);
      }
    }
  };

  // wishlist handlers moved to WishlistWidget

  // Detect if any variant of this product exists in cart
  useEffect(() => {
    const checkAnyVariant = async () => {
      try {
        if (!user) { setInCartAnyVariant(false); return; }
        const cartRef = collection(db, 'users', user.uid, 'cart');
        const qAny = query(cartRef, where('productId', '==', product.id));
        const snap = await getDocs(qAny);
        setInCartAnyVariant(!snap.empty);
      } catch (_) {
        setInCartAnyVariant(false);
      }
    };
    checkAnyVariant();
  }, [user, product.id]);

  // Detect if current selected variant exists in cart; if so, show qty controls
  useEffect(() => {
    const checkCurrentVariant = async () => {
      try {
        if (!user) { setHasCurrentVariantInCart(false); return; }
        const opt = product.options?.[selectedOptionIdx] || product.options?.[0] || {};
        const cartRef = collection(db, 'users', user.uid, 'cart');
        const qVar = query(
          cartRef,
          where('productId', '==', product.id),
          where('unit', '==', opt.unit),
          where('unitSize', '==', opt.unitSize)
        );
        const snap = await getDocs(qVar);
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const qty = d.quantity || 1;
          setHasCurrentVariantInCart(true);
          setCurrentVariantQty(qty);
          setAddQuantity(qty);
          setShowQuantity(true);
        } else {
          setHasCurrentVariantInCart(false);
        }
      } catch (_) {
        setHasCurrentVariantInCart(false);
      }
    };
    checkCurrentVariant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, product.id, selectedOptionIdx]);

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
            <Box 
              sx={{
                overflow: 'hidden',
                width: '100%',
                position: 'relative',
                textAlign: 'center',
                '&:hover .product-name': {
                  textOverflow: product.name.length > 12 ? 'clip' : 'ellipsis',
                  whiteSpace: 'nowrap',
                  animation: product.name.length > 12 ? 'scrollText 8s linear infinite' : 'none',
                },
                '@keyframes scrollText': {
                  '0%': { transform: 'translateX(0)' },
                  '10%': { transform: 'translateX(0)' },
                  '40%': { transform: 'translateX(calc(-100% + 180px))' },
                  '60%': { transform: 'translateX(calc(-100% + 180px))' },
                  '90%': { transform: 'translateX(0)' },
                  '100%': { transform: 'translateX(0)' },
                }
              }}
            >
              <Typography
                className="product-name"
                variant="subtitle1"
                fontWeight={700}
                sx={{ 
                  fontSize: '1rem',
                  mb: 0.5,
                  lineHeight: 1.1,
                  display: 'inline-block',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                  '&:hover': {
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'background.paper',
                    boxShadow: product.name.length > 12 ? 3 : 'none',
                    padding: product.name.length > 12 ? '0 8px' : 0,
                    margin: product.name.length > 12 ? '0 -8px' : 0,
                    borderRadius: 1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxWidth: 'calc(100% + 16px)'
                  }
                }}
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
      {/* Add to Cart Section (fixed height to prevent layout shift) */}
      <Box
        className="add-to-cart-container"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: hasMultipleOptions ? 'auto' : 56,
          minHeight: 56,
          p: 0,
          m: 0,
          mt: 0,
          gap: 0,
        }}
      >
        {/* Show Add to Cart button only if not showing quantity selector for single option products */}
        {hasMultipleOptions ? (
          <Box sx={{ width: '100%', px: 1, pb: 1 }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              fullWidth
              className="add-to-cart-btn"
              onClick={handleAddToCartClick}
              disabled={product.outOfStock}
              sx={{ height: 36, minHeight: 36, borderRadius: 2, fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              {inCartAnyVariant ? 'Add Another' : 'Add Options'}
            </Button>
          </Box>
        ) : (
          (!showQuantity) && (
            <Button
              variant="contained"
              className="add-to-cart-btn"
              onClick={(e) => {
                if (hasCurrentVariantInCart) {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/cart');
                } else {
                  handleAddToCartClick(e);
                }
              }}
              disabled={product.outOfStock}
              sx={{ height: 40, minHeight: 40, borderRadius: 2, px: 2 }}
            >
              {hasCurrentVariantInCart ? 'Go to Cart' : 'Add to Cart'}
            </Button>
          )
        )}
        {/* Show quantity controls only for single option products after adding to cart */}
        {showQuantity && !hasMultipleOptions && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', mb: 0, height: 40 }}>
            <IconButton size="small" sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '50%',
              bgcolor: 'success.main',
              color: '#fff',
              '&:hover': { bgcolor: 'success.dark' }
            }} onClick={async e => {
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
            <Typography sx={{ mx: 1.5, minWidth: 28, textAlign: 'center', fontSize: '1rem', fontWeight: 600, lineHeight: '36px' }}>{addQuantity}</Typography>
            <IconButton size="small" sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '50%',
              bgcolor: 'success.main',
              color: '#fff',
              '&:hover': { bgcolor: 'success.dark' }
            }} onClick={async e => {
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
                <IconButton size="small" sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'success.dark' }
                }} onClick={() => setAddQuantity(q => Math.max(1, q - 1))}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ mx: 1.5, minWidth: 24, textAlign: 'center', fontSize: '1rem', fontWeight: 600 }}>{addQuantity}</Typography>
                <IconButton size="small" sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'success.dark' }
                }} onClick={() => setAddQuantity(q => q + 1)}>
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
      {/* Auth Required Dialog */}
      <AuthRequiredPrompt 
        open={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)} 
      />
    </Box>

  {/* wishlist UI moved to WishlistWidget */}
    </Card>
  );
};

export default ProductCard;