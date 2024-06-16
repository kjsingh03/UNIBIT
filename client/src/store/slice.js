import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    login:false,
    username:'',
    userBalance:90000,
    unibitBalance:0
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
        },
        setUnibitBalance:(state,action)=>{
            state.unibitBalance = action.payload
        },
    }
})

export const { setLoginState,setUsername,setUserBalance,setUnibitBalance} = slice.actions

export default slice.reducer