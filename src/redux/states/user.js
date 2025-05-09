import { createSlice } from "@reduxjs/toolkit";
export const EmptyUserState={
    id:0,
    email:'',
    token:'',
    campeonato:0,
    liga:0,
    equipo:0,
    seccion:0,
}

const setUserLocalStorage=(data)=>{
    localStorage.setItem('user',JSON.stringify(data))
}

const removeUserLocalStorage=()=>{
    localStorage.removeItem('user')
}


export const userSlice = createSlice({
    name:"user",
    initialState:localStorage.getItem('user')?JSON.parse(localStorage.getItem('user')):EmptyUserState,
    reducers:{
        createUser:(state,action)=>{
            // console.log(state,action)
            setUserLocalStorage(action.payload)
            return action.payload;
        },
        updateUser:(state,action)=>{
            const result={...state,...action.payload}
            return result;
        },
        resetUser:()=>{
            removeUserLocalStorage()
            return EmptyUserState;
        }
    }
})

export const {createUser,updateUser,resetUser}=userSlice.actions;

export default userSlice.reducer;