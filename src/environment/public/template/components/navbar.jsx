import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Button,
  styled,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { supabase } from '../../../../services/supabase.config';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../../redux/states/user';
import Crab from '../../../../assets/img/fav4.png'
import { useSelector } from "react-redux"

const themeConfig = {
  colors: {
    primary: '#1e0c1b',
    textPrimary: 'white',
    hover: 'rgba(4, 2, 2, 0.1)',
    underline: '#ffffff',
    hoverText: '#e0e0e0'
  },
  scrollBehavior: {
    enableTransparency: false,
    scrolledColor: 'transparent'
  },
  spacing: {
    desktop: 3,
    mobile: 1.5
  },
  typography: {
    titleSize: {
      desktop: '1rem',
      mobile: '1.1rem'
    }
  },
  transitions: {
    default: 'all 0.3s ease'
  }
};

const Navbar = () => {
  const dispatch=useDispatch();
  const userState=useSelector((store)=>store.user);
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [CampeonatoActual, setCampeonatoActual] = useState([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const query = async () => {
    try {
      const { data: data, error } = await supabase
        .from('CAMPEONATOS')
        .select('*')
        .eq('principal', 1);

      if (error) { 
        console.error('❌ Error en la consulta:', error);
        return;
      }
      console.log(data)
      dispatch(updateUser({campeonato:data[0].id}))
      setCampeonatoActual(data);
    } catch (error) {
      console.error('🔥 Error inesperado:', error);
    }
  };

  useEffect(() => {
    query();
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getNavbarColor = () => {
    if (!themeConfig.scrollBehavior.enableTransparency) {
      return themeConfig.colors.primary;
    }
    return isScrolled ? themeConfig.scrollBehavior.scrolledColor : themeConfig.colors.primary;
  };

  // Funciones de navegación
  const handleHome = () => {
    dispatch(updateUser({seccion:0}))
    navigate('/home')
  };
  const handleGearClick = () => alert('Configuración del campeonato');
  const handleLigas = () => {
    dispatch(updateUser({seccion:1}))
    navigate('/torneo')

  };
  const handleEquipos = () => {
    dispatch(updateUser({seccion:2}))
    navigate('/equipo')

  };
  const handlePosiciones = () => {};
  const handleCalendario = () => {
    dispatch(updateUser({seccion:3}))
    navigate('/calendario')
  };

  // Funciones del drawer
  const openMenu = () => setOpenDrawer(true);
  const closeMenu = () => setOpenDrawer(false);

  // Estilos comunes
  const MenuButton = styled(Button)(({ theme }) => ({
    color: themeConfig.colors.textPrimary,
    textTransform: 'none',
    borderRadius: '20px',
    padding: '6px 12px',
    margin: '0 8px 0 0',
    transition: themeConfig.transitions.default,
    '&:hover': {
      backgroundColor: '#ef4136',
      color: themeConfig.colors.primary
    }
  }));

  const HoverContainer = styled(Button)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: themeConfig.transitions.default,
    minWidth: 'auto',
    maxHeight:'80px',
    padding: theme.spacing(isMobile ? themeConfig.spacing.mobile : themeConfig.spacing.desktop),
    // '&:hover': {
    //   backgroundColor: themeConfig.colors.hover,
    //   '& .title-text': {
    //     color: themeConfig.colors.hoverText,
    //   }
    // }
  }));

  function obtenerUltimoSegmentoUrl() {
    const url = window.location.href;
    const segmentos = url.split('/').filter(segmento => segmento !== '');
    const urlSeccion=segmentos.length > 0 ? segmentos.pop() : '';
    console.log(urlSeccion)
    switch (urlSeccion) {
      case 'home':
        dispatch(updateUser({seccion:0}))
      break;
    
      case 'torneo':
        dispatch(updateUser({seccion:1}))
      break;

      case 'equipo':
        dispatch(updateUser({seccion:2}))
      break;

      case 'iequipo':
        dispatch(updateUser({seccion:2}))
      break;

      case 'calendario':
        dispatch(updateUser({seccion:3}))
      break;
    }
  }

  const pintarSeccion=()=>{
    const caseVal=userState.seccion
    console.log(caseVal)
    switch (caseVal) {
      case 0:
        // alert('home')
      break;
    
      case 1:
        
      break;

      case 2:
        
      break;
    }
  }

  useEffect(() => {    
    obtenerUltimoSegmentoUrl()
    
  }, [userState.seccion])
  

  return (
    <>
      <AppBar 
        position="fixed"
        sx={{
          backgroundColor: getNavbarColor(),
          boxShadow: 'none',
          transition: 'background-color 0.3s ease',
          zIndex: 999
        }}
      >
        <Toolbar 
          sx={{
            maxHeight: isMobile ? 48 : 56,
            paddingX: theme.spacing(isMobile ? 1 : 3),
            justifyContent: 'space-between'
          }}
        >
          {/* Sección izquierda */}
          <div style={{ flex: 2,
             display: 'flex',
              justifyContent: 'center' ,
              // backgroundColor:'red'
              }}>
            <HoverContainer onClick={handleHome}>
              {/* <Typography 
                variant="h6" 
                component="div"
                sx={{
                  color: themeConfig.colors.textPrimary,
                  fontSize: themeConfig.typography.titleSize[isMobile ? 'mobile' : 'desktop'],
                  lineHeight: 1
                }}
              >
                POWER-UP
              </Typography> */}
              <img src={Crab} alt="" style={{height:'100px'}}/>
            </HoverContainer>
          </div>

          {/* Sección central (solo desktop) */}
          {!isMobile && (
            <div style={{ 
              flex: 4,
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              paddingLeft: '40px',
              gap: '15px',
              // backgroundColor:'green'
            }}>
              {
                userState.seccion!=undefined?
                <>
                  <MenuButton style={{backgroundColor:userState.seccion===0?'#ef4136':''}} onClick={handleHome}>Inicio</MenuButton>
                  <MenuButton style={{backgroundColor:userState.seccion===1?'#ef4136':''}} onClick={handleLigas}>Torneos</MenuButton>
                  <MenuButton style={{backgroundColor:userState.seccion===2?'#ef4136':''}} onClick={handleEquipos}>Equipos</MenuButton>
                  <MenuButton style={{backgroundColor:userState.seccion===3?'#ef4136':''}} onClick={handleCalendario}>Calendario</MenuButton>
                </>:''
              }
            </div>
          )}

          {/* Sección derecha */}
          <div style={{ 
            flex: 2,
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={openMenu}
                sx={{ color: themeConfig.colors.textPrimary }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <IconButton 
              edge="end"
              onClick={handleGearClick}
              sx={{
                color: themeConfig.colors.textPrimary,
                padding: theme.spacing(isMobile ? themeConfig.spacing.mobile : themeConfig.spacing.desktop),
                '&:hover': {
                  backgroundColor: themeConfig.colors.hover
                }
              }}
            >
              <SettingsIcon 
                sx={{ 
                  fontSize: themeConfig.typography.titleSize[isMobile ? 'mobile' : 'desktop']
                }}
              />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>

      {/* Drawer para móviles */}
      <Drawer
        anchor="left"
        open={openDrawer}
        onClose={closeMenu}
        sx={{
          '& .MuiDrawer-paper': {
            backgroundColor: themeConfig.colors.primary,
            width: '250px',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography 
            variant="h6" 
            onClick={() => {
              handleHome();
              closeMenu();
            }}
            sx={{
              color: themeConfig.colors.textPrimary,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              pb: 2,
              textAlign: 'center',
              '&:hover': {
                color: themeConfig.colors.hoverText
              }
            }}
          >
            POWER-UP
          </Typography>
          <Divider sx={{ borderColor: 'white', mb: 2 }} />

          <List sx={{ py: 1 }}>
            {[
              { text: 'Torneos', icon: <EmojiEventsIcon />, handler: handleLigas },
              { text: 'Equipos', icon: <GroupsIcon />, handler: handleEquipos },
              { text: 'Posiciones', icon: <LeaderboardIcon />, handler: handlePosiciones },
              { text: 'Calendario', icon: <CalendarMonthIcon />, handler: handleCalendario }
            ].map((item, index) => (
              <React.Fragment key={item.text}>
                <ListItem 
                  button 
                  onClick={() => {
                    item.handler();
                    closeMenu();
                  }}
                  sx={{
                    borderRadius: '8px',
                    mx: 1,
                    my: 0.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    '&:active': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    width: '100%',
                    color: 'white'
                  }}>
                    {item.icon}
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        sx: {
                          fontSize: '1rem',
                          fontWeight: 500
                        }
                      }}
                    />
                  </Box>
                </ListItem>
                
                {index < 3 && (
                  <Divider 
                    sx={{ 
                      borderColor: 'rgba(255, 255, 255, 0.3)', 
                      my: 1,
                      mx: 2 
                    }} 
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;