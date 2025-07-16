import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Button, Dialog, IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import UserDataPage from "./UserDataPage";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const baseLinks = [
  { label: "Addresses", path: "/addresses" },
  { label: "Change Password", path: "/settings" },
  { label: "My Orders", path: "/orders" },
  { label: "Payment Options", path: "/payment" },
  { label: "Notifications", path: "/notifications" },
  { label: "About Us", path: "/about" },
  { label: "Report a Problem", path: "/report" },
];


const MorePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in, object = logged in
  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: '', number: '', countryCode: '+91' });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            fullName: data.fullName || '',
            number: data.number || '',
            countryCode: data.countryCode || '+91',
          });
        } else {
          setProfile({ fullName: '', number: '', countryCode: '+91' });
        }
      } else {
        setProfile({ fullName: '', number: '', countryCode: '+91' });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      alert("Logout failed. Please try again.");
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  // Hide 'Change Password' if user is Google login
  let moreLinks = baseLinks;
  if (user && user.providerData && user.providerData.some(p => p.providerId === 'google.com')) {
    moreLinks = baseLinks.filter(link => link.label !== 'Change Password');
  }

  return (
    <Box sx={{
      position: 'fixed',
      top: 64, // height of AppBar
      left: 0,
      right: 0,
      bottom: 56, // height of bottom nav
      p: 2,
      background: '#fff',
      borderRadius: 0,
      boxShadow: '0 4px 16px rgba(67,160,71,0.08)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      zIndex: 1200,
      overflow: 'hidden',
    }}>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <Box mb={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="h5" color="primary" fontWeight={700} flex={1} sx={{ textTransform: 'capitalize' }}>
              {profile.fullName || 'Your Name'}
            </Typography>
            {user && (
              <IconButton color="primary" onClick={() => setEditOpen(true)} size="small" sx={{ ml: 1 }} title="Edit Profile">
                <EditIcon />
              </IconButton>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5, ml: 0.5 }}>
            {(profile.number ? `${profile.countryCode} ${profile.number}` : 'Contact Number')}
          </Typography>
        </Box>
        <List>
          {moreLinks.map(link => (
            <ListItem key={link.path} disablePadding>
              <ListItemButton onClick={() => navigate(link.path)}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
          <UserDataPage editMode={true} onSave={() => setEditOpen(false)} />
        </Dialog>
      </div>
      {user === undefined ? null : user ? (
        <Button
          variant="contained"
          color="error"
          sx={{ mb: 1, fontWeight: 700 }}
          onClick={handleLogout}
        >
          Logout
        </Button>
      ) : (
        <Button
          variant="contained"
          color="success"
          sx={{ mb: 1, fontWeight: 700 }}
          onClick={handleLogin}
        >
          Login
        </Button>
      )}
    </Box>
  );
};
export default MorePage;
