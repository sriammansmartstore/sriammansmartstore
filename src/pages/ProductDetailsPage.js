import React, { useEffect, useState, useContext } from "react";
import './ProductDetailsPage.css';
import { useParams } from "react-router-dom";
import { Box, Typography, Card, CardMedia, CardContent, Button, IconButton, Divider, Rating, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getDiscount } from "../utils/productUtils";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import ProductCard from "../components/ProductCard.js"; // Explicit extension for compatibility

const ProductDetailsPage = () => {
  const { category, id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [otherProducts, setOtherProducts] = useState([]);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const { user, userDetails } = useContext(AuthContext) || {};
  // Wishlist dialog and cart logic (copied from ProductCard)

  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlists, setWishlists] = useState([]);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [selectingWishlist, setSelectingWishlist] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistAdded, setWishlistAdded] = useState(false);

  // Add to Cart logic (like ProductCard)
  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartFirestore();
  };


  const addToCartFirestore = async () => {
    if (!user) {
      alert("Please login to add to cart.");
      return;
    }
    setCartLoading(true);
    try {
      const selectedOption = options[selectedOptionIdx] || options[0];
      // Use addDoc for unique cart item
      await addDoc(collection(db, "users", user.uid, "cart"), {
        ...product,
        ...selectedOption,
        quantity,
        addedAt: new Date().toISOString(),
      });
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 1500);
    } catch (err) {
      alert("Failed to add to cart.");
    }
    setCartLoading(false);
  };

  // Wishlist dialog logic (like ProductCard)
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
  useEffect(() => { fetchWishlists(); }, [user, wishlistDialogOpen]);

  const handleWishlistIconClick = (e) => {
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
      setWishlistAdded(true);
      setTimeout(() => setWishlistAdded(false), 1500);
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
      setWishlistAdded(true);
      setTimeout(() => setWishlistAdded(false), 1500);
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
      setWishlistAdded(true);
      setTimeout(() => setWishlistAdded(false), 1500);
    } catch (err) {
      alert("Failed to add to general wishlist. " + (err?.message || ""));
    }
  };

  useEffect(() => {
    // Fetch product by id from Firestore (modular v9 syntax)
    const fetchProduct = async () => {
      try {
        if (!category || !id) {
          setProduct(null);
          return;
        }
        const ref = doc(db, "products", category, "items", id);
        const snap = await getDoc(ref);
        if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
        else setProduct(null);
      } catch (err) {
        setProduct(null);
      }
    };
    fetchProduct();
  }, [category, id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!category || !id) return;
      try {
        const reviewsRef = collection(db, "products", category, "items", id, "reviews");
        const q = orderBy ? query(reviewsRef, orderBy("createdAt", "desc")) : reviewsRef;
        const snap = await getDocs(q);
        setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setReviews([]);
      }
    };
    fetchReviews();
  }, [category, id]);

  // Fetch other products in the same category
  useEffect(() => {
    const fetchOtherProducts = async () => {
      if (!category || !id) return;
      try {
        const productsRef = collection(db, "products", category, "items");
        const q = query(productsRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setOtherProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => p.id !== id));
      } catch (err) {
        setOtherProducts([]);
      }
    };
    fetchOtherProducts();
  }, [category, id]);

  // Calculate average rating
  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

  if (product === null) return <Typography sx={{ mt: 2, textAlign: 'center' }}>Product not found.</Typography>;
  if (!product) return <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading...</Typography>;
  // Option selection logic
  const options = Array.isArray(product.options) && product.options.length > 0 ? product.options : [{
    mrp: product.mrp,
    sellingPrice: product.sellingPrice,
    specialPrice: product.specialPrice,
    unit: product.unit,
    unitSize: product.unitSize,
    quantity: product.quantity
  }];
  const selectedOption = options[selectedOptionIdx] || options[0];
  const discount = getDiscount(selectedOption.mrp, selectedOption.sellingPrice);

  return (
  <Box className="product-details-root" sx={{ maxWidth: { xs: '100%', sm: 700 }, mx: "auto", mt: 0, p: { xs: 0.5, sm: 2 }, boxShadow: 3, borderRadius: { xs: 0, sm: 3 }, bgcolor: "#fff" }}>
  <Card sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, boxShadow: 0, position: 'relative', borderRadius: { xs: 0, sm: 3 } }}>
        {/* Image gallery */}
        <Box sx={{ position: 'relative', width: { xs: '100%', md: 300 }, minHeight: { xs: 220, sm: 300 }, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: { xs: '#fafafa', sm: 'inherit' }, p: { xs: 1, sm: 0 } }}>
          <Box sx={{ position: 'relative', width: '100%' }}>
            <CardMedia
              component="img"
              image={product.imageUrls?.[selectedImageIdx] || product.imageUrls?.[0] || "https://via.placeholder.com/300"}
              alt={product.name}
              sx={{ width: '100%', height: { xs: 180, sm: 220 }, objectFit: "cover", borderRadius: 2 }}
            />
            {/* ...existing code... */}
            {/* Thumbnails inside image at bottom */}
            {Array.isArray(product.imageUrls) && product.imageUrls.length > 1 && (
              <Box className="horizontal-scroll" sx={{ position: 'absolute', left: 0, bottom: 0, width: '100%', display: 'flex', gap: 1, justifyContent: 'center', overflowX: 'auto', pb: 0.5, zIndex: 1, background: 'rgba(255,255,255,0.7)', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                {product.imageUrls.map((img, idx) => (
                  <CardMedia
                    key={idx}
                    component="img"
                    image={img}
                    alt={`thumb-${idx}`}
                    onClick={() => setSelectedImageIdx(idx)}
                    sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, border: selectedImageIdx === idx ? '2px solid #388e3c' : '1px solid #eee', cursor: 'pointer', boxShadow: selectedImageIdx === idx ? 2 : 0 }}
                  />
                ))}
              </Box>
            )}
          </Box>
          {/* Wishlist button at top right */}
          <IconButton
            color={wishlistAdded ? "error" : "secondary"}
            sx={{ position: 'absolute', top: 12, right: 12, bgcolor: '#fff', boxShadow: 2, zIndex: 2 }}
            onClick={handleWishlistIconClick}
            disabled={wishlistLoading}
          >
            <FavoriteBorderIcon />
          </IconButton>

          {/* Wishlist Dialog like ProductCard */}
          <Dialog open={wishlistDialogOpen} onClose={() => { setWishlistDialogOpen(false); setSelectingWishlist(false); setNewWishlistName(""); }} maxWidth="xs" fullWidth>
            {console.log('Wishlist Dialog rendered, wishlists:', wishlists, 'selectingWishlist:', selectingWishlist)}
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
        </Box>
  <CardContent sx={{ flex: 1, px: { xs: 0.5, sm: 2 }, py: { xs: 1, sm: 2 } }}>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '2rem' }, wordBreak: 'break-word' }}>{product.name}</Typography>
          {/* Star ratings below product name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: 0.5 }}>
            <Rating value={Number(avgRating) || 0} precision={0.1} readOnly size="medium" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{avgRating || "No ratings yet"}</Typography>
            <Typography variant="body2" sx={{ color: '#888', ml: 1 }}>({reviews.length} reviews)</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          {/* Modern pricing and cart UI */}
       
          {/* Unit selector - horizontally scrollable and spaced */}
{options.length > 1 && (
  <Box className="horizontal-scroll" sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, mb: 1, width: '100%' }}>
    {options.map((opt, idx) => (
      <Button
        key={idx}
        variant={selectedOptionIdx === idx ? 'contained' : 'outlined'}
        color={selectedOptionIdx === idx ? 'primary' : 'inherit'}
        size="medium"
        sx={{
          fontWeight: 700,
          borderRadius: 3,
          minWidth: 100,
          px: 3,
          fontSize: { xs: '1rem', sm: '1.1rem' },
          boxShadow: selectedOptionIdx === idx ? 3 : 0,
          border: selectedOptionIdx === idx ? '2px solid #388e3c' : '1px solid #eee',
          background: selectedOptionIdx === idx ? 'linear-gradient(90deg,#e0ffe6 0%,#fff 100%)' : '#fff',
          color: selectedOptionIdx === idx ? '#388e3c' : '#222',
          transition: '0.2s',
          whiteSpace: 'nowrap',
          '&:hover': { boxShadow: 4, borderColor: '#43a047', background: '#f5fff5' }
        }}
        onClick={() => setSelectedOptionIdx(idx)}
      >
        {opt.unitSize} {opt.unit.toUpperCase()}
      </Button>
    ))}
  </Box>
)}

{/* Price display based on selected unit */}
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 1 }}>
  <Typography variant="h4" sx={{ fontWeight: 700, color: '#388e3c', fontSize: { xs: '2rem', sm: '2.5rem' } }}>
    ₹{selectedOption.sellingPrice}
  </Typography>
  {discount > 0 && (
    <Typography variant="body2" sx={{ color: '#888', textDecoration: 'line-through', fontWeight: 500, fontSize: { xs: '1.1rem', sm: '1.2rem' } }}>
      ₹{selectedOption.mrp}
    </Typography>
  )}
  {discount > 0 && (
    <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.2rem' } }}>
      {discount}% OFF
    </Typography>
  )}
</Box>
{/* ...existing code... */}
<Button
  variant="contained"
  startIcon={<AddShoppingCartIcon />}
  sx={{ width: '100%', py: 1.2, fontSize: '1.08rem', fontWeight: 700, borderRadius: 2, boxShadow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}
  onClick={handleAddToCartClick}
  disabled={cartLoading || product.outOfStock}
>
  <span>{cartAdded ? 'Added!' : 'Add to Cart'}</span>
  <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#fff', borderRadius: 2, px: 1, py: 0.5, ml: 2 }}>
    <Typography variant="body2" sx={{ fontWeight: 700, color: '#555', mr: 1 }}>Qty</Typography>
    <IconButton size="small" onClick={e => { e.stopPropagation(); setQuantity(q => Math.max(1, q - 1)); }} sx={{ color: '#388e3c', border: '1.5px solid #388e3c', borderRadius: 2, background: '#fff', '&:hover': { background: '#e0ffe6' }, mx: 0.5 }}>
      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>-</span>
    </IconButton>
    <Typography variant="h6" sx={{ mx: 1, minWidth: 28, textAlign: 'center', fontWeight: 700, color: '#222', letterSpacing: 1 }}>{quantity}</Typography>
    <IconButton size="small" onClick={e => { e.stopPropagation(); setQuantity(q => q + 1); }} sx={{ color: '#388e3c', border: '1.5px solid #388e3c', borderRadius: 2, background: '#fff', '&:hover': { background: '#e0ffe6' }, mx: 0.5 }}>
      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>+</span>
    </IconButton>
  </Box>
</Button>
          {/* Description with Read More */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {showFullDesc ? product.description : (product.description?.length > 120 ? product.description.slice(0, 120) + "..." : product.description)}
            </Typography>
            {product.description?.length > 120 && (
              <Button size="small" color="primary" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', pl: 0 }} onClick={() => setShowFullDesc(v => !v)}>
                {showFullDesc ? "Show less" : "Read more"}
              </Button>
            )}
          </Box>
          {/* Ratings & Reviews Section */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Ratings & Reviews</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={Number(avgRating) || 0} precision={0.1} readOnly size="medium" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{avgRating || "No ratings yet"}</Typography>
              <Typography variant="body2" sx={{ color: '#888', ml: 1 }}>({reviews.length} reviews)</Typography>
            </Box>
            {/* Add Review Form */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, mt: 1, p: 1, bgcolor: '#f7f7f7', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Your Rating:</Typography>
              <Rating value={userRating} onChange={(e, v) => setUserRating(v)} size="large" />
              <TextField
                label="Your Review"
                multiline
                minRows={2}
                value={userReview}
                onChange={e => setUserReview(e.target.value)}
                sx={{ mt: 1 }}
                disabled={!user}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 1, alignSelf: 'flex-end', fontWeight: 600, fontSize: '0.98rem' }}
                disabled={reviewLoading || !userRating || !userReview.trim() || !user}
                onClick={async () => {
                  if (!user) {
                    alert('Please login to write a review.');
                    return;
                  }
                  setReviewLoading(true);
                  try {
                    // Use logged-in user's name or email
                    const reviewerName = userDetails?.name || user.displayName || user.email || 'Anonymous';
                    await addDoc(collection(db, "products", category, "items", id, "reviews"), {
                      reviewer: reviewerName,
                      rating: userRating,
                      review: userReview.trim(),
                      createdAt: new Date(),
                    });
                    setUserRating(0);
                    setUserReview("");
                    // Refresh reviews
                    const reviewsRef = collection(db, "products", category, "items", id, "reviews");
                    const q = orderBy ? query(reviewsRef, orderBy("createdAt", "desc")) : reviewsRef;
                    const snap = await getDocs(q);
                    setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                  } catch (err) {
                    // Optionally show error
                  }
                  setReviewLoading(false);
                }}
              >
                Submit Review
              </Button>
              {!user && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Please login to write a review.
                </Typography>
              )}
            </Box>
            {/* List of Reviews */}
            <Box sx={{ mt: 1 }}>
              {reviews.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#888' }}>No reviews yet.</Typography>
              ) : (
                reviews.map(r => (
                  <Box key={r.id} sx={{ mb: 2, p: 1.5, bgcolor: '#f9f9f9', borderRadius: 2, boxShadow: 1 }}>
                    {/* Review text first */}
                    <Typography variant="body2" sx={{ mb: 1 }}>{r.review}</Typography>
                    {/* Stars and date in a row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Rating value={r.rating} readOnly size="small" />
                      <Typography variant="caption" sx={{ color: '#888', textAlign: 'right' }}>
                        {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : ''}
                      </Typography>
                    </Box>
                    {/* Name below stars/date */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.reviewer || 'Anonymous'}</Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
          {/* You might check section */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>You might check</Typography>
          <Box className="horizontal-scroll" sx={{ display: 'flex', overflowX: 'auto', gap: 2, pb: 1 }}>
            {otherProducts?.length > 0 ? (
              otherProducts.map(prod => (
                <Box key={prod.id} sx={{ maxWidth: 220, flex: '0 0 auto' }}>
                  {/* Use your existing ProductCard component for consistency */}
                  <ProductCard product={prod} category={category} />
                </Box>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: '#888', minWidth: 220 }}>No other products found.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductDetailsPage;
