import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, Chip } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const Navbar = () => {
  const role = localStorage.getItem("role") || "employee";
  const fullName = localStorage.getItem("name") || "Employee Name";
  const navigate = useNavigate();

  // Extract initials (e.g., "Mavasa Musa" -> "MM")
  const getInitials = (name) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(fullName);

  const menus = {
    employee: [
      { path: "/", label: "Dashboard" },
      { path: "/timesheets", label: "My Timesheets" },
    ],
    manager: [
      { path: "/", label: "Dashboard" },
      { path: "/team-timesheets", label: "Team Timesheets" },
      { path: "/reports", label: "Reports" },
    ],
    admin: [
      { path: "/", label: "Dashboard" },
      { path: "/users", label: "User Management" },
      { path: "/reports", label: "Reports" },
    ],
  };

  const navItems = menus[role] || menus.employee;

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "whitesmoke",
        boxShadow: 3,
        color: "navy",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left section: logo + nav links */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 30, color: "navy" }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", letterSpacing: 1, color: "navy" }}
            >
              Trackify
            </Typography>
          </Box>

          {/* Left-aligned nav links */}
          <Box sx={{ display: "flex", gap: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  color: "navy",
                  "&:hover": { backgroundColor: "rgba(0, 0, 128, 0.08)" },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Right section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* ✅ Add Employee button (only for Admins) */}
          {role === "admin" && (
            <Button
              variant="contained"
              color="primary"
              sx={{
                textTransform: "none",
                backgroundColor: "navy",
                "&:hover": { backgroundColor: "#001a66" },
              }}
              onClick={() => navigate("/add-employee")}
            >
              ➕ Add Employee
            </Button>
          )}

          <Chip
            label={initials}
            sx={{
              backgroundColor: "navy",
              color: "white",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "red",
              color: "white",
              "&:hover": { backgroundColor: "#b30000" },
            }}
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
