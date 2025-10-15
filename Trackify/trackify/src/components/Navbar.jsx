import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, Chip } from "@mui/material";
import { Link } from "react-router-dom";
import AccessTimeIcon from "@mui/icons-material/AccessTime"; // clock icon

const Navbar = () => {
  const role = localStorage.getItem("role") || "employee";

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
      { path: "/settings", label: "Settings" },
      { path: "/reports", label: "Reports" },
    ],
  };

  const navItems = menus[role] || menus.employee;

  return (
    <AppBar position="static" sx={{ backgroundColor: "#1976d2", boxShadow: 3 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left section: logo and app name */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <AccessTimeIcon sx={{ fontSize: 30, mr: 1 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: "bold", letterSpacing: 1 }}
          >
            Trackify
          </Typography>
        </Box>

        {/* Middle: navigation links */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              component={Link}
              to={item.path}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* Right section: role + logout */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            label={role.toUpperCase()}
            color="default"
            sx={{
              backgroundColor: "white",
              color: "#1976d2",
              fontWeight: "bold",
            }}
          />
          <Button
            variant="contained"
            color="secondary"
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
