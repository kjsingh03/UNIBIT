import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { logo } from '../assets';
import { setAlertMessage, setAlertState, setUserBalance } from '../store/slice';
import { Input } from '../components';
import Web3 from 'web3';
import uibtABI from '../utils/unibit.json'
import contractAbi from '../utils/pool.json'

const unibitTokenAddress = import.meta.env.VITE_UNIBIT_TOKEN_ADDRESS;

const unibitTokenABI = uibtABI;

const poolContractAddress = import.meta.env.VITE_POOL_CONTRACT_ADDRESS;

const poolAbi = contractAbi;

function Room() {
	const { roomName } = useParams();
	const [username, setUsername] = useState(sessionStorage.getItem('name') || '');
	const [users, setUsers] = useState([]);
	const [readyPlayers, setReadyPlayers] = useState([]);
	const [isReady, setIsReady] = useState(false);
	const [roomFull, setRoomFull] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [showNameModal, setShowNameModal] = useState(false);
	const [choice, setChoice] = useState(null);
	const [gameResult, setGameResult] = useState(null);
	const [canJoin, setCanJoin] = useState(false);
	const [joinedRoom, setJoinedRoom] = useState(false);
	const [isFlipping, setIsFlipping] = useState(false);
	const [playButton, setPlayButton] = useState(true)
	const [playAgain, setPlayAgain] = useState(false);
	const [showReady, setshowReady] = useState(false)
	const [startTime, setStartTime] = useState(0)
	const [betTime, setBetTime] = useState(10)
	const [roomId, setRoomId] = useState(0)
	const [walletAddress, setWalletAddress] = useState('')
	const [loader, setLoader] = useState(false)
	const [depositedAmount, setDepositedAmount] = useState(false)
	const socketRef = useRef(null);

	const userBalance = useSelector(state => state.userBalance);
	const loginState = useSelector(state => state.loginState);

	const dispatch = useDispatch();
	const navigate = useNavigate()

	const betAmounts = {
		'room1': 1000,
		'room2': 10000,
		'room3': 100000,
	};

	const betAmount = betAmounts[roomName];

	useEffect(() => {
		if (!socketRef.current) {
			socketRef.current = io(import.meta.env.VITE_SERVER_URL);
		}

		const socket = socketRef.current;

		const handleBeforeUnload = () => {
			socket.emit('leaveRoom', { roomName });
			if (depositedAmount) {
				socket.emit('returnAmount', { roomId, walletAddress, betAmount });
				dispatch(setUserBalance(userBalance + betAmount))
				setDepositedAmount(false)
				dispatch(setAlertState(true))
				dispatch(setAlertMessage({ message: 'Amount will be refunded to your account in a while', type: 'alert' }))
				setTimeout(() => dispatch(setAlertState(false)), 1000)
			}
		};

		window?.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			if (socket) {
				socket.emit('leaveRoom', { roomName });
				if (depositedAmount) {
					socket.emit('returnAmount', { roomId, walletAddress, betAmount });
					dispatch(setUserBalance(userBalance + betAmount))
					setDepositedAmount(false)
					dispatch(setAlertState(true))
					dispatch(setAlertMessage({ message: 'Amount will be refunded to your account in a while', type: 'alert' }))
					setTimeout(() => dispatch(setAlertState(false)), 1000)
				}
				socket.disconnect();
			}
		};
	}, [roomName]);

	useEffect(() => {
		if (!socketRef.current) {
			socketRef.current = io(import.meta.env.VITE_SERVER_URL);
		}

		const socket = socketRef.current;

		const handleConnect = () => {
			console.log('Connected to server');
			socket.emit('enterRoom', { roomName })
		};

		const handleRoomFull = () => {
			setRoomFull(true);
		};

		const handleJoinedRoom = (isJoined) => {
			setJoinedRoom(isJoined);
		};

		const handlePlayerList = (playerList) => {
			setUsers(playerList.map(player => ({
				name: player.name,
				image: logo,
				id: player.id,
				state: readyPlayers.includes(player.name),
				betChoice: player.betChoice
			})));
		};

		const handleReadyPlayers = (readyPlayerList) => {
			setReadyPlayers(readyPlayerList);
			setUsers(prevUsers => prevUsers.map(user => ({
				...user,
				state: readyPlayerList.includes(user.id)
			})));
		};

		const handleStartCoinFlip = () => {
			setShowModal(true);
			setIsFlipping(true);
			setshowReady(false);
			setTimeout(() => {
				setChoice(p => { socket.emit('chooseSide', { choice: p, walletAddress }); return p; });
			}, 10000);
			setBetTime(10)
		};

		const handleGameResult = ({ result, winners, losers, winnings, losses }) => {
			setGameResult({ result, winners, losers, winnings, losses });
			setIsFlipping(false);
			setPlayAgain(true)
			setDepositedAmount(false)
			console.log(winners, winnings, result)
			document.querySelector('.bet-screen .bet-btns').childNodes.forEach(btn => { btn.disabled = false; btn.classList.remove('active') })
			if (result === choice) dispatch(setUserBalance(userBalance + winnings + betAmount))
			document.querySelector('.bet-screen')?.addEventListener('click', (e) => {
				if (!document.querySelector('.bet-modal').contains(e.target)) {
					setShowModal(false)
				}
			})
		};

		const handleRemovePlayer = (removeList) => {
			setShowModal(false);
		}

		const handleStartTime = (startTime) => {
			setStartTime(startTime);
		};

		const handleRoomIdGenerated = ({ result, roomId }) => {
			console.log(result, roomId)
			setRoomId(roomId)
			setLoader(false)
		}

		socket.on('connect', handleConnect);
		socket.on('roomFull', handleRoomFull);
		socket.on('joinedRoom', handleJoinedRoom);
		socket.on('playerList', handlePlayerList);
		socket.on('readyPlayers', handleReadyPlayers);
		socket.on('startCoinFlip', handleStartCoinFlip);
		socket.on('gameResult', handleGameResult);
		socket.on('removePlayer', handleRemovePlayer);
		socket.on('startGameTimer', handleStartTime);
		socket.on('roomIdGenerated', handleRoomIdGenerated);

		return () => {
			socket.off('connect', handleConnect);
			socket.off('joinedRoom', handleJoinedRoom);
			socket.off('roomFull', handleRoomFull);
			socket.off('playerList', handlePlayerList);
			socket.off('readyPlayers', handleReadyPlayers);
			socket.off('startCoinFlip', handleStartCoinFlip);
			socket.off('gameResult', handleGameResult);
			socket.off('removePlayers', handleRemovePlayer);
			socket.off('startGameTimer', handleStartTime);
			socket.off('roomIdGenerated', handleRoomIdGenerated);
		};
	}, [roomName, readyPlayers, choice]);

	useEffect(() => {
		let betTimeIntervalId;

		if (betTime > 0) {
			betTimeIntervalId = setInterval(() => {
				setBetTime(prevTime => {
					if (prevTime > 1) {
						return prevTime - 1;
					} else {
						clearInterval(betTimeIntervalId);
						return 0;
					}
				});
			}, 1000);
		}

		return () => {
			clearInterval(betTimeIntervalId);
		};
	}, [betTime]);

	useEffect(() => {
		let startTimeIntervalId;

		if (startTime > 0) {
			startTimeIntervalId = setInterval(() => {
				setStartTime(prevTime => {
					if (prevTime > 1) {
						return prevTime - 1;
					} else {
						clearInterval(startTimeIntervalId);
						return 0;
					}
				});
			}, 1000);
		}

		return () => {
			clearInterval(startTimeIntervalId);
		};
	}, [startTime]);

	useEffect(() => {
		setCanJoin(userBalance > betAmount && username !== '');
	}, [userBalance, betAmount, username]);

	useEffect(() => {
		document.querySelector('.name-screen')?.addEventListener('click', (e) => {
			if (!document.querySelector('.name-modal').contains(e.target)) {
				setShowNameModal(false)
			}
		})
	}, [showNameModal])

	const handleReady = () => {

		if (users?.length === 1) {
			dispatch(setAlertState(true))
			dispatch(setAlertMessage({ message: 'Please wait until others join', type: 'alert' }))
			setTimeout(() => dispatch(setAlertState(false)), 1000)
		}

		else if (!depositedAmount && users?.length >= 2)
			handleDeductAmt()

		else {
			// const socket = socketRef.current;
			// socket.emit('setReady');
			// setIsReady(!isReady);
			dispatch(setAlertState(true))
			dispatch(setAlertMessage({ message: 'Amount already deposited', type: 'alert' }))
			setTimeout(() => dispatch(setAlertState(false)), 1000)
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

			setWalletAddress(fromAddress)

			const amountInWei = web3.utils.toWei(betAmount.toString(), 'ether');

			const approveTx = await unibitToken.methods.approve(poolContractAddress, amountInWei).send({ from: fromAddress });

			const depositTx = await poolContract.methods.deposit(roomId, amountInWei).send({ from: fromAddress });

			setDepositedAmount(true)

			dispatch(setUserBalance(userBalance - betAmount))

			const socket = socketRef.current;
			socket.emit('setReady');
			setIsReady(!isReady);

		} catch (error) {
			socketRef.current.emit('leaveRoom', { roomName: roomName });
			dispatch(setAlertState(true))
			dispatch(setAlertMessage({ message: 'Failed to deposit amount', type: 'alert' }))
			setTimeout(() => dispatch(setAlertState(false)), 1000)
			setTimeout(() => navigate('/'), 1000)
		}
	};

	const handleChoice = (e) => {
		setChoice(e.target.innerText.toLowerCase());
		e.target.classList.add('active')
		document.querySelector('.bet-btns').childNodes.forEach(btn => btn.disabled = true)
	};

	const handlePlayClick = () => {
		if (loginState) {
			if (userBalance > betAmount && !username) {
				setShowNameModal(true);
			}
			else if (userBalance > betAmount && username) {
				handleJoinRoom();
			}
			else {
				dispatch(setAlertState(true))
				dispatch(setAlertMessage({ message: 'Insufficient balance to join the room', type: 'alert' }))
				setTimeout(() => dispatch(setAlertState(false)), 1000)
			}
		} else {
			dispatch(setAlertState(true))
			dispatch(setAlertMessage({ message: 'Kindly Connect Wallet First', type: 'alert' }))
			setTimeout(() => dispatch(setAlertState(false)), 1000)
		}
	};

	const handleNameSubmit = (e) => {
		e.preventDefault();
		if (username) {
			sessionStorage.setItem('name', username);
			setShowNameModal(false)
			handleJoinRoom();
		}
	};

	const handleJoinRoom = () => {
		const socket = socketRef.current;
		setLoader(true)
		socket.emit('joinRoom', { roomName: roomName, username });
		setPlayButton(false)
		setshowReady(true)
	};

	const handleLeaveRoom = () => {
		if (!depositedAmount) {
			socketRef.current.emit('leaveRoom', { roomName: roomName });
			setStartTime(0);
			setTimeout(() => navigate('/'), 1000)
		}
		else {
			socketRef.current.emit('leaveRoom', { roomName: roomName });
			socketRef.current.emit('returnAmount', { roomId, walletAddress, betAmount:betAmount*(10**18) });
			dispatch(setUserBalance(userBalance + betAmount))
			setDepositedAmount(false)
			dispatch(setAlertState(true))
			dispatch(setAlertMessage({ message: 'Amount will be refunded to your account in a while', type: 'alert' }))
			setTimeout(() => dispatch(setAlertState(false)), 1000)
			setTimeout(() => navigate('/'), 1000)
		}

	};

	const handlePlayAgain = () => {
		if (userBalance > betAmount && !username) {
			setShowNameModal(true);
		}
		else if (userBalance > betAmount && username) {
			setGameResult(null);
			setPlayAgain(false);
			setshowReady(true)
			setDepositedAmount(false)
			users.forEach(user => user.betChoice = null)
			handleReady()
		}
		else {
			dispatch(setAlertState(true))
			dispatch(setAlertMessage({ message: 'Insufficient balance to join the room', type: 'alert' }))
			setTimeout(() => dispatch(setAlertState(false)), 1000)
		}
	};

	if (roomFull) {
		return <div className='pt-32 text-2xl'>Room is full. Please try again later.</div>;
	}

	return (
		<>

			{
				loader ?
					<div className="pt-32 h-[90vh] bg-[#0000004b] w-screen z-50 fixed top-[5rem] left-0 flex justify-center items-center">
						<div className="flex flex-col gap-3 items-center">
							<div className="border-4 border-[#00ACE6] border-t-transparent animate-spin h-16 w-16 rounded-[50%]">
								&nbsp;
							</div>
							<div className="">
								<p>Joining Room </p>
							</div>
						</div>
					</div>
					:
					(<div className='flex flex-col gap-8 pt-32'>
						<div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-[95%] 2xl:w-[80%] mx-auto lg:h-[80vh] 2xl:h-[75vh] ">
							<div className={`flex flex-col items-center gap-6 lg:py-12 ${(!users.length > 0 || !joinedRoom) ? 'w-full' : 'w-max'} ${joinedRoom ? 'border' : ''} transition-[height] ease-in duration-300 p-4 rounded-xl ${users.length > 0 && users.filter(user => user.id === socketRef?.current?.id)[0]?.state ? 'border-green-600' : 'border-red-600'}`}>
								<div className="w-64">
									<img src={logo} className='w-full h-full object-contain' alt="Card Logo" />
								</div>
								{
									!joinedRoom &&
									<p className='text-xl font-medium'>Amount : {betAmount} $UIBT</p>
								}
								{
									joinedRoom &&
									<p className='text-xl font-medium'>{username}</p>
								}
								{
									users.filter(user => user.id === socketRef?.current?.id)[0]?.betChoice &&
									<div className="flex gap-2 bet-btns">
										<div className="flex flex-col gap-1 items-center">
											<button className={`btn selected-btn`}>Heads</button>
											{
												users.filter(user => user.id === socketRef?.current?.id)[0]?.betChoice === 'heads' &&
												<i className="fa-solid fa-check text-green-600"></i>
											}
										</div>
										<div className="flex flex-col gap-1 items-center">
											<button className={`btn selected-btn`}>Tails</button>
											{
												users.filter(user => user.id === socketRef?.current?.id)[0]?.betChoice === 'tails' &&
												<i className="fa-solid fa-check text-green-600"></i>
											}
										</div>
									</div>
								}
								{
									playButton &&
									<button className={`btn btn1 `} onClick={handlePlayClick} disabled={roomFull}>Play</button>
								}
								{
									playAgain &&
									<button className={`btn btn1`} onClick={handlePlayAgain} disabled={roomFull}>Bet again</button>
								}
								{
									<div className={`${joinedRoom && showReady && !playAgain ? 'block' : 'hidden'} w-full text-center flex justify-center items-center gap-3`}>
										<button className='btn btn1' onClick={handleReady} disabled={!canJoin}>BET</button>
									</div>
								}
							</div>
							{
								users.length > 0 && joinedRoom &&
								<div className="flex flex-col gap-8 w-full lg:w-[50vw]">
									<div className="w-full flex items-center justify-end h-10">
										{
											startTime !== 0 && !showModal && !gameResult &&
											<div className="flex items-center gap-2">
												<div>Game starting in </div>
												<div className="border-2 border-[#00ACE6] text-lg font-medium py-1 px-2 rounded-[50%] w-10 h-10 text-center">{startTime}</div>
											</div>
										}
									</div>
									<div className="grid grid-cols-2 2xl:grid-cols-3 gap-4 overflow-y-auto px-2">
										{
											users?.filter(user => user.id !== socketRef.current.id)?.length > 0 &&
											users?.filter(user => user.id !== socketRef.current.id).map((user, index) => (
												<div key={index} className={`flex flex-col items-center justify-between gap-2 bg-[#5f5f5f0a] transition-all ease-in duration-300 ${user?.betChoice ? 'h-48' : 'h-32'} p-4 rounded-xl ${user.state ? 'border-green-600' : 'border-red-600'} border`}>
													<div className="w-16 h-16">
														<img src={user.image} className='w-full h-full object-cover' alt="user image" />
													</div>
													<p className='text-xl font-medium'>{user.name}</p>
													{
														user?.betChoice &&
														<div className="flex gap-2 bet-btns">
															<div className="flex flex-col gap-1 items-center">
																<button className={`btn selected-btn`}>Heads</button>
																{
																	user?.betChoice === 'heads' &&
																	<i className="fa-solid fa-check text-green-600"></i>
																}
															</div>
															<div className="flex flex-col gap-1 items-center">
																<button className={`btn selected-btn`}>Tails</button>
																{
																	user?.betChoice === 'tails' &&
																	<i className="fa-solid fa-check text-green-600"></i>
																}
															</div>
														</div>
													}
												</div>
											))
										}
										{
											users?.filter(user => user.id !== socketRef.current.id).length === 0 &&
											<div className="col-span-3 w-full text-center text-xl">Please wait until others join</div>
										}
									</div>
									<div className={`${joinedRoom && showReady ? 'block' : 'hidden'} w-full text-end flex justify-end items-center gap-3`}>
										<button className='btn btn2' onClick={handleLeaveRoom}>Leave Room</button>
									</div>
								</div>
							}
						</div>

						<div className={`name-screen bg-[#00000067] ${showNameModal ? 'flex' : 'hidden'} justify-center items-center z-[49] w-screen h-screen fixed top-0 left-0`}>
							<div className="name-modal relative border border-slate-400/25 w-[95%] sm:w-[30rem] h-40 rounded-lg flex items-center justify-center">
								<form onSubmit={handleNameSubmit} className='w-full px-4 flex flex-col xs:flex-row gap-4 items-center justify-center'>
									<p onClick={() => setShowNameModal(false)} className="w-full text-right xs:absolute cursor-pointer top-3 right-4 text-[#00ACE6] text-3xl font-bold">&times;</p>
									<Input type="text" value={username} handleChange={(e) => setUsername(e.target.value)} placeholder="Enter your name" className="border p-2" required />
									<button type="submit" className='btn btn1'>Join Room</button>
								</form>
							</div>
						</div>

						<div className={`bet-screen bg-[#00000067] ${showModal ? 'flex' : 'hidden'} justify-center items-center z-[49] w-screen h-screen fixed top-0 left-0`}>
							<div className="bet-modal relative border backdrop-blur-sm border-slate-400/25 w-[95%] sm:w-[30rem] h-96 rounded-lg flex flex-col items-center gap-4 justify-center">
								<div className="flex items-center gap-2">
									<h1 className='text-3xl font-semibold'>Choose Heads or Tails</h1>
									<div className="border-2 border-[#00ACE6] text-lg font-medium py-1 px-2 rounded-[50%] w-10 h-10 text-center">{betTime}</div>
								</div>
								<div className={`coin ${isFlipping ? 'flipping' : ''}`}>
									<div className={`side heads-img ${gameResult?.result === 'heads' ? 'show' : ''}`}></div>
									<div className={`side tails-img ${gameResult?.result === 'tails' ? 'show' : ''}`}></div>
								</div>
								<div className="flex gap-2 bet-btns">
									<button className={`btn btn1 bet-btn `} onClick={handleChoice}>Heads</button>
									<button className={`btn btn1 bet-btn `} onClick={handleChoice}>Tails</button>
								</div>
								{
									gameResult &&
									<div className="h-8">
										{
											gameResult?.result === choice && gameResult &&
											<p className='text-2xl font-semibold'>Congrats! You won {gameResult?.winnings} $UIBT</p>
										}
										{
											gameResult?.result !== choice && gameResult &&
											<p className='text-2xl font-semibold'>Oops! You got rugged {gameResult?.losses} $UIBT</p>
										}
									</div>
								}
							</div>
						</div>
					</div>)

			}
		</>
	)

}

export default Room;

