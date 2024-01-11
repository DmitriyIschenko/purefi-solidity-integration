import {ethers as hardhat, network} from "hardhat";
import {ethers} from "ethers";
import {ProxyAdmin__factory} from "../typechain-types";

const deployer = new ethers.Wallet(process.env.PRIVATE_KEY as string, hardhat.provider);

async function deployInfrastructure(wallet: ethers.Wallet) {
    console.log("DEPLOYER:", wallet.address)
    const ProxyAdminFactory = await hardhat.getContractFactory("ProxyAdmin");
    const ProxyFactory = await hardhat.getContractFactory("TransparentUpgradeableProxy");

    const KYC1BuyerFactory = await hardhat.getContractFactory("UFIBuyerMumbaiKYC1");
    const KYC2BuyerFactory = await hardhat.getContractFactory("UFIBuyerMumbaiKYC2");

    const ProxyAdmin = await ProxyAdminFactory.connect(wallet).deploy();
    console.log("ProxyAdmin deployed at:", ProxyAdmin.address);

    const KYC1BuyerImplementation = await KYC1BuyerFactory.connect(wallet).deploy();
    console.log("KYC1BuyerImplementation deployed at:", (await KYC1BuyerImplementation.deployed()).address);

    const KYC1BuyerProxy = await ProxyFactory.connect(wallet).deploy(KYC1BuyerImplementation.address, ProxyAdmin.address, "0x");
    console.log("KYC1BuyerProxy deployed at:", (await KYC1BuyerProxy.deployed()).address);

    const KYC1ProxyWithABI = KYC1BuyerFactory.attach(KYC1BuyerProxy.address);

    const transactionInit = await KYC1ProxyWithABI.connect(wallet).initialize();
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

    const initTrans = await KYC2ProxyWithABI.connect(wallet).initialize();
    const inRec = await initTrans.wait();
    // console.log("gasLimit", initTrans.gasLimit);
    // console.log("gasUsed", inRec.gasUsed);

    console.log(`KYC2BuyerProxy(${KYC2BuyerProxy.address}) initialized`);

    return {ProxyAdmin, KYC1BuyerProxy, KYC1ProxyWithABI, KYC2BuyerProxy, KYC2ProxyWithABI};
}


async function upgrade(proxyAdminAddress: string, proxyAddress: string, newLogicAddress: string, wallet: ethers.Wallet) {
    const upgradeTransaction = await (ProxyAdmin__factory.connect(proxyAdminAddress, hardhat.provider)).connect(wallet).upgrade(proxyAddress, newLogicAddress);
    await upgradeTransaction.wait(1);

    console.log(`Proxy ${proxyAddress} successfully upgraded`);
}


async function deployNoKYC(proxyAdminAddress: string, wallet: ethers.Wallet) {
    const UFIBuyerMumbaiNoKYCFactory = await hardhat.getContractFactory("UFIBuyerMumbaiNoKYC");
    const UFIBuyerMumbaiNoKYCImpl = await UFIBuyerMumbaiNoKYCFactory.connect(wallet).deploy();
    await UFIBuyerMumbaiNoKYCImpl.deployed();

    console.log(`UFIBuyerMumbaiNoKYCImpl deployed at ${UFIBuyerMumbaiNoKYCImpl.address}`);

    const ProxyFactory = await hardhat.getContractFactory("TransparentUpgradeableProxy");

    const UFIBuyerMumbaiNoKYCProxy = await ProxyFactory.connect(wallet).deploy(UFIBuyerMumbaiNoKYCImpl.address, proxyAdminAddress, "0x8129fc1c");
    await UFIBuyerMumbaiNoKYCProxy.deployed();
    console.log(`UFIBuyerMumbaiNoKYCProxy deployed at ${UFIBuyerMumbaiNoKYCProxy.address}`);

    const UFIBuyerMumbaiNoKYC = UFIBuyerMumbaiNoKYCFactory.attach(UFIBuyerMumbaiNoKYCProxy.address);

    // const initTrans = await UFIBuyerMumbaiNoKYC.connect(wallet).initialize();
    // await initTrans.wait(1)

    return {UFIBuyerMumbaiNoKYCProxy, UFIBuyerMumbaiNoKYC};
}

async function main() {
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

    const KYC1BuyerFactory = await hardhat.getContractFactory("UFIBuyerMumbaiKYC1");
    const KYC2BuyerFactory = await hardhat.getContractFactory("UFIBuyerMumbaiKYC2");

    const KYC1BuyerImplementation = await KYC1BuyerFactory.connect(deployer).deploy();
    console.log("KYC1BuyerImplementation deployed at:", (await KYC1BuyerImplementation.deployed()).address);

    const KYC2BuyerImplementation = await KYC2BuyerFactory.connect(deployer).deploy();
    console.log("KYC2Buyer Implementation deployed at:", (await KYC2BuyerImplementation.deployed()).address);

    const upgradeTrans1 = await upgrade(proxyAdminAddress, KYC1ProxyAddress, KYC1BuyerImplementation.address, deployer);
    const upgradeTrans2 = await upgrade(proxyAdminAddress, KYC2ProxyAddress, KYC2BuyerImplementation.address, deployer);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
