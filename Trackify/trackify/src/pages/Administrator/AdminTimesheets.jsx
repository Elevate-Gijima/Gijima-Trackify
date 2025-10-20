import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const AdminDashboard = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [filter, setFilter] = useState("all");

  // Fetch timesheets based on filter
  const fetchTimesheets = async () => {
    try {
      const token = localStorage.getItem("access_token");

      // Build endpoint dynamically based on filter
      const url =
        filter === "all"
          ? "http://127.0.0.1:8000/timesheets"
          : `http://127.0.0.1:8000/timesheets?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch timesheets");
      const data = await response.json();
      setTimesheets(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [filter]);

  // --- Download CSV (only approved) ---
  const downloadCSV = () => {
    const approvedSheets = timesheets.filter((s) => s.status === "approved");
    const csvRows = [];
    const headers = ["Name", "Surname", "Email", "Clock In", "Clock Out", "Hours Worked", "Status"];
    csvRows.push(headers.join(","));

    approvedSheets.forEach((sheet) => {
      const row = [
        sheet.employee_name,
        sheet.employee_surname,
        sheet.employee_email,
        sheet.clock_in,
        sheet.clock_out,
        sheet.hours_worked,
        sheet.status,
      ];
      csvRows.push(row.join(","));
    });

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "approved_timesheets.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- Download PDF (only approved) ---
  const downloadPDF = () => {
    const approvedSheets = timesheets.filter((s) => s.status === "approved");
    const doc = new jsPDF();
    doc.text("Approved Timesheets", 14, 16);
    const tableColumn = ["Name", "Surname", "Email", "Clock In", "Clock Out", "Hours Worked", "Status"];
    const tableRows = [];

    approvedSheets.forEach((sheet) => {
      const row = [
        sheet.employee_name,
        sheet.employee_surname,
        sheet.employee_email,
        sheet.clock_in,
        sheet.clock_out,
        sheet.hours_worked,
        sheet.status,
      ];
      tableRows.push(row);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("approved_timesheets.pdf");
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" color="primary" onClick={downloadCSV}>
              Download CSV
            </Button>
            <Button variant="contained" color="secondary" onClick={downloadPDF}>
              Download PDF
            </Button>
          </Stack>

          <Typography variant="h6" gutterBottom>
            {filter === "all" ? "All Timesheets" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Timesheets`}
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Surname</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Clock In</strong></TableCell>
                  <TableCell><strong>Clock Out</strong></TableCell>
                  <TableCell><strong>Hours Worked</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timesheets.map((sheet, index) => (
                  <TableRow key={index}>
                    <TableCell>{sheet.employee_name}</TableCell>
                    <TableCell>{sheet.employee_surname}</TableCell>
                    <TableCell>{sheet.employee_email}</TableCell>
                    <TableCell>{sheet.clock_in}</TableCell>
                    <TableCell>{sheet.clock_out}</TableCell>
                    <TableCell>{sheet.hours_worked}</TableCell>
                    <TableCell>{sheet.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </>
  );
};

export default AdminDashboard;
