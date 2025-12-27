// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ArcadeRegistry is Ownable {
    struct Agent {
        uint256 agentId;
        address owner;
        string name; // Agent name stored on-chain
        string description; // Agent description stored on-chain
        string category; // Agent category (Trading, Social, Data, etc.)
        uint256 pricePerHour; // In ARC tokens, or a stablecoin equivalent
        string metadataHash; // Optional IPFS hash for additional metadata
        string imageUrl; // Optional bot profile image URL
        bool isListed; // True if agent is actively listed
    }

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents; // owner => list of agentIds
    uint256 private _nextAgentId;

    event AgentListed(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        string description,
        string category,
        uint256 pricePerHour,
        string metadataHash,
        string imageUrl
    );
    event AgentUnlisted(uint256 indexed agentId);
    event AgentDelisted(uint256 indexed agentId, address indexed owner);
    event AgentPriceUpdated(uint256 indexed agentId, uint256 newPricePerHour);
    event AgentMetadataUpdated(uint256 indexed agentId, string name, string description, string category, string imageUrl);

    constructor(address initialOwner) Ownable(initialOwner) {
        _nextAgentId = 1;
    }

    function listAgent(
        string memory _name,
        string memory _description,
        string memory _category,
        uint256 _pricePerHour,
        string memory _metadataHash,
        string memory _imageUrl
    ) public {
        require(bytes(_name).length > 0, "Agent name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_pricePerHour > 0, "Price per hour must be greater than 0");

        uint256 agentId = _nextAgentId++;
        agents[agentId] = Agent(
            agentId,
            msg.sender,
            _name,
            _description,
            _category,
            _pricePerHour,
            _metadataHash,
            _imageUrl,
            true
        );
        ownerAgents[msg.sender].push(agentId);

        emit AgentListed(agentId, msg.sender, _name, _description, _category, _pricePerHour, _metadataHash, _imageUrl);
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

    function updateAgentMetadata(
        uint256 _agentId,
        string memory _name,
        string memory _description,
        string memory _category,
        string memory _imageUrl
    ) public {
        Agent storage agent = agents[_agentId];
        require(agent.owner == msg.sender, "Only agent owner can update metadata");
        require(bytes(_name).length > 0, "Agent name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        agent.name = _name;
        agent.description = _description;
        agent.category = _category;
        agent.imageUrl = _imageUrl;

        emit AgentMetadataUpdated(_agentId, _name, _description, _category, _imageUrl);
    }

    function getAgent(uint256 _agentId) public view returns (Agent memory) {
        return agents[_agentId];
    }

    function getOwnerAgents(address _owner) public view returns (uint256[] memory) {
        return ownerAgents[_owner];
    }

    function getAgentCount() public view returns (uint256) {
        return _nextAgentId > 0 ? _nextAgentId - 1 : 0;
    }

    function getAgentsPaginated(uint256 _offset, uint256 _limit)
        external
        view
        returns (Agent[] memory)
    {
        uint256 total = _nextAgentId > 0 ? _nextAgentId - 1 : 0;
        if (_offset >= total) {
            return new Agent[](0);
        }

        uint256 end = _offset + _limit;
        if (end > total) {
            end = total;
        }

        uint256 resultCount = end - _offset;
        Agent[] memory result = new Agent[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = agents[_offset + i + 1]; // Agents are 1-indexed
        }

        return result;
    }

    // Permanently delist an agent - CANNOT be relisted
    function delistAgent(uint256 _agentId) external {
        uint256 agentCount = _nextAgentId > 0 ? _nextAgentId - 1 : 0;
        require(_agentId > 0 && _agentId <= agentCount, "Invalid agent ID");
        require(agents[_agentId].owner == msg.sender, "Not owner");
        require(agents[_agentId].isListed, "Already delisted");

        agents[_agentId].isListed = false;

        emit AgentDelisted(_agentId, msg.sender);
    }
}
