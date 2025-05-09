import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase.config';
import LoadingSkeleton from '../../../components/Loading/LoadingSqueleton';
import { Grid, Paper, Card, CardContent, Typography, Box } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  borderRadius: '10px',
  padding: theme.spacing(3),
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
  minHeight: '300px'
}));

function Equipo({ idCampeonato, idEquipo, idLiga }) {
  const [loading, setLoading] = useState(true);
  const [loadingTabla, setLoadingTabla] = useState(true);
  const [loadingPartidos, setLoadingPartidos] = useState(true);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [equipoData, setEquipoData] = useState(null);
  const [tablaDePosiciones, setTablaDePosiciones] = useState([]);
  const [proximosPartidosData, setProximosPartidosData] = useState([]);
  const [partidosAgrupados, setPartidosAgrupados] = useState({});
  const [partidosAnterioresAgrupados, setPartidosAnterioresAgrupados] = useState({});
  const [partidosAnterioresData, setPartidosAnterioresData] = useState([]);
  const [noticiasData, setNoticiasData] = useState([]);
  const [ID_EQUIPO, setID_EQUIPO] = useState(idEquipo);
  const navigate = useNavigate();

  // Nueva función para obtener noticias
  const obtenerNoticias = async () => {
    setLoadingNoticias(true);
    try {
      const { data, error } = await supabase
        .from('NOTICIAS')
        .select(`
          *,
          liga: id_liga (id, nombre, logo)
        `)
        .eq('id_liga', idLiga)
        .eq('id_campeonato', idCampeonato)
        .or(`id_equipo1.eq.${ID_EQUIPO},id_equipo2.eq.${ID_EQUIPO}`)
        .eq('view', 1)
        .eq('status', 1)
        .order('fecha', { ascending: false });

      if (!error) {
        const noticiasFormateadas = data.map(noticia => ({
          ...noticia,
          fecha_formateada: new Date(noticia.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })
        }));
        setNoticiasData(noticiasFormateadas);
      }
    } catch (error) {
      console.error('Error fetching noticias:', error);
    } finally {
      setLoadingNoticias(false);
    }
  };

  // Funciones existentes...
  const fetchEquipoData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('EQUIPOS')
        .select('id, nombre, acronimo, logo')
        .eq('id', ID_EQUIPO)
        .single();
      
      if (error) throw error;
      setEquipoData(data);
    } catch (error) {
      console.error('Error fetching equipo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTablaDePosiciones = async () => {
    setLoadingTabla(true);
    try {
      const { data, error } = await supabase
        .from('POSICIONES')
        .select(`
          *,
          campeonato: id_campeonato (id,nombre, principal),
          liga: id_liga (nombre,id),
          equipo: id_equipo (id, nombre, acronimo, logo)
        `)
        .eq('id_campeonato', idCampeonato)
        .eq('id_liga', idLiga)
        .order('puntos', { ascending: false });

      if (!error) {
        const posiciones = data.map(posicion => ({
          id: posicion.equipo.id,
          nombre: posicion.equipo.nombre,
          acronimo: posicion.equipo.acronimo,
          logo: posicion.equipo.logo,
          puntos: posicion.puntos,
          victorias: posicion.victorias,
          derrotas: posicion.derrotas,
          diferencia_sets: posicion.diferencia_sets
        }));
        setTablaDePosiciones(posiciones);
      }
    } catch (error) {
      console.error('Error fetching posiciones:', error);
    } finally {
      setLoadingTabla(false);
    }
  };

  const obtenerProximosPartidos = async () => {
    setLoadingPartidos(true);
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
      const { data, error } = await supabase
        .from('PARTIDOS')
        .select(`
          *,
          equipo_local: id_equipo1 (id, nombre, acronimo, logo),
          equipo_visitante: id_equipo2 (id, nombre, acronimo, logo),
          liga: id_liga (nombre,id),
          campeonato: id_campeonato (nombre, principal,id)
        `)
        .or(`id_equipo1.eq.${ID_EQUIPO},id_equipo2.eq.${ID_EQUIPO}`)
        .eq('id_campeonato', idCampeonato)
        .eq('id_liga', idLiga)
        .gte('fecha', startDate.toISOString())
        .lte('fecha', endDate.toISOString())
        .order('fecha', { ascending: true });
          console.log(data)
      if (!error) {
        const opcionesFecha = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        };

        const partidosFormateados = data.map(partido => ({
          ...partido,
          fecha_local: new Date(partido.fecha)
            .toLocaleDateString('es-ES', opcionesFecha)
            .replace(',', ' -')
            .replace(/\./g, '')
        }));
        
        const agrupados = partidosFormateados.reduce((acc, partido) => {
          const fecha = partido.fecha_local.split(' - ')[0];
          if (!acc[fecha]) acc[fecha] = [];
          acc[fecha].push(partido);
          return acc;
        }, {});
        
        setPartidosAgrupados(agrupados);
        setProximosPartidosData(partidosFormateados);
      }
    } catch (error) {
      console.error('Error fetching partidos:', error);
    } finally {
      setLoadingPartidos(false);
    }
  };

  const obtenerPartidosAnteriores = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
      const { data, error } = await supabase
        .from('PARTIDOS')
        .select(`
          *,
          equipo_local: id_equipo1 (nombre, acronimo, logo),
          equipo_visitante: id_equipo2 (nombre, acronimo, logo),
          liga: id_liga !inner(nombre,id),
          campeonato: id_campeonato (nombre, principal,id)
        `)
        .or(`id_equipo1.eq.${ID_EQUIPO},id_equipo2.eq.${ID_EQUIPO}`)
        .gte('fecha', startDate.toISOString())
        .lte('fecha', endDate.toISOString())
        .eq('campeonato.id', idCampeonato)
        .eq('liga.id', idLiga)
        .order('fecha', { ascending: false });
          console.log(data)
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
          campeonato: partido.campeonato,
          resultado: partido.resultado
        }));
        
        const agrupados = partidosFormateados.reduce((acc, partido) => {
          const fecha = partido.fecha_local.split(' - ')[0];
          if (!acc[fecha]) {
            acc[fecha] = [];
          }
          acc[fecha].push(partido);
          return acc;
        }, {});
        
        setPartidosAnterioresAgrupados(agrupados);
        setPartidosAnterioresData(partidosFormateados);
      }
    } catch (error) {
      console.error('Error fetching partidos anteriores:', error);
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

  useEffect(() => {
    if(ID_EQUIPO !== undefined && idCampeonato !== undefined && idLiga !== undefined) {
      fetchEquipoData();
      obtenerTablaDePosiciones();
      obtenerProximosPartidos();
      obtenerPartidosAnteriores();
      obtenerNoticias();
    }
  }, [ID_EQUIPO, idCampeonato, idLiga]);

  const clickEquipo = (idxEquipo) => {
    setID_EQUIPO(idxEquipo);
  };

  return (
    <Box sx={{ margin: '0 auto', p: 3 }}>
      {/* Sección superior con datos del equipo */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: 3,
            backgroundColor: 'background.paper',
            position: 'relative',
            minHeight: 150
          }}>
            {loading && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1,
                backgroundColor: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LoadingSkeleton />
              </Box>
            )}
            
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    height: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    {!loading && equipoData?.logo ? (
                      <img 
                        src={equipoData.logo}
                        alt="Logo del equipo"
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          borderRadius: '20px'
                        }}
                      />
                    ) : (
                      <Typography variant="h6" color="text.secondary">
                        SIN LOGO
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                    {!loading && equipoData && (
                      <>
                        <Typography variant="h4" gutterBottom align="center" style={{ color: '#1e0c1b' }}>
                          <b>{equipoData.nombre}</b>
                        </Typography>
                        <Typography variant="h5" align="center" style={{ color: '#666' }}>
                          ({equipoData.acronimo})
                        </Typography>
                      </>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  {/* Espacio reservado para información adicional */}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sección principal */}
      <Grid container spacing={3}>
        {/* Columna izquierda - Partidos */}
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
            ) : proximosPartidosData.length === 0  &&  partidosAnterioresData.length===0?(
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
                
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    my: 2,
                    '& hr': {
                    flexGrow: 1,
                    borderColor: '#1e0c1b'
                    }
                }}>
                    <hr />
                    <Typography variant="h8" sx={{ color: '#1e0c1b' }}>
                    HOY
                    </Typography>
                    <hr />
                </Box>

                {Object.entries(partidosAnterioresAgrupados).map(([fecha, partidos]) => (
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
                              <b>{partido.resultado}</b>
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
                
                {partidosAnterioresData.length === 0 && !loadingPartidos && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No hay partidos en los últimos 7 días
                    </Typography>
                )}
                </Box>
            )}
            </StyledPaper>
        </Grid>

        {/* Columna central - Noticias */}
        <Grid item xs={12} md={6}>
          <StyledPaper sx={{ height: 'auto' }}>
            {/* <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1e0c1b' }}>
              NOTICIAS DESTACADAS
            </Typography> */}
            
            {loadingNoticias ? (
              <LoadingSkeleton color="#1e0c1b" />
            ) : noticiasData.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                No hay noticias destacadas
              </Typography>
            ) : (
              noticiasData.map((noticia) => (
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

        {/* Columna derecha - Tabla de posiciones */}
        <Grid item xs={12} md={3}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: 3,
            backgroundColor: 'background.paper',
            overflow: 'auto',
            height: 400
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin:'10px 0 20px 0'}}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold', 
                  color: '#1e0c1b', 
                  margin: '20px 0' 
                }}>
                  POSICIÓN ACTUAL
                </Typography>
              </Box>
              {loadingTabla ? (
                <LoadingSkeleton />
              ) : (
                <Box>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1e0c1b',color:'white' }}>
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>#</th>
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>Equipo</th>
                        <th style={{ textAlign: 'right', padding: '8px', fontSize: '0.875rem' }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablaDePosiciones.map((equipo, idx, arr) => {
                        const isCurrent = equipo.id === ID_EQUIPO;
                        const isFirst = idx === 0;
                        const isLast = idx === arr.length - 1;
                        
                        return (
                          <tr 
                            key={idx} 
                            style={{
                              borderBottom: '1px solid #e0e0e0',
                              backgroundColor: isFirst ? '#c6efce' : 
                                           isLast ? '#ffcdd2' : 
                                           'transparent',
                              border: isCurrent ? '2px solid #1e0c1b' : 'none',
                              boxSizing: 'border-box',
                              cursor:'pointer'
                            }}
                            onClick={()=>clickEquipo(equipo.id)}
                          >
                            <td style={{ padding: '8px', fontWeight: 500 }}>{idx + 1}</td>
                            <td style={{ padding: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img 
                                  src={equipo.logo} 
                                  alt={equipo.nombre} 
                                  style={{ height: '25px', width: '25px', objectFit: 'contain' }} 
                                />
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
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Equipo;