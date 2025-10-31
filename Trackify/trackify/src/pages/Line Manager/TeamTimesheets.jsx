import React, { useState, useEffect } from "react";
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Stack, 
  Card, 
  CardContent,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import { MoreVert, CheckCircle, Cancel } from "@mui/icons-material";

const API_BASE_URL = "http://127.0.0.1:8000";

const TeamTimesheets = () => {
  const [employees, setEmployees] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/manager/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  // Fetch timesheets
  const fetchTimesheets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/timesheets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch timesheets");
      const data = await response.json();
      setTimesheets(data);
    } catch (error) {
      console.error("Failed to fetch timesheets:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTimesheets();
  }, []);

  // Calculate statistics
  const totalEmployees = employees.length;
  const pendingTasks = timesheets.filter(ts => ts.status === "pending").length;
  const completedTasks = timesheets.filter(ts => ts.status === "approved").length;
  const rejectedTasks = timesheets.filter(ts => ts.status === "rejected").length;

  // Get recent pending tasks (top 10)
  const recentPendingTasks = timesheets
    .filter(ts => ts.status === "pending")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  // Get employee details by ID
  const getEmployeeDetails = (employeeId) => {
    // Convert both to strings for comparison to handle type mismatches
    const employee = employees.find(emp => 
      String(emp.employee_id) === String(employeeId)
    );
    return employee ? {
      name: `${employee.name} ${employee.surname}`,
      email: employee.email
    } : {
      name: `Employee ${employeeId}`,
      email: 'Email not available'
    };
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle menu operations
  const handleMenuOpen = (event, timesheet) => {
    setAnchorEl(event.currentTarget);
    setSelectedTimesheet(timesheet);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTimesheet(null);
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedTimesheet) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/manager/employees/${selectedTimesheet.employee_id}/timesheets/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update timesheet status');
      }

      // Refresh timesheets data
      await fetchTimesheets();
      handleMenuClose();
      
      // Show success message
      alert(`Timesheet ${status} successfully!`);
    } catch (error) {
      console.error('Error updating timesheet status:', error);
      alert('Failed to update timesheet status');
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: "whitesmoke", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "navy", mb: 4 }}>
        Manager Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1, background: "linear-gradient(45deg, #001f3f 20%, #0074D9 90%)", color: "white" }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6">Total Employees</Typography>
            <Typography variant="h3" sx={{ fontWeight: "bold" }}>{totalEmployees}</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, background: "linear-gradient(45deg, #FFF700 10%, #FFD700 90%)", color: "navy" }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6">Pending Tasks</Typography>
            <Typography variant="h3" sx={{ fontWeight: "bold" }}>{pendingTasks}</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, background: "linear-gradient(45deg, #2ECC40 10%, #01FF70 90%)", color: "#022" }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6">Completed Tasks</Typography>
            <Typography variant="h3" sx={{ fontWeight: "bold" }}>{completedTasks}</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, background: "linear-gradient(45deg, #FF4136 10%, #FF6B6B 90%)", color: "white" }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6">Rejected Tasks</Typography>
            <Typography variant="h3" sx={{ fontWeight: "bold" }}>{rejectedTasks}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* My Team Table */}
      <Paper elevation={4} sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", color: "navy" }}>
          My Team
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Surname</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((emp) => (
                <TableRow key={emp.employee_id}>
                  <TableCell>{emp.employee_id}</TableCell>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.surname}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.department_name}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={employees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Recent Tasks Section */}
      <Paper elevation={4}>
        <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", color: "navy" }}>
          Recent Pending Tasks (Top 10)
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Employee</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Clock In</strong></TableCell>
                <TableCell><strong>Clock Out</strong></TableCell>
                <TableCell><strong>Total Hours</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentPendingTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: "center", py: 4 }}>
                    <Typography color="text.secondary">No pending tasks found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentPendingTasks.map((task) => {
                  const employeeDetails = getEmployeeDetails(task.employee_id);
                  return (
                    <TableRow key={task.timesheet_id}>
                      <TableCell>{employeeDetails.name}</TableCell>
                      <TableCell>{employeeDetails.email}</TableCell>
                      <TableCell>{task.date}</TableCell>
                      <TableCell>{task.clock_in}</TableCell>
                      <TableCell>{task.clock_out}</TableCell>
                      <TableCell>{task.total_hours}</TableCell>
                      <TableCell>{task.description || "N/A"}</TableCell>
                      <TableCell>
                        <Chip 
                          label={task.status} 
                          color="warning" 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, task)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Menu for Actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleStatusUpdate('approved')}>
          <ListItemIcon>
            <CheckCircle color="success" />
          </ListItemIcon>
          <ListItemText>Approve</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate('rejected')}>
          <ListItemIcon>
            <Cancel color="error" />
          </ListItemIcon>
          <ListItemText>Reject</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TeamTimesheets;
