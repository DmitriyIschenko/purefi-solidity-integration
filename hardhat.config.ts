import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings:{
      optimizer:{
        enabled : true,
        runs : 200
      }
    }
  },
  networks: {
    mumbai: {
      url: (process.env.POLYGON_TESTNET as string),
    },
    polygon : {
      url : (process.env.POLYGON_MAINNET as string)
    },
  }
};

export default config;
