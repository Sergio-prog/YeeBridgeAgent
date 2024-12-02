import json
import logging
from typing import Dict, Optional
from cdp import Cdp, Wallet, WalletData
from pathlib import Path
from src.stores import key_manager_instance

logger = logging.getLogger(__name__)


class WalletManager:
    def __init__(self):
        """Initialize the WalletManager"""
        self.wallets: Dict[str, Wallet] = {}
        self.wallet_data: Dict[str, dict] = {}
        self.cdp_client: Optional[Cdp] = None

    def configure_cdp_client(self) -> bool:
        """Configure CDP client with stored credentials if not already configured"""
        try:
            if self.cdp_client:
                return True
            if not key_manager_instance.has_coinbase_keys():
                logger.error("CDP credentials not found")
                return False

            keys = key_manager_instance.get_coinbase_keys()
            logger.info("Configuring CDP client with stored credentials")
            self.cdp_client = Cdp.configure(keys.cdp_api_key, keys.cdp_api_secret)

            logger.info("CDP client configured successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to configure CDP client: {str(e)}")
            return False

    def create_wallet(self, wallet_id: str, network_id: Optional[str] = None) -> Wallet:
        """Create a new CDP wallet and store it"""
        try:
            if not wallet_id:
                raise ValueError("wallet_id cannot be None or empty")

            if not self.configure_cdp_client():
                raise ValueError("Failed to configure CDP client - check credentials")

            logger.info(f"Creating new wallet with network ID: {network_id}")
            logger.info(f"Current wallets: {self.wallets}")
            wallet = Wallet.create(network_id=network_id)
            if not wallet:
                raise ValueError("Failed to create wallet - wallet is None")

            self.wallets[wallet_id] = wallet

            # Export and store wallet data
            wallet_data = wallet.export_data()
            if not wallet_data:
                raise ValueError("Failed to export wallet data")

            self.wallet_data[wallet_id] = wallet_data.to_dict()

            logger.info(f"Created new wallet with ID: {wallet_id}")
            return wallet

        except Exception as e:
            logger.error(f"Failed to create wallet: {str(e)}")
            raise

    def restore_wallet(self, wallet_id: str, wallet_data: dict) -> Optional[Wallet]:
        """Restore a wallet from exported data"""
        try:
            if not wallet_id:
                raise ValueError("wallet_id cannot be None or empty")

            if not self.configure_cdp_client():
                raise ValueError("Failed to configure CDP client - check credentials")

            logger.info(f"Restoring wallet with ID: {wallet_id}")

            # Convert dict to WalletData instance
            wallet_data_obj = WalletData.from_dict(wallet_data)

            # Import wallet from WalletData
            wallet = Wallet.import_data(wallet_data_obj)
            if not wallet:
                raise ValueError("Failed to restore wallet - import returned None")

            # Store in memory
            self.wallets[wallet_id] = wallet
            self.wallet_data[wallet_id] = wallet_data

            logger.info(f"Successfully restored wallet {wallet_id}")
            return wallet

        except Exception as e:
            logger.error(f"Failed to restore wallet: {str(e)}")
            return None

    def get_wallet(self, wallet_id: str) -> Optional[Wallet]:
        """Get a wallet by ID"""
        return self.wallets.get(wallet_id)

    def save_wallet(self, wallet_id: str, filepath: str) -> bool:
        """Save wallet data to file"""
        try:
            if wallet_id not in self.wallet_data:
                logger.error(f"No wallet data found for ID: {wallet_id}")
                return False

            # Create directory if it doesn't exist
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)

            with open(filepath, "w") as f:
                json.dump(self.wallet_data[wallet_id], f)

            logger.info(f"Saved wallet {wallet_id} to {filepath}")
            return True

        except Exception as e:
            logger.error(f"Failed to save wallet: {str(e)}")
            return False

    def load_wallet(self, wallet_id: str, filepath: str) -> Optional[Wallet]:
        """Load wallet from saved data"""
        try:
            with open(filepath, "r") as f:
                wallet_data = json.load(f)

            # Import wallet from data
            wallet = Wallet.import_data(wallet_data)

            # Store in memory
            self.wallets[wallet_id] = wallet
            self.wallet_data[wallet_id] = wallet_data

            logger.info(f"Loaded wallet {wallet_id} from {filepath}")
            return wallet

        except Exception as e:
            logger.error(f"Failed to load wallet: {str(e)}")
            return None

    def remove_wallet(self, wallet_id: str):
        """Remove a wallet from memory"""
        if wallet_id in self.wallets:
            del self.wallets[wallet_id]
        if wallet_id in self.wallet_data:
            del self.wallet_data[wallet_id]
        logger.info(f"Removed wallet {wallet_id}")

    def has_wallet(self, wallet_id: str) -> bool:
        """Check if wallet exists"""
        return wallet_id in self.wallets

    def list_wallets(self) -> list[dict]:
        """Get list of wallets with their data"""
        return [
            {"wallet_id": wallet_id, "network_id": wallet.network_id}
            for wallet_id, wallet in self.wallets.items()
        ]

    def export_wallet(self, wallet_id: str) -> Optional[dict]:
        """Export wallet data to dictionary format"""
        try:
            if not self.has_wallet(wallet_id):
                logger.error(f"Wallet {wallet_id} not found")
                return None

            wallet = self.wallets[wallet_id]
            wallet_data = wallet.export_data()

            logger.info(f"Exported wallet {wallet_id}")
            return wallet_data.to_dict()

        except Exception as e:
            logger.error(f"Failed to export wallet: {str(e)}")
            return None


# Create an instance to act as a singleton store
wallet_manager_instance = WalletManager()
