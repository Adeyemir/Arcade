# Arcade - AI Agent Rental Marketplace

A decentralized marketplace for renting AI agents on the Arc Network blockchain.

## Features

- **Agent Listing**: List your AI agents for rent with customizable pricing
- **Hourly Rentals**: Rent agents by the hour with automatic on-chain payment
- **Owner Earnings**: Track and withdraw earnings from your listed agents
- **Platform Fees**: Trustless 5% platform fee collection
- **Pagination**: Efficient loading of marketplace listings (20 agents per page)
- **Permanent Delist**: Remove agents from marketplace when needed
- **IPFS Integration**: Upload agent images to IPFS via Pinata

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Blockchain**: Arc Network Testnet
- **Smart Contracts**: Solidity 0.8.20, Hardhat
- **Web3**: wagmi, viem, RainbowKit
- **Styling**: Tailwind CSS
- **Storage**: IPFS (Pinata)

## Smart Contracts

### ArcadeRegistry
Manages agent listings, metadata, and pricing.

**Deployed at**: See `src/lib/blockchain/contracts/ArcadeRegistry.ts`

### RentalManager
Handles rental transactions, earnings tracking, and platform fees.

**Deployed at**: See `src/lib/blockchain/contracts/RentalManager.ts`

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Arc Network wallet with testnet tokens

### Installation

1. Clone the repository
```bash
git clone https://github.com/Adeyemir/Arcade.git
cd Arcade
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add:
- `ARC_PRIVATE_KEY`: Your Arc Network private key (for contract deployment)
- `NEXT_PUBLIC_PINATA_JWT`: Your Pinata JWT token (for IPFS uploads)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deployment

1. Compile contracts
```bash
npx hardhat compile
```

2. Deploy contracts to Arc Testnet
```bash
npx hardhat run scripts/deploy-all.ts --network arc
```

3. Update contract addresses in `src/lib/blockchain/contracts/`

4. Build frontend
```bash
npm run build
```

## Usage

### List an Agent

1. Connect your wallet
2. Navigate to "List Agent"
3. Fill in agent details (name, description, category, price)
4. Upload an image (optional)
5. Submit transaction

### Rent an Agent

1. Browse marketplace
2. Click on an agent
3. Select rental duration (hours)
4. Confirm payment (total = price × hours)
5. Transaction complete!

### Manage Your Agents

1. Go to Dashboard
2. View your listed agents
3. Update pricing
4. Withdraw earnings
5. Delist agents (permanent)

## Contract Architecture

### ArcadeRegistry
- `listAgent()` - List a new agent
- `updateAgentPrice()` - Update agent pricing
- `updateAgentMetadata()` - Update agent details
- `delistAgent()` - Permanently remove from marketplace
- `getAgentsPaginated()` - Fetch agents with pagination
- `getAgentCount()` - Get total agent count

### RentalManager  
- `rentAgent()` - Rent an agent for X hours
- `endRental()` - End an active rental
- `withdrawEarnings()` - Withdraw accumulated earnings
- `getAgentEarnings()` - Check earnings for an agent
- Platform fee: 5% (500 basis points)

## Security

- Never commit `.env` files
- Use environment variables for sensitive data
- Private keys are only used for contract deployment
- Frontend uses user's wallet for transactions
- All transactions require user approval

## Contributing

Pull requests welcome! Please ensure:
- Code follows existing patterns
- No sensitive data in commits
- Tests pass (if applicable)
- Documentation updated

## License

MIT

## Support

For issues or questions:
- GitHub Issues: [https://github.com/Adeyemir/Arcade/issues](https://github.com/Adeyemir/Arcade/issues)

## Links

- Arc Network: [https://arc.network](https://arc.network)
- Arc Testnet Explorer: [https://testnet.arcscan.net](https://testnet.arcscan.net)
- Pinata: [https://pinata.cloud](https://pinata.cloud)
