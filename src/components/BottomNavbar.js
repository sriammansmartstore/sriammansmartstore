import React, { useContext, useEffect, useState } from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { Button } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Badge from "@mui/material/Badge";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const BottomNavbar = () => {
  const [nav, setNav] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const { user } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  // Search handler - focuses the search bar on home page
  const handleSearch = () => {
    // Navigate to home page if not already there
    navigate('/');
    // Trigger search focus event after navigation and render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('focus-search'));
    }, 460);
  };

  // Home handler - clears search and navigates to home
  const handleHome = () => {
    navigate('/');
    // Trigger clear search event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('clear-search'));
    }, 100);
  };

  useEffect(() => {
    if (!user) return setCartCount(0);
    const cartRef = collection(db, "users", user.uid, "cart");
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      setCartCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <BottomNavigation
      showLabels
      value={nav}
      onChange={(e, newValue) => {
        setNav(newValue);
      }}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#fff',
        boxShadow: '0 -2px 12px rgba(56,142,60,0.10)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        fontFamily: 'Montserrat',
        px: 1.5,
      }}
    >
      <BottomNavigationAction 
        label="Home" 
        icon={<HomeIcon sx={{ color: '#43a047' }} />} 
        onMouseDown={() => window.dispatchEvent(new CustomEvent('clear-search'))}
        onClick={() => navigate("/")}
        sx={{ fontFamily: 'Montserrat', fontWeight: 600 }} 
      />
      <BottomNavigationAction label="Categories" icon={<CategoryIcon sx={{ color: '#ff9800' }} />} onClick={() => navigate("/categories")} sx={{ fontFamily: 'Montserrat', fontWeight: 600 }} />
      <BottomNavigationAction
        label="Search"
        icon={<SearchIcon sx={{ fontSize: 28, color: '#388e3c' }} />}
        onClick={handleSearch}
        sx={{ fontFamily: 'Montserrat', fontWeight: 600, color: '#388e3c' }}
      />
      <BottomNavigationAction label="Wishlist" icon={<FavoriteIcon sx={{ color: '#e91e63' }} />} onClick={() => navigate("/wishlist")} sx={{ fontFamily: 'Montserrat', fontWeight: 600, pr: 2 }} />
      <BottomNavigationAction
        label="Cart"
        icon={
          <Badge
            badgeContent={cartCount}
            color="error"
            showZero
            overlap="circular"
          >
            <ShoppingCartIcon sx={{ color: '#1976d2' }} />
          </Badge>
        }
        onClick={() => navigate("/cart")}
        sx={{ fontFamily: 'Montserrat', fontWeight: 600, pl: 2 }}
      />
    </BottomNavigation>
  );
};

export default BottomNavbar;
