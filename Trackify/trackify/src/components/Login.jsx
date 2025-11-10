import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Swal from 'sweetalert2';
import { Box, TextField, Button, Typography, Paper, Stack } from '@mui/material';
import AnalogClock from './DigitalClock';

const navy = '#001f3f';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Login failed');
      }

      const data = await response.json();

      // Save token and user details in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('name', data.name);
      localStorage.setItem('surname', data.surname);
      localStorage.setItem('email', data.email);
      localStorage.setItem('role', data.role);

      login(); // Update auth context

      Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        timer: 1500,
        showConfirmButton: false,
      });

      // Normalize role for comparison
      const normalizedRole = data.role?.replace('RoleEnum.', '') || data.role;
      
      // Redirect based on role
      if (normalizedRole === 'employee') navigate('/home');
      else if (normalizedRole === 'manager') navigate('/manager');
      else if (normalizedRole === 'admin' || normalizedRole === 'administrator') navigate('/admin');
      else navigate('/home');

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message,
      });
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: navy,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
      }}
    >
      <Paper 
        elevation={6} 
        sx={{ 
          padding: 4, 
          width: { xs: '100%', md: 800 }, 
          bgcolor: 'white', 
          borderRadius: 2, 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: 4,
          minHeight: 500,
        }}
      >
        {/* Login Form */}
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom sx={{ color: navy, fontWeight: 'bold' }}>
            Welcome to Trackify
          </Typography>

          <Typography variant="h4" gutterBottom sx={{ color: navy }}>
            Login
          </Typography>

          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, bgcolor: navy }}>
              Login
            </Button>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link 
                to="/forgot-password" 
                style={{ 
                  color: navy, 
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                Forgot Password?
              </Link>
            </Box>

          </form>
        </Box>

        {/* Analog Clock */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <AnalogClock />
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
