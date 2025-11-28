let userScore = 0;
let computerScore = 0;

// DOM Elements
const userScore_span = document.getElementById('user-score');
const computerScore_span = document.getElementById('computer-score');
const result_p = document.querySelector('.result > p');
const rock_div = document.getElementById('r');
const paper_div = document.getElementById('p');
const scissors_div = document.getElementById('s');
const connectBtn = document.getElementById('connectBtn');

// --- WEB3 CONFIGURATION ---
// Вставь сюда адрес из Remix!
const contractAddress = "0x41a994942f58764b593F4E2611294F6c02326B91"; 

// ABI из Remix (я сделал его коротким, только нужная функция)
const contractABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "result",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "computerMove",
				"type": "uint8"
			}
		],
		"name": "GameResult",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint8",
				"name": "_playerMove",
				"type": "uint8"
			}
		],
		"name": "play",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	}
];

let provider;
let signer;
let contract;

// 1. Connect Wallet Function
async function connectWallet() {
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            
            const address = await signer.getAddress();
            connectBtn.innerText = `Connected: ${address.substring(0,6)}...`;
            result_p.innerText = "Wallet Connected! Make your move.";
        } catch (error) {
            console.error(error);
            result_p.innerText = "Connection failed.";
        }
    } else {
        alert("Please install MetaMask!");
    }
}

connectBtn.addEventListener('click', connectWallet);

// 2. Helper Functions
function convertToWord(moveIndex) {
    if (moveIndex === 0) return "Rock";
    if (moveIndex === 1) return "Paper";
    return "Scissors";
}

// 3. Game Logic (Blockchain Interaction)
async function game(moveName) {
    if (!contract) {
        alert("Please connect wallet first!");
        return;
    }

    // Convert letters to numbers for Solidity: r=0, p=1, s=2
    let moveNum;
    if (moveName === 'r') moveNum = 0;
    else if (moveName === 'p') moveNum = 1;
    else moveNum = 2;

    result_p.innerText = "Waiting for MetaMask confirmation...";
    
    try {
        // Call the smart contract "play" function
        // Sending 0.0001 BNB as bet
        const tx = await contract.play(moveNum, { value: ethers.utils.parseEther("0.0001") });
        
        result_p.innerText = "Transaction sent... Mining block...";
        
        // Wait for transaction to finish
        const receipt = await tx.wait();
        
        // Parse the event "GameResult" from the logs
        // Note: In complex apps we parse logs carefully, here let's assume it's the first event
        const event = receipt.events.find(x => x.event === "GameResult");
        const resultStr = event.args.result;
        const compMoveNum = event.args.computerMove;

        const userWord = convertToWord(moveNum);
        const compWord = convertToWord(compMoveNum);

        // Update UI based on result
        if (resultStr === "Win") {
            userScore++;
            userScore_span.innerHTML = userScore;
            result_p.innerHTML = `${userWord} (user) beats ${compWord} (comp). YOU WIN!`;
            document.getElementById(moveName).classList.add('green-glow');
            setTimeout(() => document.getElementById(moveName).classList.remove('green-glow'), 1000);
        } else if (resultStr === "Lose") {
            computerScore++;
            computerScore_span.innerHTML = computerScore;
            result_p.innerHTML = `${userWord} (user) loses to ${compWord} (comp). You lost...`;
            document.getElementById(moveName).classList.add('red-glow');
            setTimeout(() => document.getElementById(moveName).classList.remove('red-glow'), 1000);
        } else {
            result_p.innerHTML = `${userWord} equals ${compWord}. It's a draw.`;
            document.getElementById(moveName).classList.add('gray-glow');
            setTimeout(() => document.getElementById(moveName).classList.remove('gray-glow'), 1000);
        }

    } catch (error) {
        console.error(error);
        result_p.innerText = "Transaction failed or rejected.";
    }
}

// 4. Event Listeners
function main() {
    rock_div.addEventListener('click', () => game('r'));
    paper_div.addEventListener('click', () => game('p'));
    scissors_div.addEventListener('click', () => game('s'));
}

main();