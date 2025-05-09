import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, useTheme, useMediaQuery, Autocomplete, TextField, CardContent } from '@mui/material';
import { supabase } from '../../../services/supabase.config';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../../../components/Loading/LoadingSqueleton';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../redux/states/user';

function PreTorneo({idCampeonato}) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [equiposFiltrados, setEquiposFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ligasOptions, setLigasOptions] = useState([]);
  const [selectedLigaId, setSelectedLigaId] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // Función para manejar el click en un equipo
  const handleTeamClick = (idEquipo) => {
    dispatch(updateUser({equipo:idEquipo,liga:selectedLigaId}))
    navigate(`/iequipo`);
  };

  const fetchLigas = async () => {
    console.log(idCampeonato)
    try {
      const { data, error } = await supabase
        .from('rel_campeonato_liga')
        .select(`
          liga: id_liga(id, nombre, logo),
          campeonato: id_campeonato!inner(id, principal)
        `)
        .eq('campeonato.id', idCampeonato);

      if (error) throw error;
      console.log(data)
      const options = data.map(item => ({
        id: item.liga.id,
        nombre: item.liga.nombre
      })); 
      setLigasOptions(options);
      
      if (options.length > 0 && !selectedLigaId) {
        setSelectedLigaId(options[0]?.id);
      }

    } catch (error) {
      console.error('Error fetching ligas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipos = async () => {
    if (!selectedLigaId || !idCampeonato) return;
    
    try {
      const { data: campeonatoEquipos, error: errorCampeonato } = await supabase
        .from('rel_campeonato_equipo')
        .select('id_equipo')
        .eq('id_campeonato', idCampeonato);

      if (errorCampeonato) throw errorCampeonato;

      const equipoIds = campeonatoEquipos.map(ce => ce.id_equipo);

      const { data: ligaEquipos, error: errorLiga } = await supabase
        .from('rel_liga_equipo')
        .select(`
          id_equipo,
          equipo: id_equipo(id, nombre, acronimo, logo)
        `)
        .eq('id_liga', selectedLigaId)
        .in('id_equipo', equipoIds);

      if (errorLiga) throw errorLiga;

      const equipos = ligaEquipos.map(le => le.equipo);
      setEquiposFiltrados(equipos);

    } catch (error) {
      console.error('Error fetching equipos:', error);
    }
  };

  const handleLigaChange = (event, newValue) => {
    setSelectedLigaId(newValue?.id || null);
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

  useEffect(() => {
    if(idCampeonato !== undefined){
      fetchLigas();
    }
  }, [idCampeonato]);

  useEffect(() => {
    if (selectedLigaId && idCampeonato) {
      fetchEquipos();
    }
  }, [selectedLigaId, idCampeonato]);

  const selectedLigaNombre = ligasOptions.find(option => option.id === selectedLigaId)?.nombre || 'LIGA';

  return (
    <Grid container spacing={3} sx={{ padding: isMobile ? 2 : 3 }}>
      <Grid item xs={12}>
        <Paper 
          sx={{ 
            borderRadius: '15px',
            p: isMobile ? 2 : 3,
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={7}>
              <Typography 
                variant={isMobile ? "h5" : "h4"}
                sx={{ 
                  color: '#1e0c1b',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: isMobile ? '1.8rem' : '2.125rem',
                  margin: '20px 0',
                  lineHeight: '1.2'
                }}
              >
                Equipos de {selectedLigaNombre}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <CardContent>
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
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                  filterOptions={(options, state) =>
                    options.filter(option =>
                      option.nombre.toLowerCase().includes(state.inputValue.toLowerCase())
                    )
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </CardContent>
            </Grid>
          </Grid>

          {loading ? (
            <LoadingSkeleton color="#1e0c1b" />
          ) : (
            <Grid container spacing={isMobile ? 2 : 3}>
              {equiposFiltrados.map((equipo) => (
                <Grid item xs={6} sm={6} md={3} key={equipo.id}>
                  <Paper 
                    onClick={() => handleTeamClick(equipo.id)}
                    sx={{ 
                      p: 2,
                      borderRadius: '12px',
                      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                      minHeight: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      textAlign: 'center'
                    }}>
                      <img 
                        src={equipo.logo} 
                        alt={`Logo ${equipo.nombre}`}
                        style={{ 
                          width: isMobile ? '80px' : '100px',
                          height: isMobile ? '80px' : '100px',
                          borderRadius: '20%',
                          objectFit: 'cover',
                          marginBottom: '10px'
                        }}
                      />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          color: '#1e0c1b'
                        }}
                      >
                        {equipo.acronimo}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.secondary',
                          fontSize: '0.9rem'
                        }}
                      >
                        {equipo.nombre}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

export default PreTorneo;