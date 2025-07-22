import React, { useContext, useEffect, useState } from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
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
        background: 'linear-gradient(90deg, #388e3c 60%, #43a047 100%)',
        boxShadow: '0 -2px 12px rgba(56,142,60,0.10)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        fontFamily: 'Montserrat',
        px: 1.5,
      }}
    >
      <BottomNavigationAction label="Home" icon={<HomeIcon />} onClick={() => navigate("/")} sx={{ color: '#fff', fontWeight: 600 }} />
      <BottomNavigationAction label="Categories" icon={<CategoryIcon />} onClick={() => navigate("/categories")} sx={{ color: '#fff', fontWeight: 600 }} />
      <BottomNavigationAction label="Search" icon={<SearchIcon />} onClick={() => navigate("/search")} sx={{ color: '#fff', fontWeight: 600 }} />
      <BottomNavigationAction label="Wishlist" icon={<FavoriteIcon />} onClick={() => navigate("/wishlist")} sx={{ color: '#fff', fontWeight: 600 }} />
      <BottomNavigationAction
        label="Cart"
        icon={
          <Badge
            badgeContent={cartCount}
            color="error"
            showZero
            overlap="circular"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '1.1rem',
                minWidth: 26,
                height: 26,
                fontWeight: 700,
                border: '2px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                top: 6,
                right: -6,
              }
            }}
          >
            <ShoppingCartIcon sx={{ fontSize: 28 }} />
          </Badge>
        }
        onClick={() => navigate("/cart")}
        sx={{ color: '#fff', fontWeight: 600 }}
      />
    </BottomNavigation>
  );
};

export default BottomNavbar;
