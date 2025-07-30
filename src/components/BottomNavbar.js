import React, { useContext, useEffect, useState } from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import CategoryIcon from "@mui/icons-material/Category";
import MicIcon from "@mui/icons-material/Mic";
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
  // Voice search state
  const [listening, setListening] = useState(false);
  // Voice search handler
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      // Store the transcript in localStorage for HomePage to pick up
      localStorage.setItem('voice_search_query', transcript);
      navigate('/');
      // Optionally, trigger a custom event for HomePage to listen
      window.dispatchEvent(new CustomEvent('voice-search', { detail: transcript }));
    };
    recognition.onerror = (event) => {
      setListening(false);
      alert('Voice search failed: ' + event.error);
    };
    recognition.onend = () => {
      setListening(false);
    };
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
      <BottomNavigationAction label="Home" icon={<HomeIcon sx={{ color: '#43a047' }} />} onClick={() => navigate("/")} sx={{ fontFamily: 'Montserrat', fontWeight: 600 }} />
      <BottomNavigationAction label="Categories" icon={<CategoryIcon sx={{ color: '#ff9800' }} />} onClick={() => navigate("/categories")} sx={{ fontFamily: 'Montserrat', fontWeight: 600 }} />
      <BottomNavigationAction
        label={listening ? "Listening..." : "Voice"}
        icon={<MicIcon sx={{ fontSize: 28, color: listening ? '#d32f2f' : '#388e3c' }} />}
        onClick={handleVoiceSearch}
        sx={{ fontFamily: 'Montserrat', fontWeight: 600, color: listening ? '#d32f2f' : '#388e3c' }}
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
