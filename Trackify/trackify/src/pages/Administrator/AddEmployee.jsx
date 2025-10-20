import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  MenuItem,
  Paper,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    role: "",
  });

  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseAlert = () => setAlert({ ...alert, open: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.post("http://127.0.0.1:8000/employees/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAlert({
        open: true,
        message: "Employee added successfully!",
        severity: "success",
      });

      // Clear form
      setFormData({
        name: "",
        surname: "",
        email: "",
        password: "",
        role: "",
      });
    } catch (error) {
      setAlert({
        open: true,
        message:
          error.response?.data?.detail ||
          "Failed to add employee. Please try again.",
        severity: "error",
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "90vh",
        backgroundColor: "#f5f7fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 500,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{ mb: 3, textAlign: "center", fontWeight: "bold", color: "navy" }}
        >
          Add New Employee
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Surname"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              label="Role"
              name="role"
              select
              value={formData.role}
              onChange={handleChange}
              required
              fullWidth
            >
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            <Button
              variant="contained"
              type="submit"
              fullWidth
              sx={{
                mt: 2,
                textTransform: "none",
                backgroundColor: "navy",
                "&:hover": { backgroundColor: "#001a66" },
              }}
            >
              Add Employee
            </Button>
          </Stack>
        </form>
      </Paper>

      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={alert.severity}
          onClose={handleCloseAlert}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddEmployee;
