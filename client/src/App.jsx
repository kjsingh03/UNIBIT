import React, { useEffect, useState } from 'react'
import './App.css'
import { Navbar } from './components'
import { Outlet } from 'react-router-dom'
import Alert from './components/Alert/Alert'
import { useSelector } from 'react-redux'

function App() {

  // useEffect(() => setTimeout(() => window.onresize = () => width > 768 ? location.reload() : '', 500), [])

  const alertState = useSelector(state => state.alertState)
  const alertMessage = useSelector(state => state.alertMessage)

  return (
    <>
      <Navbar />
      <div className="screen hidden z-[49] w-screen h-screen fixed top-0 left-0">
      </div>
      {
        alertState &&
        <Alert message={alertMessage?.message} type={alertMessage?.type} />
      }
      <Outlet />
    </>
  )
}

export default App
