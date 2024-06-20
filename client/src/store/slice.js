import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    loginState:false,
    userBalance:0
}

const slice = createSlice({
    name:'store',
    initialState,
    reducers:{
        setLoginState :(state,action)=>{
            state.loginState = action.payload
        },
        setUserBalance:(state,action)=>{
            state.userBalance = action.payload
        },
    }
})

export const { setLoginState,setUserBalance} = slice.actions

export default slice.reducer