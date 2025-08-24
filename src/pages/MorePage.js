import React, { useContext, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Button, 
  Dialog, 
  IconButton, 
  Divider, 
  Collapse, 
  Avatar,
  Paper,
  alpha,
  CircularProgress
} from "@mui/material";
import { styled } from '@mui/material/styles';
import {
  Close as CloseIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  ShoppingBag as ShoppingBagIcon,
  Payment as PaymentIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Info as InfoIcon,
  Report as ReportIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  LocationOn as AddressIcon,
  LocalShipping as ShippingIcon,
  AssignmentReturn as ReturnIcon,
  Gavel as GavelIcon,
  Policy as PolicyIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import UserDataPage from "./UserDataPage";

const menuItems = [
  { label: "Home", path: "/", icon: <HomeIcon color="primary" /> },
  { label: "My Orders", path: "/orders", icon: <ShoppingBagIcon sx={{ color: '#ff6d00' }} /> },
  { label: "Addresses", path: "/addresses", icon: <AddressIcon sx={{ color: '#00c853' }} /> },
  { label: "Notifications", path: "/notifications", icon: <NotificationsIcon sx={{ color: '#ffab00' }} /> },
  { label: "Change Password", path: "/settings", icon: <LockIcon sx={{ color: '#c51162' }} /> },
  { label: "Contact Us", path: "/contact", icon: <EmailIcon sx={{ color: '#00b8d4' }} /> },
  { label: "About Us", path: "/about", icon: <InfoIcon sx={{ color: '#0091ea' }} /> },
  { label: "Report a Problem", path: "/report", icon: <ReportIcon color="error" /> },
];

const policyItems = [
  { label: "Terms and Conditions", path: "/terms", icon: <GavelIcon sx={{ color: '#7b1fa2' }} /> },
  { label: "Privacy Policy", path: "/privacy", icon: <PolicyIcon sx={{ color: '#455a64' }} /> },
  { label: "Refund & Cancellation", path: "/refund-cancellation", icon: <ReceiptIcon sx={{ color: '#ff6d00' }} /> },
  { label: "Shipping Policy", path: "/shipping", icon: <ShippingIcon sx={{ color: '#00c853' }} /> },
  { label: "Return Policy", path: "/return", icon: <ReturnIcon sx={{ color: '#0091ea' }} /> },
];

const StyledListItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderRadius: theme.shape.borderRadius,
  },
  marginBottom: theme.spacing(0.5),
}));

const MorePage = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, userDetails } = useContext(AuthContext);
  const [editOpen, setEditOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
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
      console.error("Logout error:", error);
    }
  };

  const handleLogin = () => {
    if (onClose) onClose();
    navigate("/login");
  };

  // Filter menu items based on user login status
  const filteredMenuItems = user ? 
    (user.providerData?.some(p => p.providerId === 'google.com') 
      ? menuItems.filter(item => item.label !== 'Change Password')
      : menuItems)
    : [];

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      minWidth: 320,
      maxWidth: 400,
      position: 'relative',
    }}>
      {/* Header */}
      <Box sx={{ 
        px: 2, 
        pt: 2, 
        pb: 1,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        bgcolor: 'background.paper',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={onClose} 
            sx={{ mr: 1, color: 'text.primary' }}
            size="large"
          >
            <CloseIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            color="primary" 
            fontWeight={700} 
            sx={{ 
              fontFamily: 'Montserrat', 
              letterSpacing: 0.5,
              flexGrow: 1
            }}
          >
            Menu
          </Typography>
        </Box>
      </Box>
      
      <Divider />

      {user === undefined ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : user ? (
        <>
          {/* Profile Section */}
          <Paper 
            elevation={0}
            sx={{ 
              m: 2, 
              p: 2, 
              borderRadius: 2,
              background: (theme) => 
                `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 56, 
                  height: 56, 
                  mr: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText'
                }}
              >
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : <PersonIcon />}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600} 
                  noWrap
                  sx={{ color: 'text.primary' }}
                >
                  {profile.fullName || 'Welcome!'}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  noWrap
                >
                  {profile.number ? `${profile.countryCode} ${profile.number}` : 'Tap to edit profile'}
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setEditOpen(true)}
                size="small"
                sx={{ 
                  ml: 1,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>

          {/* Menu Items */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1 }}>
            <List disablePadding>
              {filteredMenuItems.map((item) => (
                <StyledListItem key={item.path} disablePadding>
                  <ListItemButton 
                    onClick={() => { 
                      if (onClose) onClose(); 
                      navigate(item.path); 
                    }}
                    sx={{ px: 2, py: 1.25 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: 'body1',
                        fontWeight: 500,
                        color: 'text.primary'
                      }}
                    />
                  </ListItemButton>
                </StyledListItem>
              ))}

              {/* Policies Section */}
              <StyledListItem disablePadding>
                <ListItemButton 
                  onClick={() => setPoliciesOpen(!policiesOpen)}
                  sx={{ px: 2, py: 1.25 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <GavelIcon sx={{ color: '#7b1fa2' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Policies"
                    primaryTypographyProps={{
                      variant: 'body1',
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                  />
                  {policiesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </StyledListItem>
              
              <Collapse in={policiesOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {policyItems.map((item) => (
                    <StyledListItem key={item.path} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          if (onClose) onClose();
                          navigate(item.path);
                        }}
                        sx={{ pl: 7, py: 1 }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.label}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary'
                          }}
                        />
                      </ListItemButton>
                    </StyledListItem>
                  ))}
                </List>
              </Collapse>
            </List>
          </Box>

          {/* Logout Button */}
          <Box sx={{ p: 2, position: 'sticky', bottom: 0, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                py: 1.5,
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                }
              }}
            >
              Logout
            </Button>
          </Box>

          {/* Edit Profile Dialog */}
          <Dialog 
            open={editOpen} 
            onClose={() => setEditOpen(false)} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                maxHeight: '90vh'
              }
            }}
          >
            <UserDataPage editMode={true} onSave={() => setEditOpen(false)} />
          </Dialog>
        </>
      ) : (
        /* Login Prompt */
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 4,
          textAlign: 'center'
        }}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.8 }} />
          <Typography variant="h6" color="text.primary" fontWeight={600} gutterBottom>
            Welcome to Sri Amman Smart Store
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 320 }}>
            Login to access your orders, addresses, payment options, and more.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleLogin}
            sx={{
              py: 1.5,
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              maxWidth: 280,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
                transition: 'all 0.2s'
              }
            }}
          >
            Login / Sign Up
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MorePage;
