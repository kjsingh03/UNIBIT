import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PlayerCard } from '../components'
import { coinLogo, hlogo, logo } from '../assets'

function Home() {

  return (
    <div className='flex flex-col gap-8 pt-32 pb-16 h-screen overflow-y-auto'>
      <div className="flex flex-col gap-8 w-[95%] md:w-[80%] mx-auto">

        <div className="flex flex-col gap-4">
          <h1 className='text-3xl md:text-6xl text-center font-bold'>Wanna Bet & Earn?</h1>
          <h3 className='text-2xl md:text-4xl text-center font-bold'>Join the rooms below</h3>
        </div>

        <h6 className='text-lg font-bold' >Multi Player Rooms</h6>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-2 place-items-center">
          <PlayerCard amount={1000} img={logo} roomId={'room1'} />
          <PlayerCard amount={10000} img={coinLogo} roomId={'room2'} />
          <PlayerCard amount={100000} img={hlogo} roomId={'room3'} />
        </div>

        <h6 className='text-lg font-bold' >Single Player Rooms</h6>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-2 place-items-center">
          <PlayerCard amount={1000} img={logo} gameId={'game1'} />
          <PlayerCard amount={10000} img={coinLogo} gameId={'game2'} />
          <PlayerCard amount={100000} img={hlogo} gameId={'game3'} />
        </div>

      </div>
    </div>
  )
}

export default Home
