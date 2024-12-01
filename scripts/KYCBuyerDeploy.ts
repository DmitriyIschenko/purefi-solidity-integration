import hre from "hardhat";
import { ProxyAdmin__factory } from "../typechain-types";

let verifierAddress = "0x87D3106EFC235f338b4a19defE08EB339Ad88777";
let tokenAddress = "0xa784295ec77D69917bCFa97200897393e04e1c65";

async function deployInfrastructure(wallet: hre.ethers.Wallet) {
  console.log("DEPLOYER:", wallet.address);
  const ProxyAdminFactory = await hre.ethers.getContractFactory("ProxyAdmin");
  const ProxyFactory = await hre.ethers.getContractFactory(
    "TransparentUpgradeableProxy",
  );

  const KYC1BuyerFactory = await hre.ethers.getContractFactory("UFIBuyerKYC1");
  const KYC2BuyerFactory = await hre.ethers.getContractFactory("UFIBuyerKYC2");

  const ProxyAdmin = await ProxyAdminFactory.connect(wallet).deploy();
  await ProxyAdmin.waitForDeployment();
  console.log("ProxyAdmin deployed at:", ProxyAdmin.target.toString());

  const KYC1BuyerImplementation =
    await KYC1BuyerFactory.connect(wallet).deploy();
  console.log(
    "KYC1BuyerImplementation deployed at:",
    (await KYC1BuyerImplementation.waitForDeployment()).target.toString(),
  );

  const KYC1BuyerProxy = await ProxyFactory.connect(wallet).deploy(
    KYC1BuyerImplementation.target.toString(),
    ProxyAdmin.target.toString(),
    "0x",
  );
  console.log(
    "KYC1BuyerProxy deployed at:",
    (await KYC1BuyerProxy.waitForDeployment()).target.toString(),
  );

  const KYC1ProxyWithABI = KYC1BuyerFactory.attach(
    KYC1BuyerProxy.target.toString(),
  );

  const transactionInit = await KYC1ProxyWithABI.connect(wallet).initialize(
    tokenAddress,
    verifierAddress,
  );
  const recInit = await transactionInit.wait(1);
  console.log(
    `KYC1BuyerProxy(${KYC1BuyerProxy.target.toString()}) initialized`,
  );
  // console.log(recInit.gasUsed);

  //console.log(await KYC1ProxyWithABI.connect(wallet).owner());

  const setRuleIdTrans = await KYC1ProxyWithABI.connect(wallet).setRuleId(776n);
  const rec = await setRuleIdTrans.wait();
  console.log(
    `KYC1BuyerProxy(${KYC1BuyerProxy.target.toString()}) setted ruleID as 776`,
  );

  const KYC2BuyerImplementation =
    await KYC2BuyerFactory.connect(wallet).deploy();
  console.log(
    "KYC2Buyer Implementation deployed at:",
    (await KYC2BuyerImplementation.waitForDeployment()).target.toString(),
  );

  const KYC2BuyerProxy = await ProxyFactory.connect(wallet).deploy(
    KYC2BuyerImplementation.target.toString(),
    ProxyAdmin.target.toString(),
    "0x",
  );
  console.log(
    "KYC2Buyer Proxy deployed at:",
    (await KYC2BuyerProxy.waitForDeployment()).target.toString(),
  );

  const KYC2ProxyWithABI = KYC2BuyerFactory.attach(
    KYC2BuyerProxy.target.toString(),
  );

  const initTrans = await KYC2ProxyWithABI.connect(wallet).initialize(
    tokenAddress,
    verifierAddress,
  );
  const inRec = await initTrans.wait();
  // console.log("gasLimit", initTrans.gasLimit);
  // console.log("gasUsed", inRec.gasUsed);

  console.log(
    `KYC2BuyerProxy(${KYC2BuyerProxy.target.toString()}) initialized`,
  );

  await (
    await KYC1ProxyWithABI.connect(wallet).setDenominator(10n ** 10n)
  ).wait(1);
  await (await KYC1ProxyWithABI.connect(wallet).setExchangeRate(1n)).wait(1);

  await (
    await KYC2ProxyWithABI.connect(wallet).setDenominator(10n ** 10n)
  ).wait(1);
  await (await KYC2ProxyWithABI.connect(wallet).setExchangeRate(1n)).wait(1);

  return {
    ProxyAdmin,
    KYC1BuyerProxy,
    KYC1ProxyWithABI,
    KYC2BuyerProxy,
    KYC2ProxyWithABI,
  };
}

async function upgrade(
  proxyAdminAddress: string,
  proxyAddress: string,
  newLogicAddress: string,
  wallet: ethers.Wallet,
) {
  const upgradeTransaction = await ProxyAdmin__factory.connect(
    proxyAdminAddress,
    hre.ethers.provider,
  )
    .connect(wallet)
    .upgrade(proxyAddress, newLogicAddress);
  await upgradeTransaction.wait(1);

  console.log(`Proxy ${proxyAddress} successfully upgraded`);
}

async function deployNoKYC(proxyAdminAddress: string, wallet: ethers.Wallet) {
  const UFIBuyerNoKYCFactory =
    await hre.ethers.getContractFactory("UFIBuyerNoKYC");
  const UFIBuyerNoKYCImpl = await UFIBuyerNoKYCFactory.connect(wallet).deploy();
  await UFIBuyerNoKYCImpl.waitForDeployment();

  console.log(
    `UFIBuyerNoKYCImpl deployed at ${UFIBuyerNoKYCImpl.target.toString()}`,
  );

  const ProxyFactory = await hre.ethers.getContractFactory(
    "TransparentUpgradeableProxy",
  );

  const UFIBuyerNoKYCProxy = await ProxyFactory.connect(wallet).deploy(
    UFIBuyerNoKYCImpl.target.toString(),
    proxyAdminAddress,
    "0x",
  );
  await UFIBuyerNoKYCProxy.waitForDeployment();
  console.log(
    `UFIBuyerNoKYCProxy deployed at ${UFIBuyerNoKYCProxy.target.toString()}`,
  );

  const UFIBuyerNoKYC = UFIBuyerNoKYCFactory.attach(
    UFIBuyerNoKYCProxy.target.toString(),
  );

  const initTrans = await UFIBuyerNoKYC.connect(wallet).initialize(
    tokenAddress,
    verifierAddress,
  );
  await initTrans.wait(1);

  await (
    await UFIBuyerNoKYC.connect(wallet).setDenominator(10n ** 10n)
  ).wait(1);
  await (await UFIBuyerNoKYC.connect(wallet).setExchangeRate(1n)).wait(1);

  return { UFIBuyerNoKYCProxy, UFIBuyerNoKYC };
}
//
// async function foo() {
//     const proxyAdminAddress = "0xfBF708B74AD5EC1403f1CF42C486ae3616DE98ab";
//     const KYC1ProxyAddress = "0xadf290E7BBC69C0270abA1C7284FC077419499C9";
//     const KYC2ProxyAddress = "0x2aeaD2FAC8f21a5B2AeF9B869C54BB1288f6f295";
//
//     //const infrastructure = await deployInfrastructure(deployer);
//     if (network.name === "hardhat") {
//         const signers = await hardhat.getSigners();
//
//         await signers[0].sendTransaction({
//             to: deployer.address,
//             value: 10n ** 20n
//         });
//     }
//
//     //const infrastructure = await deployInfrastructure(deployer);
//
//     //await deployNoKYC("0xfBF708B74AD5EC1403f1CF42C486ae3616DE98ab", deployer);
//
//     const KYC1BuyerFactory = await hardhat.getContractFactory("UFIBuyerKYC1");
//     const KYC2BuyerFactory = await hardhat.getContractFactory("UFIBuyerKYC2");
//
//     const KYC1BuyerImplementation = await KYC1BuyerFactory.connect(deployer).deploy();
//     console.log("KYC1BuyerImplementation deployed at:", (await KYC1BuyerImplementation.deployed()).address);
//
//     const KYC2BuyerImplementation = await KYC2BuyerFactory.connect(deployer).deploy();
//     console.log("KYC2Buyer Implementation deployed at:", (await KYC2BuyerImplementation.deployed()).address);
//
//     const upgradeTrans1 = await upgrade(proxyAdminAddress, KYC1ProxyAddress, KYC1BuyerImplementation.address, deployer);
//     const upgradeTrans2 = await upgrade(proxyAdminAddress, KYC2ProxyAddress, KYC2BuyerImplementation.address, deployer);
// }

async function upgradeKYC1(
  wallet: hre.ethers.Wallet,
  proxyAdminAddress: string,
  proxyAddress: string,
) {
  const KYC1NewImpl = await (
    await (await hre.ethers.getContractFactory("UFIBuyerKYC1"))
      .connect(wallet)
      .deploy()
  ).waitForDeployment();
  console.log("Kyc1Impl deployed to", KYC1NewImpl.target.toString());
  await upgrade(
    proxyAdminAddress,
    proxyAddress,
    KYC1NewImpl.target.toString(),
    wallet,
  );
}

async function upgradeKYC2(
  wallet: hre.ethers.Wallet,
  proxyAdminAddress: string,
  proxyAddress: string,
) {
  const KYC2NewImpl = await (
    await (await hre.ethers.getContractFactory("UFIBuyerKYC2"))
      .connect(wallet)
      .deploy()
  ).waitForDeployment();
  console.log("Kyc2Impl deployed to", KYC2NewImpl.target.toString());
  await upgrade(
    proxyAdminAddress,
    proxyAddress,
    KYC2NewImpl.target.toString(),
    wallet,
  );
}

async function upgradeNoKYC(
  wallet: hre.ethers.Wallet,
  proxyAdminAddress: string,
  proxyAddress: string,
) {
  const NoKYCNewImpl = await (
    await (await hre.ethers.getContractFactory("UFIBuyerNoKYC"))
      .connect(wallet)
      .deploy()
  ).waitForDeployment();
  console.log("NoKYCNewImpl deployed to", NoKYCNewImpl.target.toString());
  await upgrade(
    proxyAdminAddress,
    proxyAddress,
    NoKYCNewImpl.target.toString(),
    wallet,
  );
}

async function main() {
  const [owner, ...others] = await hre.ethers.getSigners();
  const tokenFactory = await hre.ethers.getContractFactory(
    "ERC20PresetMinterPauserUpgradeable",
  );

  // if (network.name === "optest") {
  //     verifierAddress = "0x33962E4b101dd947ef35200c151B0fa56Fb6670E";
  //     tokenAddress = "0xa784295ec77D69917bCFa97200897393e04e1c65";
  // }
  // if (network.name === "fuji") {
  //     verifierAddress = "0x5BeF14365342f88056430da075F613c5545A0Ce9";
  //     tokenAddress = "0xa784295ec77D69917bCFa97200897393e04e1c65";
  // }

  const token = tokenFactory.attach(tokenAddress);

  const kyc = await deployInfrastructure(owner);

  const noKyc = await deployNoKYC(
    "0x277B58288450aef72DfC889Ed2008656E077dD2A",
    owner,
  );

  await (
    await token.connect(owner).mint(owner.address, 1000000000n * 10n ** 6n)
  ).wait(1);
  await (
    await token
      .connect(owner)
      .mint(noKyc.UFIBuyerNoKYC.target.toString(), 1000000000n * 10n ** 6n)
  ).wait(1);
  await (
    await token
      .connect(owner)
      .mint(kyc.KYC1BuyerProxy.target.toString(), 1000000000n * 10n ** 6n)
  ).wait(1);
  await (
    await token
      .connect(owner)
      .mint(kyc.KYC2BuyerProxy.target.toString(), 1000000000n * 10n ** 6n)
  ).wait(1);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
