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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";

const AdminDashboard = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [filter, setFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showDepartmentEmployees, setShowDepartmentEmployees] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [employeeForm, setEmployeeForm] = useState({
    employee_id: "",
    name: "",
    surname: "",
    email: "",
    password: "",
    role: "employee",
    department_name: "",
  });

  // Expose the function globally so Navbar can access it
  useEffect(() => {
    window.openAddEmployeeDialog = () => setShowAddEmployee(true);
    return () => {
      delete window.openAddEmployeeDialog;
    };
  }, []);

  const API_BASE_URL = "http://127.0.0.1:8000";

  // --- Fetch Timesheets (admin enriched endpoint) ---
  const fetchTimesheets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/timesheets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch timesheets');
      const data = await response.json();
      setTimesheets(data);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    }
  };

  // Filter timesheets based on status and department
  const filteredTimesheets = useMemo(() => {
    let filtered = timesheets;
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.status === filter);
    }
    
    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(t => t.employee_department === departmentFilter);
    }
    
    return filtered;
  }, [timesheets, filter, departmentFilter]);

  // --- Fetch Departments ---
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch departments");
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // --- Fetch Department Employees ---
  const fetchDepartmentEmployees = async (departmentName) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/admin/departments/${encodeURIComponent(departmentName)}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch department employees");
      const data = await response.json();
      setDepartmentEmployees(data);
      setSelectedDepartment(departmentName);
      setShowDepartmentEmployees(true);
    } catch (error) {
      console.error("Error fetching department employees:", error);
      setSnackbar({ open: true, message: "Failed to fetch department employees", severity: "error" });
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [filter]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Group timesheets by employee for display and exports
  const groupedEmployees = useMemo(() => {
    const map = new Map();
    filteredTimesheets.forEach((s) => {
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
        hours: parseFloat(s.total_hours ?? 0),
        status: s.status,
      });
      const hrs = parseFloat(s.total_hours ?? 0);
      g.total += isNaN(hrs) ? 0 : hrs;
    });
    return Array.from(map.values());
  }, [filteredTimesheets]);

  // Group timesheets by week (Monday to Sunday)
  const groupedByWeek = useMemo(() => {
    const weekMap = new Map();
    
    filteredTimesheets.forEach((s) => {
      const date = typeof s.date === 'string' ? parseISO(s.date) : s.date;
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekStart,
          weekEnd,
          weekLabel: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
          employees: new Map(),
        });
      }
      
      const week = weekMap.get(weekKey);
      if (!week.employees.has(s.employee_id)) {
        week.employees.set(s.employee_id, {
          employee_id: s.employee_id,
          name: s.employee_name,
          surname: s.employee_surname,
          email: s.employee_email,
          department: s.employee_department || "N/A",
          tasks: [],
          total: 0,
        });
      }
      
      const emp = week.employees.get(s.employee_id);
      emp.tasks.push({
        date: s.date,
        description: s.description,
        clock_in: s.clock_in,
        clock_out: s.clock_out,
        hours: parseFloat(s.total_hours ?? 0),
        status: s.status,
      });
      const hrs = parseFloat(s.total_hours ?? 0);
      emp.total += isNaN(hrs) ? 0 : hrs;
    });
    
    // Sort weeks by date (newest first)
    return Array.from(weekMap.values())
      .sort((a, b) => b.weekStart - a.weekStart)
      .map(week => ({
        ...week,
        employees: Array.from(week.employees.values()),
      }));
  }, [filteredTimesheets]);

  // --- Download CSV (grouped by employee) ---
  const downloadCSV = () => {
    const csvRows = [];
    const headers = ["Name", "Surname", "Email", "Department", "Descriptions", "Total Hours"];
    csvRows.push(headers.join(","));

    // Flatten weeks to get all employees
    const allEmployees = new Map();
    groupedByWeek.forEach((week) => {
      week.employees.forEach((emp) => {
        if (!allEmployees.has(emp.employee_id)) {
          allEmployees.set(emp.employee_id, {
            name: emp.name,
            surname: emp.surname,
            email: emp.email,
            department: emp.department || "N/A",
            tasks: [],
            total: 0,
          });
        }
        const employee = allEmployees.get(emp.employee_id);
        emp.tasks.forEach(task => employee.tasks.push(task));
        employee.total += emp.total;
      });
    });

    Array.from(allEmployees.values()).forEach((g) => {
      const descriptions = g.tasks
        .map((t) => `${t.date}: ${t.description} (${t.clock_in}-${t.clock_out}, ${t.hours}h, ${t.status})`)
        .join(" | ")
        .replace(/\n/g, " ")
        .replace(/,/g, " ");
      csvRows.push([g.name, g.surname, g.email, g.department, descriptions, g.total.toFixed(2)].join(","));
    });

    // Generate filename with filters
    let filename = "timesheets";
    if (filter !== "all") {
      filename += `_${filter}`;
    }
    if (departmentFilter !== "all") {
      filename += `_${departmentFilter}`;
    }
    filename += ".csv";

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- Download PDF (grouped by week) ---
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    
    // Generate title with filter information
    let title = "Timesheets";
    if (departmentFilter !== "all") {
      title += ` - ${departmentFilter}`;
    }
    if (filter !== "all") {
      title += ` (${filter.charAt(0).toUpperCase() + filter.slice(1)})`;
    }
    
    let startY = 16;
    
    // Add main title
    doc.setFontSize(14);
    doc.text(title, 14, startY);
    startY = 24;
    
    const tableColumn = ["Name", "Surname", "Email", "Department", "Descriptions", "Total Hours"];
    let finalY = startY;
    
    // Process each week
    groupedByWeek.forEach((week, weekIndex) => {
      // Check if we need a new page (leave room for header and at least 2-3 rows)
      if (finalY > 170 && weekIndex > 0) {
        doc.addPage();
        finalY = 20;
      }
      
      // Add week header
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Week of ${week.weekLabel}`, 14, finalY);
      finalY += 8;
      
      // Create table for this week
      const tableRows = week.employees.map((emp) => [
        emp.name,
        emp.surname,
        emp.email,
        emp.department || "N/A",
        emp.tasks.map((t) => `• ${t.date}: ${t.description} (${t.clock_in}-${t.clock_out}, ${t.hours}h, ${t.status})`), // Array for multi-line
        emp.total.toFixed(2),
      ]);
      
      if (tableRows.length > 0) {
        // Calculate estimated table height
        const totalTasks = week.employees.reduce((sum, emp) => sum + emp.tasks.length, 0);
        const avgTasksPerRow = week.employees.length > 0 ? totalTasks / week.employees.length : 0;
        const estimatedRowHeight = Math.max(5, avgTasksPerRow * 2);
        const estimatedHeight = (tableRows.length * estimatedRowHeight) + 10;
        
        // Add table and track position
        const result = autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: finalY,
          styles: { 
            cellWidth: 'wrap', 
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
          },
          columnStyles: { 
            4: { cellWidth: 150, cellPadding: 3 },
            5: { halign: 'right' }
          },
          margin: { top: finalY },
        });
        
        // Get final Y position after table
        finalY = result ? result.finalY : finalY + estimatedHeight;
      }
      
      // Add spacing between weeks
      finalY += 10;
    });
    
    // Generate filename with filters
    let filename = "timesheets";
    if (filter !== "all") {
      filename += `_${filter}`;
    }
    if (departmentFilter !== "all") {
      filename += `_${departmentFilter}`;
    }
    filename += ".pdf";
    
    doc.save(filename);
  };

  // --- Handle Employee Form ---
  const handleEmployeeFormChange = (field, value) => {
    setEmployeeForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddEmployee = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/admin/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(employeeForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create employee");
      }

      setSnackbar({ open: true, message: "Employee created successfully!", severity: "success" });
      setShowAddEmployee(false);
      setEmployeeForm({
        employee_id: "",
        name: "",
        surname: "",
        email: "",
        password: "",
        role: "employee",
        department_name: "",
      });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        {/* === DEPARTMENT CARDS SECTION === */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Departments Overview
          </Typography>
          <Grid container spacing={2}>
            {departments.map((dept) => (
              <Grid item xs={12} sm={6} md={4} key={dept.department_id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    minHeight: 120,
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => fetchDepartmentEmployees(dept.name)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {dept.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Click to view employees
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

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

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Department Filter</InputLabel>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                label="Department Filter"
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.department_id} value={dept.name}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="contained" color="primary" onClick={downloadCSV}>
              Download CSV
            </Button>
            <Button variant="contained" color="secondary" onClick={downloadPDF}>
              Download PDF
            </Button>
          </Stack>

          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            {(() => {
              let title = filter === "all" ? "All Timesheets" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Timesheets`;
              if (departmentFilter !== "all") {
                title += ` - ${departmentFilter}`;
              }
              return title;
            })()}
          </Typography>

          {groupedByWeek.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No timesheets found
            </Typography>
          ) : (
            groupedByWeek.map((week, weekIdx) => (
              <Accordion key={weekIdx} defaultExpanded={weekIdx === 0} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Week of {week.weekLabel}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
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
                        {week.employees.map((g) => (
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
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Paper>

        {/* === ADD EMPLOYEE DIALOG === */}
        <Dialog open={showAddEmployee} onClose={() => setShowAddEmployee(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Employee ID"
                value={employeeForm.employee_id}
                onChange={(e) => handleEmployeeFormChange("employee_id", e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Name"
                value={employeeForm.name}
                onChange={(e) => handleEmployeeFormChange("name", e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Surname"
                value={employeeForm.surname}
                onChange={(e) => handleEmployeeFormChange("surname", e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Email"
                type="email"
                value={employeeForm.email}
                onChange={(e) => handleEmployeeFormChange("email", e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Password"
                type="password"
                value={employeeForm.password}
                onChange={(e) => handleEmployeeFormChange("password", e.target.value)}
                fullWidth
                required
              />
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={employeeForm.department_name}
                  onChange={(e) => handleEmployeeFormChange("department_name", e.target.value)}
                  label="Department"
                >
                  {departments
                    .filter((dept) => dept.name !== "HR")
                    .map((dept) => (
                      <MenuItem key={dept.department_id} value={dept.name}>
                        {dept.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddEmployee(false)}>Cancel</Button>
            <Button onClick={handleAddEmployee} variant="contained" color="primary">
              Add Employee
            </Button>
          </DialogActions>
        </Dialog>

        {/* === DEPARTMENT EMPLOYEES DIALOG === */}
        <Dialog 
          open={showDepartmentEmployees} 
          onClose={() => setShowDepartmentEmployees(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            Employees in {selectedDepartment} Department ({departmentEmployees.length} {departmentEmployees.length === 1 ? 'employee' : 'employees'})
          </DialogTitle>
          <DialogContent>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Employee ID</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Surname</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                        <Typography color="text.secondary">No employees found in this department.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    departmentEmployees.map((emp) => (
                      <TableRow key={emp.employee_id}>
                        <TableCell>{emp.employee_id}</TableCell>
                        <TableCell>{emp.name}</TableCell>
                        <TableCell>{emp.surname}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={emp.role} 
                            color={emp.role === 'admin' ? 'error' : emp.role === 'manager' ? 'warning' : 'success'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDepartmentEmployees(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default AdminDashboard;