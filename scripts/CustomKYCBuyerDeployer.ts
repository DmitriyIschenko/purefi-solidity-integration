import {ethers} from "ethers";
import {ethers as hardhat} from "hardhat";


async function deployBuyerWithCustomKYC(wallet: ethers.Wallet, kycRule: bigint, tokenAddress: string, verifierAddress: string) {
    console.log("DEPLOYER:", wallet.address)
    const ProxyAdminFactory = await hardhat.getContractFactory("ProxyAdmin");
    const ProxyFactory = await hardhat.getContractFactory("TransparentUpgradeableProxy");

    const KYC1BuyerFactory = await hardhat.getContractFactory("UFIBuyerKYC1");

    const ProxyAdmin = await ProxyAdminFactory.connect(wallet).deploy();
    await ProxyAdmin.deployed();
    console.log("ProxyAdmin deployed at:", ProxyAdmin.address);

    const KYC1BuyerImplementation = await KYC1BuyerFactory.connect(wallet).deploy();
    console.log("KYCBuyerImplementation deployed at:", (await KYC1BuyerImplementation.deployed()).address);

    const KYC1BuyerProxy = await ProxyFactory.connect(wallet).deploy(KYC1BuyerImplementation.address, ProxyAdmin.address, "0x");
    console.log("KYCBuyerProxy deployed at:", (await KYC1BuyerProxy.deployed()).address);

    const KYC1ProxyWithABI = KYC1BuyerFactory.attach(KYC1BuyerProxy.address);

    const transactionInit = await KYC1ProxyWithABI.connect(wallet).initialize(tokenAddress, verifierAddress);
    const recInit = await transactionInit.wait(1);
    console.log(`KYCBuyerProxy(${KYC1BuyerProxy.address}) initialized`)
    // console.log(recInit.gasUsed);

    //console.log(await KYC1ProxyWithABI.connect(wallet).owner());

    const setRuleIdTrans = await KYC1ProxyWithABI.connect(wallet).setRuleId(kycRule);
    const rec = await setRuleIdTrans.wait();
    console.log(`KYCBuyerProxy(${KYC1BuyerProxy.address}) setted ruleID as ${kycRule}`)

    return KYC1ProxyWithABI;
}


async function main() {
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY as string, hardhat.provider);
    const tokenAddress = "0xa784295ec77D69917bCFa97200897393e04e1c65";
    const verifierAddress = "0x5BeF14365342f88056430da075F613c5545A0Ce9";

    const rule81 = await deployBuyerWithCustomKYC(deployer, 81n, tokenAddress, verifierAddress);
    const rule82 = await deployBuyerWithCustomKYC(deployer, 82n, tokenAddress, verifierAddress);

    const token = (await hardhat.getContractFactory("ERC20PresetMinterPauserUpgradeable")).attach(tokenAddress);

    await (await token.connect(deployer).mint(rule81.address, 100000n * 10n ** 6n)).wait(1);
    await (await token.connect(deployer).mint(rule82.address, 100000n * 10n ** 6n)).wait(1);

    await (await rule81.connect(deployer).setExchangeRate(1n)).wait(1);
    await (await rule81.connect(deployer).setDenominator(10000000000n)).wait(1);

    await (await rule82.connect(deployer).setExchangeRate(1n)).wait(1);
    await (await rule82.connect(deployer).setDenominator(10000000000n)).wait(1);
}


main().catch(e => {
    console.log(e);
    process.exitCode = 1;
})