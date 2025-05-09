import React, { useEffect } from "react";
import { PrivateRoutes, PublicRoutes } from "./routeList";
import { Navigate, Route, Routes } from "react-router-dom";
import Template from '../environment/public/template/template'
import Home from "../environment/public/home/home";
import PreTorneo from "../environment/public/torneo/preTorneo";
import Torneo from "../environment/public/torneo/torneo";
import Equipo from "../environment/public/equipo/equipo";
import Calendario from "../environment/public/calendario/calendario";
// import { Login, Registro } from "../views";
import { useDispatch } from 'react-redux';
import { useSelector } from "react-redux"
import { updateUser } from "../redux/states/user";




function PublicRouterController() {
  const dispatch=useDispatch();
  const userState=useSelector((store)=>store.user);

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
    }
  }

  // useEffect(() => {    
  //   obtenerUltimoSegmentoUrl()
    
  // }, [userState.seccion])




  console.log(userState) 
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={PrivateRoutes.PRIVATE} />} />
        <Route path={"/"+PublicRoutes.HOME} element={<Template children={<Home idCampeonato={userState.campeonato}/>}/>} />
        <Route path={"/"+PublicRoutes.PRE_EQUIPO} element={<Template children={<PreTorneo idCampeonato={userState.campeonato} idLiga={userState.liga}/>}/>} />
        <Route path={"/"+PublicRoutes.TORNEO} element={<Template children={<Torneo idLiga={userState.liga} idCampeonato={userState.campeonato}/>}/>} />
        <Route path={"/"+PublicRoutes.EQUIPO_ID} element={<Template children={<Equipo idLiga={userState.liga} idCampeonato={userState.campeonato} idEquipo={userState.equipo}/>}/>} />
        <Route path={"/"+PublicRoutes.CALENDARIO} element={<Template children={<Calendario idCampeonato={userState.campeonato} idLiga={userState.liga}/>}/>} />
        {/* <Route path={PublicRoutes.LOGIN} element={<Login/>} />
        <Route path={PublicRoutes.REGISTRO} element={<Registro/>}/> */}

        <Route path="*" element={<>public / 404</> } />
      </Routes>
    </>
  );
}

export default PublicRouterController;
