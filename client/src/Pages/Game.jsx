import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'
import { logo } from '../assets';
import { Input } from '../components';
import { setAlertMessage, setUserBalance } from '../store/slice';
import axios from 'axios'
import Web3 from 'web3';
import uibtABI from '../utils/unibit.json'
import gameABI from '../utils/game.json'
import '../App.css'

const unibitTokenAddress = import.meta.env.VITE_UNIBIT_TOKEN_ADDRESS;

const unibitTokenABI = uibtABI;

const gameContractAddress = import.meta.env.VITE_GAME_CONTRACT_ADDRESS;

const gameContractAbi = gameABI;

function Game() {

    const { gameId } = useParams()
    const [choice, setChoice] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isFlipping, setIsFlipping] = useState(false);
    const [betTime, setBetTime] = useState(10)
    const [isDepositing, setIsDepositing] = useState(false)
    const [amountInWei, setAmountInWei] = useState()
    const [gameResult, setGameResult] = useState(null);
    const [eventListen, seteventListen] = useState(false)

    const userBalance = useSelector(state => state.userBalance);
    const loginState = useSelector(state => state.loginState);
    const walletAddress = useSelector(state => state.walletAddress);

    const dispatch = useDispatch();
    const navigate = useNavigate()

    const games = {
        'game1': 1000,
        'game2': 10000,
        'game3': 100000,
    }

    const betAmount = games[gameId]

    const checkForEvents = async () => {
        if (!window.ethereum) {
            console.error('Ethereum provider not found');
            return;
        }
    
        const web3 = new Web3(window.ethereum);
        const gameContract = new web3.eth.Contract(gameContractAbi, gameContractAddress);
    
        if (!gameContract) {
            console.error('Game contract is not initialized');
            return;
        }
    
        try {
            const latestBlock = await web3.eth.getBlockNumber();
    
            const events = await gameContract.getPastEvents('deposit', {
                filter: { user: walletAddress },
                fromBlock: (BigInt(latestBlock) - BigInt(100)).toString(),
                toBlock: 'latest',
            });
    
            events.forEach(event => {
                console.log(event);
                const eventId = `${event.transactionHash}-${event.logIndex}`;
                console.log('New resolvePool event received:');
                console.log('User:', event.returnValues.user);
                console.log('Amount:', web3.utils.fromWei(event.returnValues.amount.toString(), 'ether'));
                console.log('Result:', event.returnValues.result);
            });
        } catch (error) {
            console.error('Error checking for events:', error);
        }
    };
    
    useEffect(() => {
        checkForEvents();
    }, []);
    
    

    useEffect(() => {
        setBetTime(10)
        document.querySelector('.bet-screen').addEventListener('click', (e) => {
            if (!document.querySelector('.bet-modal').contains(e.target)) {
                setShowModal(false)
                document.querySelector('.bet-btns').childNodes.forEach(btn => btn.disabled = false)
                document.querySelector('.bet-btn.active')?.classList.remove('active')
                setChoice(null)
            }
        })
    }, [showModal])

    useEffect(() => {

        let betInterval = setInterval(() => {
            setBetTime(p => {
                if (p > 0)
                    return p - 1;
                else {
                    clearInterval(betInterval)
                    return 0;
                }
            })
        }, 1000)

        return () => clearInterval(betInterval)

    }, [betTime])

    const handleChoice = async (e) => {
        try {
            let newChoice = e.target.innerText.toLowerCase()
            setChoice(newChoice)
            e.target.classList.add('active')
            document.querySelector('.bet-btns').childNodes.forEach(btn => btn.disabled = true)

            const res = await distribute(walletAddress, amountInWei, newChoice)

            console.log(res)
        }
        catch (err) {
            console.log(err)
        }
    };

    const handlePlay = () => {
        if (loginState) {
            if (userBalance > betAmount) {
                handleDeductAmt()
            }
            else {
                dispatch(setAlertMessage({ message: 'Insufficient balance to play the bet', type: 'alert' }))
                setTimeout(() => dispatch(setAlertMessage({})), 1000)
            }
        } else {
            dispatch(setAlertMessage({ message: 'Kindly Connect Wallet First', type: 'alert' }))
            setTimeout(() => dispatch(setAlertMessage({})), 1000)
        }
    }

    const handleDeductAmt = async () => {
        if (!window.ethereum) {
            dispatch(setAlertMessage({ message: 'Please install MetaMask!', type: 'alert' }))
            setTimeout(() => dispatch(setAlertMessage({})), 1000)
            return;
        }

        setIsDepositing(true)
        try {
            const web3 = new Web3(window.ethereum);

            const gameContract = new web3.eth.Contract(gameContractAbi, gameContractAddress);
            const unibitToken = new web3.eth.Contract(unibitTokenABI, unibitTokenAddress);

            const amountInWei = web3.utils.toWei(betAmount.toString(), 'ether');
            setAmountInWei(amountInWei)

            const approveTx = await unibitToken.methods.approve(gameContractAddress, amountInWei).send({ from: walletAddress });

            const depositTx = await gameContract.methods.deposit(amountInWei).send({ from: walletAddress });

            dispatch(setUserBalance(userBalance - betAmount))

            setShowModal(true)

        } catch (error) {
            dispatch(setAlertMessage({ message: 'Transaction Failed', type: 'alert' }))
            setTimeout(() => dispatch(setAlertMessage({})), 1200);

        } finally {
            setIsDepositing(false)
        }
    }

    const distribute = async (walletAddress, amount, choice) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/distribute`, {
                walletAddress,
                amount,
                choice
            });

            if (res.data.response === 'Error in resolving pool') {
                const refundRes = await refund(walletAddress, amountInWei);
                dispatch(setAlertMessage({ message: res.data.response + ', initiating refund', type: 'alert' }))
                setTimeout(() => dispatch(setAlertMessage({})), 2000);
                return refundRes;
            }
            else {
                await checkForEvents();
                return res.data.response;
            }

        } catch (err) {
            const refundRes = await refund(walletAddress, amountInWei);
            dispatch(setAlertMessage({ message: res.data.response + ', initiating refund', type: 'alert' }))
            setTimeout(() => dispatch(setAlertMessage({})), 2000);
            return 'Error in resolving pool, refunding pool';
        }
    };

    const refund = async (walletAddress, refundAmount) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/refund`, {
                walletAddress,
                refundAmount
            });

            if (res.data.response === 'Refund successful') {
                dispatch(setUserBalance(userBalance + refundAmount / 10 ** 18))
                dispatch(setAlertMessage({ message: res.data.response, type: 'alert' }))
                setTimeout(() => dispatch(setAlertMessage({})), 2000);
            } else {
                dispatch(setAlertMessage({ message: res.data.response, type: 'alert' }))
                setTimeout(() => dispatch(setAlertMessage({})), 2000);
            }
            return res.data.response;
        }
        catch (err) {
            dispatch(setAlertMessage({ message: 'Error in refunding', type: 'alert' }))
            setTimeout(() => dispatch(setAlertMessage({})), 1200);
            return 'Error in refunding';
        }
    }

    return (
        <div>
            <div className='flex flex-col gap-8 pt-32 h-screen overflow-y-auto'>
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-[95%] md:w-[80%] mx-auto lg:h-[80vh] 2xl:h-[75vh] ">

                    <div className={`flex flex-col items-center gap-6 lg:py-12 `}>
                        <div className="w-64">
                            <img src={logo} className='w-full h-full object-contain' alt="Card Logo" />
                        </div>
                        <p className='text-xl font-medium'>Amount : {betAmount} $UIBT</p>
                        <div className={` w-full text-center flex justify-center items-center gap-3`}>
                            <button className='btn btn1' onClick={handlePlay} disabled={isDepositing}>BET</button>
                        </div>

                    </div>
                </div>

                <div className={`bet-screen bg-[#00000067] ${showModal ? 'flex' : 'hidden'} justify-center items-center z-[49] w-screen h-screen fixed top-0 left-0`}>
                    <div className="bet-modal relative border backdrop-blur-sm border-slate-400/25 w-[95%] sm:w-[30rem] h-96 rounded-lg flex flex-col items-center gap-4 justify-center">
                        <div className="flex items-center gap-2">
                            <h1 className='text-xl md:text-3xl font-semibold'>Choose Heads or Tails</h1>
                            <div className="border-2 border-[#00ACE6] text-lg font-medium py-1 px-2 rounded-[50%] w-10 h-10 text-center">{betTime}</div>
                        </div>
                        <div className={`coin ${isFlipping ? 'flipping' : ''}`}>
                            <div className={`side heads-img ${gameResult?.result === 'heads' ? 'show' : ''}`}></div>
                            <div className={`side tails-img ${gameResult?.result === 'tails' ? 'show' : ''}`}></div>
                        </div>
                        {
                            !gameResult &&
                            <div className="flex gap-2 bet-btns">
                                <button className={`btn btn1 bet-btn `} onClick={handleChoice}>Heads</button>
                                <button className={`btn btn1 bet-btn `} onClick={handleChoice}>Tails</button>
                            </div>
                        }
                        {
                            gameResult &&
                            <div className="h-8">
                                {
                                    gameResult?.result === choice && gameResult &&
                                    <p className='text-xl md:text-2xl font-semibold'>{gameResult.winnings > 0 ? `Congrats! You won ${gameResult.winnings} $UIBT` : `Tie! You will get refunded`}</p>
                                }
                                {
                                    gameResult?.result !== choice && gameResult &&
                                    <p className='text-xl md:text-2xl font-semibold'>Oops! You got rugged {gameResult.losses} $UIBT</p>
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Game