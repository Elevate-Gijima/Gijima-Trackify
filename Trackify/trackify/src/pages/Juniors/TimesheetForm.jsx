import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
} from "@mui/material";

const API_BASE_URL = "http://127.0.0.1:8000"; // ⚙️ backend URL

const TimesheetForm = ({ showOnlyRecords = false, onBack }) => {
  const [formData, setFormData] = useState({
    date: "",
    clock_in: "",
    clock_out: "",
    description: "",
  });
  const [records, setRecords] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Note: Since we only have POST endpoint, we'll remove the fetch functionality
  // Timesheets will be displayed only after creation
  useEffect(() => {
    if (!showOnlyRecords) return;
    const fetchTimesheets = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch("http://127.0.0.1:8000/timesheets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to load timesheets");
        const data = await response.json();
        setRecords(data);
      } catch (err) {
        setSnackbar({ open: true, message: err.message, severity: "error" });
      }
    };
    fetchTimesheets();
  }, [showOnlyRecords]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (formData.clock_out <= formData.clock_in) {
      setSnackbar({ open: true, message: "Clock Out must be after Clock In!", severity: "error" });
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setSnackbar({ open: true, message: "Please log in first.", severity: "error" });
      return;
    }

    try {
      // Create new timesheet using the new endpoint
      const response = await fetch(`${API_BASE_URL}/timesheets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create timesheet");
      }

      const savedRecord = await response.json();
      
      // Update or add to local records for display
      let wasUpdate = false;
      setRecords(prev => {
        const existingIndex = prev.findIndex(r => r.timesheet_id === savedRecord.timesheet_id);
        if (existingIndex >= 0) {
          // Update existing record
          wasUpdate = true;
          const updated = [...prev];
          updated[existingIndex] = savedRecord;
          return updated;
        } else {
          // Add new record
          return [savedRecord, ...prev];
        }
      });
      
      // Reset form
      setFormData({ date: "", clock_in: "", clock_out: "", description: "" });
      const message = wasUpdate 
        ? "Timesheet updated and resubmitted successfully!" 
        : "Timesheet submitted successfully!";
      setSnackbar({ open: true, message, severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <Box sx={{ mt: 2, display: "flex", justifyContent: "center", width: "100%" }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: 600, backgroundColor: "white", borderRadius: 3 }} elevation={4}>
        {onBack && <Button onClick={onBack} sx={{ mb: 2 }} variant="outlined">Back to Menu</Button>}

        {!showOnlyRecords && (
          <>
            <Typography variant="h5" sx={{ mb: 3, textAlign: "center", color: "navy", fontWeight: "bold" }}>
              Timesheet
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField label="Date" type="date" name="date" value={formData.date} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
                <TextField label="Clock In Time" type="time" name="clock_in" value={formData.clock_in} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
                <TextField label="Clock Out Time" type="time" name="clock_out" value={formData.clock_out} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
                <TextField label="Project Description" name="description" multiline rows={3} value={formData.description} onChange={handleChange} placeholder="Describe what you worked on..." required />
                <Button type="submit" variant="contained" sx={{ backgroundColor: "navy", color: "white", "&:hover": { backgroundColor: "#001f3f" } }}>
                  Submit Timesheet
                </Button>
              </Stack>
            </form>
          </>
        )}

        {showOnlyRecords && records.length > 0 && (
          <>
            <Typography variant="h5" sx={{ mb: 3, textAlign: "center", color: "navy", fontWeight: "bold" }}>
              My Timesheets
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((rec, idx) => (
                    <TableRow key={rec.timesheet_id}>
                      <TableCell>{rec.date}</TableCell>
                      <TableCell>{rec.clock_in}</TableCell>
                      <TableCell>{rec.clock_out}</TableCell>
                      <TableCell>{rec.total_hours || 'N/A'}</TableCell>
                      <TableCell>{rec.description}</TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: rec.status === 'approved' ? 'green' : 
                                  rec.status === 'rejected' ? 'red' : 'orange',
                            fontWeight: 'bold'
                          }}
                        >
                          {rec.status || 'pending'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default TimesheetForm;
