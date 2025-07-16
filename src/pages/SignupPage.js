import React, { useState } from "react";
import { Box, Typography, TextField, Button, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import GoogleIcon from "@mui/icons-material/Google";
import './SignupPage.css';

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    setError("");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        uid: userCred.user.uid,
        fullName: name,
      }, { merge: true });
      navigate("/userdata");
    } catch (err) {
      setError("Signup failed. Please try again.");
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await setDoc(doc(db, "users", result.user.uid), {
        email: result.user.email,
        uid: result.user.uid,
        fullName: result.user.displayName,
      }, { merge: true });
      navigate("/userdata");
    } catch (err) {
      setError("Google signup failed.");
    }
  };

  return (
    <Box className="signup-root">
      <Box className="signup-box">
        <Typography variant="h5" className="signup-title">Create Your Account</Typography>
        <TextField label="Full Name" placeholder="Enter your name" variant="outlined" fullWidth margin="normal" value={name} onChange={e => setName(e.target.value)} InputProps={{ className: 'signup-input' }} />
        <TextField label="Email Address" placeholder="Enter your email" variant="outlined" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} InputProps={{ className: 'signup-input' }} />
        <TextField label="Password" placeholder="Create a password" type="password" variant="outlined" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} InputProps={{ className: 'signup-input' }} />
        {error && <Typography color="error" className="signup-error">{error}</Typography>}
        <Button variant="contained" className="signup-btn" fullWidth onClick={handleSignup}>Sign Up</Button>
        <Divider className="signup-divider">OR</Divider>
        <Button variant="outlined" className="signup-google-btn" fullWidth onClick={handleGoogleSignup}>
          <Box className="signup-google-icon">
            <GoogleIcon className="signup-google-icon-svg" />
          </Box>
          Sign Up with Google
        </Button>
        <Typography className="switch-link" onClick={() => navigate("/login")}>Already have an account? Login</Typography>
      </Box>
    </Box>
  );
};
export default SignupPage;
