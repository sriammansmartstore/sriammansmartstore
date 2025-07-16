import React, { useState } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

const ReportProblemPage = () => {
  const [problem, setProblem] = useState("");
  const handleSubmit = () => {
    // TODO: Send problem report to backend
    setProblem("");
    alert("Thank you for your feedback!");
  };
  return (
    <Box sx={{ p: 2, background: "#fff", minHeight: "100vh", borderRadius: 4, boxShadow: '0 4px 16px rgba(233,30,99,0.08)' }}>
      <Typography variant="h5" color="primary" fontWeight={700} mb={2}>Report a Problem</Typography>
      <TextField
        label="Describe your problem"
        multiline
        rows={4}
        variant="outlined"
        fullWidth
        value={problem}
        onChange={e => setProblem(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleSubmit}>Submit</Button>
    </Box>
  );
};
export default ReportProblemPage;
