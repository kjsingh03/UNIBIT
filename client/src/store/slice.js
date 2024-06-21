import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    loginState: false,
    userBalance: 0,
    alertState: false,
    alertMessage: {
        message: '',
        type: ''
    },
}

const slice = createSlice({
    name: 'store',
    initialState,
    reducers: {
        setLoginState: (state, action) => {
            state.loginState = action.payload
        },
        setUserBalance: (state, action) => {
            state.userBalance = action.payload
        },
        setAlertState: (state, action) => {
            state.alertState = action.payload
        },
        setAlertMessage: (state, action) => {
            state.alertMessage = action.payload
        }
    }
})

export const { setLoginState, setUserBalance, setAlertMessage, setAlertState } = slice.actions

export default slice.reducer