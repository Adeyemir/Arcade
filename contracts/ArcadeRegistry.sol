// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ArcadeRegistry is Ownable {
    struct Agent {
        uint256 agentId;
        address owner;
        uint256 pricePerHour; // In ARC tokens, or a stablecoin equivalent
        string metadataHash; // IPFS hash for agent manifest
        bool isListed; // True if agent is actively listed
    }

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents; // owner => list of agentIds
    uint256 private _nextAgentId;

    event AgentListed(
        uint256 indexed agentId,
        address indexed owner,
        uint256 pricePerHour,
        string metadataHash
    );
    event AgentUnlisted(uint256 indexed agentId);
    event AgentPriceUpdated(uint256 indexed agentId, uint256 newPricePerHour);

    constructor(address initialOwner) Ownable(initialOwner) {
        _nextAgentId = 1;
    }

    function listAgent(
        uint256 _pricePerHour,
        string memory _metadataHash
    ) public {
        require(_pricePerHour > 0, "Price per hour must be greater than 0");
        require(bytes(_metadataHash).length > 0, "Metadata hash cannot be empty");

        uint256 agentId = _nextAgentId++;
        agents[agentId] = Agent(
            agentId,
            msg.sender,
            _pricePerHour,
            _metadataHash,
            true
        );
        ownerAgents[msg.sender].push(agentId);

        emit AgentListed(agentId, msg.sender, _pricePerHour, _metadataHash);
    }

    function unlistAgent(uint256 _agentId) public {
        Agent storage agent = agents[_agentId];
        require(agent.owner == msg.sender, "Only agent owner can unlist");
        require(agent.isListed, "Agent is not currently listed");

        agent.isListed = false;

        // Optionally remove from ownerAgents array to save gas, but requires iteration
        // For MVP, we can keep it simple and just set isListed to false.

        emit AgentUnlisted(_agentId);
    }

    function updateAgentPrice(
        uint256 _agentId,
        uint256 _newPricePerHour
    ) public {
        Agent storage agent = agents[_agentId];
        require(agent.owner == msg.sender, "Only agent owner can update price");
        require(_newPricePerHour > 0, "Price per hour must be greater than 0");

        agent.pricePerHour = _newPricePerHour;

        emit AgentPriceUpdated(_agentId, _newPricePerHour);
    }

    function getAgent(uint256 _agentId) public view returns (Agent memory) {
        return agents[_agentId];
    }

    function getOwnerAgents(address _owner) public view returns (uint256[] memory) {
        return ownerAgents[_owner];
    }
}
