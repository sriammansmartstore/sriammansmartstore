import React, { useState, useEffect, lazy, Suspense } from "react";
import { auth } from "./firebase";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/montserrat";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Typography from "@mui/material/Typography";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import HomeIcon from "@mui/icons-material/Home";
import CategoryIcon from "@mui/icons-material/Category";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";


const HomePage = lazy(() => import("./pages/HomePage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const AddressesPage = lazy(() => import("./pages/AddressesPage"));
const UserSettingsPage = lazy(() => import("./pages/UserSettingsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const PaymentOptionsPage = lazy(() => import("./pages/PaymentOptionsPage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const LocationDetectionPage = lazy(() => import("./pages/LocationDetectionPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const MorePage = lazy(() => import("./pages/MorePage"));
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"));
const ReportProblemPage = lazy(() => import("./pages/ReportProblemPage"));
const UserDataPage = lazy(() => import("./pages/UserDataPage"));

const theme = createTheme({
  palette: {
    primary: {
      main: "#388e3c",
    },
    secondary: {
      main: "#43a047",
    },
    background: {
      default: "#fff",
    },
  },
  typography: {
    fontFamily: 'Montserrat, Arial, sans-serif',
  },
});


function App() {
  const [nav, setNav] = useState(0);
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in, object = logged in

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="fixed" sx={{ top: 0, background: 'white' }}>
          <Toolbar sx={{ minHeight: 48 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: 'Montserrat, Arial, sans-serif', letterSpacing: 0.4, color: '#388e3c', fontWeight: 700 }}>
              Sri Amman Smart Store
            </Typography>
            {/* Hide Login button if user is logged in, and don't show until auth state is loaded */}
            {user === undefined ? null : !user && (
              <Typography component="span" sx={{ fontFamily: 'Montserrat', fontWeight: 600, color: 'red', cursor: 'pointer', ml: 2 }} onClick={() => window.location.href='/login'}>
                Login
              </Typography>
            )}
          </Toolbar>
        </AppBar>
        <div style={{ paddingTop: 64, paddingBottom: 56, minHeight: "100vh", background: '#fff' }}>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/addresses" element={<AddressesPage />} />
              <Route path="/settings" element={<UserSettingsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment" element={<PaymentOptionsPage />} />
              <Route path="/orders" element={<MyOrdersPage />} />
              <Route path="/location" element={<LocationDetectionPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/report" element={<ReportProblemPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/userdata" element={<UserDataPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </div>
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
          <BottomNavigationAction label="Home" icon={<HomeIcon sx={{ color: '#43a047' }} />} href="/" sx={{ fontFamily: 'Montserrat', fontWeight: 600, pl: 2 }} />
          <BottomNavigationAction label="Categories" icon={<CategoryIcon sx={{ color: '#ff9800' }} />} href="/categories" sx={{ fontFamily: 'Montserrat', fontWeight: 600 }} />
          <BottomNavigationAction label="Cart" icon={<ShoppingCartIcon sx={{ color: '#1976d2' }} />} href="/cart" sx={{ fontFamily: 'Montserrat', fontWeight: 600 }} />
          <BottomNavigationAction label="Wishlist" icon={<FavoriteIcon sx={{ color: '#e91e63' }} />} href="/wishlist" sx={{ fontFamily: 'Montserrat', fontWeight: 600 }} />
          <BottomNavigationAction label="More" icon={<PersonIcon sx={{ color: '#8e24aa' }} />} href="/more" sx={{ fontFamily: 'Montserrat', fontWeight: 600, pr: 2 }} />
        </BottomNavigation>
      </Router>
    </ThemeProvider>
  );
}
export default App;
