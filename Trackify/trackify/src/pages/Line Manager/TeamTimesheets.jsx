import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from "@mui/material";

const API_BASE_URL = "http://localhost:8000"; // Backend base URL

const TeamTimesheets = () => {
  const [employees, setEmployees] = useState([]);

  // Fetch employees from manager's department
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
      console.error("Error fetching employees:", error);
      Swal.fire("Error", "Failed to fetch employees", "error");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle approval/rejection using backend
  const handleStatusChange = async (employeeId, newStatus) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to update status");
      }

      const updatedEmployee = await response.json();

      // Update frontend state
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.employee_id === updatedEmployee.employee_id ? updatedEmployee : emp
        )
      );

      Swal.fire("Success", `Status updated to ${newStatus}`, "success");
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire("Error", error.message, "error");
    }
  };

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
                <TableCell>{emp.role}</TableCell>
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
