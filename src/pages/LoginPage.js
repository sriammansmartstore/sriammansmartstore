import React, { useState } from "react";
import { Box, Typography, TextField, Button, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import GoogleIcon from "@mui/icons-material/Google";
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLogin(userCred.user);
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handlePostLogin(result.user);
    } catch (err) {
      setError("Google login failed.");
    }
  };

  const handlePostLogin = async (user) => {
    // Check if user profile is complete
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || !userSnap.data().fullName || !userSnap.data().number || !userSnap.data().gender || !userSnap.data().dob) {
      // Store basic info if not present
      await setDoc(userRef, { email: user.email, uid: user.uid }, { merge: true });
      navigate("/userdata");
    } else {
      navigate("/");
    }
  };

  return (
    <Box className="login-root">
      <Box className="login-box">
        <Typography variant="h5" className="login-title">Welcome Back</Typography>
        <TextField label="Email Address" placeholder="Enter your email" variant="outlined" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} InputProps={{ className: 'login-input' }} />
        <TextField label="Password" placeholder="Enter your password" type="password" variant="outlined" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} InputProps={{ className: 'login-input' }} />
        {error && <Typography color="error" className="login-error">{error}</Typography>}
        <Button variant="contained" className="login-btn" fullWidth onClick={handleLogin}>Login</Button>
        <Divider className="login-divider">OR</Divider>
        <Button variant="outlined" className="login-google-btn" fullWidth onClick={handleGoogleLogin}>
          <Box className="login-google-icon">
            <GoogleIcon className="login-google-icon-svg" />
          </Box>
          Login with Google
        </Button>
        <Typography className="switch-link" onClick={() => navigate("/signup")}>Don't have an account? Sign Up</Typography>
      </Box>
    </Box>
  );
};
export default LoginPage;
