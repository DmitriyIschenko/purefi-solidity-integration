import { ethers as hardhat } from "hardhat";
import { ethers } from "ethers";

const deployer = new ethers.Wallet(
  process.env.PRIVATE_KEY as string,
  hardhat.provider,
);

async function deployInfrastructure(wallet: ethers.Wallet) {
  const WhitelistProxyAdminFactory = await hardhat.getContractFactory(
    "WhitelistProxyAdmin",
  );
  const WhitelistProxyFactory =
    await hardhat.getContractFactory("WhitelistProxy");
  const WhitelistProxyImplementation = await hardhat.getContractFactory(
    "IntegratedWhitelist",
  );

  const ProxyAdmin = await WhitelistProxyAdminFactory.connect(wallet).deploy();
  console.log("ProxyAdmin deployed at:", ProxyAdmin.address);
  const Implementation =
    await WhitelistProxyImplementation.connect(wallet).deploy();
  console.log(
    "Implementation deployed at:",
    (await Implementation.deployed()).address,
  );
  const Proxy = await WhitelistProxyFactory.connect(wallet).deploy(
    Implementation.address,
    ProxyAdmin.address,
    "0x",
  );
  console.log("Proxy deployed at:", Proxy.address);

  const WhitelistIntegrated = WhitelistProxyImplementation.attach(
    Proxy.address,
  );

  return { ProxyAdmin, Implementation, Proxy, WhitelistIntegrated };
}

async function intialize(proxyAddress: string) {
  const WhitelistProxyImplementation = (
    await hardhat.getContractFactory("IntegratedWhitelist")
  ).attach(proxyAddress);
  const receipt =
    await WhitelistProxyImplementation.connect(deployer).initialize();
  await receipt.wait();
}

async function main() {
  const infrastructure = await deployInfrastructure(deployer);
  await intialize(infrastructure.Proxy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
