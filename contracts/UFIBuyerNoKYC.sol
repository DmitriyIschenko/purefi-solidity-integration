pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {IPureFiVerifier} from "./PureFi/interfaces/IPureFiVerifier.sol";


contract UFIBuyerNoKYC is OwnableUpgradeable {
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
        // Updated for verifier v5
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
     */
    function buyForWithoutKYC(address _to) external payable {
        _buy(_to);
    }

    function _buy(address _to) internal returns (uint256) {
        require(msg.value >= 1e16, "UFIBuyerMumbaiKYC2:value less than 0.01");
        uint tokensSent = (msg.value * exchangeRate) / denominator;
        ufi.transfer(_to, tokensSent);
        emit DemoPurchase(_to, msg.value, tokensSent);
        return tokensSent;
    }
}
