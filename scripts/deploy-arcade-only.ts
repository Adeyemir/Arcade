import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🚀 Deploying ArcadeRegistry to Arc Testnet...\n");

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

  // Load contract artifact
  const artifactsPath = path.join(process.cwd(), "artifacts", "contracts");
  const arcadeRegistryArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, "ArcadeRegistry.sol", "ArcadeRegistry.json"), "utf8")
  );

  console.log("📦 Deploying ArcadeRegistry with pagination support...");
  const ArcadeRegistry = new ethers.ContractFactory(
    arcadeRegistryArtifact.abi,
    arcadeRegistryArtifact.bytecode,
    wallet
  );
  const arcadeRegistry = await ArcadeRegistry.deploy(deployerAddress);
  await arcadeRegistry.waitForDeployment();
  const arcadeRegistryAddress = await arcadeRegistry.getAddress();

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n✅ ArcadeRegistry deployed at:", arcadeRegistryAddress);
  console.log("👤 Owner:", deployerAddress);
  console.log("\n📝 New Features:");
  console.log("   ✓ getAgentCount() - Get total number of agents");
  console.log("   ✓ getAgentsPaginated(offset, limit) - Load agents in batches");
  console.log("\n🔗 Next Steps:");
  console.log("   1. Update ARCADE_REGISTRY_ADDRESS in:");
  console.log("      src/lib/blockchain/contracts/ArcadeRegistry.ts");
  console.log("   2. Set to:", arcadeRegistryAddress);
  console.log("\n🌐 Explorer:");
  console.log("   https://testnet.arcscan.net/address/" + arcadeRegistryAddress);
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
