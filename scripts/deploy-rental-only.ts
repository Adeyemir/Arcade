import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying RentalManager to Arc Testnet...\n");

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

  const balance = await provider.getBalance(deployerAddress);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ARC\n");

  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no ARC tokens!");
    process.exit(1);
  }

  // NEW ArcadeRegistry address (with pagination)
  const arcadeRegistryAddress = "0xaB7B4c595d3cE8C85e16DA86630f2fc223B05057";

  // Load RentalManager artifact
  const artifactsPath = path.join(process.cwd(), "artifacts", "contracts");
  const rentalManagerArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, "RentalManager.sol", "RentalManager.json"), "utf8")
  );

  console.log("📦 Deploying RentalManager...");
  console.log("   Linking to ArcadeRegistry:", arcadeRegistryAddress);

  const RentalManager = new ethers.ContractFactory(
    rentalManagerArtifact.abi,
    rentalManagerArtifact.bytecode,
    wallet
  );
  const rentalManager = await RentalManager.deploy(arcadeRegistryAddress);
  await rentalManager.waitForDeployment();
  const rentalManagerAddress = await rentalManager.getAddress();

  // Verify configuration
  const rm = new ethers.Contract(rentalManagerAddress, rentalManagerArtifact.abi, wallet);
  const registryAddr = await rm.arcadeRegistry();
  const platformWallet = await rm.PLATFORM_WALLET();
  const platformFee = await rm.PLATFORM_FEE_PERCENT();

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n✅ RentalManager deployed at:", rentalManagerAddress);
  console.log("\n📋 Configuration:");
  console.log("   Registry:", registryAddr);
  console.log("   Platform Wallet:", platformWallet);
  console.log("   Platform Fee:", platformFee.toString(), "basis points (", Number(platformFee) / 100, "%)");
  console.log("\n🔗 Complete Contract Set:");
  console.log("   ArcadeRegistry: ", arcadeRegistryAddress);
  console.log("   RentalManager:  ", rentalManagerAddress);
  console.log("\n📝 Next Steps:");
  console.log("   1. Update RENTAL_MANAGER_ADDRESS in:");
  console.log("      src/lib/blockchain/contracts/RentalManager.ts");
  console.log("   2. Set to:", rentalManagerAddress);
  console.log("\n🌐 Explorer:");
  console.log("   https://testnet.arcscan.net/address/" + rentalManagerAddress);
  console.log("=".repeat(60) + "\n");
}

main().catch((error) => {
  console.error("\n❌ Deployment failed!");
  console.error("Error:", error.message);
  process.exitCode = 1;
});
