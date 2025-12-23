
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    /*arc_testnet: {
      url: "https://rpc.testnet.arc.network", // Replace with the actual RPC URL
      accounts: ["YOUR_PRIVATE_KEY"] // Replace with a private key for deployment
    }*/
  }
};

export default config;
