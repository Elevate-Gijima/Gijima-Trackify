import React, { useState, useEffect } from "react";
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from "@mui/material";

const TeamTimesheets = () => {
  // Mock employee data (you can later replace this with API data)
  const [employees, setEmployees] = useState([
    { name: "Musa Mavasa", department: "IT", status: "Pending" },
    {  name: "Sarah Ndlovu", department: "Finance", status: "Pending" },
    { name: "John Dlamini", department: "HR", status: "Pending" },
  ]);

  // Function to handle approval or rejection
  const handleStatusChange = (id, newStatus) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? { ...emp, status: newStatus } : emp
      )
    );

    // 🧩 Later, here you can call your FastAPI endpoint, e.g.:
    // fetch(`http://127.0.0.1:8000/employees/${id}/status`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ status: newStatus }),
    // });
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
              <TableRow key={emp.id}>
                <TableCell>{emp.id}</TableCell>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.department}</TableCell>
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
                    {emp.status}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => handleStatusChange(emp.id, "Approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleStatusChange(emp.id, "Rejected")}
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
