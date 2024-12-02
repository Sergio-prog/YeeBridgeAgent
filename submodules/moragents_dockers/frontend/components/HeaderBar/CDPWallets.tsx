import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  Box,
  useToast,
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { ChevronDownIcon, DownloadIcon, DeleteIcon } from "@chakra-ui/icons";

const NETWORKS = [
  "base-mainnet",
  "base-sepolia",
  "base-goerli",
  "ethereum-mainnet",
  "ethereum-goerli",
  "ethereum-sepolia",
];

interface Wallet {
  wallet_id: string;
  network_id: string;
}

export const CDPWallets: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [newWalletName, setNewWalletName] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [walletFile, setWalletFile] = useState<File | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState("");
  const [confirmWalletId, setConfirmWalletId] = useState("");
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const fetchWallets = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/wallets/list");
      const data = await response.json();
      console.log(data);
      setWallets(data.wallets || []);
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
      toast({
        title: "Error fetching wallets",
        status: "error",
        duration: 3000,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      toast({
        title: "Please enter a wallet name",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/wallets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_id: newWalletName,
          network_id: selectedNetwork,
        }),
      });

      if (response.ok) {
        toast({
          title: "Wallet created successfully",
          status: "success",
          duration: 3000,
        });
        onClose();
        fetchWallets();
        setNewWalletName("");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create wallet");
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast({
        title:
          error instanceof Error ? error.message : "Failed to create wallet",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleRestoreWallet = async () => {
    if (!walletFile) {
      toast({
        title: "Please select a wallet file",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const fileContent = await walletFile.text();
      const walletData = JSON.parse(fileContent);

      const response = await fetch("http://localhost:8080/wallets/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_id: walletData.wallet_id,
          wallet_data: walletData,
        }),
      });

      if (response.ok) {
        toast({
          title: "Wallet restored successfully",
          status: "success",
          duration: 3000,
        });
        onClose();
        fetchWallets();
        setWalletFile(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to restore wallet");
      }
    } catch (error) {
      console.error("Error restoring wallet:", error);
      toast({
        title:
          error instanceof Error ? error.message : "Failed to restore wallet",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDownloadWallet = async (walletId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8080/wallets/export/${walletId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          // Trigger download of wallet data
          const blob = new Blob([JSON.stringify(data.data, null, 2)], {
            type: "application/json",
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${walletId}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          toast({
            title: "Wallet exported successfully",
            status: "success",
            duration: 3000,
          });
        } else {
          throw new Error(data.message || "Failed to export wallet");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to export wallet");
      }
    } catch (error) {
      console.error("Error exporting wallet:", error);
      toast({
        title:
          error instanceof Error ? error.message : "Failed to export wallet",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDeleteWallet = async () => {
    if (confirmWalletId !== walletToDelete) {
      toast({
        title: "Wallet ID does not match",
        status: "error",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/wallets/${walletToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Wallet deleted successfully",
          status: "success",
          duration: 3000,
        });
        setIsDeleteOpen(false);
        setConfirmWalletId("");
        setWalletToDelete("");
        fetchWallets();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete wallet");
      }
    } catch (error) {
      console.error("Error deleting wallet:", error);
      toast({
        title:
          error instanceof Error ? error.message : "Failed to delete wallet",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <>
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
          CDP Wallets
        </MenuButton>
        <MenuList minWidth="300px">
          <Box p={4}>
            <Button colorScheme="green" size="sm" width="full" onClick={onOpen}>
              Create New Wallet
            </Button>
          </Box>
          <Divider />
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <MenuItem key={wallet.wallet_id} py={4}>
                <HStack width="100%" justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{wallet.wallet_id}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Network: {wallet.network_id}
                    </Text>
                  </VStack>
                  <HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadWallet(wallet.wallet_id);
                      }}
                    >
                      <DownloadIcon />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWalletToDelete(wallet.wallet_id);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </HStack>
                </HStack>
              </MenuItem>
            ))
          ) : (
            <Box p={4}>
              <Text color="gray.500">No wallets created yet</Text>
            </Box>
          )}
        </MenuList>
      </Menu>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>CDP Wallet Management</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs isFitted variant="enclosed">
              <TabList mb="1em">
                <Tab>Create New</Tab>
                <Tab>Restore Existing</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Wallet Name</FormLabel>
                      <Input
                        placeholder="Enter wallet name"
                        value={newWalletName}
                        onChange={(e) => setNewWalletName(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Network</FormLabel>
                      <Select
                        value={selectedNetwork}
                        onChange={(e) => setSelectedNetwork(e.target.value)}
                      >
                        {NETWORKS.map((network) => (
                          <option key={network} value={network}>
                            {network}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      colorScheme="blue"
                      width="full"
                      mt={4}
                      onClick={handleCreateWallet}
                    >
                      Create Wallet
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Upload Wallet File</FormLabel>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          if (e.target.files) {
                            setWalletFile(e.target.files[0]);
                          }
                        }}
                      />
                    </FormControl>
                    <Button
                      colorScheme="blue"
                      width="full"
                      mt={4}
                      onClick={handleRestoreWallet}
                    >
                      Restore Wallet
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setIsDeleteOpen(false);
          setConfirmWalletId("");
          setWalletToDelete("");
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Wallet
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={4}>
                To confirm deletion, please type the wallet ID:{" "}
                <Text as="span" fontWeight="bold">
                  {walletToDelete}
                </Text>
              </Text>
              <Input
                value={confirmWalletId}
                onChange={(e) => setConfirmWalletId(e.target.value)}
                placeholder="Enter wallet ID to confirm"
              />
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteWallet} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
