import React, { useState } from "react";
import { Box, Paper, Typography, Stack, IconButton } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TimesheetForm from "./TimesheetForm";

const LandingPage = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "80vh",
        backgroundColor: "whitesmoke",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 4,
        flexDirection: "column",
      }}
    >
      {!showForm && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={6}
          alignItems="center"
          justifyContent="center"
        >
          {/* Add Task */}
          <Paper
            elevation={3}
            sx={{
              width: 150,
              height: 150,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "transform 0.2s, background-color 0.2s",
              "&:hover": { backgroundColor: "#f0f0f0", transform: "scale(1.05)" },
            }}
            onClick={() => setShowForm(true)}
          >
            <Box
              sx={{
                mb: 1,
                width: 50,
                height: 50,
                borderRadius: "50%",
                backgroundColor: "navy",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
              }}
            >
              <AddCircleOutlineIcon fontSize="large" />
            </Box>
            <Typography variant="body1" sx={{ fontWeight: "bold", color: "navy" }}>
              Add Task
            </Typography>
          </Paper>

          {/* View Previous Tasks */}
          <Paper
            elevation={3}
            sx={{
              width: 150,
              height: 150,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "transform 0.2s, background-color 0.2s",
              "&:hover": { backgroundColor: "#f0f0f0", transform: "scale(1.05)" },
            }}
            onClick={() => setShowForm(false)}
          >
            <Box
              sx={{
                mb: 1,
                width: 50,
                height: 50,
                borderRadius: "50%",
                backgroundColor: "navy",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
              }}
            >
              <VisibilityIcon fontSize="large" />
            </Box>
            <Typography variant="body1" sx={{ fontWeight: "bold", color: "navy" }}>
              View Tasks
            </Typography>
          </Paper>
        </Stack>
      )}

      {/* Show Timesheet Form */}
      {showForm && (
        <TimesheetForm
          onBack={() => setShowForm(false)} // Back button hides the form
        />
      )}
    </Box>
  );
};

export default LandingPage;
