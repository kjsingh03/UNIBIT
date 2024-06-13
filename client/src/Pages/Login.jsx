import React, { useState } from 'react'
import { Input } from '../components'
import { Link } from 'react-router-dom'

function Login() {

    const [form, setForm] = useState({})

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const submitLogin= ()=>{
        console.log(form)
        
    }

    return (
        <div className='w-full h-screen flex flex-col items-center py-32'>
            <div className="flex flex-col gap-6 items-center bg-[#5f5f5f0a] w-[30rem] p-8 rounded-xl">
                <p className='text-3xl font-bold'>Login</p>
                <p className='text-lg font-medium'>Don't have an account? <Link to="/signup" className='underline hover:no-underline'>Signup</Link></p>
                <Input name='username' placeholder='Enter username' label='username' handleChange={handleChange} />
                <Input name='password' placeholder='Enter password' label='password' handleChange={handleChange} />
                <button className='btn' onClick={submitLogin}>Login</button>
            </div>
        </div>
    )
}

export default Login
