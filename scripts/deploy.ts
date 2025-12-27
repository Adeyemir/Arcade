import hre from "hardhat";

async function main() {
  console.log("Deploying ArcadeRegistry to Arc Testnet...");

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying with account:", deployerAddress);

  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ARC");

  // Deploy ArcadeRegistry
  const ArcadeRegistry = await hre.ethers.getContractFactory("ArcadeRegistry");
  const arcadeRegistry = await ArcadeRegistry.deploy(deployerAddress);

  await arcadeRegistry.waitForDeployment();
  const contractAddress = await arcadeRegistry.getAddress();

  console.log("\n✅ ArcadeRegistry deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("👤 Owner:", deployerAddress);
  console.log("\n🔗 Update this address in:");
  console.log("   src/lib/blockchain/contracts/ArcadeRegistry.ts");
  console.log("\n📝 Next steps:");
  console.log("   1. Copy the contract address above");
  console.log("   2. Update ARCADE_REGISTRY_ADDRESS in the frontend");
  console.log("   3. Test listing an agent!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
