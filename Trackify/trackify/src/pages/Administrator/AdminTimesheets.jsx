import React, { useState, useEffect, useMemo } from "react";
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
import autoTable from "jspdf-autotable";

const AdminDashboard = () => {
    const [timesheets, setTimesheets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [filter, setFilter] = useState("all");

    const API_BASE_URL = "http://127.0.0.1:8000";

<<<<<<< HEAD
  // --- Fetch Timesheets (admin enriched endpoint) ---
  const fetchTimesheets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const url =
        filter === "all"
          ? `${API_BASE_URL}/admin/timesheets`
          : `${API_BASE_URL}/admin/timesheets?status=${filter}`;
=======
    // --- Fetch Timesheets ---
    const fetchTimesheets = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const url =
                filter === "all"
                    ? `${API_BASE_URL}/timesheets`
                    : `${API_BASE_URL}/timesheets?status=${filter}`;
>>>>>>> e2ec6e5bf4b88f866a39a8f595629f518855b675

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch timesheets");
            const data = await response.json();
            setTimesheets(data);
        } catch (error) {
            console.error("Error fetching timesheets:", error);
        }
    };

    // --- Fetch Approved Employees ---
    const fetchApprovedEmployees = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/employees/approved`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch approved employees");
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error("Error fetching approved employees:", error);
        }
    };

    useEffect(() => {
        fetchTimesheets();
    }, [filter]);

    useEffect(() => {
        fetchApprovedEmployees();
    }, []);

<<<<<<< HEAD
  // Group timesheets by employee for display and exports
  const groupedEmployees = useMemo(() => {
    const map = new Map();
    timesheets.forEach((s) => {
      if (!map.has(s.employee_id)) {
        map.set(s.employee_id, {
          employee_id: s.employee_id,
          name: s.employee_name,
          surname: s.employee_surname,
          email: s.employee_email,
          tasks: [],
          total: 0,
        });
      }
      const g = map.get(s.employee_id);
      g.tasks.push({
        date: s.date,
        description: s.description,
        clock_in: s.clock_in,
        clock_out: s.clock_out,
        hours: s.hours_worked,
        status: s.status,
      });
      const hrs = parseFloat(s.hours_worked ?? 0);
      g.total += isNaN(hrs) ? 0 : hrs;
    });
    return Array.from(map.values());
  }, [timesheets]);

  // --- Download CSV (only approved timesheets) ---
  const downloadCSV = () => {
    // Group by employee for export
    const grouped = new Map();
    timesheets
      .filter((s) => s.status === "approved")
      .forEach((s) => {
        if (!grouped.has(s.employee_id)) {
          grouped.set(s.employee_id, {
            name: s.employee_name,
            surname: s.employee_surname,
            email: s.employee_email,
            tasks: [],
            total: 0,
          });
        }
        const g = grouped.get(s.employee_id);
        g.tasks.push(`${s.date}: ${s.description} (${s.clock_in}-${s.clock_out}, ${s.hours_worked}h)`);
        const hrs = parseFloat(s.hours_worked ?? 0);
        g.total += isNaN(hrs) ? 0 : hrs;
      });

    const csvRows = [];
    const headers = ["Name", "Surname", "Email", "Descriptions", "Total Hours"];
    csvRows.push(headers.join(","));

    Array.from(grouped.values()).forEach((g) => {
      const descriptions = g.tasks.join(" | ").replace(/\n/g, " ").replace(/,/g, " ");
      csvRows.push([g.name, g.surname, g.email, descriptions, g.total.toFixed(2)].join(","));
    });
=======
    // --- Download CSV (only approved timesheets) ---
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
>>>>>>> e2ec6e5bf4b88f866a39a8f595629f518855b675

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

<<<<<<< HEAD
  // --- Download PDF (only approved timesheets) ---
  const downloadPDF = () => {
    // Use the already grouped, currently displayed data
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Timesheets (Grouped by Employee)", 14, 16);
    const tableColumn = ["Name", "Surname", "Email", "Descriptions", "Total Hours"];
    const tableRows = groupedEmployees.map((g) => [
      g.name,
      g.surname,
      g.email,
      g.tasks
        .map((t) => `${t.date}: ${t.description} (${t.clock_in}-${t.clock_out}, ${t.hours}h, ${t.status})`)
        .join(" | "),
      g.total.toFixed(2),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { cellWidth: 'wrap', fontSize: 9 },
      columnStyles: { 3: { cellWidth: 180 } },
    });
    doc.save("timesheets_grouped.pdf");
  };

  return (
    <>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        {/* === TIMESHEETS SECTION === */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select value={filter} onChange={(e) => setFilter(e.target.value)} label="Status Filter">
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
=======
    // --- Download PDF (only approved timesheets) ---
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

                {/* === TIMESHEETS SECTION === */}
                <Paper sx={{ p: 2, mb: 4 }}>
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
>>>>>>> e2ec6e5bf4b88f866a39a8f595629f518855b675

                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: '#E53935', // ERD red shade
                                '&:hover': {
                                    backgroundColor: '#C62828', // darker shade on hover
                                },
                            }}
                            onClick={downloadCSV}
                        >
                            Download CSV
                        </Button>

                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: '#E53935',
                                '&:hover': {
                                    backgroundColor: '#C62828',
                                },
                            }}
                            onClick={downloadPDF}
                        >
                            Download PDF
                        </Button>

<<<<<<< HEAD
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Surname</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Total Hours</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedEmployees.map((g) => (
                  <TableRow key={g.employee_id}>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{g.surname}</TableCell>
                    <TableCell>{g.email}</TableCell>
                    <TableCell>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {g.tasks.map((t, idx) => (
                          <li key={idx}>
                            {t.date} — {t.description} | {t.clock_in} → {t.clock_out} | {t.hours}h ({t.status})
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>{g.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
=======
                    </Stack>
>>>>>>> e2ec6e5bf4b88f866a39a8f595629f518855b675

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

                {/* === APPROVED EMPLOYEES SECTION === */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Approved Employees
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>ID</strong></TableCell>
                                    <TableCell><strong>Name</strong></TableCell>
                                    <TableCell><strong>Surname</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>Role</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.map((emp) => (
                                    <TableRow key={emp.employee_id}>
                                        <TableCell>{emp.employee_id}</TableCell>
                                        <TableCell>{emp.name}</TableCell>
                                        <TableCell>{emp.surname}</TableCell>
                                        <TableCell>{emp.email}</TableCell>
                                        <TableCell>{emp.role}</TableCell>
                                        <TableCell>{emp.status}</TableCell>
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
