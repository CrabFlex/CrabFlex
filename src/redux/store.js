import { configureStore } from "@reduxjs/toolkit";
import  userReducer  from "./states/user";



export default configureStore({
    reducer:{
        user:userReducer,
    },
})