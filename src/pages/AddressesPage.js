import React, { useEffect, useState } from "react";
import { Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Radio, FormControlLabel, Grid } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, updateDoc as updateDocFirestore, deleteDoc } from "firebase/firestore";
import './AddressesPage.css'; // Keep an eye on this for conflicts
import '../firebase';


const AddressesPage = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [form, setForm] = useState({
    fullName: '',
    fatherOrSpouse: '',
    door: '',
    street: '',
    pincode: '',
    town: '',
    city: '',
    district: '',
    state: '',
    contact: '',
    altContact: '',
    landmark: ''
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState(null); // Added state for pincode error
  const [primaryId, setPrimaryId] = useState(null);
  const auth = getAuth();
  const db = getFirestore();

  // Fetch addresses from Firestore subcollection
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!auth.currentUser) return;
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      // Get primary address id from user doc
      const userSnap = await getDoc(userDoc);
      let primaryId = null;
      if (userSnap.exists()) {
        const data = userSnap.data();
        primaryId = data.primaryAddressId || null;
      }
      // Get addresses from subcollection
      const addressesCol = collection(userDoc, 'addresses');
      const addressesSnap = await getDocs(addressesCol);
      const addressesArr = addressesSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setAddresses(addressesArr);
      setPrimaryId(primaryId);
      setLoading(false);
    };
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.currentUser, openDialog]);

  // Save addresses to Firestore subcollection
  const saveAddresses = async (newAddresses, newPrimaryId = primaryId) => {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    // Save primary address id in user doc
    await setDoc(userDocRef, { primaryAddressId: newPrimaryId }, { merge: true });
    // Sync addresses in subcollection
    const addressesCol = collection(userDocRef, 'addresses');
    // Remove all existing addresses and re-add (for simplicity)
    const existing = await getDocs(addressesCol);
    for (const d of existing.docs) {
      await deleteDoc(d.ref);
    }
    for (const addr of newAddresses) {
      const { id, ...rest } = addr;
      await setDoc(doc(addressesCol, id.toString()), rest);
    }
    setAddresses(newAddresses);
    setPrimaryId(newPrimaryId);
  };

  // Open dialog for add/edit
  const handleOpenDialog = (idx = -1) => {
    setEditIndex(idx);
    setPincodeError(null); // Clear previous pincode errors
    if (idx >= 0) {
      setForm({
        fullName: addresses[idx].fullName || '',
        fatherOrSpouse: addresses[idx].fatherOrSpouse || '',
        door: addresses[idx].door || '',
        street: addresses[idx].street || '',
        pincode: addresses[idx].pincode || '',
        town: addresses[idx].town || '',
        city: addresses[idx].city || '',
        district: addresses[idx].district || '',
        state: addresses[idx].state || '',
        contact: addresses[idx].contact || '',
        altContact: addresses[idx].altContact || '',
        landmark: addresses[idx].landmark || ''
      });
    } else {
      setForm({
        fullName: '',
        fatherOrSpouse: '',
        door: '',
        street: '',
        pincode: '',
        town: '',
        city: '',
        district: '',
        state: '',
        contact: '',
        altContact: '',
        landmark: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditIndex(-1);
    setForm({ // Reset form to initial state
      fullName: '',
      fatherOrSpouse: '',
      door: '',
      street: '',
      pincode: '',
      town: '',
      city: '',
      district: '',
      state: '',
      contact: '',
      altContact: '',
      landmark: ''
    });
    setPincodeError(null); // Clear pincode error on close
  };

  // Add or edit address (subcollection logic)
  const handleSave = async () => {
    if (!form.fullName || !form.door || !form.street || !form.pincode || !form.town || !form.city || !form.district || !form.state || !form.contact) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const addressesCol = collection(userDocRef, 'addresses');
    let newId = form.id || Date.now().toString();
    if (editIndex >= 0 && addresses[editIndex]) {
      // Update existing address
      await setDoc(doc(addressesCol, newId.toString()), { ...form });
    } else {
      // Add new address
      await setDoc(doc(addressesCol, newId.toString()), { ...form });
      // If first address, set as primary
      const addressesSnap = await getDocs(addressesCol);
      if (addressesSnap.size === 0) {
        await setDoc(userDocRef, { primaryAddressId: newId }, { merge: true });
      }
    }
    setOpenDialog(false);
    setEditIndex(-1);
    setForm({
      fullName: '', fatherOrSpouse: '', door: '', street: '', pincode: '', town: '', city: '', district: '', state: '', contact: '', altContact: '', landmark: ''
    });
    setPincodeError(null);
  };

  // Pincode API integration
  const handlePincodeBlur = async () => {
    const pin = form.pincode.trim();
    if (pin.length !== 6 || isNaN(pin)) {
      setPincodeError('Pincode must be 6 digits');
      setForm(f => ({ ...f, town: '', city: '', district: '', state: '' })); // Clear dependent fields
      return;
    }
    setPincodeLoading(true);
    setPincodeError(null); // Clear previous errors
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const po = data[0].PostOffice[0];
        setForm(f => ({
          ...f,
          town: po.Name || '', // Often, PostOffice.Name is the town/locality
          city: po.Division || '',
          district: po.District || '',
          state: po.State || ''
        }));
      } else {
        setPincodeError('Invalid Pincode or no data found.');
        setForm(f => ({ ...f, town: '', city: '', district: '', state: '' }));
      }
    } catch (e) {
      console.error("Error fetching pincode:", e);
      setPincodeError('Failed to fetch location data.');
      setForm(f => ({ ...f, town: '', city: '', district: '', state: '' }));
    }
    setPincodeLoading(false);
  };

  // Set primary address (update only user doc)
  const handleSetPrimary = async (id) => {
    setPrimaryId(id);
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, { primaryAddressId: id }, { merge: true });
  };

  // UI
  return (
    <Box className="addresses-root">
      <Box display="flex" alignItems="center" mb={1}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="addresses-title" sx={{ flex: 1 }}>Your Addresses</Typography>
      </Box>
      <Button variant="contained" className="add-address-btn" onClick={() => handleOpenDialog()}>Add New Address</Button>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : addresses.length === 0 ? (
        <Typography>No addresses found.</Typography>
      ) : (
        addresses.map((addr, idx) => (
          <Box key={addr.id} className="address-card">
            <Box>
              <Typography variant="h6">{addr.fullName}</Typography>
              <Typography variant="body2">
                {addr.fatherOrSpouse && <><b>Father/Spouse:</b> {addr.fatherOrSpouse}<br /></>}
                <b>Door:</b> {addr.door}, <b>Street:</b> {addr.street}<br />
                <b>Pincode:</b> {addr.pincode}, <b>Town:</b> {addr.town}<br />
                <b>City:</b> {addr.city}, <b>District:</b> {addr.district}<br />
                <b>Contact:</b> {addr.contact}<br />
                {addr.altContact && <><b>Alt Contact:</b> {addr.altContact}<br /></>}
                {addr.landmark && <><b>Landmark:</b> {addr.landmark}</>}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={<Radio checked={primaryId === addr.id} onChange={() => handleSetPrimary(addr.id)} />}
                label="Primary"
              />
              <Button variant="outlined" color="primary" size="small" onClick={() => handleOpenDialog(idx)}>Edit</Button>
            </Box>
          </Box>
        ))
      )}

      {/* Add/Edit Dialog */}
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      fullWidth // Ensures dialog takes full width responsively
      maxWidth="md" // Sets a max width for larger screens (default 900px for md)
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
          margin: { xs: 0, sm: '32px' },
          // The key change is here:
          // Remove `width: { xs: '100%', sm: 'auto' }` as it can cause issues.
          // `fullWidth` combined with `maxWidth` handles width well.
          // Explicitly set `minWidth` to ensure space.
          minWidth: { xs: 'calc(100% - 64px)', sm: '600px' }, // Ensure it's wide enough for two columns
          top: { xs: 0, sm: 'auto' },
          maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 4,
          pt: 3,
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
        }}
      >
        {editIndex >= 0 ? 'Edit Address' : 'Add New Address'}
        <IconButton onClick={handleCloseDialog} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          px: 4,
          py: 3,
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        <Grid container spacing={3}>
          {/* Personal Details */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Father/Spouse Name"
                  value={form.fatherOrSpouse}
                  onChange={(e) => setForm({ ...form, fatherOrSpouse: e.target.value })}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Address Line 1 */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}> {/* Door No. can be smaller */}
                <TextField
                  label="Door No."
                  value={form.door}
                  onChange={(e) => setForm({ ...form, door: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={8}> {/* Street Name takes more space */}
                <TextField
                  label="Street Name"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Location Details (Pincode, Town, City, District, State) */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}> {/* Pincode can be a specific width */}
                <TextField
                  label="Pincode"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  onBlur={handlePincodeBlur}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                  helperText={pincodeLoading ? 'Fetching location...' : pincodeError}
                  error={!!pincodeError}
                  FormHelperTextProps={{ error: true }}
                />
              </Grid>
              <Grid item xs={12} sm={8}> {/* Town can take remaining space */}
                <TextField
                  label="Town"
                  value={form.town}
                  onChange={(e) => setForm({ ...form, town: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6}> {/* City and District remain half-width */}
                <TextField
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="District"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6}> {/* State remains half-width */}
                <TextField
                  label="State"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              {/* This empty grid item can be removed if not strictly needed for alignment
                  or filled with another small input */}
              <Grid item xs={12} sm={6}>
                {/* Potentially another small input or just leave for spacing */}
              </Grid>
            </Grid>
          </Grid>

          {/* Contact Details */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Number"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Alternative Contact (Optional)"
                  value={form.altContact}
                  onChange={(e) => setForm({ ...form, altContact: e.target.value })}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Landmark - Full Width */}
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
          px: 4,
          pb: 3,
          pt: 2,
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <Button
          onClick={handleCloseDialog}
          color="inherit"
          variant="text"
          sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disableElevation
        >
          {editIndex >= 0 ? 'Update Address' : 'Save Address'}
        </Button>
      </DialogActions>
    </Dialog>
    </Box>
  );
};

export default AddressesPage;