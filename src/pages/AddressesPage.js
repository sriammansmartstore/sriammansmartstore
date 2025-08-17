import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  FormControlLabel,
  Grid,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import BottomNavbar from "../components/BottomNavbar";

// Helper function for exponential backoff during API calls
const withExponentialBackoff = async (
  apiCall,
  retries = 3,
  delay = 1000
) => {
  try {
    return await apiCall();
  } catch (error) {
    if (retries > 0) {
      await new Promise((res) => setTimeout(res, delay));
      return withExponentialBackoff(apiCall, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Using initialized Firebase from src/firebase.js

const AddressesPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editAddressId, setEditAddressId] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    fatherOrSpouse: "",
    door: "",
    street: "",
    pincode: "",
    town: "",
    city: "",
    district: "",
    state: "",
    contact: "",
    altContact: "",
    landmark: "",
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [primaryId, setPrimaryId] = useState(null);
  const [userId, setUserId] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Set up auth listener using initialized auth instance
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch addresses from Firestore once authenticated
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!userId) return;
      try {
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);
        let currentPrimaryId = null;
        if (userSnap.exists()) {
          const data = userSnap.data();
          currentPrimaryId = data.primaryAddressId || null;
        }

        const addressesCol = collection(userDocRef, "addresses");
        const addressesSnap = await getDocs(addressesCol);
        const addressesArr = addressesSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setAddresses(addressesArr);
        setPrimaryId(currentPrimaryId);
      } catch (e) {
        console.error("Error fetching addresses:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, [userId, openDialog]);

  // Open dialog for add/edit
  const handleOpenDialog = (address = null) => {
    setFormError(null);
    setPincodeError(null);
    if (address) {
      setEditAddressId(address.id);
      setForm(address);
    } else {
      setEditAddressId(null);
      setForm({
        fullName: "",
        fatherOrSpouse: "",
        door: "",
        street: "",
        pincode: "",
        town: "",
        city: "",
        district: "",
        state: "",
        contact: "",
        altContact: "",
        landmark: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditAddressId(null);
    setForm({
      fullName: "",
      fatherOrSpouse: "",
      door: "",
      street: "",
      pincode: "",
      town: "",
      city: "",
      district: "",
      state: "",
      contact: "",
      altContact: "",
      landmark: "",
    });
    setFormError(null);
    setPincodeError(null);
  };

  // Add or edit address
  const handleSave = async () => {
    if (
      !form.fullName ||
      !form.door ||
      !form.street ||
      !form.pincode ||
      !form.town ||
      !form.city ||
      !form.district ||
      !form.state ||
      !form.contact
    ) {
      setFormError("Please fill in all required fields (marked with *)");
      return;
    }
    if (!userId) return;
    const userDocRef = doc(db, "users", userId);
    const addressesCol = collection(userDocRef, "addresses");

    try {
      if (editAddressId) {
        // Update existing address
        const addressDocRef = doc(addressesCol, editAddressId);
        await setDoc(addressDocRef, form, { merge: true });
      } else {
        // Add new address
        const newAddressRef = doc(addressesCol);
        await setDoc(newAddressRef, form);

        // If this is the first address, set it as primary
        if (addresses.length === 0) {
          await setDoc(
            userDocRef,
            { primaryAddressId: newAddressRef.id },
            { merge: true }
          );
        }
      }
      handleCloseDialog();
    } catch (e) {
      console.error("Error saving address:", e);
      setFormError("Failed to save address. Please try again.");
    }
  };

  // Pincode API integration
  const handlePincodeBlur = async () => {
    const pin = form.pincode.trim();
    if (pin.length !== 6 || isNaN(pin)) {
      setPincodeError("Pincode must be 6 digits.");
      setForm((f) => ({ ...f, town: "", city: "", district: "", state: "" }));
      return;
    }
    setPincodeLoading(true);
    setPincodeError(null);
    try {
      const apiCall = () =>
        fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const res = await withExponentialBackoff(apiCall);
      const data = await res.json();
      if (
        data &&
        data[0] &&
        data[0].Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        const po = data[0].PostOffice[0];
        setForm((f) => ({
          ...f,
          town: po.Name || "",
          city: po.Division || "",
          district: po.District || "",
          state: po.State || "",
        }));
      } else {
        setPincodeError("Invalid Pincode or no data found.");
        setForm((f) => ({ ...f, town: "", city: "", district: "", state: "" }));
      }
    } catch (e) {
      console.error("Error fetching pincode:", e);
      setPincodeError("Failed to fetch location data.");
      setForm((f) => ({ ...f, town: "", city: "", district: "", state: "" }));
    }
    setPincodeLoading(false);
  };

  // Set primary address
  const handleSetPrimary = async (id) => {
    if (!userId) return;
    try {
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, { primaryAddressId: id }, { merge: true });
      setPrimaryId(id);
    } catch (e) {
      console.error("Error setting primary address:", e);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // Leave space for fixed BottomNavbar
        pb: { xs: 10, sm: 12 },
      }}
    >
      {/* Header with back button and title */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: "700px",
          mb: 3,
        }}
      >
        <IconButton onClick={() => window.history.back()} size="large">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, ml: 1, fontWeight: 600 }}>
          Your Addresses
        </Typography>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "700px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Add New Address Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
          sx={{
            py: 1.5,
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: theme.shadows[3],
          }}
        >
          Add New Address
        </Button>

        {/* Loading and Empty State */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : addresses.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            No addresses found. Add a new one to get started!
          </Alert>
        ) : (
          addresses.map((addr) => (
            <Box
              key={addr.id}
              sx={{
                p: 3,
                backgroundColor: "white",
                borderRadius: 3,
                boxShadow: theme.shadows[1],
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                gap: 2,
                transition: "box-shadow 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                  {addr.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {addr.door}, {addr.street}
                  <br />
                  {addr.town}, {addr.city}
                  <br />
                  {addr.district}, {addr.state} - {addr.pincode}
                  <br />
                  Contact: {addr.contact}
                  {addr.altContact && <>, {addr.altContact}</>}
                  {addr.landmark && <br />}
                  {addr.landmark && `Landmark: ${addr.landmark}`}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "row", sm: "column" },
                  alignItems: { xs: "center", sm: "flex-end" },
                  gap: 1.5,
                }}
              >
                <FormControlLabel
                  control={
                    <Radio
                      checked={primaryId === addr.id}
                      onChange={() => handleSetPrimary(addr.id)}
                    />
                  }
                  label="Primary"
                  sx={{ mr: { xs: 0, sm: "auto" } }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleOpenDialog(addr)}
                  sx={{
                    borderRadius: 2,
                    borderColor: theme.palette.grey[300],
                    color: theme.palette.text.primary,
                  }}
                >
                  Edit
                </Button>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        // Do not use fullScreen on mobile; keep consistent within app layout
        fullScreen={false}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
          },
        }}
      >
        <DialogTitle
          sx={{
            py: 2,
            px: { xs: 2, sm: 4 },
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {editAddressId ? "Edit Address" : "Add New Address"}
          </Typography>
          <IconButton onClick={handleCloseDialog} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            px: { xs: 2, sm: 4 },
            py: { xs: 2, sm: 3 },
            flexGrow: 1,
            overflowY: "auto",
          }}
        >
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={3}>
            {/* Personal Details */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name *"
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Father/Spouse Name"
                value={form.fatherOrSpouse}
                onChange={(e) =>
                  setForm({ ...form, fatherOrSpouse: e.target.value })
                }
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>

            {/* Address Line 1 */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Door No. *"
                value={form.door}
                onChange={(e) => setForm({ ...form, door: e.target.value })}
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Street Name *"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>

            {/* Location Details */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Pincode *"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                onBlur={handlePincodeBlur}
                fullWidth
                variant="outlined"
                size="medium"
                error={!!pincodeError}
                helperText={pincodeLoading ? "Fetching location..." : pincodeError}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Town *"
                value={form.town}
                onChange={(e) => setForm({ ...form, town: e.target.value })}
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City *"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="District *"
                value={form.district}
                onChange={(e) =>
                  setForm({ ...form, district: e.target.value })
                }
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="State *"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>

            {/* Contact Details */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Number *"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Alternative Contact"
                value={form.altContact}
                onChange={(e) =>
                  setForm({ ...form, altContact: e.target.value })
                }
                fullWidth
                variant="outlined"
                size="medium"
              />
            </Grid>

            {/* Landmark */}
            <Grid item xs={12}>
              <TextField
                label="Landmark (e.g., Near ABC School)"
                value={form.landmark}
                onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                size="medium"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            py: 2,
            px: { xs: 2, sm: 4 },
            borderTop: "1px solid #eee",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Button onClick={handleCloseDialog} color="inherit" variant="text">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disableElevation
          >
            {editAddressId ? "Update Address" : "Save Address"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Bottom Navigation */}
      <BottomNavbar />
    </Box>
  );
};

export default AddressesPage;
