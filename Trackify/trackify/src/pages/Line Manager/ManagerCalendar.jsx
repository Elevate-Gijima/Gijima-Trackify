import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, Card, CardContent, IconButton, Menu, MenuItem, ListItemIcon, Chip } from "@mui/material";
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { MoreVert, CheckCircle, Cancel } from "@mui/icons-material";

const API_BASE_URL = "http://127.0.0.1:8000";

const ManagerCalendar = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const timesheetsResp = await fetch(`${API_BASE_URL}/timesheets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (timesheetsResp.ok) {
          const timesheetsData = await timesheetsResp.json();
          console.log("Timesheets data:", timesheetsData);
          setTimesheets(timesheetsData);
        }

        const employeesResp = await fetch(`${API_BASE_URL}/manager/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (employeesResp.ok) {
          const employeesData = await employeesResp.json();
          console.log("Employees data:", employeesData);
          setEmployees(employeesData);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  const dateStr = (date) => date?.toISOString().split('T')[0];
  const dayTasks = selectedDate
    ? timesheets.filter(ts => ts.date === dateStr(selectedDate))
    : [];

  const getEmp = (id) => employees.find(emp => emp.employee_id === id);
  
  const getEmployeeDetails = (employeeId) => {
    // Convert both to strings for comparison to handle type mismatches
    console.log("Looking for employee ID:", employeeId, "Type:", typeof employeeId);
    console.log("Available employees:", employees.map(emp => ({ id: emp.employee_id, type: typeof emp.employee_id, name: emp.name })));
    
    const employee = employees.find(emp => 
      String(emp.employee_id) === String(employeeId)
    );
    
    console.log("Found employee:", employee);
    
    return employee ? {
      name: `${employee.name} ${employee.surname}`,
      email: employee.email
    } : {
      name: `Employee ${employeeId}`,
      email: 'Email not available'
    };
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
      const timesheetsResp = await fetch(`${API_BASE_URL}/timesheets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (timesheetsResp.ok) {
        const timesheetsData = await timesheetsResp.json();
        setTimesheets(timesheetsData);
      }
      
      handleMenuClose();
      alert(`Timesheet ${status} successfully!`);
    } catch (error) {
      console.error('Error updating timesheet status:', error);
      alert('Failed to update timesheet status');
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, width: '100%', p: 4 }}>
      {/* Calendar */}
      <Paper sx={{ flex: 1, minWidth: 260, maxWidth: 350, p: 2 }} elevation={4}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "navy" }}>
          Team Calendar
        </Typography>
        <DateCalendar
          value={selectedDate}
          onChange={setSelectedDate}
          sx={{ width: '100%', minWidth: 260 }}
        />
      </Paper>

      {/* Task Summary */}
      <Box sx={{ flex: 2 }}>
        {selectedDate ? (
          <Card sx={{ p: 2 }} elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#0d3e63" }}>
                Tasks for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
              {dayTasks.length === 0 ? (
                <Typography color="text.secondary">No tasks/timesheets for this day.</Typography>
              ) : (
                <List>
                  {dayTasks.map((ts, idx) => {
                    const employeeDetails = getEmployeeDetails(ts.employee_id);
                    return (
                      <React.Fragment key={ts.timesheet_id}>
                        <ListItem>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                            <Box sx={{ flex: 1 }}>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {employeeDetails.name}
                                    <span style={{ color: '#888', fontWeight: 'normal' }}>
                                      ({employeeDetails.email})
                                    </span>
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ mt: 0.5 }}>
                                    <Typography variant="body2"><b>Time:</b> {ts.clock_in} - {ts.clock_out}</Typography>
                                    <Typography variant="body2"><b>Total Hours:</b> {ts.total_hours}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                      <Typography variant="body2"><b>Status:</b></Typography>
                                      <Chip 
                                        label={ts.status} 
                                        color={ts.status === 'pending' ? 'warning' : ts.status === 'approved' ? 'success' : 'error'}
                                        size="small"
                                      />
                                    </Box>
                                    {ts.description && (
                                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        <b>Description:</b> {ts.description}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                            </Box>
                            {ts.status === 'pending' && (
                              <IconButton
                                onClick={(e) => handleMenuOpen(e, ts)}
                                size="small"
                                sx={{ ml: 1 }}
                              >
                                <MoreVert />
                              </IconButton>
                            )}
                          </Box>
                        </ListItem>
                        {idx < dayTasks.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ p: 2, bgcolor: "#f5f7fa" }} elevation={0}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#aaa', fontWeight: 400 }}>
                Click a day to view tasks.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
      
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

export default ManagerCalendar;
