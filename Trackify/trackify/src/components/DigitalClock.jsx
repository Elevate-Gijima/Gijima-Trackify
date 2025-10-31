import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const AnalogClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Calculate angles for clock hands
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = (minutes / 60) * 360 + (seconds / 60) * 6;
  const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 400,
      }}
    >
      {/* TRACKIFY Text */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #ff0000, #0000ff)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3,
          textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { opacity: 0.8 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.8 },
          },
        }}
      >
        TRACKIFY
      </Typography>

      {/* Analog Clock */}
      <Box
        sx={{
          position: 'relative',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          border: '6px solid #333',
          boxShadow: '0 0 40px rgba(255, 0, 0, 0.3), 0 0 40px rgba(0, 0, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Hour Markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = 50 + 40 * Math.cos(angle);
          const y = 50 + 40 * Math.sin(angle);
          return (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                width: 8,
                height: 8,
                backgroundColor: '#ccc',
                borderRadius: '50%',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}

        {/* Center Dot */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 16,
            height: 16,
            backgroundColor: '#ff0000',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
            boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)',
          }}
        />

        {/* Hour Hand */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transformOrigin: 'bottom',
            transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
            transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 70,
              backgroundColor: '#ff0000',
              borderRadius: '3px',
              boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)',
            }}
          />
        </Box>

        {/* Minute Hand */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transformOrigin: 'bottom',
            transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
            transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 100,
              backgroundColor: '#0000ff',
              borderRadius: '2px',
              boxShadow: '0 0 15px rgba(0, 0, 255, 0.5)',
            }}
          />
        </Box>

        {/* Second Hand */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transformOrigin: 'bottom',
            transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          }}
        >
          <Box
            sx={{
              width: 2,
              height: 110,
              backgroundColor: '#ff6666',
              borderRadius: '1px',
            }}
          />
        </Box>
      </Box>

      {/* Time Display */}
      <Typography
        variant="h6"
        sx={{
          color: '#ccc',
          fontSize: '1rem',
          fontWeight: 'medium',
          mt: 2,
        }}
      >
        {time.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}
      </Typography>

      {/* Date Display */}
      <Typography
        variant="body2"
        sx={{
          color: '#999',
          fontSize: '0.8rem',
          fontWeight: 'medium',
          mt: 1,
        }}
      >
        {time.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </Typography>
    </Box>
  );
};

export default AnalogClock;
