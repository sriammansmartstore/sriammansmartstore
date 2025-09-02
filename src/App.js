import BottomNavbar from "./components/BottomNavbar";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { auth } from "./firebase";
import { BrowserRouter as Router, Routes, Route, Navigate, Link as RouterLink, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/montserrat";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { NotificationProvider } from './components/NotificationProvider';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import ScrollToTop from './components/ScrollToTop';
import RouteSEO from './components/RouteSEO';
import GlobalPageSEO from './components/GlobalPageSEO';
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Typography from "@mui/material/Typography";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Badge from "@mui/material/Badge";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import { db } from "./firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import WishlistDetailPage from "./pages/WishlistDetailPage";
import WishlistReviewPage from "./pages/WishlistReviewPage";
import OfferScroller from "./components/OfferScroller";


const HomePage = lazy(() => import("./pages/HomePage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const AddressesPage = lazy(() => import("./pages/AddressesPage"));
const UserSettingsPage = lazy(() => import("./pages/UserSettingsPage"));
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
const ContactPage = lazy(() => import("./pages/ContactPage"));

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
  // Request location permission on app startup (robust)
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const requestGeo = () => {
      try {
        navigator.geolocation.getCurrentPosition(
          () => {
            // success: we only need to trigger the permission prompt early
          },
          (err) => {
            // Log for debugging; some browsers require user interaction if previously denied
            console.warn('Geolocation error on startup:', err && err.message ? err.message : err);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
      } catch (e) {
        console.warn('Geolocation exception on startup:', e);
      }
    };

    // Use Permissions API if available to avoid redundant prompts and ensure immediate request
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          // Trigger request for both 'granted' (to warm cache) and 'prompt' (to show prompt now)
          if (status.state === 'granted' || status.state === 'prompt') {
            requestGeo();
          }
          // If 'denied', do nothing here; user can enable via settings or later explicit action
        })
        .catch(() => {
          // Fallback if Permissions API not available/failed
          requestGeo();
        });
    } else {
      requestGeo();
    }
  }, []);
  // Disable browser scroll restoration so we control it
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      const prev = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      return () => { window.history.scrollRestoration = prev; };
    }
  }, []);
  const [nav, setNav] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = React.useContext(AuthContext) || {};

  useEffect(() => {
    if (!user) return setCartCount(0);
    const cartRef = collection(db, "users", user.uid, "cart");
    // Listen for real-time updates to cart
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      setCartCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <HelmetProvider>
        <NotificationProvider>
        <CssBaseline />
        <Router>
          <Helmet>
            <title>Sri Amman Smart Store</title>
            <meta name="description" content="Shop groceries and daily essentials online from Sri Amman Smart Store. Fast delivery, best prices, and secure payment options." />
            <meta name="robots" content="index,follow" />
            <meta property="og:site_name" content="Sri Amman Smart Store" />
            <meta property="og:title" content="Sri Amman Smart Store" />
            <meta property="og:description" content="Shop groceries and daily essentials online from Sri Amman Smart Store." />
            <meta property="og:type" content="website" />
          </Helmet>
          <RouteSEO />
          <GlobalPageSEO />
          <ScrollToTop />

          {/* Routed layout to access location */}
          {(() => {
            const RoutedLayout = () => {
              const location = useLocation();
              const onHome = location.pathname === '/';
              return (
                <>
                  <AppBar position="fixed" sx={{ top: 0, background: 'white' }}>
                    <Toolbar sx={{ minHeight: 48, px: 2 }}>
                      {/* Hamburger icon opens MorePage drawer */}
                      <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 1 }} onClick={() => setDrawerOpen(true)}>
                        <MenuIcon sx={{ color: '#388e3c' }} />
                      </IconButton>
                      {/* Logo next to the side nav toggler */}
                      <IconButton
                        color="inherit"
                        component={RouterLink}
                        to="/"
                        aria-label="Sri Amman Smart Store logo"
                        sx={{ mr: 1, p: 0.5 }}
                      >
                        <Box component="img" src="/logo.png" alt="Sri Amman Smart Store" sx={{ height: 32, width: 32, objectFit: 'contain' }} />
                      </IconButton>
                      {/* Banner close to the logo */}
                      <Box component="img" src="/banner.png" alt="Sri Amman Smart Store" sx={{ height: 28, objectFit: 'contain', maxWidth: { xs: '40%', sm: '50%', md: '60%' } }} />
                      {/* Spacer to push cart to the right */}
                      <Box sx={{ flexGrow: 1 }} />
                      {/* Cart on the right */}
                      <IconButton color="inherit" component={RouterLink} to="/cart" sx={{ ml: 1 }}>
                        <Badge badgeContent={cartCount} color="error" overlap="circular">
                          <ShoppingCartIcon sx={{ color: '#1976d2' }} />
                        </Badge>
                      </IconButton>
                    </Toolbar>
                  </AppBar>
                  {/* Offer scroller only on home */}
                  {onHome && <OfferScroller />}
                  {/* Side Drawer for MorePage */}
                  <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 340, maxWidth: '90vw', pt: 0 } }}>
                    <Suspense fallback={null}>
                      <MorePage onClose={() => setDrawerOpen(false)} />
                    </Suspense>
                  </Drawer>
                  <Box sx={{
                    paddingTop: onHome ? '88px' : '64px',
                    paddingBottom: '56px',
                    minHeight: "100vh",
                    background: '#fff',
                    width: '100%',
                    overflow: 'hidden'
                  }}>
                    <Suspense fallback={null}>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/product/:category/:id" element={<ProductDetailsPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/category/:categoryName" element={<CategoriesPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                        <Route path="/wishlist/:wishlistId" element={<WishlistDetailPage />} />
                        <Route path="/wishlist/:wishlistId/review" element={<WishlistReviewPage />} />
                        <Route path="/addresses" element={<AddressesPage />} />
                        <Route path="/settings" element={<UserSettingsPage />} />
                        {/* Checkout flow now goes directly from cart to payment */}
                        <Route path="/payment" element={<PaymentOptionsPage />} />
                        <Route path="/orders" element={<MyOrdersPage />} />
                        <Route path="/location" element={<LocationDetectionPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/about" element={<AboutUsPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/report" element={<ReportProblemPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/userdata" element={<UserDataPage />} />
                        <Route path="/terms" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/TermsAndConditionsPage')))}</Suspense>} />
                        <Route path="/privacy" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/PrivacyPolicyPage')))}</Suspense>} />
                        <Route path="/refund-cancellation" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/RefundAndCancellationPolicyPage')))}</Suspense>} />
                        <Route path="/shipping" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/ShippingPolicyPage')))}</Suspense>} />
                        <Route path="/return" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/ReturnPolicyPage')))}</Suspense>} />
                        {/* Checkout flow now goes directly from cart to payment */}
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </Suspense>
                  </Box>
                  <BottomNavbar />
                </>
              );
            };
            return <RoutedLayout />;
          })()}
        </Router>
        </NotificationProvider>
        </HelmetProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
export default App;
