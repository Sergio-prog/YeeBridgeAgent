import logging

# Logging configuration
logging.basicConfig(level=logging.INFO)


# Configuration object
class Config:
    WEB3RPCURL = {
        "56": "https://bsc-dataseed.binance.org",
        "42161": "https://arb1.arbitrum.io/rpc",
        "137": "https://polygon-rpc.com",
        "1": "https://eth.llamarpc.com/",
        "10": "https://mainnet.optimism.io",
        "8453": "https://mainnet.base.org",
    }
    NATIVE_TOKENS = {
        "137": "MATIC",
        "56": "BNB",
        "1": "ETH",
        "42161": "ETH",
        "10": "ETH",
        "8453": "ETH",
    }
    ERC20_ABI = [
        {
            "constant": True,
            "inputs": [],
            "name": "decimals",
            "outputs": [{"name": "", "type": "uint8"}],
            "payable": False,
            "stateMutability": "view",
            "type": "function",
        },
        {
            "constant": True,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "payable": False,
            "stateMutability": "view",
            "type": "function",
        },
        {
            "constant": True,
            "inputs": [
                {
                    "name": "",
                    "type": "address"
                },
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": False,
            "stateMutability": "view",
            "type": "function"
        },
    ]
    CHAINS = [
        {
            "name": "Base Sepolia",
            "chain_id": 84532,
        },
        {
            "name": "Arbitrum Sepolia",
            "chain_id": 421614,
        }
    ]
    CHAIN_IDS = list(map(lambda x: x["chain_id"], CHAINS))

    AVAILABLE_TOKENS = {
        "USDT": {
            84532: {
                "address": "0x408DdbB94C985f8Fec4D3Bb8d4b05d69D0620283",
                "resource": "0x000000000000000000000000408DdbB94C985f8Fec4D3Bb8d4b05d69D0620283",
            },
            421614: {
                "address": "0x21B18e8c6c8e4eB7f05Fa6A48373002AA389Feec",
                "resource": "0x000000000000000000000000408DdbB94C985f8Fec4D3Bb8d4b05d69D0620283",
            },
        },
    }

    BRIDGE_ADDRESS = {
        421614: "0x303AE9878288cd970741C568377059B27F47735F"
    }
    BRIDGE_ABI = [
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "resourceId",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint64",
                    "name": "destChainId",
                    "type": "uint64"
                }
            ],
            "name": "deposit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
    ]
