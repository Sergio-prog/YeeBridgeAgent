import { useState, useEffect } from "react";
import {
  VStack,
  Box,
  Checkbox,
  Button,
  Text,
  Heading,
  useColorModeValue,
  Container,
  useToast,
} from "@chakra-ui/react";

interface Agent {
  name: string;
  description: string;
  human_readable_name: string;
}

interface AgentSelectionProps {
  onSave: (agents: string[]) => void;
}

export const AgentSelection: React.FC<AgentSelectionProps> = ({ onSave }) => {
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const toast = useToast();

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("http://localhost:8080/agents/available");
        const data = await response.json();
        setAvailableAgents(data.available_agents);
        setSelectedAgents(data.selected_agents);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    };

    fetchAgents();
  }, []);

  const handleAgentToggle = (agentName: string) => {
    setSelectedAgents((prev) => {
      if (prev.includes(agentName)) {
        return prev.filter((name) => name !== agentName);
      } else {
        if (prev.length >= 6) {
          toast({
            title: "Maximum agents selected",
            description: "You can only select up to 6 agents at a time",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          return prev;
        }
        return [...prev, agentName];
      }
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch("http://localhost:8080/agents/selected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agents: selectedAgents }),
      });
      const data = await response.json();
      if (data.status === "success") {
        onSave(data.agents);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to save selection:", error);
    }
  };

  return (
    <Container maxW="container.md">
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="md" mb={3}>
            Agent Configuration
          </Heading>
          <Text fontSize="sm" color={textColor}>
            Select which agents you want to be available in the system. For
            performance reasons, only 6 agents can be selected at a time.
          </Text>
        </Box>

        <VStack
          align="stretch"
          spacing={2}
          maxH="500px"
          overflowY="auto"
          px={2}
        >
          {availableAgents.map((agent) => (
            <Box
              key={agent.name}
              p={4}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              width="100%"
            >
              <Checkbox
                isChecked={selectedAgents.includes(agent.name)}
                onChange={() => handleAgentToggle(agent.name)}
                width="100%"
                isDisabled={
                  !selectedAgents.includes(agent.name) &&
                  selectedAgents.length >= 6
                }
              >
                <Box ml={4}>
                  <VStack align="start" width="100%">
                    <Text fontWeight="medium" textAlign="left">
                      {agent.human_readable_name}
                    </Text>
                    <Text fontSize="sm" color={textColor} textAlign="left">
                      {agent.description}
                    </Text>
                  </VStack>
                </Box>
              </Checkbox>
            </Box>
          ))}
        </VStack>

        <Button colorScheme="green" onClick={handleSave} size="md" width="100%">
          Save Configuration
        </Button>
      </VStack>
    </Container>
  );
};