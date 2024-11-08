import type { NextPage } from "next";
import { Box, Flex } from "@chakra-ui/react";
import { LeftSidebar } from "../components/LeftSidebar";
import { Chat } from "../components/Chat";
import {
  writeMessage,
  getHttpClient,
  ChatMessage,
  getMessagesHistory,
  sendSwapStatus,
  SWAP_STATUS,
  uploadFile,
} from "../services/backendClient";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { HeaderBar } from "../components/HeaderBar";
import { availableAgents } from "../config";
import { WalletRequiredModal } from "../components/WalletRequiredModal";
import { ErrorBackendModal } from "../components/ErrorBackendModal";

const Home: NextPage = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chainId = useChainId();
  const { address } = useAccount();
  const [selectedAgent, setSelectedAgent] = useState<string>("swap-agent");
  const [showBackendError, setShowBackendError] = useState<boolean>(false);

  useEffect(() => {
    getMessagesHistory(getHttpClient())
      .then((messages: ChatMessage[]) => {
        setChatHistory([...messages]);
      })
      .catch((e) => {
        console.error(`Failed to get initial messages history. Error: ${e}`);
        setShowBackendError(true);
      });
  }, []);

  const isWalletRequired = useMemo(() => {
    const agent = availableAgents[selectedAgent] || null;
    if (null !== agent && agent.requirements.connectedWallet) {
      return true;
    }
    return false;
  }, [selectedAgent]);

  const handleSubmitMessage = async (
    message: string,
    file: File | null
  ): Promise<boolean> => {
    const agent = availableAgents[selectedAgent] || null;

    if (null !== agent && agent.requirements.connectedWallet) {
      if (!address) {
        return true;
      }
    }

    setChatHistory([
      ...chatHistory,
      {
        role: "user",
        content: message,
      } as ChatMessage,
    ]);

    try {
      let newHistory;
      if (!file) {
        newHistory = await writeMessage(
          chatHistory,
          message,
          getHttpClient(),
          chainId,
          address || ""
        );
      } else {
        await uploadFile(getHttpClient(), file);
        newHistory = await getMessagesHistory(getHttpClient());
      }
      setChatHistory([...newHistory]);
    } catch (e) {
      console.error(`Failed to send message. Error: ${e}`);
      setShowBackendError(true);
    }

    return true;
  };

  const handleCancelSwap = async (fromAction: number) => {
    if (!address) {
      return;
    }

    try {
      await sendSwapStatus(
        getHttpClient(),
        chainId,
        address,
        SWAP_STATUS.CANCELLED,
        "",
        fromAction
      );

      const updatedMessages = await getMessagesHistory(getHttpClient());
      setChatHistory([...updatedMessages]);
    } catch (e) {
      console.error(`Failed to cancel swap or update messages. Error: ${e}`);
      setShowBackendError(true);
    }
  };

  const handleBackendError = () => {
    setShowBackendError(true);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#020804",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <HeaderBar
        onAgentChanged={setSelectedAgent}
        currentAgent={selectedAgent}
      />
      <Flex flex="1" overflow="hidden">
        <Box>
          <LeftSidebar />
        </Box>
        <Box flex="1" overflow="hidden">
          <Chat
            selectedAgent={selectedAgent}
            messages={chatHistory}
            onCancelSwap={handleCancelSwap}
            onSubmitMessage={handleSubmitMessage}
            onBackendError={handleBackendError}
          />
        </Box>
      </Flex>

      <WalletRequiredModal agentRequiresWallet={isWalletRequired} />
      <ErrorBackendModal show={showBackendError} />
    </Box>
  );
};

export default Home;
