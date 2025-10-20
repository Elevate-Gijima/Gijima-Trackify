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

const TimesheetForm = ({ showOnlyRecords = false, onBack }) => {
  const [formData, setFormData] = useState({
    date: "",
    clockIn: "",
    clockOut: "",
    description: "",
  });
  const [records, setRecords] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("timesheets")) || [];
    setRecords(saved);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clock validation
    if (formData.clockOut <= formData.clockIn) {
      setSnackbar({ open: true, message: "Clock Out must be after Clock In!", severity: "error" });
      return;
    }

    let updatedRecords = [...records];
    if (editingIndex !== null) {
      // Update existing record
      updatedRecords[editingIndex] = formData;
      setEditingIndex(null);
    } else {
      // Add new record
      updatedRecords.push(formData);
    }

    setRecords(updatedRecords);
    localStorage.setItem("timesheets", JSON.stringify(updatedRecords));

    setSnackbar({ open: true, message: "Timesheet saved successfully!", severity: "success" });
    setFormData({ date: "", clockIn: "", clockOut: "", description: "" });
  };

  const handleEdit = (index) => {
    setFormData(records[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    const updatedRecords = records.filter((_, idx) => idx !== index);
    setRecords(updatedRecords);
    localStorage.setItem("timesheets", JSON.stringify(updatedRecords));
    setSnackbar({ open: true, message: "Timesheet deleted!", severity: "info" });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        mt: 2,
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 600,
          backgroundColor: "white",
          borderRadius: 3,
        }}
      >
        {onBack && (
          <Button onClick={onBack} sx={{ mb: 2 }} variant="outlined">
            Back to Menu
          </Button>
        )}

        {!showOnlyRecords && (
          <>
            <Typography
              variant="h5"
              sx={{ mb: 3, textAlign: "center", color: "navy", fontWeight: "bold" }}
            >
              Timesheet
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
                <TextField
                  label="Clock In Time"
                  type="time"
                  name="clockIn"
                  value={formData.clockIn}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
                <TextField
                  label="Clock Out Time"
                  type="time"
                  name="clockOut"
                  value={formData.clockOut}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
                <TextField
                  label="Project Description"
                  name="description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what you worked on..."
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: "navy",
                    color: "white",
                    "&:hover": { backgroundColor: "#001f3f" },
                  }}
                >
                  {editingIndex !== null ? "Update" : "Submit"}
                </Button>
              </Stack>
            </form>
          </>
        )}

        {records.length > 0 && (
          <>
            <Typography
              variant="h6"
              sx={{ mt: 4, mb: 2, textAlign: "center", color: "navy", fontWeight: "bold" }}
            >
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
                    <TableRow key={idx}>
                      <TableCell>{rec.date}</TableCell>
                      <TableCell>{rec.clockIn}</TableCell>
                      <TableCell>{rec.clockOut}</TableCell>
                      <TableCell>{rec.description}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(idx)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(idx)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default TimesheetForm;
