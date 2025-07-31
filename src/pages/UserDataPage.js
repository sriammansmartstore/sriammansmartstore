import React, { useContext, useState, useEffect } from "react";
import { Box, Typography, TextField, Button, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { doc, setDoc, getDoc } from "firebase/firestore";

const genders = ["Male", "Female", "Other"];

const countryCodes = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+971", label: "🇦🇪 +971" },
  // Add more as needed
];

const UserDataPage = ({ editMode = false, onSave }) => {
  const { user, userDetails } = useContext(AuthContext);
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [number, setNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (userDetails) {
      setFullName(userDetails.fullName || "");
      setCountryCode(userDetails.countryCode || "+91");
      setNumber(userDetails.number || "");
      setGender(userDetails.gender || "");
      setDob(userDetails.dob || "");
    }
    setLoading(false);
  }, [user, userDetails]);

  const handleSubmit = async () => {
    if (!user) return;
    const cc = countryCode;
    await setDoc(doc(db, "users", user.uid), {
      fullName,
      countryCode: cc,
      number,
      gender,
      dob,
      email: user.email,
      uid: user.uid,
    }, { merge: true });
    setSuccess(true);
    if (onSave) onSave();
    if (!editMode) navigate("/");
  };

  if (loading) return null;

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 3, background: "#fff", borderRadius: 4, boxShadow: '0 4px 16px rgba(67,160,71,0.10)' }}>
      <Typography variant="h5" color="primary" fontWeight={700} mb={2}>{editMode ? "Edit Account Details" : "Complete Your Profile"}</Typography>
      <TextField label="Full Name" variant="outlined" fullWidth margin="normal" value={fullName} onChange={e => setFullName(e.target.value)} />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1, mb: 1 }}>
        <TextField
          select
          label="Code"
          value={countryCode}
          onChange={e => setCountryCode(e.target.value)}
          sx={{ minWidth: 100 }}
        >
          {countryCodes.map(opt => (
            <MenuItem key={opt.code} value={opt.code}>{opt.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Phone Number"
          variant="outlined"
          fullWidth
          value={number}
          onChange={e => setNumber(e.target.value.replace(/\D/g, ''))}
          inputProps={{ maxLength: 15 }}
        />
      </Box>
      <TextField select label="Gender" variant="outlined" fullWidth margin="normal" value={gender} onChange={e => setGender(e.target.value)}>
        {genders.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
      </TextField>
      <TextField label="Date of Birth" type="date" variant="outlined" fullWidth margin="normal" value={dob} onChange={e => setDob(e.target.value)} InputLabelProps={{ shrink: true }} />
      <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>{editMode ? "Save Changes" : "Save & Continue"}</Button>
      {success && <Typography color="success.main" mt={2} align="center">Profile updated successfully!</Typography>}
    </Box>
  );
};
export default UserDataPage;
