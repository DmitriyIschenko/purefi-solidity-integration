pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./PureFi/PureFiContext.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract UFIBuyerMumbaiKYC1 is PureFiContext, OwnableUpgradeable, ReentrancyGuard {
    ERC20Upgradeable public ufi;
    uint public ruleID;


    function initialize() external initializer {
        ufi = ERC20Upgradeable(0x70892902C0BfFdEEAac711ec48F14c00b0fa7E3A);
        address verifier = 0x6ae5e97F3954F64606A898166a294B3d54830979;
        __Ownable_init();
        __PureFiContext_init_unchained(verifier);
    }


     function version() public pure returns(uint32){
        // 000.000.000 - Major.minor.internal
        return 2000005;
    }


    function setVerifier(address _verifier) external onlyOwner{
        pureFiVerifier = _verifier;
    }


    function setRuleId(uint _ruleId) external onlyOwner {
        ruleID = _ruleId;
    }


    /**
    * buys UFI tokens for the full amount of _value provided.
    * @param _to - address to send bought tokens to
   @param _purefidata -  a signed data package from the PureFi Issuer
    */
    function buyForWithKYCPurefi1(address _to,
        bytes calldata _purefidata
    ) external payable nonReentrant withCustomAddressVerification (ruleID, msg.sender, _purefidata) {
        _buy(_to);
    }


    function _buy(address _to) internal returns (uint256){
        require(msg.value >= 1e16, "UFIBuyerMumbaiKYC2:value less than 0.01");
        //Dima: fixed exchange rate 0.01 MATIC == 1 UFI
        uint tokensSent = msg.value * 100;
        ufi.transfer(_to, tokensSent);
        return tokensSent;
    }
}
