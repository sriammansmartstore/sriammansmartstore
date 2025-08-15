import BottomNavbar from "./components/BottomNavbar";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { auth } from "./firebase";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/montserrat";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Typography from "@mui/material/Typography";
// import BottomNavigation from "@mui/material/BottomNavigation";
// import BottomNavigationAction from "@mui/material/BottomNavigationAction";
// import HomeIcon from "@mui/icons-material/Home";
// import CategoryIcon from "@mui/icons-material/Category";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
// import FavoriteIcon from "@mui/icons-material/Favorite";
// import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Badge from "@mui/material/Badge";
import Drawer from "@mui/material/Drawer";
import { db } from "./firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import WishlistDetailPage from "./pages/WishlistDetailPage";
import WishlistReviewPage from "./pages/WishlistReviewPage";

const HomePage = lazy(() => import("./pages/HomePage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const AddressesPage = lazy(() => import("./pages/AddressesPage"));
const UserSettingsPage = lazy(() => import("./pages/UserSettingsPage"));
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
const CategoryProductsPage = lazy(() => import("./pages/CategoryProductsPage"));

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
  // Request location permission on app startup
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {}
      );
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
        <CssBaseline />
        <Router>
          <AppBar position="fixed" sx={{ top: 0, background: 'white' }}>
            <Toolbar sx={{ minHeight: 48, px: 2 }}>
              {/* Hamburger icon opens MorePage drawer */}
              <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={() => setDrawerOpen(true)}>
                <MenuIcon sx={{ color: '#388e3c' }} />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  flexGrow: 1,
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  letterSpacing: 0.4,
                  color: '#388e3c',
                  fontWeight: 700,
                  fontSize: { xs: '1.05rem', sm: '1.25rem', md: '1.5rem' },
                  transition: 'font-size 0.2s',
                }}
              >
                Sri Amman Smart Store
              </Typography>
              {/* Top right: Cart icon always visible */}
              <IconButton color="inherit" href="/cart" sx={{ ml: 2 }}>
                <Badge badgeContent={cartCount} color="error" overlap="circular">
                  <ShoppingCartIcon sx={{ color: '#1976d2' }} />
                </Badge>
              </IconButton>
            </Toolbar>
          </AppBar>
          {/* Side Drawer for MorePage */}
          <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 340, maxWidth: '90vw', pt: 0 } }}>
            <Suspense fallback={null}>
              <MorePage onClose={() => setDrawerOpen(false)} />
            </Suspense>
          </Drawer>
          <div style={{ paddingTop: 64, paddingBottom: 56, minHeight: "100vh", background: '#fff' }}>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:category/:id" element={<ProductDetailsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/category/:categoryName" element={<CategoryProductsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/wishlist/:wishlistId" element={<WishlistDetailPage />} />
                <Route path="/wishlist/:wishlistId/review" element={<WishlistReviewPage />} />
                <Route path="/addresses" element={<AddressesPage />} />
                <Route path="/settings" element={<UserSettingsPage />} />
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
                <Route path="/terms" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/TermsAndConditionsPage')))}</Suspense>} />
                <Route path="/privacy" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/PrivacyPolicyPage')))}</Suspense>} />
                <Route path="/refund-cancellation" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/RefundAndCancellationPolicyPage')))}</Suspense>} />
                <Route path="/shipping" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/ShippingPolicyPage')))}</Suspense>} />
                <Route path="/return" element={<Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/ReturnPolicyPage')))}</Suspense>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </div>
          <BottomNavbar />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
export default App;
