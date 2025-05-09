import { useSelector } from "react-redux"
import { Navigate, Outlet } from "react-router-dom";
import { PublicRoutes } from "../routes";

export const AuthGuard=()=>{
    const userState=useSelector((store)=>store.user);
    // console.log(userState);
    return userState.email? <Outlet/> : <Navigate replace to={PublicRoutes.HOME}/>;

}

export default AuthGuard;