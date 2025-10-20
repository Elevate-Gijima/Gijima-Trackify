import React, { useState, useEffect } from "react";
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from "@mui/material";

const TeamTimesheets = () => {
  const [employees, setEmployees] = useState([]);

  // Fetch employees from backend
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:8000/employees/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle approval/rejection
  const handleStatusChange = async (employeeId, newStatus) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://127.0.0.1:8000/employees/${employeeId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const updatedEmployee = await response.json();
      setEmployees((prev) =>
        prev.map((emp) => (emp.employee_id === updatedEmployee.employee_id ? updatedEmployee : emp))
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Employee Approval Dashboard
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.employee_id}>
                <TableCell>{emp.employee_id}</TableCell>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.department_name}</TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      color:
                        emp.status === "Approved"
                          ? "green"
                          : emp.status === "Rejected"
                          ? "red"
                          : "orange",
                      fontWeight: 500,
                    }}
                  >
                    {emp.status || "Pending"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => handleStatusChange(emp.employee_id, "Approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleStatusChange(emp.employee_id, "Rejected")}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TeamTimesheets;
