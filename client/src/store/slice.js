import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    login:false,
    username:'',
    userBalance:90000
}

const slice = createSlice({
    name:'store',
    initialState,
    reducers:{
        setLoginState :(state,action)=>{
            state.login = action.payload
        },
        setUsername:(state,action)=>{
            state.username = action.payload
        },
        setUserBalance:(state,action)=>{
            state.userBalance = action.payload
        }
    }
})

export const { setLoginState,setUsername,setUserBalance} = slice.actions

export default slice.reducer