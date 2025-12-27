import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🚀 Deploying Arcade contracts to Arc Testnet...\n");

  // Setup provider and wallet
  const privateKey = process.env.ARC_PRIVATE_KEY;
  const rpcUrl = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";

  if (!privateKey) {
    console.error("❌ Error: ARC_PRIVATE_KEY not set in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const deployerAddress = wallet.address;

  console.log("📍 Deploying with account:", deployerAddress);

  // Get balance
  const balance = await provider.getBalance(deployerAddress);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ARC\n");

  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no ARC tokens!");
    console.log("💡 Get testnet tokens from Arc faucet");
    process.exit(1);
  }

  // Load contract artifacts
  const artifactsPath = path.join(process.cwd(), "artifacts", "contracts");

  // Step 1: Deploy ArcadeRegistry
  console.log("📦 Step 1/2: Deploying ArcadeRegistry...");
  const arcadeRegistryArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, "ArcadeRegistry.sol", "ArcadeRegistry.json"), "utf8")
  );
  const ArcadeRegistry = new ethers.ContractFactory(
    arcadeRegistryArtifact.abi,
    arcadeRegistryArtifact.bytecode,
    wallet
  );
  const arcadeRegistry = await ArcadeRegistry.deploy(deployerAddress);
  await arcadeRegistry.waitForDeployment();
  const arcadeRegistryAddress = await arcadeRegistry.getAddress();
  console.log("✅ ArcadeRegistry deployed at:", arcadeRegistryAddress);

  // Step 2: Deploy RentalManager
  console.log("\n📦 Step 2/2: Deploying RentalManager...");
  const rentalManagerArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, "RentalManager.sol", "RentalManager.json"), "utf8")
  );
  const RentalManager = new ethers.ContractFactory(
    rentalManagerArtifact.abi,
    rentalManagerArtifact.bytecode,
    wallet
  );
  const rentalManager = await RentalManager.deploy(
    arcadeRegistryAddress
  );
  await rentalManager.waitForDeployment();
  const rentalManagerAddress = await rentalManager.getAddress();
  console.log("✅ RentalManager deployed at:", rentalManagerAddress);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   ArcadeRegistry: ", arcadeRegistryAddress);
  console.log("   RentalManager:  ", rentalManagerAddress);
  console.log("\n👤 Owner:", deployerAddress);
  console.log("\n📝 Next Steps:");
  console.log("   1. Update contract addresses in frontend:");
  console.log("      - src/lib/blockchain/contracts/ArcadeRegistry.ts");
  console.log("      - src/lib/blockchain/contracts/RentalManager.ts");
  console.log("\n   2. Test the contracts:");
  console.log("      - List an agent");
  console.log("      - Rent an agent");
  console.log("      - Check earnings");
  console.log("\n🔗 Explorer:");
  console.log("   https://testnet.arcscan.net");
  console.log("=".repeat(60) + "\n");
}

main().catch((error) => {
  console.error("\n❌ Deployment failed!");
  console.error("Error:", error.message);
  if (error.message.includes("insufficient funds")) {
    console.log("\n💡 Your account needs more ARC testnet tokens");
    console.log("   Get tokens from the Arc faucet");
  }
  process.exitCode = 1;
});
