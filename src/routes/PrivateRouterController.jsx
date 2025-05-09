import React from "react";
import { PrivateRoutes } from "./routeList";
import { Navigate, Route, Routes } from "react-router-dom";

import { Home} from "../views"

function PrivateRouterController() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={PrivateRoutes.HOME} />} />
        <Route path={PrivateRoutes.HOME} element={<Home/>} />
        {/* <Route path={PrivateRoutes.PERFIL} element={<Dashboard view={<UserInfo/>}/>} /> */}
        <Route path="*" element={<>PRIVATE / 404</> } />
      </Routes>
    </>
  );
}

export default PrivateRouterController;
