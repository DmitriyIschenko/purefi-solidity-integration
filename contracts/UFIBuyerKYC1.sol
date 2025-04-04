pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {IPureFiVerifier} from "./PureFi/interfaces/IPureFiVerifier.sol";

contract UFIBuyerKYC1 is OwnableUpgradeable {
    ERC20Upgradeable public ufi;
    uint public ruleID;
    uint public exchangeRate;
    uint public denominator;
    IPureFiVerifier public verifier;

    event DemoPurchase(address recepient, uint256 ethAmount, uint256 ufiAmount);

    function initialize(address token, address _verifier) external initializer {
        ufi = ERC20Upgradeable(token);
        __Ownable_init_unchained(msg.sender);
        exchangeRate = 1_000_000;
        denominator = 1_000_0;
        verifier = IPureFiVerifier(_verifier);
    }

    function setDenominator(uint newDenominator) external onlyOwner {
        denominator = newDenominator;
    }

    function setExchangeRate(uint newExchangeRate) external onlyOwner {
        exchangeRate = newExchangeRate;
    }

    function version() public pure returns (uint32) {
        // 000.000.000 - Major.minor.internal
        // v3: updated for verifier v5
        return 3000000;
    }

    function setVerifier(address _verifier) external onlyOwner {
        verifier = IPureFiVerifier(_verifier);
    }

    function setRuleId(uint _ruleId) external onlyOwner {
        ruleID = _ruleId;
    }

    /**
    * buys UFI tokens for the full amount of _value provided.
    * @param _to - address to send bought tokens to
   @param _purefidata -  a signed data package from the PureFi Issuer
    */
    function buyForWithKYCPurefi1(
        address _to,
        bytes calldata _purefidata
    )
    external
    payable

    {
        verifier.validatePayload(_purefidata);
        _buy(_to);
    }

    function _buy(address _to) internal returns (uint256) {
        uint tokensSent = (msg.value * exchangeRate) / denominator;
        ufi.transfer(_to, tokensSent);
        emit DemoPurchase(_to, msg.value, tokensSent);
        return tokensSent;
    }
}
