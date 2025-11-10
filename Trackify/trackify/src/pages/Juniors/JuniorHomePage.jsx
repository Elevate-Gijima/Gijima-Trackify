import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Stack, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import TimesheetForm from "./TimesheetForm";

const API_BASE_URL = "http://127.0.0.1:8000";

const JuniorHomePage = () => {
  const [records, setRecords] = useState([]);
  const [, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Show form if routed to /add-task
  useEffect(() => {
    setShowForm(location.pathname === "/add-task");
  }, [location.pathname]);

  useEffect(() => {
    const fetchTimesheets = async () => {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) return setLoading(false);
      try {
        const response = await fetch(`${API_BASE_URL}/timesheets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to load timesheets");
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

  // Stats - normalize status to handle different formats
  const normalizeStatus = (status) => {
    if (status === null || status === undefined || status === "") return "pending"; // Default to pending
    return typeof status === "string" ? status.toLowerCase().trim() : String(status).toLowerCase().trim();
  };

  const totalTasks = records.length;
  const pendingTasks = records.filter(ts => normalizeStatus(ts.status) === "pending").length;
  const completedTasks = records.filter(ts => normalizeStatus(ts.status) === "approved").length;
  const rejectedTasks = records.filter(ts => normalizeStatus(ts.status) === "rejected").length;

  // Recent timesheets sorted by date (desc), robust to format
  const mostRecent = [...records]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);


  return (
    <Box sx={{ minHeight: "80vh", backgroundColor: "whitesmoke", p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Statistic Cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ width: "100%", maxWidth: 1200, mb: 4, justifyContent: "center", flexWrap: "wrap" }}>
        <Paper elevation={3} sx={{ p: 3, flex: "1 1 200px", textAlign: "center", background: "linear-gradient(45deg, #001f3f 20%, #0074D9 90%)", color: "white", minWidth: "200px" }}>
          <Typography variant="h5">Total Tasks</Typography>
          <Typography variant="h3" sx={{ fontWeight: "bold" }}>{totalTasks}</Typography>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, flex: "1 1 200px", textAlign: "center", background: "linear-gradient(45deg, #FFF700 10%, #FFD700 90%)", color: "navy", minWidth: "200px" }}>
          <Typography variant="h5">Pending Tasks</Typography>
          <Typography variant="h3" sx={{ fontWeight: "bold" }}>{pendingTasks}</Typography>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, flex: "1 1 200px", textAlign: "center", background: "linear-gradient(45deg, #2ECC40 10%, #01FF70 90%)", color: "#022", minWidth: "200px" }}>
          <Typography variant="h5">Completed Tasks</Typography>
          <Typography variant="h3" sx={{ fontWeight: "bold" }}>{completedTasks}</Typography>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, flex: "1 1 200px", textAlign: "center", background: "linear-gradient(45deg, #FF4136 10%, #FF6B6B 90%)", color: "white", minWidth: "200px" }}>
          <Typography variant="h5">Rejected Tasks</Typography>
          <Typography variant="h3" sx={{ fontWeight: "bold" }}>{rejectedTasks}</Typography>
        </Paper>
      </Stack>

      {/* Table of recent tasks */}
      <Paper elevation={4} sx={{ mb: 4, width: "100%", maxWidth: 900, p: 2, overflowX: "auto" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "navy" }}>
          Recent Tasks
        </Typography>
        {mostRecent.length === 0 ? (
          <Typography>No timesheets found.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Clock In</TableCell>
                <TableCell>Clock Ins</TableCell>
                <TableCell>Clock Out</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mostRecent.map((rec) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Add Task Modal/Page */}
      {showForm && <TimesheetForm onBack={() => navigate("/")} />} 
    </Box>
  );
};

export default JuniorHomePage;
