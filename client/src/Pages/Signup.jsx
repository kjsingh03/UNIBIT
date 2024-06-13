import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

// const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
// const contractABI = [/* ABI from the compiled contract */];
// const contractAddress = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
// const contract = new web3.eth.Contract(contractABI, contractAddress);

function App() {
    const [account, setAccount] = useState('');
    const [amount, setAmount] = useState(0);
    const [walletAddress, setWalletAddress] = useState('');
    const [recipients, setRecipients] = useState([]);
    const [pool, setPool] = useState(0);

    useEffect(() => {
        async function load() {
            const accounts = await web3.eth.requestAccounts();
            setAccount(accounts[0]);
            updatePool();
        }
        load();
    }, []);

    const enterRoom = async () => {
        await contract.methods.enterRoom(walletAddress, web3.utils.toWei(amount, 'ether')).send({ from: account })
            .on('transactionHash', function (hash) {
                console.log('Transaction sent: ', hash);
            })
            .on('receipt', function (receipt) {
                console.log('Transaction confirmed: ', receipt);
                updatePool();
            })
            .on('error', function (error, receipt) {
                console.error('Error: ', error);
            });
    };

    const distributePool = async () => {
        await contract.methods.distributePool(recipients).send({ from: account })
            .on('transactionHash', function (hash) {
                console.log('Transaction sent: ', hash);
            })
            .on('receipt', function (receipt) {
                console.log('Transaction confirmed: ', receipt);
                updatePool();
            })
            .on('error', function (error, receipt) {
                console.error('Error: ', error);
            });
    };

    const updatePool = async () => {
        const pool = await contract.methods.getTotalPool().call();
        setPool(web3.utils.fromWei(pool, 'ether'));
    };

    return (
        <div>
            <h1>Token Redistribution</h1>
        </div>
    );
}

export default App;