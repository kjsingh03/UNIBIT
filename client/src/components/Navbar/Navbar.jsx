import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Web3 from 'web3';
import { hlogo } from '../../assets';
import { Link } from 'react-router-dom';
import { setUserBalance,setLoginState } from '../../store/slice';
import uibtABI from '../../utils/unibit.json'

const unibitTokenABI = uibtABI;

const unibitTokenAddress = import.meta.env.VITE_UNIBIT_TOKEN_ADDRESS;

function Navbar() {

	const dispatch = useDispatch()

	const userBalance = useSelector(state => state.userBalance)

	const connectWallet = async () => {
		if (typeof window.ethereum !== 'undefined') {
			const web3 = new Web3(window.ethereum);

			try {
				const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

				const unibitTokenContract = new web3.eth.Contract(unibitTokenABI, unibitTokenAddress);

				const balance = await unibitTokenContract.methods.balanceOf(accounts[0]).call();

				dispatch(setUserBalance(parseInt(balance) / 10 ** 18));
				dispatch(setLoginState(true))

			} catch (error) {
				alert('Error connecting to MetaMask or fetching balance', error);
			}
		} else {
			alert('MetaMask is not installed');
		}
	};

	useEffect(()=>{
		connectWallet()
	},[])

	const activateNavbar = () => {
		const navbar = document.querySelector('.navbar')
		const screen = document.querySelector('.screen')

		navbar.classList.add('active')
		screen.style.display = 'flex'

		screen.addEventListener('click', (e) => {
			if (!navbar.contains(e.target)) {
				screen.style.display = 'none'
				navbar.classList.remove('active')
			}
		})

	}

	return (
		<nav className='w-full fixed bg-[#00000066] h-[5rem]'>
			<div className="w-[95%] md:w-[80%] mx-auto flex items-center justify-between ">
				<Link to="/" className="w-32">
					<img src={hlogo} className='w-full -full object-cover' alt="UIBT Logo" />
				</Link>
				<div className="md:hidden">
				<button onClick={activateNavbar} id="navbar-toggler" className="text-xl py-[0.9rem] text-white"  >☰</button>
				</div>
				<ul className='navbar flex bg-[#000000] z-40 w-64 flex-col justify-center fixed top-0 right-0 h-screen translate-x-[100%] md:translate-x-0 md:bg-transparent md:w-auto md:flex-row md:justify-normal md:static md:h-auto items-center gap-4'>
					<li><Link to="/">Home</Link></li>
					<div>
						{userBalance ? (
							<div>
								<li>Unibit Balance: {userBalance}</li>
							</div>
						) : (
							<li><button onClick={connectWallet}>Connect Wallet</button></li>
						)}
					</div>
				</ul>
			</div>
		</nav>
	);
}

export default Navbar;
