import React, { useEffect } from 'react'; // Importa useEffect
import Navbar from './components/navbar';
import { Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';

function Template({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Efecto para scroll al top cuando cambia el contenido
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Opcional: efecto suave de desplazamiento
    });
  }, [children]); // Se ejecuta cada vez que cambian los children

  return (
    <>
      <CssBaseline />
      
      <Navbar />
      
      <Box 
        component="main"
        sx={{
          marginTop: isMobile ? '3rem' : '4rem',
          padding: { xs: 0, md: 3 },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          boxSizing: 'border-box'
        }}
      >
        {children}
      </Box>
    </>
  );
}

export default Template;