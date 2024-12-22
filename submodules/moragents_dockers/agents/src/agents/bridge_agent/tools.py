import logging
import time

import requests
from src.agents.token_swap.config import Config
from web3 import Web3
from web3.types import Address


class InsufficientFundsError(Exception):
    pass


class TokenNotFoundError(Exception):
    pass


class SwapNotPossibleError(Exception):
    pass


def get_token_balance(web3: Web3, wallet_address: str, token_address: str, abi: list) -> int:
    """Get the balance of an ERC-20 token for a given wallet address."""
    if (
        not token_address
    ):  # If no token address is provided, assume checking ETH or native token balance
        return web3.eth.get_balance(web3.to_checksum_address(wallet_address))
    else:
        contract = web3.eth.contract(address=web3.to_checksum_address(token_address), abi=abi)
        return contract.functions.balanceOf(web3.to_checksum_address(wallet_address)).call()


def eth_to_wei(amount_in_eth: float) -> int:
    """Convert an amount in ETH to wei."""
    return int(amount_in_eth * 10**18)


def validate_bridge(web3: Web3, token1, token2, src_chain, dest_chain, amount, wallet_address):
    native = Config.NATIVE_TOKENS
    chains = Config.CHAIN_IDS
    tokens = Config.AVAILABLE_TOKENS

    token1, token2 = token1.upper(), token2.upper()
    #  token1 is the native token]
    if token1.lower() not in tokens:
        raise TokenNotFoundError(f"Token {token1} is invalid")

    token1_address = tokens[token1]
    token1_balance = get_token_balance(web3, wallet_address, token1_address, Config.ERC20_ABI)

    if token2 not in tokens:
        raise TokenNotFoundError(f"Token {token2} is invalid")
    token2_address = tokens[token2]

    # Check if the user has sufficient balance for the swap
    if token1_balance < convert_to_smallest_unit(web3, amount, token1_address):
        raise InsufficientFundsError(f"Insufficient funds to perform the bridge.")

    return token1_address, token1, token2_address, token2


def get_token_decimals(web3: Web3, token_address: str) -> int:
    if not token_address:
        return 18  # Assuming 18 decimals for the native gas token
    else:
        contract = web3.eth.contract(
            address=Web3.to_checksum_address(token_address), abi=Config.ERC20_ABI
        )
        return contract.functions.decimals().call()


def convert_to_smallest_unit(web3: Web3, amount: float, token_address: str) -> int:
    decimals = get_token_decimals(web3, token_address)
    return int(amount * (10**decimals))


def convert_to_readable_unit(web3: Web3, smallest_unit_amount: int, token_address: str) -> float:
    decimals = get_token_decimals(web3, token_address)
    return smallest_unit_amount / (10**decimals)


def get_quote(token1, token2, amount, src_chain_id, dest_chain_id):
    pass


def bridge_coins(token1, token2, src_chain, dest_chain, amount, chain_id, wallet_address):
    """Swap two crypto coins with each other"""
    web3 = Web3(Web3.HTTPProvider(Config.WEB3RPCURL[str(chain_id)]))
    t1_address, t1_id, t2_address, t2_id = validate_bridge(web3, token1, token2, src_chain, dest_chain, amount, wallet_address)

    return {
        "dst_token": t2_id,
        "dst_chain": dest_chain,
        "dst_address": t2_address,
        "src": t1_id,
        "src_address": t1_address,
        "src_amount": amount,
        "approve_tx_cb": "/approve",
        "swap_tx_cb": "/bridge",
    }, "bridge"


def check_allowance(token_address: str, wallet_address: str, chain_id):
    w3 = Web3(Web3.HTTPProvider(Config.WEB3RPCURL[str(chain_id)]))
    contract = w3.eth.contract(token_address, abi=Config.ERC20_ABI)  # type: ignore
    bridge_address = Config.BRIDGE_ADDRESS[chain_id]

    allowance_amount = contract.functions.allowance(wallet_address, bridge_address)



def get_tools():
    """Return a list of tools for the agent."""
    return [
        {
            "type": "function",
            "function": {
                "name": "bridge_agent",
                "description": "bridge between chains",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token1": {
                            "type": "string",
                            "description": "name or address of the cryptocurrency to sell",
                        },
                        "token2": {
                            "type": "string",
                            "description": "name or address of the cryptocurrency to buy",
                        },
                        "src_chain": {
                            "type": "string",
                            "description": "name of chain from we are send/bridge tokens"
                        },
                        "dest_chain": {
                            "type": "string",
                            "description": "name of chain to which we are send/bridge tokens",
                        },
                        "value": {
                            "type": "string",
                            "description": "Value or amount of the cryptocurrency to sell",
                        },
                    },
                    "required": ["token1", "token2", "src_chain", "dest_chain", "value"],
                },
            },
        }
    ]
