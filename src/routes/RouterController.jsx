import { HashRouter as BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
// import { Login } from "../views";
import { AuthGuard } from "../guards";
import React from "react";
import { PrivateRoutes } from "./routeList";
import PrivateRouterController from "./PrivateRouterController";
import PublicRouterController from "./PublicRouterController";

function RouterController() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path={"*"} element={<PublicRouterController/>} />
          <Route element={<AuthGuard />}>
            <Route path={`${PrivateRoutes.PRIVATE}/*`} element={<PrivateRouterController/>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default RouterController;
