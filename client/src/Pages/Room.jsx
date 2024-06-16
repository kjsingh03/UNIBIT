import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { logo } from '../assets';
import { setUserBalance, setUsername } from '../store/slice';
import { Input } from '../components';

const unibitTokenABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "DOMAIN_SEPARATOR",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "DOMAIN_TYPEHASH",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "PERMIT_TYPEHASH",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "burn",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "nonces",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			},
			{
				"internalType": "uint8",
				"name": "v",
				"type": "uint8"
			},
			{
				"internalType": "bytes32",
				"name": "r",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "permit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

const unibitTokenAddress = '0xfc842DA376c6aAFFB154CaB03D51507c20301Aa0';

const poolContractAddress = '0x64Dd96b9063798eB6c0A4e5e227cc7901cCEfb2f';

const poolAbi = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

function Room() {
    const { id } = useParams();
    const [username, setUsername] = useState(localStorage.getItem('name') || '');
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
    const socketRef = useRef(null);
    const [betTime, setBetTime] = useState(10)
    const [isFlipping, setIsFlipping] = useState(false);
    const [playButton, setPlayButton] = useState(true)
    const [playAgain, setPlayAgain] = useState(false);
    const [showReady, setshowReady] = useState(false)
    const [removedModal, setRemovedModal] = useState(false)

    const userBalance = useSelector(state => state.userBalance);
    const dispatch = useDispatch();
    const navigate = useNavigate()

    const betAmounts = {
        'room1': 1,
        'room2': 10000,
        'room3': 100000,
    };

    const betAmount = betAmounts[id];

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io('http://localhost:3000');
        }

        const socket = socketRef.current;

        const handleConnect = () => {
            console.log('Connected to server');
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
            setIsFlipping(true)
            setshowReady(false)
            setTimeout(() => {
                setChoice((p) => { socket.emit('chooseSide', p); return p });
            }, 10000);
            setInterval(() => setBetTime(p => p > 0 ? p - 1 : 0), 1000)
        };

        const handleGameResult = ({ result, winners, losers, winnings, losses }) => {
            setGameResult({ result, winners, losers, winnings, losses });
            setIsFlipping(false);
            setPlayAgain(true);
            setPlayAgain(true)
            socketRef.current.emit('resetGame', { roomId: id });
            if (result === choice) dispatch(setUserBalance(userBalance + winnings + betAmount))
				document.querySelector('.bet-btns').childNodes.forEach(btn => btn.disabled = false)
			
			document.querySelector('.bet-screen').addEventListener('click', (e) => {
				if (!document.querySelector('.bet-modal').contains(e.target)) {
					setShowModal(false)
				}
			})
        };

        const handleRemovePlayer = (removeList) => {
            dispatch(setUserBalance(userBalance + betAmount))
               navigate("/")
        }

        socket.on('connect', handleConnect);
        socket.on('roomFull', handleRoomFull);
        socket.on('joinedRoom', handleJoinedRoom);
        socket.on('playerList', handlePlayerList);
        socket.on('readyPlayers', handleReadyPlayers);
        socket.on('startCoinFlip', handleStartCoinFlip);
        socket.on('gameResult', handleGameResult);
        socket.on('removePlayer', handleRemovePlayer);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('joinedRoom', handleJoinedRoom);
            socket.off('roomFull', handleRoomFull);
            socket.off('playerList', handlePlayerList);
            socket.off('readyPlayers', handleReadyPlayers);
            socket.off('startCoinFlip', handleStartCoinFlip);
            socket.off('gameResult', handleGameResult);
            socket.off('removePlayers', handleRemovePlayer);
        };
    }, [id, readyPlayers, choice]);


    useEffect(() => {
        setCanJoin(userBalance > betAmount && username !== '');
    }, [userBalance, betAmount, username]);

    useEffect(() => {
        document.querySelector('.name-screen').addEventListener('click', (e) => {
            if (!document.querySelector('.name-modal').contains(e.target)) {
                setShowNameModal(false)
            }
        })
    }, [showNameModal])

    const handleReady = () => {
        const socket = socketRef.current;
        socket.emit('setReady');
        console.log('click')
        setIsReady(!isReady);
    };

    const handleChoice = (e) => {
        setChoice(e.target.innerText.toLowerCase());
        e.target.classList.add('active')
        document.querySelector('.bet-btns').childNodes.forEach(btn => btn.disabled = true)
    };

    const handlePlayClick = () => {
        if (userBalance > betAmount && !username) {
            setShowNameModal(true);
        }
        else if (userBalance > betAmount && username) {
            handleJoinRoom();
        }
        else {
            alert('Insufficient balance to join the room');
        }
    };

    const handlePlayAgain = () => {
        setGameResult(null);
        setPlayAgain(false);
        setPlayButton(false);
        handleJoinRoom()
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (username) {
            localStorage.setItem('name', username);
            handleJoinRoom();
        }
    };

    const handleJoinRoom = () => {
        const socket = socketRef.current;
        socket.emit('joinRoom', { roomId: id, username });
        dispatch(setUserBalance(userBalance - betAmount))
        setShowNameModal(false);
        setPlayButton(false)
        setGameResult(null);
        setshowReady(true)
    };

    const handleLeaveRoom = () => {
        const socket = socketRef.current;
        socket.emit('leaveRoom', { roomId: id });
        navigate('/')
    };

    if (roomFull) {
        return <div>Room is full. Please try again later.</div>;
    }

    return (
        <div className='flex flex-col gap-8 pt-32'>
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-[95%] 2xl:w-[80%] mx-auto h-[80vh] 2xl:h-[75vh] ">
                <div className={`flex flex-col items-center gap-6 lg:py-12 ${(!users.length > 0 || !joinedRoom) ? 'w-full' : 'w-max'}`}>
                    <div className="w-64">
                        <img src={logo} className='w-full h-full object-contain' alt="Card Logo" />
                    </div>
                    <p className='text-xl font-medium'>Amount : {betAmount} $UIBT</p>
                    {/* <div className={`${showModal ? 'flex' : 'hidden'} flex flex-col items-center gap-4 justify-center bet-modal relative`}>
                        <div className="flex items-center gap-2">
                            <h1 className='text-xl font-semibold'>Choose Heads or Tails</h1>
                            <div className="border-2 border-[#00ACE6] text-lg font-medium py-1 px-2 rounded-[50%] w-10 h-10 text-center">{betTime}</div>
                        </div>
                        <div className="flex gap-2 bet-btns">
                            <button className={`btn btn1 bet-btn `} onClick={handleChoice}>Heads</button>
                            <button className={`btn btn1 bet-btn `} onClick={handleChoice}>Tails</button>
                        </div>
                    </div> */}
                    {/* {
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
                    } */}
                    {
                        playButton &&
                        <button className={`btn btn1 `} onClick={handlePlayClick} disabled={roomFull}>Play</button>
                    }
                    {
                        playAgain &&
                        <button className={`btn btn1`} onClick={()=>{navigate("/");setTimeout(()=>navigate(`/room/${id}`),5)}} disabled={roomFull}>Play again</button>
                    }
					{
						<div className={`${joinedRoom && showReady ? 'block' : 'hidden'} w-full text-center flex justify-center items-center gap-3`}>
						<button className='btn btn1' onClick={handleReady} disabled={!canJoin}>
							BET
						</button>
					</div>
					}
                </div>
                {
                    users.length > 0 && joinedRoom &&
                    <div className="flex flex-col gap-8 py-4 w-full lg:w-[50vw]">
                        <h6 className='text-lg font-bold'>Users Joined</h6>
                        <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4 overflow-y-auto px-2">
                            {
                                users?.map((user, index) => (
                                    <div key={index} className={`flex flex-col items-center justify-between gap-2 bg-[#5f5f5f0a] transition-all ease-in duration-300 ${user?.betChoice ? 'h-48' : 'h-32'} p-4 rounded-xl ${user.state ? 'border-green-600' : 'border-red-600'} border`}>
                                        <div className="w-16 h-16">
                                            <img src={user.image} className='w-full h-full object-cover' alt="user image" />
                                        </div>
                                        <p className='text-xl font-medium'>{user.name}</p>
                                        {
                                            user?.betChoice &&
                                            <div className="flex gap-2 bet-btns">
                                                <button className={`btn selected-btn ${user?.betChoice === 'heads' ? 'selected' : ''}`}>Heads</button>
                                                <button className={`btn selected-btn ${user?.betChoice === 'tails' ? 'selected' : ''}`}>Tails</button>
                                            </div>
                                        }
                                    </div>
                                ))
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

            <div className={`remove-screen bg-[#00000067] ${removedModal ? 'flex' : 'hidden'} justify-center items-center z-[49] w-screen h-screen fixed top-0 left-0`}>
                <div className="name-modal relative border border-slate-400/25 w-[95%] sm:w-[30rem] h-40 rounded-lg flex items-center justify-center">
                    <form onSubmit={handleNameSubmit} className='w-full px-4 flex flex-col xs:flex-row gap-4 items-center justify-center'>
                        <p onClick={() => setShowNameModal(false)} className="w-full text-right xs:absolute top-3 right-4 text-[#00ACE6] text-3xl font-bold">&times;</p>
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
        </div>
    );
}

export default Room;

