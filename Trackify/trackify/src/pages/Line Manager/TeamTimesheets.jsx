import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Modal } from "@mui/material";

const API_BASE_URL = "http://localhost:8000"; // Backend base URL

const TeamTimesheets = () => {
  const [employees, setEmployees] = useState([]);
  const [allTimesheets, setAllTimesheets] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeTimesheets, setEmployeeTimesheets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      Swal.fire("Error", "Failed to fetch employees", "error");
    }
  };
  // Fetch all timesheets
  const fetchAllTimesheets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/manager/timesheets?status=pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch timesheets");
      const data = await response.json();
      setAllTimesheets(data);
    } catch (error) {
      Swal.fire("Error", "Failed to fetch timesheets", "error");
    }
  };

  const fetchEmployeeTimesheets = async (employeeId) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/manager/timesheets?status=pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch timesheets");
      const deptTimesheets = await response.json();
      const filtered = deptTimesheets.filter(ts => ts.employee_id === employeeId && ts.status === 'pending');
      setEmployeeTimesheets(filtered);
    } catch (error) {
      Swal.fire("Error", "Failed to fetch timesheets", "error");
    }
  };

  const updateTimesheetStatus = async (timesheetId, status) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/timesheets/${timesheetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to update timesheet status");
      }
      return await response.json();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  // Bulk update function for employee
  const updateAllEmployeeTimesheetsStatus = async (employeeId, status) => {
    const employeeTs = allTimesheets.filter(ts => ts.employee_id === employeeId);
    let success = 0, fail = 0;
    for (const ts of employeeTs) {
      try {
        await updateTimesheetStatus(ts.timesheet_id, status);
        success++;
      } catch {
        fail++;
      }
    }
    Swal.fire("Done", `Updated ${success} timesheet(s).`, fail ? "warning" : "success");
    // Immediately remove this employee's timesheets from local state so the row disappears
    setAllTimesheets(prev => prev.filter(ts => ts.employee_id !== employeeId));
    // If the modal is open for this employee, clear and close it
    if (selectedEmployee && selectedEmployee.employee_id === employeeId) {
      setEmployeeTimesheets([]);
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAllTimesheets();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        My Team
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Tasks Descriptions</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {employees
              .filter(emp => allTimesheets.some(ts => ts.employee_id === emp.employee_id && ts.status === 'pending'))
              .map((emp) => {
                const empTimesheets = allTimesheets.filter(ts => ts.employee_id === emp.employee_id && ts.status === 'pending');
                return (
                  <TableRow key={emp.employee_id}>
                    <TableCell>{emp.employee_id}</TableCell>
                    <TableCell style={{cursor:'pointer', color:'#2A57A6', textDecoration:'underline'}}
                      onClick={async () => {
                        setSelectedEmployee(emp);
                        await fetchEmployeeTimesheets(emp.employee_id);
                        setIsModalOpen(true);
                      }}>{emp.name}</TableCell>
                    <TableCell>{emp.department_name}</TableCell>
                    <TableCell>{emp.role}</TableCell>
                    <TableCell>
                      <ul style={{margin:0, paddingLeft:16}}>
                        {empTimesheets.map((ts) => (
                          <li key={ts.timesheet_id}>{ts.description}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="contained" color="success" size="small" sx={{mr:1, ...(empTimesheets.length > 0 && empTimesheets.every(ts => ts.status === 'approved') ? { backgroundColor: '#9e9e9e' } : {})}}
                        onClick={async ()=>await updateAllEmployeeTimesheetsStatus(emp.employee_id, "approved")}
                        disabled={empTimesheets.length === 0}
                      >Approve</Button>
                      <Button 
                        variant="contained" color="error" size="small"
                        onClick={async ()=>await updateAllEmployeeTimesheetsStatus(emp.employee_id, "rejected")}
                        disabled={empTimesheets.length === 0}
                      >Reject</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box sx={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%, -50%)',width:700,bgcolor:'background.paper',borderRadius:2,boxShadow:24,p:4}}>
          <Typography variant="h6" sx={{mb:2}}>Timesheets for {selectedEmployee?.name}</Typography>
          {employeeTimesheets.length === 0 ? (
            <Typography>No timesheets found.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{mb:2}}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Total Hours</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeTimesheets.map(ts => (
                    <TableRow key={ts.timesheet_id}>
                      <TableCell>{ts.date}</TableCell>
                      <TableCell>{ts.description}</TableCell>
                      <TableCell>{ts.clock_in}</TableCell>
                      <TableCell>{ts.clock_out}</TableCell>
                      <TableCell>{ts.total_hours}</TableCell>
                      <TableCell>
                        <Typography sx={{ color: ts.status === 'approved' ? '#9e9e9e' : (ts.status === 'rejected' ? 'red' : 'orange'), fontWeight: 500 }}>
                          {ts.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          sx={{ mr: 1, ...(ts.status === 'approved' ? { backgroundColor: '#9e9e9e' } : {}) }}
                          onClick={async () => {
                            const updated = await updateTimesheetStatus(ts.timesheet_id, "approved");
                            if (updated) {
                              setEmployeeTimesheets(prev => prev.filter(t => t.timesheet_id !== ts.timesheet_id));
                              setAllTimesheets(prev => prev.filter(t => t.timesheet_id !== ts.timesheet_id));
                            }
                          }}
                          disabled={ts.status === 'approved'}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={async () => {
                            const updated = await updateTimesheetStatus(ts.timesheet_id, "rejected");
                            if (updated) {
                              setEmployeeTimesheets(prev => prev.filter(t => t.timesheet_id !== ts.timesheet_id));
                              setAllTimesheets(prev => prev.filter(t => t.timesheet_id !== ts.timesheet_id));
                            }
                          }}
                          disabled={ts.status === 'rejected'}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Button variant="contained" color="primary" onClick={() => setIsModalOpen(false)}>Close</Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default TeamTimesheets;
