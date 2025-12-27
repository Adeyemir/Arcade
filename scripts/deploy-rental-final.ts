import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying RentalManager (Final Fix)\n");

  const privateKey = process.env.ARC_PRIVATE_KEY;
  const rpcUrl = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";

  if (!privateKey) {
    console.error("❌ Error: ARC_PRIVATE_KEY not set");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ARC\n");

  // CORRECT ArcadeRegistry address (with delist + pagination)
  const ARCADE_REGISTRY = "0x045857BDEAE7C1c7252d611eB24eB55564198b4C";

  const artifactsPath = path.join(process.cwd(), "artifacts", "contracts");
  const rentalManagerArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, "RentalManager.sol", "RentalManager.json"), "utf8")
  );

  console.log("📦 Deploying RentalManager...");
  console.log("   Linking to ArcadeRegistry:", ARCADE_REGISTRY);

  const RentalManager = new ethers.ContractFactory(
    rentalManagerArtifact.abi,
    rentalManagerArtifact.bytecode,
    wallet
  );
  
  const rentalManager = await RentalManager.deploy(ARCADE_REGISTRY);
  await rentalManager.waitForDeployment();
  const rentalManagerAddress = await rentalManager.getAddress();

  // Verify
  const rm = new ethers.Contract(rentalManagerAddress, rentalManagerArtifact.abi, wallet);
  const registryAddr = await rm.arcadeRegistry();
  const platformWallet = await rm.PLATFORM_WALLET();
  const platformFee = await rm.PLATFORM_FEE_PERCENT();

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n✅ RentalManager:", rentalManagerAddress);
  console.log("\n📋 Configuration:");
  console.log("   Registry:       ", registryAddr);
  console.log("   Platform Wallet:", platformWallet);
  console.log("   Platform Fee:   ", platformFee.toString(), "bps (", Number(platformFee)/100, "%)");
  console.log("\n🔗 Complete System:");
  console.log("   ArcadeRegistry: ", ARCADE_REGISTRY);
  console.log("   RentalManager:  ", rentalManagerAddress);
  console.log("\n📝 Next Step:");
  console.log("   Update RENTAL_MANAGER_ADDRESS in:");
  console.log("   src/lib/blockchain/contracts/RentalManager.ts");
  console.log("   to:", rentalManagerAddress);
  console.log("\n🌐 Explorer:");
  console.log("   https://testnet.arcscan.net/address/" + rentalManagerAddress);
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("\n❌ Deployment failed!");
  console.error("Error:", error.message);
  process.exitCode = 1;
});
