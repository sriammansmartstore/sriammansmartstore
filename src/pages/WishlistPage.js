import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, IconButton, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Menu, MenuItem, Avatar, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";

const WishlistPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTargetId, setMenuTargetId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [renameWishlistName, setRenameWishlistName] = useState("");
  // Avatar change dialog state
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarTargetId, setAvatarTargetId] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchWishlists = async () => {
      try {
        const colRef = collection(db, "users", user.uid, "wishlists");
        const snapshot = await getDocs(colRef);
        setWishlists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setWishlists([]);
      }
      setLoading(false);
    };
    fetchWishlists();
  }, [user, createDialogOpen, renameDialogOpen, deleteDialogOpen]);

  const handleMenuOpen = (event, id) => {
    setAnchorEl(event.currentTarget);
    setMenuTargetId(id);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    // Do NOT clear menuTargetId here; let dialogs manage it
  };
  const handleDelete = async () => {
    if (!user || !menuTargetId) return;
    await deleteDoc(doc(db, "users", user.uid, "wishlists", menuTargetId));
    setDeleteDialogOpen(false);
    setMenuTargetId(null);
  };
  const handleRename = async () => {
    console.log("handleRename called", { user, menuTargetId, renameWishlistName });
    if (!user || !menuTargetId || !renameWishlistName.trim()) {
      alert("Missing user, wishlist id, or name!");
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid, "wishlists", menuTargetId), { name: renameWishlistName.trim() });
      setRenameDialogOpen(false);
      setMenuTargetId(null);
      setRenameWishlistName("");
      console.log("Rename successful");
    } catch (err) {
      alert("Failed to rename wishlist: " + err.message);
      console.error("Rename error:", err);
    }
  };
  const handleCreate = async () => {
    if (!user || !newWishlistName.trim()) return;
    await addDoc(collection(db, "users", user.uid, "wishlists"), { name: newWishlistName.trim(), createdAt: new Date().toISOString() });
    setCreateDialogOpen(false);
    setNewWishlistName("");
  };

  return (
    <Box sx={{ px: { xs: 1, md: 3 }, py: 3, maxWidth: 900, mx: 'auto', minHeight: '100vh', backgroundColor: 'background.paper' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>My Wishlists</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : wishlists.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ mt: 8 }}>
          You have no wishlists yet.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {wishlists.map(wl => (
            <Box key={wl.id} sx={{ p: 2, borderRadius: 2, boxShadow: 1, background: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 3, background: '#f5faff' } }} onClick={() => navigate(`/wishlist/${wl.id}`)}>
              {/* Avatar with custom icon/gradient/emoji if set */}
              {wl.avatar ? (
                <Avatar
                  sx={{
                    mr: 2,
                    fontSize: 28,
                    bgcolor: wl.avatar.type === 'gradient' ? undefined : '#1976d2',
                    background: wl.avatar.type === 'gradient' ? wl.avatar.value : undefined,
                  }}
                >
                  {wl.avatar.type === 'icon' || wl.avatar.type === 'emoji' ? wl.avatar.value : ''}
                </Avatar>
              ) : (
                <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>{(wl.name || wl.id)[0]?.toUpperCase()}</Avatar>
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>{wl.name || wl.id}</Typography>
              <IconButton onClick={e => { e.stopPropagation(); handleMenuOpen(e, wl.id); }}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      <Fab color="primary" sx={{ position: 'fixed', bottom: 80, right: 24, zIndex: 100 }} onClick={() => setCreateDialogOpen(true)}>
        <AddIcon />
      </Fab>
      {/* Menu for each wishlist */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { setRenameDialogOpen(true); setRenameWishlistName(wishlists.find(w => w.id === menuTargetId)?.name || ""); handleMenuClose(); }}>Rename</MenuItem>
        <MenuItem onClick={() => { setAvatarDialogOpen(true); setAvatarTargetId(menuTargetId); handleMenuClose(); }}>Change Avatar</MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>Delete</MenuItem>
      </Menu>
      {/* Create Wishlist Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Wishlist</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Wishlist Name" value={newWishlistName} onChange={e => setNewWishlistName(e.target.value)} variant="outlined" autoFocus sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newWishlistName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>
      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => { setRenameDialogOpen(false); setMenuTargetId(null); }} fullWidth maxWidth="sm">
        <DialogTitle>Rename Wishlist</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Wishlist Name" value={renameWishlistName} onChange={e => setRenameWishlistName(e.target.value)} variant="outlined" autoFocus sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRename} disabled={!renameWishlistName.trim()}>Rename</Button>
        </DialogActions>
      </Dialog>
      {/* Avatar Dialog */}
      <Dialog open={avatarDialogOpen} onClose={() => { setAvatarDialogOpen(false); setAvatarTargetId(null); setSelectedAvatar(null); }} fullWidth maxWidth="xs">
        <DialogTitle>Choose an Avatar</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 1 }}>
            {[
              // Emojis
              { type: 'emoji', value: '😀' }, { type: 'emoji', value: '😎' }, { type: 'emoji', value: '🤩' },
              { type: 'emoji', value: '🎉' }, { type: 'emoji', value: '🦄' }, { type: 'emoji', value: '🐱' },
              { type: 'emoji', value: '🐶' }, { type: 'emoji', value: '🍕' }, { type: 'emoji', value: '🍔' },
              { type: 'emoji', value: '🍦' }, { type: 'emoji', value: '🌟' }, { type: 'emoji', value: '🍀' },
              // Icons (using emojis for now, can swap to MUI icons if needed)
              { type: 'icon', value: '❤️' }, { type: 'icon', value: '⭐' }, { type: 'icon', value: '🛒' },
              { type: 'icon', value: '🎁' }, { type: 'icon', value: '📦' }, { type: 'icon', value: '📝' },
              // Gradients
              { type: 'gradient', value: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' },
              { type: 'gradient', value: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
              { type: 'gradient', value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
              { type: 'gradient', value: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)' },
              { type: 'gradient', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
              { type: 'gradient', value: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)' },
              { type: 'gradient', value: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)' },
            ].map((avatar, idx) => (
              <Box
                key={idx}
                sx={{
                  width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, cursor: 'pointer', border: selectedAvatar === JSON.stringify(avatar) ? '3px solid #1976d2' : '2px solid #eee',
                  background: avatar.type === 'gradient' ? avatar.value : '#fff',
                  transition: 'border 0.2s',
                }}
                onClick={() => setSelectedAvatar(JSON.stringify(avatar))}
              >
                {avatar.type !== 'gradient' ? avatar.value : ''}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAvatarDialogOpen(false); setAvatarTargetId(null); setSelectedAvatar(null); }}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            if (!user || !avatarTargetId || !selectedAvatar) return;
            const avatarObj = JSON.parse(selectedAvatar);
            await updateDoc(doc(db, "users", user.uid, "wishlists", avatarTargetId), { avatar: avatarObj });
            // Update local wishlists state for live UI update
            setWishlists(prev => prev.map(wl => wl.id === avatarTargetId ? { ...wl, avatar: avatarObj } : wl));
            setAvatarDialogOpen(false);
            setAvatarTargetId(null);
            setSelectedAvatar(null);
          }} disabled={!selectedAvatar}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setMenuTargetId(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Wishlist</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this wishlist?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WishlistPage;
