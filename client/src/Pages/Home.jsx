import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PlayerCard } from '../components'
import { coinLogo, hlogo, logo } from '../assets'

function Home() {

  return (
    <div className='flex flex-col gap-8 pt-32 pb-16'>
      <div className="flex flex-col gap-8 w-[95%] md:w-[80%] mx-auto">

        <div className="flex flex-col gap-4">
          <h1 className='text-3xl md:text-6xl text-center font-bold'>Wanna bet & earn?</h1>
          <h3 className='text-2xl md:text-4xl text-center font-bold'>Join the rooms below</h3>
        </div>

        <h6 className='text-lg font-bold' >Available Rooms</h6>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-2 place-items-center">
          <PlayerCard amount={100} img={logo} id={'room1'} />
          <PlayerCard amount={10000} img={coinLogo} id={'room2'} />
          <PlayerCard amount={100000} img={hlogo} id={'room3'} />
        </div>

      </div>
    </div>
  )
}

export default Home
