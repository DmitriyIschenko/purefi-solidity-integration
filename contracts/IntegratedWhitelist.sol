pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "./PureFi/PureFiContext.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/presets/ERC20PresetMinterPauserUpgradeable.sol";


contract IntegratedWhitelist is PureFiContext, AccessControlEnumerableUpgradeable {
    bytes32 public WHITELIST_ROLE;

    function initialize() public initializer {
        address verifier = 0xd1F404230cB1C8ffaA31d480C81D7e5348dA13e4;
        WHITELIST_ROLE = keccak256("WHITELIST_ROLE");
        __PureFiContext_init_unchained(verifier);
        __AccessControl_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }


    function version() public pure returns (uint32){
        // 000.000.000 - Major.minor.internal
        return 1000001;
    }


    function setVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pureFiVerifier = _verifier;
    }


    function whitelistForWithKYCPurefi2(bytes calldata _purefidata) external
    withDefaultAddressVerification(DefaultRule.KYC, _msgSender(), _purefidata) {
        _grantRole(WHITELIST_ROLE, _msgSender());
    }
}
