import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config();

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000
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
        sepolia: {
            url: process.env.SEPOLIA as string,
            accounts: [process.env.PRIVATE_KEY as string]
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
        polygonAmoy: {
            url: "https://rpc.ankr.com/polygon_amoy",
            accounts: [process.env.PRIVATE_KEY as string]
        },
        fuji: {
            url: "https://api.avax-test.network/ext/bc/C/rpc"
        }
    },
    etherscan: {
        apiKey: {
            polygonAmoy: process.env.ETHERSCAN_API_AMOY as string,
            sepolia: process.env.ETHERSCAN_API_SEPOLIA as string
        },
        customChains: [
            {
                network: "sepolia",
                chainId: 11155111,
                urls: {
                    apiURL: "https://api-sepolia.etherscan.io/api",
                    browserURL: "https://sepolia.etherscan.io/"
                }
            }
        ]
    }
};

export default config;
