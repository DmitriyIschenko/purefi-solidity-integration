import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config();

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {
            forking: {
                url: "https://rpc.ankr.com/polygon_amoy"
            },
            accounts: [{privateKey: process.env.PRIVATE_KEY as string, balance: "10000000000000000000"}]
        },
        mumbai: {
            url: (process.env.POLYGON_TESTNET as string),
        },
        polygon: {
            url: (process.env.POLYGON_MAINNET as string)
        },
        tbsc: {
            url: "https://data-seed-prebsc-2-s2.bnbchain.org:8545"
        },
        arbitrumSepolia: {
            url: "https://sepolia-rollup.arbitrum.io/rpc"
        },
        optest: {
            url: "https://sepolia.optimism.io"
        },
        amoy: {
            url: "https://rpc.ankr.com/polygon_amoy",
            accounts: [process.env.PRIVATE_KEY as string]
        },
        fuji: {
            url: "https://api.avax-test.network/ext/bc/C/rpc"
        }
    }
};

export default config;
