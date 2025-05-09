import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase.config';
import LoadingSkeleton from '../../../components/Loading/LoadingSqueleton';
import { 
  Container,
  Paper,
  Grid,
  Typography,
  Select,
  MenuItem,
  Button,
  IconButton,
  Box,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  SportsSoccer,
  Groups,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  Warning
} from '@mui/icons-material';

function Calendario({idCampeonato}) {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLigaId, setSelectedLigaId] = useState('');
  const [team, setTeam] = useState('todos');
  const [ligasOptions, setLigasOptions] = useState([]);
  const [equiposFiltrados, setEquiposFiltrados] = useState([]);
  const [partidosAgrupados, setPartidosAgrupados] = useState({});

  const getDateStatus = (isoDate) => {
    const today = new Date();
    const date = new Date(isoDate);
    
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < today) return 'past';
    if (date => today) return 'future';
    return 'present';
  };

  const processPartidos = (partidos) => {
    return partidos.map(partido => {
      const fecha = new Date(partido.fecha);
      return {
        ...partido,
        fechaTimestampz: partido.fecha,
        soloFechaLocal: fecha.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        fechaConHoraLocal: `${fecha.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })} - ${fecha.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        fechaISO: fecha.toISOString().split('T')[0]
      };
    });
  };

  const groupPartidosByDate = (partidos) => {
    return partidos.reduce((acc, partido) => {
      const dateKey = partido.soloFechaLocal;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(partido);
      return acc;
    }, {});
  };

  const getUniqueDates = () => {
    const datesArray = Object.keys(partidosAgrupados).map(dateKey => {
      const firstPartido = partidosAgrupados[dateKey][0];
      return {
        display: dateKey,
        iso: firstPartido.fechaISO,
        count: partidosAgrupados[dateKey].length
      };
    });
    
    return datesArray.sort((a, b) => new Date(a.iso) - new Date(b.iso));
  };

  const fetchPartidos = async () => {
    if (!selectedLigaId) return;

    let query = supabase
      .from('PARTIDOS')
      .select(`
        *,
        equipo1: id_equipo1 (id, nombre, logo, acronimo),
        equipo2: id_equipo2 (id, nombre, logo, acronimo)
      `)
      .eq('id_campeonato', idCampeonato)
      .eq('id_liga', selectedLigaId);

    if (team !== 'todos') {
      query = query.or(`id_equipo1.eq.${team},id_equipo2.eq.${team}`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching partidos:', error);
      return;
    }
    
    const processedPartidos = processPartidos(data || []);
    const groupedPartidos = groupPartidosByDate(processedPartidos);
    setPartidosAgrupados(groupedPartidos);
    
    if (processedPartidos.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const defaultDate = processedPartidos.find(p => p.fechaISO >= today)?.fechaISO || processedPartidos[0].fechaISO;
      setSelectedDate(defaultDate);
    }
  };

  const fetchEquipos = async () => {
    if (!selectedLigaId || !idCampeonato) {
      setEquiposFiltrados([]);
      return;
    }
    
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
      setTeam('todos');

    } catch (error) {
      console.error('Error fetching equipos:', error);
      setEquiposFiltrados([]);
    }
  };

  const fetchLigas = async () => {
    try {
      const { data, error } = await supabase
        .from('rel_campeonato_liga')
        .select(`
          liga: id_liga(id, nombre, logo),
          campeonato: id_campeonato!inner(id, principal)
        `)
        .eq('campeonato.id', idCampeonato);

      if (error) throw error;

      const options = data.map(item => ({
        id: item.liga.id,
        nombre: item.liga.nombre,
        logo: item.liga.logo
      })); 
      
      setLigasOptions(options);
      
      if (options.length > 0) {
        setSelectedLigaId(options[0].id);
      }

    } catch (error) {
      console.error('Error fetching ligas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLigas();
  }, [idCampeonato]);

  useEffect(() => {
    if (selectedLigaId) {
      fetchEquipos();
    }
  }, [selectedLigaId, idCampeonato]);

  useEffect(() => {
    if (selectedLigaId) {
      fetchPartidos();
    }
  }, [selectedLigaId, team]);

  const handleScroll = (direction) => {
    const container = document.getElementById('dates-container');
    const scrollAmount = 200;
    container.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
  };

  const getTituloPrincipal = () => {
    const liga = ligasOptions.find(l => l.id === selectedLigaId);
    const equipo = equiposFiltrados.find(e => e.id === team);
    
    if (liga && equipo) {
      return `${liga.nombre} - ${equipo.nombre}`;
    }
    if (liga) return liga.nombre;
    return 'Fútbol Profesional';
  };

  const CustomDateInput = () => (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: '4px',
      '&:hover': {
        borderColor: 'text.primary'
      }
    }}>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        style={{
          width: '100%',
          height: '56px',
          padding: '16px 48px 16px 16px',
          border: 'none',
          backgroundColor: 'transparent',
          fontSize: '16px',
          fontFamily: 'inherit',
          color: 'inherit',
          outline: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'textfield'
        }}
      />
      <CalendarToday
        sx={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'action.active'
        }}
      />
    </Box>
  );

  const formatearFecha = (fecha) => {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  const renderPartidos = () => {
    if (!selectedDate) return null;
    
    const fechaKey = formatearFecha(selectedDate);
    const partidosDelDia = partidosAgrupados[fechaKey] || [];

    if (partidosDelDia.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary">
          No hay partidos programados para esta fecha
        </Typography>
      );
    }

    return partidosDelDia.map((partido, index) => (
      <Paper key={index} elevation={2} sx={{ 
        p: 2,
        mb: 2,
        width: '100%',
        maxWidth: 600,
        backgroundColor: 'background.paper'
      }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={5} sx={{ textAlign: 'right' }}>
            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
              <Typography variant="subtitle1">{partido.equipo1.nombre}</Typography>
              <Box display="flex" flexDirection="column" alignItems="center">
                <img 
                  src={partido.equipo1.logo} 
                  alt={partido.equipo1.nombre} 
                  style={{ height: 40, width: 40, objectFit: 'contain' }} 
                />
                <Typography variant="caption">{partido.equipo1.acronimo}</Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={2} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              {partido.resultado || 'VS'}
            </Typography>
            <Typography variant="caption" display="block">
              {partido.fechaConHoraLocal}
            </Typography>
          </Grid>
          
          <Grid item xs={5} sx={{ textAlign: 'left' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <img 
                  src={partido.equipo2.logo} 
                  alt={partido.equipo2.nombre} 
                  style={{ height: 40, width: 40, objectFit: 'contain' }} 
                />
                <Typography variant="caption">{partido.equipo2.acronimo}</Typography>
              </Box>
              <Typography variant="subtitle1">{partido.equipo2.nombre}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    ));
  };

  if (loading) return <LoadingSkeleton />;

  const dates = getUniqueDates();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ mb: 4, p: 3 }}>
        <Grid container alignItems="center" spacing={3}>
          <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
            <Box display="flex" gap={2} justifyContent="center" alignItems="center">
              {selectedLigaId ? (
                <img 
                  src={ligasOptions.find(l => l.id === selectedLigaId)?.logo} 
                  alt="Logo Liga" 
                  style={{ maxHeight: 60, maxWidth: 100, objectFit: 'contain' }} 
                />
              ) : (
                <Box display="flex" alignItems="center" gap={1}>
                  <Warning color="error" />
                  <Typography variant="caption" color="error">
                    Selecciona una liga
                  </Typography>
                </Box>
              )}
              {team !== 'todos' ? (
                <img 
                  src={equiposFiltrados.find(e => e.id === team)?.logo} 
                  alt="Logo Equipo" 
                  style={{ maxHeight: 60, maxWidth: 100, objectFit: 'contain' }} 
                />
              ) : (
                <Box display="flex" alignItems="center" gap={1}>
                  <Groups fontSize="large" color="primary" />
                  <Typography variant="caption" color="primary">
                    Todos los equipos
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="h1">
              {getTituloPrincipal()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Select
              fullWidth
              value={selectedLigaId}
              onChange={(e) => {
                setSelectedLigaId(e.target.value);
                setTeam('todos');
              }}
              displayEmpty
              variant="outlined"
              startAdornment={
                <InputAdornment position="start">
                  <SportsSoccer color="primary" />
                </InputAdornment>
              }
              renderValue={(selected) => {
                if (!selected) return 'Seleccionar Liga';
                const liga = ligasOptions.find(l => l.id === selected);
                return (
                  <Box display="flex" alignItems="center" gap={1}>
                    <img 
                      src={liga?.logo} 
                      alt="Logo Liga" 
                      style={{ height: 24, width: 24, objectFit: 'contain' }} 
                    />
                    {liga?.nombre}
                  </Box>
                );
              }}
            >
              <MenuItem value="">
                <em>Seleccionar Liga</em>
              </MenuItem>
              {ligasOptions.map((liga) => (
                <MenuItem key={liga.id} value={liga.id}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <img 
                      src={liga.logo} 
                      alt="Logo Liga" 
                      style={{ 
                        height: 24, 
                        width: 24, 
                        objectFit: 'contain',
                        borderRadius: '4px'
                      }} 
                    />
                    <Typography>{liga.nombre}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} md={3}>
            <Select
              fullWidth
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              variant="outlined"
              startAdornment={
                <InputAdornment position="start">
                  <Groups color="primary" />
                </InputAdornment>
              }
              disabled={!selectedLigaId}
              renderValue={(selected) => {
                if (selected === 'todos') return 'Todos los equipos';
                const equipo = equiposFiltrados.find(e => e.id === selected);
                return (
                  <Box display="flex" alignItems="center" gap={1}>
                    <img 
                      src={equipo?.logo} 
                      alt="Logo Equipo" 
                      style={{ 
                        height: 24, 
                        width: 24, 
                        objectFit: 'contain',
                        borderRadius: '50%'
                      }} 
                    />
                    {equipo?.acronimo || equipo?.nombre}
                  </Box>
                );
              }}
            >
              <MenuItem value="todos">
                <Box display="flex" alignItems="center" gap={2}>
                  <Groups fontSize="small" />
                  <Typography>Todos los equipos</Typography>
                </Box>
              </MenuItem>
              {equiposFiltrados.map((equipo) => (
                <MenuItem key={equipo.id} value={equipo.id}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <img 
                      src={equipo.logo} 
                      alt="Logo Equipo" 
                      style={{ 
                        height: 24, 
                        width: 24, 
                        objectFit: 'contain',
                        borderRadius: '50%'
                      }} 
                    />
                    <Box>
                      <Typography>{equipo.nombre}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {equipo.acronimo}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ mb: 4, p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={10}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => handleScroll('left')}>
                <ChevronLeft fontSize="large" />
              </IconButton>

              <Box
                id="dates-container"
                sx={{
                  display: 'flex',
                  overflowX: 'auto',
                  gap: 1,
                  scrollBehavior: 'smooth',
                  '&::-webkit-scrollbar': { display: 'none' },
                  width: '100%',
                  py: 1
                }}
              >
                {dates.length > 0 ? (
                  dates.map((date, index) => {
                    const status = getDateStatus(date.iso);
                    const isSelected = selectedDate === date.iso;
                    
                    const borderColor = {
                      past: 'error.main',
                      future: 'success.main',
                      present: 'primary.main'
                    }[status];

                    const bgColor = isSelected ? borderColor : 'background.paper';
                    
                    return (
                      <Button
                        key={index}
                        variant="outlined"
                        onClick={() => setSelectedDate(date.iso)}
                        sx={{ 
                          whiteSpace: 'nowrap',
                          minWidth: 120,
                          py: 1.5,
                          borderColor: borderColor,
                          bgcolor: bgColor,
                          color: isSelected ? 'common.white' : 'text.primary',
                          '&:hover': { 
                            borderColor: borderColor,
                            bgcolor: bgColor,
                            opacity: 0.9
                          },
                          flexShrink: 0
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2">
                            {date.display}
                          </Typography>
                          <Typography variant="caption">
                            {date.count} partido{date.count > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Button>
                    );
                  })
                ) : (
                  <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                    No hay partidos programados
                  </Typography>
                )}
              </Box>

              <IconButton onClick={() => handleScroll('right')}>
                <ChevronRight fontSize="large" />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ width: '100%', maxWidth: 300 }}>
              <CustomDateInput />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ 
          minHeight: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 2,
          flexDirection: 'column',
          gap: 2,
          p: 3
        }}>
          <Typography variant="h6" color="text.secondary">
            {selectedDate 
              ? `Partidos del ${formatearFecha(selectedDate)}`
              : 'Selecciona una fecha para ver los partidos'}
          </Typography>
          <Divider sx={{ width: '60%' }} />
          
          <Box sx={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            {renderPartidos()}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default Calendario;