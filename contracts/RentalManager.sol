// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IArcadeRegistry {
    struct Agent {
        uint256 agentId;
        address owner;
        string name;
        string description;
        string category;
        uint256 pricePerHour;
        string metadataHash;
        string imageUrl;
        bool isListed;
    }

    function getAgent(uint256 _agentId) external view returns (Agent memory);
}

contract RentalManager is ReentrancyGuard {
    IArcadeRegistry public immutable arcadeRegistry;

    // Platform fee: 5% (500 basis points)
    uint256 public constant PLATFORM_FEE_PERCENT = 500;
    uint256 public constant BASIS_POINTS = 10000;

    // Hardcoded platform wallet - immutable for trustlessness
    address public constant PLATFORM_WALLET = 0x43C4edd85957978ce6d14AD9d023455d23Ca635D;

    // Track owner earnings (withdrawn manually)
    mapping(address => uint256) public ownerEarnings;

    // Track agent earnings
    mapping(uint256 => uint256) public agentEarnings;

    // Rental tracking
    struct Rental {
        uint256 rentalId;
        uint256 agentId;
        address renter;
        address agentOwner;
        uint256 startTime;
        uint256 endTime;
        uint256 hoursRented;
        uint256 totalCost;
        bool isActive;
        bool completed;
    }

    uint256 private _nextRentalId = 1;
    mapping(uint256 => Rental) public rentals;
    mapping(address => uint256[]) public userRentals;
    mapping(uint256 => uint256[]) public agentRentals;

    // Rental history
    struct RentalRecord {
        uint256 agentId;
        address renter;
        uint256 startTime;
        uint256 endTime;
        uint256 amountPaid;
        bool active;
    }

    mapping(uint256 => RentalRecord[]) public agentRentalHistory;
    mapping(address => RentalRecord[]) public userRentalHistory;

    event RentalCreated(
        uint256 indexed rentalId,
        uint256 indexed agentId,
        address indexed renter,
        address agentOwner,
        uint256 hoursRented,
        uint256 totalCost,
        uint256 endTime
    );

    event PlatformFeeTransferred(uint256 amount, address indexed platformWallet);

    event EarningsWithdrawn(address indexed owner, uint256 amount);

    event RentalEnded(
        uint256 indexed rentalId,
        uint256 indexed agentId,
        address indexed renter,
        uint256 endTime
    );

    constructor(address _arcadeRegistryAddress) {
        require(_arcadeRegistryAddress != address(0), "Invalid registry address");
        arcadeRegistry = IArcadeRegistry(_arcadeRegistryAddress);
    }

    /**
     * @dev Rent an agent for a specified number of hours
     * Platform fee is transferred immediately to PLATFORM_WALLET
     * @param _agentId The ID of the agent to rent
     * @param _hours Number of hours to rent the agent
     */
    function rentAgent(uint256 _agentId, uint256 _hours) external payable nonReentrant {
        require(_hours > 0, "Hours must be greater than 0");
        require(_hours <= 720, "Maximum rental period is 720 hours (30 days)");

        // Get agent details from registry
        IArcadeRegistry.Agent memory agent = arcadeRegistry.getAgent(_agentId);

        require(agent.isListed, "Agent is not listed");
        require(agent.owner != address(0), "Agent does not exist");
        require(agent.owner != msg.sender, "Cannot rent your own agent");

        // Calculate total cost
        uint256 totalCost = agent.pricePerHour * _hours;
        require(msg.value >= totalCost, "Insufficient payment");

        // Calculate platform fee and agent owner payment
        uint256 platformFee = (totalCost * PLATFORM_FEE_PERCENT) / BASIS_POINTS;
        uint256 ownerPayment = totalCost - platformFee;

        // Credit owner earnings (they withdraw later)
        ownerEarnings[agent.owner] += ownerPayment;
        agentEarnings[_agentId] += ownerPayment;

        // Transfer platform fee immediately - NO ESCROW
        (bool feeSuccess, ) = payable(PLATFORM_WALLET).call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");

        // Create rental record
        uint256 rentalId = _nextRentalId++;
        uint256 endTime = block.timestamp + (_hours * 1 hours);

        rentals[rentalId] = Rental({
            rentalId: rentalId,
            agentId: _agentId,
            renter: msg.sender,
            agentOwner: agent.owner,
            startTime: block.timestamp,
            endTime: endTime,
            hoursRented: _hours,
            totalCost: totalCost,
            isActive: true,
            completed: false
        });

        // Track rentals
        userRentals[msg.sender].push(rentalId);
        agentRentals[_agentId].push(rentalId);

        // Add to rental history
        RentalRecord memory record = RentalRecord({
            agentId: _agentId,
            renter: msg.sender,
            startTime: block.timestamp,
            endTime: endTime,
            amountPaid: ownerPayment,
            active: true
        });
        agentRentalHistory[_agentId].push(record);
        userRentalHistory[msg.sender].push(record);

        // Refund excess payment
        if (msg.value > totalCost) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refundSuccess, "Refund failed");
        }

        emit RentalCreated(rentalId, _agentId, msg.sender, agent.owner, _hours, totalCost, endTime);
        emit PlatformFeeTransferred(platformFee, PLATFORM_WALLET);
    }

    /**
     * @dev End a rental (can be called by renter or after expiry)
     * @param _rentalId The ID of the rental to end
     */
    function endRental(uint256 _rentalId) external nonReentrant {
        Rental storage rental = rentals[_rentalId];

        require(rental.rentalId != 0, "Rental does not exist");
        require(rental.isActive, "Rental is not active");
        require(
            msg.sender == rental.renter ||
            msg.sender == rental.agentOwner ||
            block.timestamp >= rental.endTime,
            "Not authorized to end rental"
        );

        rental.isActive = false;
        rental.completed = true;

        emit RentalEnded(_rentalId, rental.agentId, rental.renter, block.timestamp);
    }

    /**
     * @dev Withdraw accumulated earnings for agent owner
     */
    function withdrawEarnings() external nonReentrant {
        uint256 amount = ownerEarnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");

        ownerEarnings[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit EarningsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Get rental details
     * @param _rentalId The ID of the rental
     */
    function getRental(uint256 _rentalId) external view returns (Rental memory) {
        require(rentals[_rentalId].rentalId != 0, "Rental does not exist");
        return rentals[_rentalId];
    }

    /**
     * @dev Get all rental IDs for a user
     * @param _user The address of the user
     */
    function getUserRentals(address _user) external view returns (uint256[] memory) {
        return userRentals[_user];
    }

    /**
     * @dev Get all rental IDs for an agent
     * @param _agentId The ID of the agent
     */
    function getAgentRentals(uint256 _agentId) external view returns (uint256[] memory) {
        return agentRentals[_agentId];
    }

    /**
     * @dev Check if a rental is currently active
     * @param _rentalId The ID of the rental
     */
    function isRentalActive(uint256 _rentalId) external view returns (bool) {
        Rental memory rental = rentals[_rentalId];
        return rental.isActive && block.timestamp < rental.endTime;
    }

    /**
     * @dev Get total earnings for an agent owner
     * @param _owner The address of the agent owner
     */
    function getOwnerEarnings(address _owner) external view returns (uint256) {
        return ownerEarnings[_owner];
    }

    /**
     * @dev Get total earnings for a specific agent
     * @param _agentId The ID of the agent
     */
    function getAgentEarnings(uint256 _agentId) external view returns (uint256) {
        return agentEarnings[_agentId];
    }

    /**
     * @dev Get rental history for a specific agent
     * @param _agentId The ID of the agent
     */
    function getAgentRentalHistory(uint256 _agentId) external view returns (RentalRecord[] memory) {
        return agentRentalHistory[_agentId];
    }

    /**
     * @dev Get rental history for a user
     * @param _user The address of the user
     */
    function getUserRentalHistory(address _user) external view returns (RentalRecord[] memory) {
        return userRentalHistory[_user];
    }
}
