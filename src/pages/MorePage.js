import React, { useContext, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Button, Dialog, IconButton, Divider } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import UserDataPage from "./UserDataPage";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
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


const MorePage = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, userDetails } = useContext(AuthContext);
  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: '', number: '', countryCode: '+91' });

  useEffect(() => {
    if (userDetails) {
      setProfile({
        fullName: userDetails.fullName || '',
        number: userDetails.number || '',
        countryCode: userDetails.countryCode || '+91',
      });
    } else {
      setProfile({ fullName: '', number: '', countryCode: '+91' });
    }
  }, [userDetails]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onClose) onClose();
      navigate("/login");
    } catch (error) {
      alert("Logout failed. Please try again.");
    }
  };

  const handleLogin = () => {
    if (onClose) onClose();
    navigate("/login");
  };

  // Hide 'Change Password' if user is Google login
  let moreLinks = baseLinks;
  if (user && user.providerData && user.providerData.some(p => p.providerId === 'google.com')) {
    moreLinks = baseLinks.filter(link => link.label !== 'Change Password');
  }

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      minWidth: 320,
      maxWidth: 400,
      position: 'relative',
    }}>
      {/* Drawer Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 2, pb: 1 }}>
        <IconButton onClick={onClose} sx={{ mr: 1 }} size="large" aria-label="Close Drawer">
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" color="primary" fontWeight={700} sx={{ flex: 1, fontFamily: 'Montserrat', letterSpacing: 0.4 }}>
          More
        </Typography>
      </Box>
      <Divider />
      {user === undefined ? null : user ? (
        <>
          {/* Profile Section */}
          <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" color="primary" fontWeight={700} sx={{ textTransform: 'capitalize', fontFamily: 'Montserrat' }}>
                {profile.fullName || 'Your Name'}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                {(profile.number ? `${profile.countryCode} ${profile.number}` : 'Contact Number')}
              </Typography>
            </Box>
            {user && (
              <IconButton color="primary" onClick={() => setEditOpen(true)} size="small" sx={{ ml: 1 }} title="Edit Profile">
                <EditIcon />
              </IconButton>
            )}
          </Box>
          <Divider />
          {/* Links Section */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1 }}>
            <List>
              {moreLinks.map(link => (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton onClick={() => { if (onClose) onClose(); navigate(link.path); }}>
                    <ListItemText primary={link.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
          {/* Edit Profile Dialog */}
          <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
            <UserDataPage editMode={true} onSave={() => setEditOpen(false)} />
          </Dialog>
          {/* Logout Button */}
          <Box sx={{ px: 2, pb: 2, pt: 1 }}>
            <Button
              variant="contained"
              color="error"
              sx={{ fontWeight: 700, width: '100%' }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 2 }}>
          <Typography variant="h6" color="primary" fontWeight={700} sx={{ mb: 2, textAlign: 'center' }}>
            Login to see all options
          </Typography>
          <Button
            variant="contained"
            color="success"
            sx={{ fontWeight: 700, width: '100%' }}
            onClick={handleLogin}
          >
            Login
          </Button>
        </Box>
      )}
    </Box>
  );
};
export default MorePage;
