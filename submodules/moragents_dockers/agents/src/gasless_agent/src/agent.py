import threading
import time
import logging
from datetime import datetime
from typing import Dict, Any
from cdp import *
from .config import Config

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class GaslessAgent:
    def __init__(self, agent_info: Dict[str, Any], llm: Any, llm_ollama: Any, embeddings: Any, flask_app):
        """
        Initialize the GaslessAgent for sending gasless usdc transactions.

        Parameters:
        - agent_info (dict): Configuration details for the agent.
        - llm (object): The main language model instance.
        - llm_ollama (object): An additional language model instance.
        - embeddings (object): Embedding model for handling vector representations.
        - flask_app (Flask): The Flask application instance.
        """
        self.agent_info = agent_info
        self.llm = llm
        self.llm_ollama = llm_ollama
        self.embeddings = embeddings
        self.flask_app = flask_app
        self.scheduled_tasks: Dict[str, threading.Thread] = {}
        self.wallets: Dict[str, Wallet] = {}

    def chat(self, request: Dict[str, Any], user_id: str) -> tuple[str, str]:
        """
        Process a chat request and schedule a gasless usdc transfer.

        Parameters:
        - request (dict): The user's request containing transfer details.
        - user_id (str): The unique identifier for the user.

        Returns:
        - tuple: A response message and the next turn agent.
        """
        try:
            action = request.get('action', '').lower()
            
            if action == 'create_wallet':
                wallet = self.create_wallet(user_id)
                return f"Wallet created successfully. Address: {wallet.address}", self.agent_info["name"]
            
            elif action == 'transfer':
                token = request.get('token', 'USDC')
                amount = float(request.get('amount', 0.00001))
                to_user_id = request.get('to_user_id')
                
                if not to_user_id:
                    raise ValueError("Recipient user ID is required.")
                
                if amount <= 0:
                    raise ValueError("Transfer amount must be positive.")
                
                task_id = self.schedule_transfer(user_id, to_user_id, token, amount)
                return f"Scheduled a gasless transfer of {amount} {token} to user {to_user_id}. Task ID: {task_id}", self.agent_info["name"]
            
            else:
                return "Invalid action. Available actions: create_wallet, transfer", self.agent_info["name"]

        except ValueError as e:
            return f"Error: {str(e)}", self.agent_info["name"]
        except Exception as e:
            return f"An unexpected error occurred: {str(e)}", self.agent_info["name"]

    def set_cdp_api_key(self, request):

        data = request.get_json()
        required_keys = [
            "api_key",
            "api_secret",
        ]

        if not all(key in data for key in required_keys):
            logger.warning("Missing required API credentials")
            return {"error": Config.ERROR_MISSING_API_CREDENTIALS}, 400

        # Save these credentials to local storage
        for key in required_keys:
            self.flask_app.config[key] = data[key]

        return {"success": "API credentials saved successfully"}, 200
    

    def create_wallet(self, user_id: str, request) -> Wallet:
        """
        Create a new wallet for a user.

        Parameters:
        - user_id (str): The unique identifier for the user.

        Returns:
        - Wallet: The newly created wallet object.
        """

        data = request.get_json()
        required_keys = [
            "api_key",
            "api_secret",
        ]
        if not all(key in data for key in required_keys):
            logger.warning("Missing required API credentials")
            return {"error": Config.ERROR_MISSING_API_CREDENTIALS}, 400

        try:
            client = cdp.Client(
                consumer_key=data["api_key"],
                consumer_secret=data["api_secret"],
            )

            wallet = client.Wallet.create("base-mainnet")
            self.wallets[user_id] = wallet
            print(f"Wallet successfully created for user {user_id}: {wallet}")
            return wallet
        
        except Exception as e:
            logger.error(f"Error creating wallet: {str(e)}")
            raise
    
    def schedule_transfer(self, from_wallet: Wallet, to_wallet: Wallet, token: str, amount: float) -> str:
        """
        Schedule a gasless transfer task.

        Parameters:
        - from_wallet (Wallet): The wallet of the sender.
        - to_wallet (Wallet): The wallet of the recipient.
        - token (str): The token to transfer.
        - amount (float): The amount to transfer.

        Returns:
        - str: The unique task ID for the scheduled transfer.
        """
        task_id = f"{from_wallet.address}_to_{to_wallet.address}_{datetime.utcnow().timestamp()}"

        def task():
            try:
                self.execute_transfer(from_wallet, to_wallet, token, amount)
            except Exception as e:
                print(f"Error executing transfer: {str(e)}")

        t = threading.Thread(target=task, daemon=True)
        t.start()

        self.scheduled_tasks[task_id] = t

        return task_id

    def execute_transfer(self, from_wallet: Wallet, to_wallet: Wallet, token: str, amount: float) -> None:
        """
        Execute a single gasless transfer transaction.

        Parameters:
        - from_wallet (Wallet): The wallet of the sender.
        - to_wallet (Wallet): The wallet of the recipient.
        - token (str): The token to transfer.
        - amount (float): The amount to transfer.

        Raises:
        - Exception: If the transfer fails or an error occurs.
        """
        try:
            from_wallet = self.wallets.get(from_wallet)
            to_wallet = self.wallets.get(to_wallet)

            if not from_wallet or not to_wallet:
                raise ValueError("Both sender and recipient must have created wallets.")

            transfer = from_wallet.transfer(amount, token.lower(), to_wallet, gasless=True).wait()
            print(f"Transfer successfully completed: {transfer}")
        except Exception as e:
            raise Exception(f"Failed to execute transfer: {str(e)}")

    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a scheduled task.

        Parameters:
        - task_id (str): The unique identifier for the task to cancel.

        Returns:
        - bool: True if the task was successfully cancelled, False otherwise.
        """
        if task_id in self.scheduled_tasks:
            del self.scheduled_tasks[task_id]
            return True
        return False