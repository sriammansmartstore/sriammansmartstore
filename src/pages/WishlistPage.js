import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Button, Select, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import './WishlistPage.css';
import { db } from "../firebase";
import { collection, getDocs, doc, deleteDoc, setDoc, addDoc } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";

const WishlistPage = () => {
  const { user } = useContext(AuthContext);
  const [wishlists, setWishlists] = useState([]);
  const [selectedWishlistId, setSelectedWishlistId] = useState('general');
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchWishlists = async () => {
      try {
        const colRef = collection(db, "users", user.uid, "wishlists");
        const snapshot = await getDocs(colRef);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWishlists([{ id: 'general', name: 'General Wishlist' }, ...fetched]);
      } catch (err) {
        setWishlists([{ id: 'general', name: 'General Wishlist' }]);
      }
    };
    fetchWishlists();
  }, [user, createDialogOpen]);

  useEffect(() => {
    if (!user || !selectedWishlistId) return;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const itemsCol = collection(db, "users", user.uid, "wishlists", selectedWishlistId, "items");
        const snapshot = await getDocs(itemsCol);
        setWishlistItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [user, selectedWishlistId]);

  const [addingToCartId, setAddingToCartId] = useState(null);
  const [cartQuantity, setCartQuantity] = useState(1);

  const handleAddToCartClick = (id) => {
    setAddingToCartId(id);
    setCartQuantity(1);
  };

  const handleConfirmAddToCart = async (item) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "cart", item.id), { ...item, quantity: cartQuantity });
    setAddingToCartId(null);
    setCartQuantity(1);
  };

  const handleDelete = async (id) => {
    if (!user || !selectedWishlistId) return;
    await deleteDoc(doc(db, "users", user.uid, "wishlists", selectedWishlistId, "items", id));
    setWishlistItems(items => items.filter(item => item.id !== id));
  };

  const handleCreateWishlist = async () => {
    if (!user || !newWishlistName.trim()) return;
    try {
      const colRef = collection(db, "users", user.uid, "wishlists");
      await addDoc(colRef, { name: newWishlistName.trim(), createdAt: new Date().toISOString() });
      setCreateDialogOpen(false);
      setNewWishlistName("");
    } catch (err) {
      alert("Failed to create wishlist.");
    }
  };

  return (
    <Box className="wishlist-root">
      <Typography variant="h5" className="wishlist-title">Your Wishlists</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, mb: 2 }}>
        {wishlists.map(wl => (
          <Button
            key={wl.id}
            variant={selectedWishlistId === wl.id ? "contained" : "outlined"}
            color="primary"
            size="small"
            sx={{ mb: 1, minWidth: 160, textAlign: 'left', borderRadius: 2, fontWeight: selectedWishlistId === wl.id ? 700 : 500 }}
            onClick={() => setSelectedWishlistId(wl.id)}
          >
            {wl.name || 'Unnamed Wishlist'}
          </Button>
        ))}
        <Button variant="outlined" color="primary" size="small" sx={{ mt: 1, minWidth: 160, borderRadius: 2 }} onClick={() => setCreateDialogOpen(true)}>+ Create New Wishlist</Button>
      </Box>
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Wishlist</DialogTitle>
        <DialogContent>
          <TextField label="Wishlist Name" value={newWishlistName} onChange={e => setNewWishlistName(e.target.value)} fullWidth sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCreateWishlist}>Create</Button>
        </DialogActions>
      </Dialog>
      {selectedWishlistId && (
        loading ? (
          <Typography>Loading...</Typography>
        ) : wishlistItems.length === 0 ? (
          <Typography>No items in this wishlist.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            {wishlistItems.map(item => (
              <Box key={item.id} className="wishlist-item" sx={{ flexWrap: 'wrap', width: '100%' }}>
                <img src={item.imageUrls?.[0] || item.image} alt={item.name} className="wishlist-item-img" />
                <Box className="wishlist-item-details">
                  <Typography variant="h6">{item.name}</Typography>
                  <Typography variant="body2">Price: ₹{item.sellingPrice || item.price}</Typography>
                </Box>
                <Box className="wishlist-item-actions" sx={{ width: '100%' }}>
                  {addingToCartId === item.id ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: 1, width: '100%', gap: 1 }}>
                      <IconButton size="medium" sx={{ p: 1, background: '#f5f5f5', borderRadius: 2, boxShadow: 1, '&:hover': { background: '#e0e0e0' } }} onClick={() => setCartQuantity(q => Math.max(1, cartQuantity - 1))}>
                        <RemoveIcon fontSize="medium" />
                      </IconButton>
                      <Typography sx={{ mx: 1, minWidth: 32, textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#388e3c', background: '#f9fff9', borderRadius: 2, px: 2, py: 0.5, boxShadow: 1 }}>{cartQuantity}</Typography>
                      <IconButton size="medium" sx={{ p: 1, background: '#f5f5f5', borderRadius: 2, boxShadow: 1, '&:hover': { background: '#e0e0e0' } }} onClick={() => setCartQuantity(q => cartQuantity + 1)}>
                        <AddIcon fontSize="medium" />
                      </IconButton>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<AddShoppingCartIcon />}
                        sx={{ borderRadius: 2, minHeight: 40, fontSize: '1rem', fontWeight: 700, ml: 2, px: 3, boxShadow: 2, transition: 'background 0.2s' }}
                        onClick={() => handleConfirmAddToCart(item)}
                        disabled={cartQuantity < 1}
                      >
                        Confirm & Add
                      </Button>
                      <Button variant="outlined" color="inherit" size="small" sx={{ ml: 1, borderRadius: 2, fontWeight: 500 }} onClick={() => setAddingToCartId(null)}>Cancel</Button>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddShoppingCartIcon />}
                      sx={{ borderRadius: 2, minHeight: 36, fontSize: '0.95rem', fontWeight: 700, width: '100%', transition: 'background 0.2s', mb: 0.5 }}
                      onClick={() => handleAddToCartClick(item.id)}
                    >
                      Add to Cart
                    </Button>
                  )}
                  <Button variant="outlined" color="error" size="small" sx={{ ml: 1 }} onClick={() => handleDelete(item.id)}>Remove</Button>
                </Box>
              </Box>
            ))}
          </Box>
        )
      )}
    </Box>
  );
};

export default WishlistPage;
