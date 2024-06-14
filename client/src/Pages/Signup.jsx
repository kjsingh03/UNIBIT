// import React, { useState } from 'react';
// import Web3 from 'web3';

// const DistributePoolButton = () => {
//   const [addresses, setAddresses] = useState('');

//   const handleDistributePool = async () => {
//     if (!window.ethereum) {
//       alert('Please install MetaMask!');
//       return;
//     }

//     const web3 = new Web3(window.ethereum);
//     await window.ethereum.enable();

//     const contractAddress = '0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B';
//     const abi = [
//         {
//             "inputs": [
//                 {
//                     "internalType": "address",
//                     "name": "account",
//                     "type": "address"
//                 }
//             ],
//             "name": "balanceOf",
//             "outputs": [
//                 {
//                     "internalType": "uint256",
//                     "name": "",
//                     "type": "uint256"
//                 }
//             ],
//             "stateMutability": "view",
//             "type": "function"
//         },
//         {
//             "inputs": [
//                 {
//                     "internalType": "address",
//                     "name": "recipient",
//                     "type": "address"
//                 },
//                 {
//                     "internalType": "uint256",
//                     "name": "amount",
//                     "type": "uint256"
//                 }
//             ],
//             "name": "transfer",
//             "outputs": [
//                 {
//                     "internalType": "bool",
//                     "name": "",
//                     "type": "bool"
//                 }
//             ],
//             "stateMutability": "nonpayable",
//             "type": "function"
//         },
//         {
//             "inputs": [
//                 {
//                     "internalType": "address",
//                     "name": "sender",
//                     "type": "address"
//                 },
//                 {
//                     "internalType": "address",
//                     "name": "recipient",
//                     "type": "address"
//                 },
//                 {
//                     "internalType": "uint256",
//                     "name": "amount",
//                     "type": "uint256"
//                 }
//             ],
//             "name": "transferFrom",
//             "outputs": [
//                 {
//                     "internalType": "bool",
//                     "name": "",
//                     "type": "bool"
//                 }
//             ],
//             "stateMutability": "nonpayable",
//             "type": "function"
//         }
//     ];

//     const contract = new web3.eth.Contract(abi, contractAddress);

//     const accounts = await web3.eth.getAccounts();
//     const sender = accounts[0];

//     const addressArray = addresses.split(',').map(addr => addr.trim());

//     try {
//       await contract.methods.distributePool(addressArray).send({ from: sender });
//       alert('Distribution successful!');
//     } catch (error) {
//       console.error('Error:', error);
//       alert('Distribution failed!');
//     }
//   };

//   return (
//     <div>
//       <input type="text" placeholder="Comma-separated addresses" value={addresses} onChange={(e) => setAddresses(e.target.value)} />
//       <button onClick={handleDistributePool}>Distribute Pool</button>
//     </div>
//   );
// };

// export default DistributePoolButton;

import React, { useState } from 'react';
import Web3 from 'web3';

const DeductAmtButton = () => {
    const [wallet, setWallet] = useState('');
    const [amount, setAmount] = useState('');

    const handleDeductAmt = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();

        const contractAddress = '0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B';
        const abi = [
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

        const contract = new web3.eth.Contract(abi, contractAddress);

        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        try {
            await contract.methods.deductAmt(wallet, web3.utils.toWei(amount, 'ether')).send({ from: sender });
            alert('Transaction successful!');
        } catch (error) {
            console.error('Error:', error);
            alert('Transaction failed!');
        }
    };

    return (
        <div className='pt-64 flex gap-3'>
            <input type="text" placeholder="Wallet Address" value={wallet} onChange={(e) => setWallet(e.target.value)} />
            <input type="text" placeholder="Amount in Unibit" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={handleDeductAmt}>Deduct Amount</button>
        </div>
    );
};

export default DeductAmtButton;