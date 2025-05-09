import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase.config';
import LoadingSkeleton from '../../../components/Loading/LoadingSqueleton';
import { Grid, Paper, Card, CardContent, Typography, Box, Autocomplete, TextField } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../redux/states/user';

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  borderRadius: '10px',
  padding: theme.spacing(3),
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
  minHeight: '300px'
}));

function Torneo({ idLiga, idCampeonato }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [loadingTabla, setLoadingTabla] = useState(true);
  const [loadingPartidos, setLoadingPartidos] = useState(true);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [ligaData, setLigaData] = useState(null);
  const [ligasOptions, setLigasOptions] = useState([]);
  const [selectedLigaId, setSelectedLigaId] = useState(idLiga);
  const [inputValue, setInputValue] = useState('');
  const [tablaDePosiciones, setTablaDePosiciones] = useState([]);
  const [proximosPartidosData, setProximosPartidosData] = useState([]);
  const [partidosAgrupados, setPartidosAgrupados] = useState({});
  const [partidosAnterioresData, setPartidosAnterioresData] = useState([]);
  const [partidosAnterioresAgrupados, setPartidosAnterioresAgrupados] = useState({});
  const [noticiasData, setNoticiasData] = useState([]);
  const navigate = useNavigate();

  const fetchLigaDataSELECT = async () => {
    try {
      const { data, error } = await supabase
        .from('rel_campeonato_liga')
        .select(`
          liga:id_liga!inner(id, nombre, logo),
          campeonato: id_campeonato(id, principal)
        `)
        .eq('campeonato.id', idCampeonato);

      if (error) throw error;
      
      if(data && data.length > 0) {
        const options = data.map(item => ({
          id: item.liga.id,
          nombre: item.liga.nombre
        }));
        setLigasOptions(options);
        if (!selectedLigaId) setSelectedLigaId(options[0]?.id);
      }
    } catch (error) {
      console.error('Error fetching ligas options:', error);
    }
  };

  const fetchLigaData = async () => {
    try {
      setLoading(true);
      if (!selectedLigaId) return;

      const { data, error } = await supabase
        .from('LIGAS')
        .select('id, nombre, logo')
        .eq('id', selectedLigaId)
        .single();

      if (error) throw error;
      
      setLigaData(data);
    } catch (error) {
      console.error('Error fetching liga data:', error);
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
          liga: id_liga !inner(nombre,id),
          equipo: id_equipo (id,nombre, acronimo, logo)
        `)
        .eq('campeonato.id', idCampeonato)
        .eq('liga.id', selectedLigaId)
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
          equipo_local: id_equipo1 (nombre, acronimo, logo),
          equipo_visitante: id_equipo2 (nombre, acronimo, logo),
          liga: id_liga !inner(nombre,id),
          campeonato: id_campeonato (nombre, principal,id)
        `)
        .gte('fecha', startDate.toISOString())
        .lte('fecha', endDate.toISOString())
        .eq('campeonato.id', idCampeonato)
        .eq('liga.id', selectedLigaId)
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
        
        const agrupados = partidosFormateados.reduce((acc, partido) => {
          const fecha = partido.fecha_local.split(' - ')[0];
          if (!acc[fecha]) {
            acc[fecha] = [];
          }
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
        .gte('fecha', startDate.toISOString())
        .lte('fecha', endDate.toISOString())
        .eq('campeonato.id', idCampeonato)
        .eq('liga.id', selectedLigaId)
        .order('fecha', { ascending: false });

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

  const obtenerNoticias = async () => {
    setLoadingNoticias(true);
    try {
      const { data, error } = await supabase
        .from('NOTICIAS')
        .select(`
          *,
          liga: id_liga (id, nombre, logo)
        `)
        .eq('id_liga', selectedLigaId)
        .eq('view', 1)
        .eq('status', 1)
        .order('fecha', { ascending: false });
      console.log(data)
      if (!error) {
        const noticiasFormateadas = data.map(noticia => ({
          ...noticia,
          fecha_formateada: new Date(noticia.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })
        }));
        console.log(noticiasFormateadas)
        setNoticiasData(noticiasFormateadas);
      }
    } catch (error) {
      console.error('Error fetching noticias:', error);
    } finally {
      setLoadingNoticias(false);
    }
  };

  const clickEquipo = (idxEquipo) => {
    dispatch(updateUser({ seccion:2,equipo: idxEquipo, liga: selectedLigaId }));
    navigate('/iequipo');
  };

  useEffect(() => {
    fetchLigaDataSELECT();
    fetchLigaData();
    
    if(selectedLigaId !== 0 && idCampeonato !== 0){
      obtenerTablaDePosiciones();
      obtenerProximosPartidos();
      obtenerPartidosAnteriores();
      obtenerNoticias();
    }
  }, [selectedLigaId, idCampeonato]);

  const handleLigaChange = (event, newValue) => {
    setSelectedLigaId(newValue?.id || null);
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

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      const searchText = inputValue.toLowerCase();
      const foundLiga = ligasOptions.find(option => 
        option.nombre.toLowerCase().includes(searchText)
      );
      
      if (foundLiga) {
        setSelectedLigaId(foundLiga.id);
        setInputValue(foundLiga.nombre);
      }
    }
  };

  return (
    <Box sx={{ margin: '0 auto', p: 3 }}>
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
                    {!loading && ligaData?.logo ? (
                      <img 
                        src={ligaData.logo}
                        alt="Logo de la liga"
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
                    {!loading && ligaData && (
                      <Typography variant="h4" gutterBottom align="center" style={{ color: '#1e0c1b' }}>
                        <b>{ligaData.nombre}</b>
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    p: 2
                  }}>
                    <Autocomplete
                      options={ligasOptions}
                      getOptionLabel={(option) => option.nombre}
                      value={ligasOptions.find(option => option.id === selectedLigaId) || null}
                      inputValue={inputValue}
                      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
                      onChange={handleLigaChange}
                      sx={{ width: '100%' }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar Liga"
                          variant="outlined"
                          onKeyDown={handleKeyDown}
                        />
                      )}
                      filterOptions={(options, state) =>
                        options.filter(option =>
                          option.nombre.toLowerCase().includes(state.inputValue.toLowerCase())
                        )
                      }
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
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
            ) : proximosPartidosData.length === 0 ? (
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

        <Grid item xs={12} md={3}>
          <Card sx={{
            height: 400,
            borderRadius: 3,
            boxShadow: 3,
            backgroundColor: 'background.paper',
            overflow: 'auto'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' ,margin:'10px 0 20px 0'}}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold', 
                  color: '#1e0c1b', 
                  margin: '20px 0' 
                }}>
                  TABLA DE POSICIONES
                </Typography>
              </Box>
              {loadingTabla ? (
                <LoadingSkeleton />
              ) : (
                tablaDePosiciones.map((liga, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{
                      fontWeight: 600,
                      mb: 2,
                      textAlign: 'center',
                      backgroundColor: '#1e0c1b',
                      py: 1,
                      borderRadius: '4px',
                      color: 'white'
                    }}>
                      {liga.liga.nombre}
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>#</th>
                            <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>Equipo</th>
                            <th style={{ textAlign: 'right', padding: '8px', fontSize: '0.875rem' }}>Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {liga.equipos.map((equipo, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === liga.equipos.length - 1;
                            return (
                              <tr key={idx} style={{
                                borderBottom: '1px solid #e0e0e0',
                                backgroundColor: isFirst ? '#c6efce' : isLast ? '#ffcdd2' : 'transparent',
                                cursor:'pointer'
                              }}
                              onClick={()=>clickEquipo(equipo.idEquipo)}>
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
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Torneo;