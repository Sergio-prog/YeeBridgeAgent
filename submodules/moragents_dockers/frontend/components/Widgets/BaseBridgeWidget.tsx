import React, { useState } from "react";
import {
  VStack,
  Box,
  Text,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  useColorModeValue,
  Heading,
  FormControl,
  FormLabel,
  Container,
  useToast,
} from "@chakra-ui/react";
import { tokens } from "./Base.constants";

interface BridgeConfig {
  token: string;
  destination_bridge: number;
  amount: number;
}

const chainMapping = {
  "Base Sepolia": 84532,
  "Arbitrum Sepolia": 421614,
};

const BaseBridgeWidget: React.FC = () => {
  const toast = useToast();
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const [config, setConfig] = useState<BridgeConfig>({
    token: "qsp",
    destination_bridge: chainMapping["Base Sepolia"],
    amount: 0,
  });


  const handleBridge = async () => {
    if (config.amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/base/bridge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset: config.token,
          amount: config.amount,
          destination_bridge: config.destination_bridge,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast({
          title: "Bridge Successful",
          description: data.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Bridge Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md">
      <VStack align="stretch" spacing={6}>
        <Box textAlign="center">
          <Heading size="md" mb={3} color="white">
            Base Network Token Bridge
          </Heading>
          <Text fontSize="sm" color="white">
            Bridge tokens from Base Network to other networks
          </Text>
        </Box>

        <VStack
          align="stretch"
          spacing={4}
          p={6}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
        >
          <FormControl>
            <FormLabel color="white">Token</FormLabel>
            <Select
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              color="white"
              sx={{
                "& > option": {
                  color: "black",
                },
              }}
            >
              {tokens.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel color="white">Destination Bridge</FormLabel>
            <Select
              value={config.destination_bridge}
              onChange={(e) =>
                setConfig({
                  ...config,
                  destination_bridge: Number(e.target.value),
                })
              }
              color="white"
              sx={{
                "& > option": {
                  color: "black",
                },
              }}
            >
              {Object.entries(chainMapping).map(([name, id]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel color="white">Amount</FormLabel>
            <NumberInput
              value={config.amount}
              onChange={(_, value) => setConfig({ ...config, amount: value })}
              min={0}
              precision={6}
            >
              <NumberInputField color="white" />
              <NumberInputStepper>
                <NumberIncrementStepper color="white" />
                <NumberDecrementStepper color="white" />
              </NumberInputStepper>
            </NumberInput>
            <Text fontSize="sm" color="gray.400" mt={1}>
              Amount of {config.token} to bridge
            </Text>
          </FormControl>
        </VStack>

        <Button
          colorScheme="blue"
          onClick={handleBridge}
          size="md"
          width="100%"
        >
          Bridge
        </Button>
      </VStack>
    </Container>
  );
};

export default BaseBridgeWidget;

