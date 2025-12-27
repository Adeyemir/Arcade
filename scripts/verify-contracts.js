const hre = require("hardhat");

async function main() {
  const rentalManagerAddress = "0xB377a2EeD7566Ac9fCb0BA673604F9BF875e2Bab";
  const expectedRegistryAddress = "0xB2b580ce436E6F77A5713D80887e14788Ef49c9A";

  console.log("🔍 Verifying contract linkage...\n");

  // Get RentalManager contract
  const rentalManager = await hre.ethers.getContractAt("RentalManager", rentalManagerAddress);

  // Check which registry it's linked to
  const actualRegistryAddress = await rentalManager.arcadeRegistry();

  console.log("📋 RentalManager:", rentalManagerAddress);
  console.log("📋 Expected Registry:", expectedRegistryAddress);
  console.log("📋 Actual Registry:", actualRegistryAddress);
  console.log();

  if (actualRegistryAddress.toLowerCase() === expectedRegistryAddress.toLowerCase()) {
    console.log("✅ Contract linkage is CORRECT!");
  } else {
    console.log("❌ Contract linkage is WRONG!");
    console.log("   RentalManager is pointing to the wrong registry!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
