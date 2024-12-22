// Widgets.tsx
import React, { FC } from "react";
import {border, Box, IconButton, Text} from "@chakra-ui/react";
import { X } from "lucide-react";
import {
  ChatMessage,
  ImageMessage,
  CryptoDataMessageContent,
  BaseMessageContent,
} from "@/services/types";
import { ImageDisplay } from "@/components/ImageDisplay";
import TradingViewWidget from "./TradingViewWidget";
import DCAWidget from "./DCAWidget";
import BaseSwapWidget from "./BaseSwapWidget";
import BaseTransferWidget from "./BaseTransferWidget";
import BaseBridgeWidget from "./BaseBridgeWidget";

export const WIDGET_COMPATIBLE_AGENTS = [
  "imagen",
  "crypto data",
  "dca",
  "base",
];

export const shouldOpenWidget = (message: ChatMessage) => {
  if (message.agentName === "base") {
    const content = message.content as unknown as BaseMessageContent;
    return (
      content.actionType && ["transfer", "swap", "bridge"].includes(content.actionType)
    );
  }
  if (message.agentName === "crypto data") {
    const content = message.content as unknown as CryptoDataMessageContent;
    return (
      WIDGET_COMPATIBLE_AGENTS.includes(message.agentName) && content.coinId
    );
  }
  return WIDGET_COMPATIBLE_AGENTS.includes(message.agentName);
};

interface WidgetsProps {
  activeWidget: ChatMessage | null;
  onClose: () => void;
}

export const Widgets: FC<WidgetsProps> = ({ activeWidget, onClose }) => {
  const renderWidget = () => {
    if (
      activeWidget?.role === "assistant" &&
      activeWidget.agentName === "imagen"
    ) {
      return (
        <Box p={4}>
          <ImageDisplay content={activeWidget.content as ImageMessage} />
        </Box>
      );
    }

    if (
      activeWidget?.role === "assistant" &&
      activeWidget.agentName === "crypto data"
    ) {
      const content =
        activeWidget.content as unknown as CryptoDataMessageContent;
      if (!content.coinId) return null;
      return (
        <Box
          h="full"
          w="full"
          display="flex"
          flexDirection="column"
          flexGrow={1}
        >
          <TradingViewWidget symbol={`${content.coinId.toUpperCase()}`} />
        </Box>
      );
    }

    if (
      activeWidget?.role === "assistant" &&
      activeWidget.agentName === "dca"
    ) {
      return (
        <Box
          h="full"
          w="full"
          display="flex"
          flexDirection="column"
          flexGrow={1}
        >
          <DCAWidget />
        </Box>
      );
    }

    if (
      activeWidget?.role === "assistant" &&
      activeWidget.agentName === "base"
    ) {
      const content = activeWidget.content as unknown as BaseMessageContent;
      if (
        !content.actionType ||
        !["transfer", "swap", "bridge"].includes(content.actionType)
      ) {
        return null;
      }

      return (
        <Box
          h="full"
          w="full"
          display="flex"
          flexDirection="column"
          flexGrow={1}
        >
         {content.actionType === "bridge" ? (
            <BaseBridgeWidget />
          ) : content.actionType === "swap" ? (
            <BaseSwapWidget />
          ) : content.actionType === "transfer" && (
            <BaseTransferWidget />
          )}
        </Box>
      );
    }

    return null;
  };

  return (
    <Box
      w="full"
      h="100%"
      bg="#020804"
      borderRadius="md"
      overflow="auto"
      position="relative"
      mt={16}
      display="flex"
      flexDirection="column"
      alignItems="center"
      flexGrow={1}
    >
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color="white"
        mt={4}
        mb={8}
        textAlign="center"
        flexShrink={0}
      >
        Agent Widgets
      </Text>
      <IconButton
        aria-label="Close widgets"
        icon={<X />}
        onClick={onClose}
        position="absolute"
        top={2}
        right={4}
        bg="white"
        _hover={{ bg: "gray.300" }}
        zIndex={1}
        flexShrink={0}
      />
      <Box w="full" h="100%" display="flex" flexDirection="column" flexGrow={1}>
        {renderWidget()}
      </Box>
    </Box>
  );
};
