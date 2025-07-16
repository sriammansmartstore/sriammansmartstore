import React, { useState } from "react";
import { Box, Typography, TextField, Button, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const genders = ["Male", "Female", "Other"];

const UserDataPage = () => {
  const [fullName, setFullName] = useState("");
  const [number, setNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), {
      fullName,
      number,
      gender,
      dob,
      email: user.email,
      uid: user.uid,
    }, { merge: true });
    navigate("/");
  };
  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 3, background: "#fff", borderRadius: 4, boxShadow: '0 4px 16px rgba(67,160,71,0.10)' }}>
      <Typography variant="h5" color="primary" fontWeight={700} mb={2}>Complete Your Profile</Typography>
      <TextField label="Full Name" variant="outlined" fullWidth margin="normal" value={fullName} onChange={e => setFullName(e.target.value)} />
      <TextField label="Phone Number" variant="outlined" fullWidth margin="normal" value={number} onChange={e => setNumber(e.target.value)} />
      <TextField select label="Gender" variant="outlined" fullWidth margin="normal" value={gender} onChange={e => setGender(e.target.value)}>
        {genders.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
      </TextField>
      <TextField label="Date of Birth" type="date" variant="outlined" fullWidth margin="normal" value={dob} onChange={e => setDob(e.target.value)} InputLabelProps={{ shrink: true }} />
      <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>Save & Continue</Button>
    </Box>
  );
};
export default UserDataPage;
