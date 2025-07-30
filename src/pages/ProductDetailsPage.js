import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Card, CardMedia, CardContent, Button, IconButton, Divider, Rating, TextField } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getDiscount } from "../utils/productUtils";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import ProductCard from "../components/ProductCard"; // Adjust the import based on your file structure

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
    <Box className="product-details-root" sx={{ maxWidth: 700, mx: "auto", mt: 0, p: 2, boxShadow: 3, borderRadius: 3, bgcolor: "#fff" }}>
      <Card sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, boxShadow: 0, position: 'relative' }}>
        {/* Image gallery */}
        <Box sx={{ position: 'relative', width: { xs: '100%', md: 300 }, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CardMedia
            component="img"
            image={product.imageUrls?.[selectedImageIdx] || product.imageUrls?.[0] || "https://via.placeholder.com/300"}
            alt={product.name}
            sx={{ width: '100%', height: 220, objectFit: "cover", borderRadius: 2, mb: 1 }}
          />
          {/* Thumbnails */}
          {Array.isArray(product.imageUrls) && product.imageUrls.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'center' }}>
              {product.imageUrls.map((img, idx) => (
                <CardMedia
                  key={idx}
                  component="img"
                  image={img}
                  alt={`thumb-${idx}`}
                  onClick={() => setSelectedImageIdx(idx)}
                  sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1, border: selectedImageIdx === idx ? '2px solid #388e3c' : '1px solid #eee', cursor: 'pointer', boxShadow: selectedImageIdx === idx ? 2 : 0 }}
                />
              ))}
            </Box>
          )}
          {/* Wishlist button at top right */}
          <IconButton color="secondary" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: '#fff', boxShadow: 2, zIndex: 2 }}>
            <FavoriteBorderIcon />
          </IconButton>
        </Box>
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>{product.name}</Typography>
          {/* Star ratings below product name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: 0.5 }}>
            <Rating value={Number(avgRating) || 0} precision={0.1} readOnly size="medium" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{avgRating || "No ratings yet"}</Typography>
            <Typography variant="body2" sx={{ color: '#888', ml: 1 }}>({reviews.length} reviews)</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          {/* Modern pricing and cart UI */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
              {/* Option selector */}
              {options.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  {options.map((opt, idx) => (
                    <Button
                      key={idx}
                      variant={selectedOptionIdx === idx ? 'contained' : 'outlined'}
                      color={selectedOptionIdx === idx ? 'primary' : 'inherit'}
                      size="small"
                      sx={{ fontWeight: 600, borderRadius: 2, minWidth: 0, px: 1.5, fontSize: '0.95rem' }}
                      onClick={() => setSelectedOptionIdx(idx)}
                    >
                      {opt.unitSize} {opt.unit}
                    </Button>
                  ))}
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h4" color="primary" fontWeight={700}>
                  ₹{selectedOption.sellingPrice}{selectedOption.unit ? `/${selectedOption.unitSize || ''} ${selectedOption.unit}` : ''}
                </Typography>
                {selectedOption.mrp && selectedOption.mrp > selectedOption.sellingPrice && (
                  <Typography variant="body1" sx={{ textDecoration: 'line-through', color: '#888', fontWeight: 500 }}>
                    ₹{selectedOption.mrp}{selectedOption.unit ? `/${selectedOption.unitSize || ''} ${selectedOption.unit}` : ''}
                  </Typography>
                )}
                {discount > 0 && (
                  <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 700, ml: 1 }}>{discount}% OFF</Typography>
                )}
              </Box>
            </Box>
            {/* Quantity selector with plus/minus */}
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', borderRadius: 2, px: 1, py: 0.5, boxShadow: 1 }}>
              <IconButton size="small" onClick={() => setQuantity(q => Math.max(1, q - 1))} sx={{ color: '#388e3c' }}>
                <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>-</span>
              </IconButton>
              <Typography variant="body1" sx={{ mx: 1, minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{quantity}</Typography>
              <IconButton size="small" onClick={() => setQuantity(q => q + 1)} sx={{ color: '#388e3c' }}>
                <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>+</span>
              </IconButton>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddShoppingCartIcon />}
            sx={{ width: '100%', py: 1.2, fontSize: '1.08rem', fontWeight: 700, borderRadius: 2, boxShadow: 2 }}
            onClick={() => {/* handle add to cart with selectedOption */}}
          >
            Add to Cart
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
          <Box sx={{ display: 'flex', overflowX: 'auto', gap: 2, pb: 1 }}>
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
