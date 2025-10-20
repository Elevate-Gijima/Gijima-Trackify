import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Swal from 'sweetalert2';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';

const navy = '#001f3f';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error('Invalid credentials');

      const data = await response.json();

      // Save token, role, name in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);

      login(); // Update auth context

      Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        timer: 1500,
        showConfirmButton: false,
      });

      // Redirect based on role
      if (data.role === 'employee') navigate('/home');
      else if (data.role === 'manager') navigate('/manager');
      else if (data.role === 'admin') navigate('/admin');
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
        sx={{ padding: 4, width: 320, bgcolor: 'white', borderRadius: 2, textAlign: 'center' }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: navy, fontWeight: 'bold' }}>
          Welcome to Trackify
        </Typography>

        <Typography variant="h4" gutterBottom sx={{ color: navy }}>
          Login
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
