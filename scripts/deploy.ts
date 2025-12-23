
const hre = require("hardhat");

async function main() {
  const arcadeTest = await hre.viem.deployContract("ArcadeTest");

  console.log("ArcadeTest deployed to:", arcadeTest.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
