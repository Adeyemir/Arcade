import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ArcadeRegistryModule = buildModule("ArcadeRegistryModule", (m) => {
  // Get the deployer account address
  const deployer = m.getAccount(0);

  // Deploy ArcadeRegistry with deployer as initial owner
  const arcadeRegistry = m.contract("ArcadeRegistry", [deployer]);

  return { arcadeRegistry };
});

export default ArcadeRegistryModule;
