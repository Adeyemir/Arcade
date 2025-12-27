const fs = require('fs');

// Read the compiled artifacts
const rentalManagerArtifact = JSON.parse(
  fs.readFileSync('artifacts/contracts/RentalManager.sol/RentalManager.json', 'utf8')
);

const arcadeRegistryArtifact = JSON.parse(
  fs.readFileSync('artifacts/contracts/ArcadeRegistry.sol/ArcadeRegistry.json', 'utf8')
);

// Generate RentalManager.ts
const rentalManagerContent = `export const RENTAL_MANAGER_ABI = ${JSON.stringify(rentalManagerArtifact.abi, null, 2)} as const;

// Contract address - deployed on Arc Testnet (FIXED - 2025-12-26 - imageUrl interface fix)
export const RENTAL_MANAGER_ADDRESS = "0xefAB0Beb0A557E452b398035eA964948c750b2Fd" as const;
`;

// Generate ArcadeRegistry.ts
const arcadeRegistryContent = `// Contract deployed: 2025-12-26 with imageUrl support
export const ARCADE_REGISTRY_ABI = ${JSON.stringify(arcadeRegistryArtifact.abi, null, 2)} as const;

// Contract address - deployed on Arc Testnet (2025-12-26 with imageUrl support)
export const ARCADE_REGISTRY_ADDRESS = "0xB2b580ce436E6F77A5713D80887e14788Ef49c9A" as const;
`;

// Write files
fs.writeFileSync('src/lib/blockchain/contracts/RentalManager.ts', rentalManagerContent);
fs.writeFileSync('src/lib/blockchain/contracts/ArcadeRegistry.ts', arcadeRegistryContent);

console.log('✅ ABIs updated successfully!');
console.log('📝 RentalManager.ts - Updated to trustless version (1 param constructor)');
console.log('📝 ArcadeRegistry.ts - Updated with imageUrl support');
