import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import './UserSettingsPage.css';

const UserSettingsPage = () => {
  return (
    <Box className="settings-root">
      <Typography variant="h5" className="settings-title">User Settings</Typography>
      <Box className="settings-section">
        <Typography className="settings-label">Profile</Typography>
        <TextField label="Name" variant="outlined" fullWidth margin="normal" defaultValue="Vignesh" />
        <TextField label="Email" variant="outlined" fullWidth margin="normal" defaultValue="user@email.com" />
        <Button variant="contained" className="save-btn">Save Profile</Button>
      </Box>
      <Box className="settings-section">
        <Typography className="settings-label">Change Password</Typography>
        <TextField label="Current Password" type="password" variant="outlined" fullWidth margin="normal" />
        <TextField label="New Password" type="password" variant="outlined" fullWidth margin="normal" />
        <Button variant="contained" className="save-btn">Change Password</Button>
      </Box>
    </Box>
  );
};
export default UserSettingsPage;
