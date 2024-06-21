import React, { useState } from 'react';
import Web3 from 'web3';
import uibtABI from '../utils/unibit.json'
import contractAbi from '../utils/pool.json'

const unibitTokenABI = uibtABI;

const unibitTokenAddress = import.meta.env.VITE_UNIBIT_TOKEN_ADDRESS;

const poolContractAddress = import.meta.env.VITE_POOL_CONTRACT_ADDRESS;

const poolAbi = contractAbi;

const DeductAmtButton = () => {
	const [wallet, setWallet] = useState('');
	const [amount, setAmount] = useState('');
	const [account, setAccount] = useState('');
	const [unibitBalance, setUnibitBalance] = useState(0);

	const connectWallet = async () => {
		if (typeof window.ethereum !== 'undefined') {
			const web3 = new Web3(window.ethereum);
	
			try {
				const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
				setAccount(accounts[0]);
	
				const unibitTokenContract = new web3.eth.Contract(unibitTokenABI, unibitTokenAddress);
	
				const balance = await unibitTokenContract.methods.balanceOf(accounts[0]).call();
				setUnibitBalance(parseInt(balance) / 10 ** 18);
			} catch (error) {
				console.error('Error connecting to MetaMask', error);
			}
		} else {
			console.error('MetaMask is not installed');
		}
	};
	
	const handleDeductAmt = async () => {
		if (!window.ethereum) {
			dispatch(setAlertState(true))
			dispatch(setAlertMessage({ message: 'Please install MetaMask!', type: 'alert' }))
			setTimeout(() => dispatch(setAlertState(false)), 1000)
			return;
			
		}
	
		const web3 = new Web3(window.ethereum);
	
		try {
			const poolContract = new web3.eth.Contract(poolAbi, poolContractAddress);
			const unibitToken = new web3.eth.Contract(unibitTokenABI, unibitTokenAddress);
	
			const accounts = await web3.eth.getAccounts();
			const fromAddress = accounts[0];
	
			// Ensure amount is in correct units (wei)
			const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
	
			const approveTx = await unibitToken.methods.approve(poolContractAddress, amountInWei).send({ from: fromAddress });
			console.log('Approval transaction:', approveTx);
			console.log(amountInWei)
			
			const depositTx = await poolContract.methods.deposit(amountInWei).send({ from: fromAddress });
			console.log('Deposit transaction:', depositTx);
			console.log(amountInWei)
	
			dispatch(setAlertState(true))
			dispatch(setAlertMessage({ message: 'Transaction successful!', type: 'alert' }))
			setTimeout(() => dispatch(setAlertState(false)), 1000)

		} catch (error) {
			dispatch(setAlertState(true))
			dispatch(setAlertMessage({ message: 'Transaction failed!', type: 'alert' }))
			setTimeout(() => dispatch(setAlertState(false)), 1000)
		}
	};

	console.log(amount)

	return (
		<div className="flex flex-col gap-4">
			<div>
				{account ? (
					<div>
						<p>Connected Account: {account}</p>
						<p>Unibit Balance: {unibitBalance}</p>
					</div>
				) : (
					<button className='btn' onClick={connectWallet}>Connect Wallet</button>
				)}
			</div>
			<div className='pt-64 flex gap-3'>
				<input type="text" placeholder="Wallet Address" value={wallet} onChange={(e) => setWallet(e.target.value)} />
				<input type="text" placeholder="Amount in Unibit" value={amount} onChange={(e) => setAmount(e.target.value)} />
				<button className='btn' onClick={handleDeductAmt}>Deduct Amount</button>
			</div>
		</div>
	);
};

export default DeductAmtButton;