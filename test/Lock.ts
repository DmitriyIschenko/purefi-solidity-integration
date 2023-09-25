import { expect } from "chai";
import { ethers as hardhat} from "hardhat";

describe("WhitelistIntegrated", function () {
  async function deployWhitelistIntegratedFixture() {
    const [owner, ...otherAccount] = await hardhat.getSigners();

    const WhitelistProxyAdminFactory = await hardhat.getContractFactory("WhitelistProxyAdmin");
    const WhitelistProxyFactory = await hardhat.getContractFactory("WhitelistProxy");
    const WhitelistProxyImplementation = await hardhat.getContractFactory("IntegratedWhitelist");

    const ProxyAdmin = await WhitelistProxyAdminFactory.deploy();
    console.log("ProxyAdmin deployed at:", ProxyAdmin.address);
    const Implementation = await WhitelistProxyImplementation.deploy();
    console.log("Implementation deployed at:", (await Implementation.deployed()).address);
    const Proxy = await WhitelistProxyFactory.deploy(Implementation.address, ProxyAdmin.address, "0x");
    console.log("Proxy deployed at:", Proxy.address);

    const WhitelistIntegrated = WhitelistProxyImplementation.attach(Proxy.address);

    await WhitelistIntegrated.connect(owner).initialize();

    return {ProxyAdmin, Implementation, Proxy, WhitelistIntegrated, owner, otherAccount};
  }

  describe("Deployment", function () {
    it("Should revert if trying initialize two times", async function () {
      const infrastructure = await deployWhitelistIntegratedFixture();

     await expect(infrastructure.WhitelistIntegrated.connect(infrastructure.owner).initialize()).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });
});

