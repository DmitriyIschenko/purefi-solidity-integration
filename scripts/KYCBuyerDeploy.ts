import {ethers as hardhat, network} from "hardhat";
import {ethers} from "ethers";
import {ProxyAdmin__factory} from "../typechain-types";

const deployer = new ethers.Wallet(process.env.PRIVATE_KEY as string, hardhat.provider);
const verifierAddress = "0x33962E4b101dd947ef35200c151B0fa56Fb6670E";
const tokenAddress = "0xa784295ec77D69917bCFa97200897393e04e1c65";

async function deployInfrastructure(wallet: ethers.Wallet) {

    console.log("DEPLOYER:", wallet.address)
    const ProxyAdminFactory = await hardhat.getContractFactory("ProxyAdmin");
    const ProxyFactory = await hardhat.getContractFactory("TransparentUpgradeableProxy");

    const KYC1BuyerFactory = await hardhat.getContractFactory("UFIBuyerKYC1");
    const KYC2BuyerFactory = await hardhat.getContractFactory("UFIBuyerKYC2");

    const ProxyAdmin = await ProxyAdminFactory.connect(wallet).deploy();
    console.log("ProxyAdmin deployed at:", ProxyAdmin.address);

    const KYC1BuyerImplementation = await KYC1BuyerFactory.connect(wallet).deploy();
    console.log("KYC1BuyerImplementation deployed at:", (await KYC1BuyerImplementation.deployed()).address);

    const KYC1BuyerProxy = await ProxyFactory.connect(wallet).deploy(KYC1BuyerImplementation.address, ProxyAdmin.address, "0x");
    console.log("KYC1BuyerProxy deployed at:", (await KYC1BuyerProxy.deployed()).address);

    const KYC1ProxyWithABI = KYC1BuyerFactory.attach(KYC1BuyerProxy.address);

    const transactionInit = await KYC1ProxyWithABI.connect(wallet).initialize(tokenAddress, verifierAddress);
    const recInit = await transactionInit.wait(1);
    console.log(`KYC1BuyerProxy(${KYC1BuyerProxy.address}) initialized`)
    // console.log(recInit.gasUsed);

    //console.log(await KYC1ProxyWithABI.connect(wallet).owner());

    const setRuleIdTrans = await KYC1ProxyWithABI.connect(wallet).setRuleId(776n);
    const rec = await setRuleIdTrans.wait();
    console.log(`KYC1BuyerProxy(${KYC1BuyerProxy.address}) setted ruleID as 776`)


    const KYC2BuyerImplementation = await KYC2BuyerFactory.connect(wallet).deploy();
    console.log("KYC2Buyer Implementation deployed at:", (await KYC2BuyerImplementation.deployed()).address);

    const KYC2BuyerProxy = await ProxyFactory.connect(wallet).deploy(KYC2BuyerImplementation.address, ProxyAdmin.address, "0x");
    console.log("KYC2Buyer Proxy deployed at:", (await KYC2BuyerProxy.deployed()).address);

    const KYC2ProxyWithABI = KYC2BuyerFactory.attach(KYC2BuyerProxy.address);

    const initTrans = await KYC2ProxyWithABI.connect(wallet).initialize(tokenAddress, verifierAddress);
    const inRec = await initTrans.wait();
    // console.log("gasLimit", initTrans.gasLimit);
    // console.log("gasUsed", inRec.gasUsed);

    console.log(`KYC2BuyerProxy(${KYC2BuyerProxy.address}) initialized`);

    await (await KYC1ProxyWithABI.connect(deployer).setDenominator(10n ** 10n)).wait(1);
    await (await KYC1ProxyWithABI.connect(deployer).setExchangeRate(1n)).wait(1);

    await (await KYC2ProxyWithABI.connect(deployer).setDenominator(10n ** 10n)).wait(1);
    await (await KYC2ProxyWithABI.connect(deployer).setExchangeRate(1n)).wait(1);

    return {ProxyAdmin, KYC1BuyerProxy, KYC1ProxyWithABI, KYC2BuyerProxy, KYC2ProxyWithABI};
}


async function upgrade(proxyAdminAddress: string, proxyAddress: string, newLogicAddress: string, wallet: ethers.Wallet) {
    const upgradeTransaction = await (ProxyAdmin__factory.connect(proxyAdminAddress, hardhat.provider)).connect(wallet).upgrade(proxyAddress, newLogicAddress);
    await upgradeTransaction.wait(1);

    console.log(`Proxy ${proxyAddress} successfully upgraded`);
}


async function deployNoKYC(proxyAdminAddress: string, wallet: ethers.Wallet) {
    const UFIBuyerNoKYCFactory = await hardhat.getContractFactory("UFIBuyerNoKYC");
    const UFIBuyerNoKYCImpl = await UFIBuyerNoKYCFactory.connect(wallet).deploy();
    await UFIBuyerNoKYCImpl.deployed();

    console.log(`UFIBuyerNoKYCImpl deployed at ${UFIBuyerNoKYCImpl.address}`);

    const ProxyFactory = await hardhat.getContractFactory("TransparentUpgradeableProxy");

    const UFIBuyerNoKYCProxy = await ProxyFactory.connect(wallet).deploy(UFIBuyerNoKYCImpl.address, proxyAdminAddress, "0x");
    await UFIBuyerNoKYCProxy.deployed();
    console.log(`UFIBuyerNoKYCProxy deployed at ${UFIBuyerNoKYCProxy.address}`);

    const UFIBuyerNoKYC = UFIBuyerNoKYCFactory.attach(UFIBuyerNoKYCProxy.address);

    const initTrans = await UFIBuyerNoKYC.connect(wallet).initialize(tokenAddress, verifierAddress);
    await initTrans.wait(1)

    await (await UFIBuyerNoKYC.connect(deployer).setDenominator(10n ** 10n)).wait(1);
    await (await UFIBuyerNoKYC.connect(deployer).setExchangeRate(1n)).wait(1);

    return {UFIBuyerNoKYCProxy, UFIBuyerNoKYC};
}

async function foo() {
    const proxyAdminAddress = "0xfBF708B74AD5EC1403f1CF42C486ae3616DE98ab";
    const KYC1ProxyAddress = "0xadf290E7BBC69C0270abA1C7284FC077419499C9";
    const KYC2ProxyAddress = "0x2aeaD2FAC8f21a5B2AeF9B869C54BB1288f6f295";

    //const infrastructure = await deployInfrastructure(deployer);
    if (network.name === "hardhat") {
        const signers = await hardhat.getSigners();

        await signers[0].sendTransaction({
            to: deployer.address,
            value: 10n ** 20n
        });
    }

    //const infrastructure = await deployInfrastructure(deployer);

    //await deployNoKYC("0xfBF708B74AD5EC1403f1CF42C486ae3616DE98ab", deployer);

    const KYC1BuyerFactory = await hardhat.getContractFactory("UFIBuyerKYC1");
    const KYC2BuyerFactory = await hardhat.getContractFactory("UFIBuyerKYC2");

    const KYC1BuyerImplementation = await KYC1BuyerFactory.connect(deployer).deploy();
    console.log("KYC1BuyerImplementation deployed at:", (await KYC1BuyerImplementation.deployed()).address);

    const KYC2BuyerImplementation = await KYC2BuyerFactory.connect(deployer).deploy();
    console.log("KYC2Buyer Implementation deployed at:", (await KYC2BuyerImplementation.deployed()).address);

    const upgradeTrans1 = await upgrade(proxyAdminAddress, KYC1ProxyAddress, KYC1BuyerImplementation.address, deployer);
    const upgradeTrans2 = await upgrade(proxyAdminAddress, KYC2ProxyAddress, KYC2BuyerImplementation.address, deployer);
}

async function main() {
    await deployInfrastructure(deployer);
    await deployNoKYC("0x4cDD791Cab032C3294FA5Dd2C60DeC1b7a213cdd", deployer);



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
