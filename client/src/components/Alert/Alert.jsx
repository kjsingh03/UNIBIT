import React from 'react'
import { useDispatch } from 'react-redux'
import { setAlertState } from '../../store/slice'

function Alert({ message, type }) {

    const dispatch = useDispatch()

    return (
        <div className='w-[95%] md:w-[80%] lg:w-[40%] bg-[#00000066] border-2 border-[#00ACE6] px-2 py-2 text-center rounded-lg fixed mx-auto top-20 left-[50%] translate-x-[-50%] transition-all duration-300 ease-in'>
            <p className='text-xs md:text-xl'>{message}</p>
            <p className="absolute right-[4%] -top-[2px] md:top-1 text-2xl text-[#00ACE6] cursor-pointer" onClick={() => dispatch(setAlertState(false))}>&times;</p>
        </div>  
    )
}

export default Alert
