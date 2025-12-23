
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";


const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    arc_testnet: {
      url: "https://rpc.testnet.arc.network", // Replace with the actual RPC URL
      accounts: [process.env.ARC_PRIVATE_KEY], // Use environment variable for private key
      type: "http"
    }
  }
};

export default config;
