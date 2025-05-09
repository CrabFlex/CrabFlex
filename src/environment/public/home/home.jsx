import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { styled } from '@mui/system';
import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase.config';
import LoadingSkeleton from '../../../components/Loading/LoadingSqueleton';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../redux/states/user';
import { useNavigate } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  borderRadius: '10px',
  padding: theme.spacing(3),
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
  minHeight: '300px'
}));

const groupPartidosByDate = (partidos) => {
  return partidos.reduce((acc, partido) => {
    const fecha = partido.fecha_local.split(' - ')[0];
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(partido);
    return acc;
  }, {});
};

function Home({idCampeonato}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [ProximosPartidoData, setProximosPartidoData] = useState([]);
  const [TablaDePosiciones, setTablaDePosiciones] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [loadingPartidos, setLoadingPartidos] = useState(true);
  const [loadingTabla, setLoadingTabla] = useState(true);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  // const [ID_CAMPEONATO, setID_CAMPEONATO] = useState()

  const obtenerProximosPartidos = async () => {
    setLoadingPartidos(true);
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
      const { data, error } = await supabase
        .from('PARTIDOS')
        .select(`
          *,
          equipo_local: id_equipo1 (nombre, acronimo, logo),
          equipo_visitante: id_equipo2 (nombre, acronimo, logo),
          liga: id_liga (nombre),
          campeonato: id_campeonato (nombre, principal)
        `)
        .gte('fecha', startDate.toISOString())
        .lte('fecha', endDate.toISOString())
        .eq('campeonato.principal', 1)
        .order('fecha', { ascending: true });
    
      if (!error) {
        const opcionesFecha = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    
        const partidosFormateados = data.map(partido => ({
          ...partido,
          fecha_local: new Date(partido.fecha)
            .toLocaleDateString('es-ES', opcionesFecha)
            .replace(',', ' -')
            .replace(/\./g, ''),
          equipo_local: partido.equipo_local,
          equipo_visitante: partido.equipo_visitante,
          liga: partido.liga,
          campeonato: partido.campeonato
        }));
        setProximosPartidoData(partidosFormateados);
      }
    } finally {
      setLoadingPartidos(false);
    }
  };

  const obtenerTablaDePosiciones = async () => {
    setLoadingTabla(true);
    try {
      const { data, error } = await supabase
        .from('POSICIONES')
        .select(`
          *,
          campeonato: id_campeonato (nombre, principal),
          liga: id_liga (id, nombre), 
          equipo: id_equipo (id, nombre, acronimo, logo) 
        `)
        .eq('campeonato.principal', 1)
        .order('puntos', { ascending: false });
    
      if (!error) {
        const posicionesPorLiga = data.reduce((acc, posicion) => {
          const ligaId = posicion.id_liga;
          if (!acc[ligaId]) {
            acc[ligaId] = {
              liga: posicion.liga,
              equipos: []
            };
          }
          acc[ligaId].equipos.push({
            nombre: posicion.equipo.nombre,
            acronimo: posicion.equipo.acronimo,
            logo: posicion.equipo.logo,
            puntos: posicion.puntos,
            victorias: posicion.victorias,
            derrotas: posicion.derrotas,
            diferencia_sets: posicion.diferencia_sets,
            idEquipo: posicion.equipo.id
          });
          return acc;
        }, {});
        setTablaDePosiciones(Object.values(posicionesPorLiga));
      }
    } finally {
      setLoadingTabla(false);
    }
  };

  const obtenerNoticiasDestacadas = async () => {
    setLoadingNoticias(true);
    try {
      const { data, error } = await supabase
        .from('NOTICIAS')
        .select(`
          *,
          liga: id_liga (id, nombre, logo)
        `)
        .eq('id_campeonato', idCampeonato)
        .eq('view', 1)
        .eq('status', 1)
        .order('fecha', { ascending: false });

      if (!error) setNoticias(data);
    } catch (error) {
      console.error('Error fetching noticias:', error);
    } finally {
      setLoadingNoticias(false);
    }
  };

  const formatFecha = (fechaISO) => {
    const opciones = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return new Date(fechaISO).toLocaleDateString('es-ES', opciones).replace(',', ' -');
  };

  const clickEquipo = (idEquipo, idLiga) => {
    dispatch(updateUser({ seccion:2,equipo: idEquipo, liga: idLiga }));
    navigate('/iequipo');
  };

  useEffect(() => {
    console.log(idCampeonato)
    // console.log(ID_CAMPEONATO) 
    // setID_CAMPEONATO(idCampeonato)
    if(idCampeonato!=undefined){ 
      obtenerProximosPartidos();
      obtenerTablaDePosiciones();
      obtenerNoticiasDestacadas();
    }
  }, [idCampeonato]);

  const partidosAgrupados = groupPartidosByDate(ProximosPartidoData);

  return (
    <Grid container spacing={3} sx={{ padding: 3 }}>
      {/* PRÓXIMOS ENFRENTAMIENTOS */}
      <Grid item xs={12} md={3}>
        <StyledPaper>
          <Typography variant="h6" gutterBottom sx={{ 
            fontWeight: 'bold', 
            color: '#1e0c1b',
            textAlign: 'center',
            mb: 2,
            margin:'20px 0 30px 0'
          }}>
            PRÓXIMOS ENCUENTROS
          </Typography>

          {loadingPartidos ? (
            <LoadingSkeleton color="#1e0c1b" />
          ) : ProximosPartidoData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              No hay partidos en los próximos 7 días
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.entries(partidosAgrupados).map(([fecha, partidos]) => (
                <Box key={fecha} sx={{ 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  p: 1.5,
                  backgroundColor: '#1e0c1b',
                  margin:'10px 0'
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 600, 
                    color: 'white',
                    textAlign: 'center',
                    mb: 1
                  }}>
                    {fecha}
                  </Typography>
                  
                  {partidos.map(partido => (
                    <Box key={partido.id} sx={{ 
                      mb: 1,
                      p: 1,
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <Box sx={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2,
                        margin: '10px 0'
                      }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <img 
                            src={partido.equipo_local.logo} 
                            alt={partido.equipo_local.nombre} 
                            style={{ height: '40px', marginBottom: '4px' }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {partido.equipo_local.acronimo}
                          </Typography>
                        </Box>

                        <Typography variant="h6" sx={{ mx: 2 }}>
                          <b>VS</b>
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <img 
                            src={partido.equipo_visitante.logo} 
                            alt={partido.equipo_visitante.nombre} 
                            style={{ height: '40px', marginBottom: '4px' }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {partido.equipo_visitante.acronimo}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="caption" style={{color:'#1e0c1b'}}>
                        {partido.liga.nombre} - Hora: {partido.fecha_local.split(' - ')[1]}
                      </Typography>
                      {partido.estadio && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {partido.estadio}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          )}
        </StyledPaper>
      </Grid>

      {/* NOTICIAS DESTACADAS */}
      <Grid item xs={12} md={6}>
        <StyledPaper sx={{ height: 'auto' }}>
          {/* <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1e0c1b' }}>
            NOTICIAS DESTACADAS
          </Typography> */}
          
          {loadingNoticias ? (
            <LoadingSkeleton color="#1e0c1b" />
          ) : noticias.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              No hay noticias destacadas
            </Typography>
          ) : (
            noticias.map((noticia) => (
              <Box key={noticia.id} sx={{ mb: 4, borderBottom: '1px solid #eee', pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',backgroundColor:'#ef4136',borderTopLeftRadius:'8px',borderTopRightRadius:'8px'}}>
                  {noticia.liga && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 ,margin:'0 15px'}}>
                      {/* <img 
                        src={noticia.liga.logo} 
                        alt={noticia.liga.nombre} 
                        style={{ height: '15px',borderTopLeftRadius:'8px'}} 
                      /> */}
                      <Typography variant="caption" color="text.secondary" style={{margin:'2px 15px',color:'white'}}>
                        <b>{noticia.liga.nombre}</b>
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="text.disabled" style={{margin:'2px 15px',color:'white'}}>
                    <b>{formatFecha(noticia.fecha)}</b>
                  </Typography>
                </Box>
                
                {noticia.img && (
                  <img 
                    src={noticia.img} 
                    alt={noticia.titulo} 
                    style={{ 
                      width: '100%', 
                      height: '300px', 
                      objectFit: 'cover', 
                      borderBottomRightRadius: '8px',
                      borderBottomLeftRadius: '8px',
                      marginBottom: '1rem'
                    }} 
                  />
                )}
                <div style={{display:'flex',justifyContent:'center',alignItems:'center',margin:'10px 0'}}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {noticia.titulo}
                  </Typography>  
                </div> 
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {noticia.descripcion}
                </Typography>
                
                
              </Box>
            ))
          )}
        </StyledPaper>
      </Grid>

      {/* TABLAS DE LIGAS */}
      <Grid item xs={12} md={3}> 
        <StyledPaper sx={{ height: 'auto' }}> 
          <div style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1e0c1b',margin:'20px 0' }}> 
              TABLAS DE LIGAS 
              </Typography>
          </div> 
          {loadingTabla ? (
            <LoadingSkeleton color="#1e0c1b" />
          ) : (
            TablaDePosiciones.map((liga, index) => ( 
              <Box key={index} sx={{ mb: 3 }}> 
                <br />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, textAlign: 'center', backgroundColor: '#1e0c1b', py: 1, borderRadius: '4px',color:'white' }}> 
                  {liga.liga.nombre} 
                </Typography> 
                <Box sx={{ overflowX: 'auto' }}> 
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}> 
                    <thead> 
                      <tr style={{ backgroundColor: '#f8f9fa' }}> 
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>#</th> 
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>Team</th> 
                        <th style={{ textAlign: 'right', padding: '8px', fontSize: '0.875rem' }}>Pts</th> 
                      </tr> 
                    </thead> 
                    <tbody> 
                      {liga.equipos.map((equipo, idx) => { 
                        const isFirst = idx === 0; 
                        const isLast = idx === liga.equipos.length - 1; 
                        return ( 
                          <tr 
                            key={idx} 
                            style={{ 
                              borderBottom: '1px solid #e0e0e0', 
                              backgroundColor: isFirst ? '#c6efce' : isLast ? '#ffcdd2' : 'transparent' ,
                              cursor:'pointer'
                            }}
                            onClick={() => clickEquipo(equipo.idEquipo, liga.liga.id)}
                          > 
                            <td style={{ padding: '8px', fontWeight: 500 }}>{idx + 1}</td> 
                            <td style={{ padding: '8px' }}> 
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> 
                                <img src={equipo.logo} alt={equipo.nombre} style={{ height: '25px', width: '25px', objectFit: 'contain' }} /> 
                                <Typography variant="body2" sx={{ fontWeight: 500 }}> 
                                  {equipo.nombre} 
                                </Typography> 
                              </div> 
                            </td> 
                            <td style={{ textAlign: 'right', padding: '8px', fontWeight: 600 }}> 
                              {equipo.puntos} 
                            </td> 
                          </tr> 
                        ); 
                      })} 
                    </tbody> 
                  </table> 
                </Box> 
              </Box> 
            ))
          )}
        </StyledPaper> 
      </Grid>
    </Grid>
  );
}

export default Home;