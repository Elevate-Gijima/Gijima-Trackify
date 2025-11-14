{/* import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Box, TextField, Button, Typography, Paper, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const navy = '#001f3f';
const API_BASE_URL = "http://127.0.0.1:8000";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to send reset email');
      }

      const data = await response.json();

      Swal.fire({
        icon: 'success',
        title: 'Email Sent!',
        text: data.message || 'If an account with that email exists, a password reset link has been sent.',
        confirmButtonText: 'OK'
      }).then(() => {
        navigate('/login');
      });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
      });
    } finally {
      setLoading(false);
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
          width: { xs: '100%', sm: 450 }, 
          bgcolor: 'white', 
          borderRadius: 2,
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Link 
              to="/login" 
              style={{ 
                textDecoration: 'none', 
                color: navy, 
                display: 'flex', 
                alignItems: 'center',
                gap: 8,
                marginBottom: 16
              }}
            >
              <ArrowBackIcon />
              <Typography variant="body2">Back to Login</Typography>
            </Link>
            <Typography variant="h4" gutterBottom sx={{ color: navy, fontWeight: 'bold' }}>
              Forgot Password
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              sx={{ mt: 3, bgcolor: navy, '&:hover': { bgcolor: '#003366' } }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: navy, textDecoration: 'none', fontWeight: 'bold' }}>
              Login
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
*/}
