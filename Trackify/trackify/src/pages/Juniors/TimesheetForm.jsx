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
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const API_BASE_URL = "http://localhost:8000"; // ⚙️ backend URL

const TimesheetForm = ({ showOnlyRecords = false, onBack }) => {
  const [formData, setFormData] = useState({
    date: "",
    clock_in: "",
    clock_out: "",
    description: "",
  });
  const [records, setRecords] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [editingIndex, setEditingIndex] = useState(null);

  // Load timesheets from backend
  useEffect(() => {
    const fetchTimesheets = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/timesheets/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to load timesheets");
        const data = await response.json();
        setRecords(data);
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: err.message, severity: "error" });
      }
    };
    fetchTimesheets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const payload = { ...formData };
      let response;

      if (editingIndex !== null) {
        // Update existing timesheet
        const record = records[editingIndex];
        response = await fetch(`${API_BASE_URL}/timesheets/${record.timesheet_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new timesheet
        response = await fetch(`${API_BASE_URL}/timesheets/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to save timesheet");
      }

      const savedRecord = await response.json();
      const updatedRecords = [...records];
      if (editingIndex !== null) {
        updatedRecords[editingIndex] = savedRecord;
        setEditingIndex(null);
      } else {
        updatedRecords.push(savedRecord);
      }

      setRecords(updatedRecords);
      setFormData({ date: "", clock_in: "", clock_out: "", description: "" });
      setSnackbar({ open: true, message: "Timesheet saved successfully!", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleEdit = (index) => {
    const record = records[index];
    setFormData({
      date: record.date,
      clock_in: record.clock_in,
      clock_out: record.clock_out,
      description: record.description,
    });
    setEditingIndex(index);
  };

  const handleDelete = async (index) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setSnackbar({ open: true, message: "Please log in first.", severity: "error" });
      return;
    }

    const record = records[index];
    try {
      const res = await fetch(`${API_BASE_URL}/timesheets/${record.timesheet_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete timesheet");
      setRecords(records.filter((_, idx) => idx !== index));
      setSnackbar({ open: true, message: "Timesheet deleted!", severity: "info" });
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
                  {editingIndex !== null ? "Update" : "Submit"}
                </Button>
              </Stack>
            </form>
          </>
        )}

        {records.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mt: 4, mb: 2, textAlign: "center", color: "navy", fontWeight: "bold" }}>
              My Previous Timesheets
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((rec, idx) => (
                    <TableRow key={rec.timesheet_id}>
                      <TableCell>{rec.date}</TableCell>
                      <TableCell>{rec.clock_in}</TableCell>
                      <TableCell>{rec.clock_out}</TableCell>
                      <TableCell>{rec.description}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(idx)} color="primary"><EditIcon /></IconButton>
                        <IconButton onClick={() => handleDelete(idx)} color="error"><DeleteIcon /></IconButton>
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
