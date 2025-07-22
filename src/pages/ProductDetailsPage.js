import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Card, CardMedia, CardContent, Button, IconButton, Divider } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getDiscount } from "../utils/productUtils";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const ProductDetailsPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Fetch product by id from Firestore (modular v9 syntax)
    const fetchProduct = async () => {
      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);
        if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
        else setProduct(null);
      } catch (err) {
        setProduct(null);
      }
    };
    fetchProduct();
  }, [id]);

  if (product === null) return <Typography sx={{ mt: 4, textAlign: 'center' }}>Product not found.</Typography>;
  if (!product) return <Typography sx={{ mt: 4, textAlign: 'center' }}>Loading...</Typography>;
  const discount = getDiscount(product.mrp, product.sellingPrice);

  return (
    <Box className="product-details-root" sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 2, boxShadow: 3, borderRadius: 3, bgcolor: "#fff" }}>
      <IconButton sx={{ mb: 2 }} onClick={() => window.history.back()}><ArrowBackIcon /></IconButton>
      <Card sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, boxShadow: 0 }}>
        <CardMedia
          component="img"
          image={product.imageUrls?.[0] || "https://via.placeholder.com/300"}
          alt={product.name}
          sx={{ width: { xs: "100%", md: 300 }, height: 300, objectFit: "cover", borderRadius: 2 }}
        />
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>{product.name}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>{product.description}</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6" sx={{ textDecoration: "line-through" }}>₹{product.mrp}</Typography>
            <Typography variant="h5" color="primary" fontWeight={700}>₹{product.sellingPrice}</Typography>
            {discount > 0 && (
              <Typography variant="body2" sx={{ color: "#d32f2f", fontWeight: 700 }}>{discount}% OFF</Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
            <Typography variant="body2">Quantity:</Typography>
            <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} style={{ width: 60, textAlign: "center" }} />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button variant="contained" color="primary" startIcon={<AddShoppingCartIcon />}>Add to Cart</Button>
            <IconButton color="secondary"><FavoriteBorderIcon /></IconButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductDetailsPage;
