import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Pagination, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert
} from "@mui/material";

const API_BASE_URL = "http://127.0.0.1:8000";

const PAGE_SIZE = 10;

const EmployeeTimesheetHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({ clock_in: "", clock_out: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const fetchTimesheets = async () => {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) return setLoading(false);
      try {
        const response = await fetch(`${API_BASE_URL}/timesheets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to load timesheet history");
        const data = await response.json();
        setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTimesheets();
  }, []);
  
  // Sorting (most recent first)
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pagedRecords = sortedRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (rec) => {
    setEditRecord(rec);
    setEditForm({
      clock_in: rec.clock_in || "",
      clock_out: rec.clock_out || "",
      description: rec.description || "",
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditRecord(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!editRecord) return;
    if (editForm.clock_out && editForm.clock_in && editForm.clock_out <= editForm.clock_in) {
      setSnackbar({ open: true, message: "Clock Out must be after Clock In", severity: "error" });
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) {
      setSnackbar({ open: true, message: "Please log in first.", severity: "error" });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/timesheets/${editRecord.timesheet_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clock_in: editForm.clock_in || null,
          clock_out: editForm.clock_out || null,
          description: editForm.description,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update timesheet");
      }
      const updated = await response.json();
      setRecords((prev) => prev.map((r) => (r.timesheet_id === updated.timesheet_id ? updated : r)));
      setSnackbar({ open: true, message: "Timesheet updated.", severity: "success" });
      closeEdit();
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "70vh", p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Paper sx={{ width: "100%", maxWidth: 900, p: 3 }} elevation={3}>
        <Typography variant="h5" sx={{ mb: 3, color: "navy", fontWeight: "bold" }}>
          My Timesheet History
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : pagedRecords.length === 0 ? (
          <Typography>No timesheets found.</Typography>
        ) : (
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Clock In</TableCell>
                <TableCell>Clock Out</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRecords.map((rec) => (
                <TableRow key={rec.timesheet_id}>
                  <TableCell>{rec.date}</TableCell>
                  <TableCell>{rec.clock_in}</TableCell>
                  <TableCell>{rec.clock_out}</TableCell>
                  <TableCell>{rec.total_hours}</TableCell>
                  <TableCell>{rec.description}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          rec.status === "approved"
                            ? "green"
                            : rec.status === "rejected"
                            ? "red"
                            : "orange",
                        fontWeight: "bold",
                      }}
                    >
                      {rec.status || "pending"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {rec.status === "rejected" && (
                      <Button size="small" variant="outlined" onClick={() => openEdit(rec)}>
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              shape="rounded"
              color="primary"
            />
          </Box>
        )}
      </Paper>
      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Rejected Timesheet</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1, display: "flex", gap: 2, flexDirection: "column" }}>
            <TextField
              label="Clock In"
              type="time"
              name="clock_in"
              value={editForm.clock_in}
              onChange={handleEditChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              fullWidth
            />
            <TextField
              label="Clock Out"
              type="time"
              name="clock_out"
              value={editForm.clock_out}
              onChange={handleEditChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              multiline
              minRows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={saving}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={saving}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeTimesheetHistory;
