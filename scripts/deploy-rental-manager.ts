import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Redeploying RentalManager with fixed interface...\n");

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

  // ArcadeRegistry address (already deployed - don't change)
  const arcadeRegistryAddress = "0x02b0B4EFd909240FCB2Eb5FAe060dC60D112E3a4";
  console.log("🔗 Using existing ArcadeRegistry:", arcadeRegistryAddress);

  // Load contract artifacts
  const artifactsPath = path.join(process.cwd(), "artifacts", "contracts");

  // Deploy RentalManager with fixed interface
  console.log("\n📦 Deploying RentalManager...");
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

  // Verify it can read from registry
  console.log("\n🔍 Verifying RentalManager can read from Registry...");
  const RentalManagerContract = new ethers.Contract(
    rentalManagerAddress,
    rentalManagerArtifact.abi,
    wallet
  );

  const linkedRegistry = await RentalManagerContract.arcadeRegistry();
  console.log("   Linked to:", linkedRegistry);
  console.log("   Match:", linkedRegistry.toLowerCase() === arcadeRegistryAddress.toLowerCase() ? "✅" : "❌");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   ArcadeRegistry: ", arcadeRegistryAddress, "(unchanged)");
  console.log("   RentalManager:  ", rentalManagerAddress, "(NEW)");
  console.log("\n👤 Owner:", deployerAddress);
  console.log("\n📝 Next Steps:");
  console.log("   1. Update RentalManager address in frontend:");
  console.log("      - src/lib/blockchain/contracts/RentalManager.ts");
  console.log("\n   2. Test rental:");
  console.log("      - npx tsx scripts/test-rental.ts");
  console.log("\n🔗 Explorer:");
  console.log("   https://testnet.arcscan.net/address/" + rentalManagerAddress);
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
