// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import {IArbitrator} from '@kleros/erc-792/contracts/IArbitrator.sol';

uint256 constant STARKNET_PRIME = 2**251 + 17 * 2**192 + 1;

// XXX: this selector computation probably isn't correct; verify it!
uint256 constant MASK_250 = 2**250 - 1;
uint256 constant ZORRO_SUPER_ADJUDICATE_SELECTOR = uint256(
  keccak256('super_adjudicate') & bytes32(MASK_250)
);
uint256 constant ZORRO_APPEAL_SELECTOR = uint256(
  keccak256('appeal') & bytes32(MASK_250)
);

interface IStarknetCore {
  // Sends a message to an L2 contract. Returns the hash of the message.
  function sendMessageToL2(
    uint256 to_address,
    uint256 selector,
    uint256[] calldata payload
  ) external returns (bytes32);
}

// Interface for https://github.com/kleros/arbitrable-proxy-contracts/blob/master/contracts/ArbitrableProxy.sol
interface IArbitrableProxy {
  function arbitrator() external returns (IArbitrator);

  function createDispute(
    bytes calldata _arbitratorExtraData,
    string calldata _metaevidenceURI,
    uint256 _numberOfRulingOptions
  ) external payable returns (uint256 disputeID);
}

contract SuperAdjudicator {
  struct ArbitratorConfiguration {
    bytes arbitratorExtraData;
    string metaevidenceURI;
    uint256 numberOfRulingOptions;
  }

  event ArbitratorConfigurationChanged(
    bytes arbitratorExtraData,
    string metaevidenceURI,
    uint256 numberOfRulingOptions
  );

  event Appealed(uint256 indexed profileId, uint256 indexed disputeId);

  event RulingEnacted(
    uint256 indexed profileId,
    uint256 indexed disputeId,
    uint256 ruling
  );

  // Set once during construction
  IStarknetCore public immutable starknetCore;
  IArbitrableProxy public immutable arbitrableProxy;
  uint256 public immutable zorroL2Address;

  address public owner; // Owner can modify arbitrator configuration
  ArbitratorConfiguration public arbitratorConfiguration;
  mapping(uint256 => uint256) public disputeIdToProfileId;

  constructor(
    IStarknetCore _starknetCore,
    IArbitrableProxy _arbitrableProxy,
    uint256 _zorroL2Address,
    address _owner,
    bytes memory _arbitratorExtraData,
    string memory _metaevidenceURI,
    uint256 _numberOfRulingOptions
  ) {
    starknetCore = _starknetCore;
    arbitrableProxy = _arbitrableProxy;
    zorroL2Address = _zorroL2Address;
    owner = _owner;
    _setPolicy(_arbitratorExtraData, _metaevidenceURI, _numberOfRulingOptions);
  }

  function setOwner(address newOwner) external {
    require(msg.sender == owner, 'caller is not the owner');
    owner = newOwner;
  }

  function setPolicy(
    bytes calldata arbitratorExtraData,
    string calldata metaevidenceURI,
    uint256 numberOfRulingOptions
  ) external {
    require(msg.sender == owner, 'caller is not the owner');
    _setPolicy(arbitratorExtraData, metaevidenceURI, numberOfRulingOptions);
  }

  function _setPolicy(
    bytes memory arbitratorExtraData,
    string memory metaevidenceURI,
    uint256 numberOfRulingOptions
  ) internal {
    arbitratorConfiguration.arbitratorExtraData = arbitratorExtraData;
    arbitratorConfiguration.metaevidenceURI = metaevidenceURI;
    arbitratorConfiguration.numberOfRulingOptions = numberOfRulingOptions;
    emit ArbitratorConfigurationChanged(
      arbitratorExtraData,
      metaevidenceURI,
      numberOfRulingOptions
    );
  }

  function appeal(uint256 profileId)
    external
    payable
    returns (uint256 disputeId)
  {
    // Require that `profileId` does not overflow a starknet field element
    // otherwise could create two disputes simultaneously for the same
    // `profileId` by calling `appeal(x)` and `appeal(x + STARKNET_PRIME)`
    require(profileId < STARKNET_PRIME, 'profileId overflow');

    disputeId = arbitrableProxy.createDispute{value: msg.value}(
      arbitratorConfiguration.arbitratorExtraData,
      arbitratorConfiguration.metaevidenceURI,
      arbitratorConfiguration.numberOfRulingOptions
    );

    disputeIdToProfileId[disputeId] = profileId;

    uint256[] memory payload = new uint256[](2);
    payload[0] = profileId;
    payload[1] = disputeId;

    starknetCore.sendMessageToL2(
      zorroL2Address,
      ZORRO_APPEAL_SELECTOR,
      payload
    );

    emit Appealed(profileId, disputeId);
    return disputeId;
  }

  function enactRuling(uint256 disputeId) external {
    uint256 profileId = disputeIdToProfileId[disputeId];
    require(profileId != 0, "dispute doesn't exist");
    IArbitrator arbitrator = arbitrableProxy.arbitrator();
    IArbitrator.DisputeStatus status = arbitrator.disputeStatus(disputeId);
    require(
      status == IArbitrator.DisputeStatus.Solved,
      'still waiting for final ruling'
    );

    uint256 ruling = arbitrator.currentRuling(disputeId);
    uint256[] memory payload = new uint256[](2);
    payload[0] = profileId;
    payload[1] = disputeId;
    payload[2] = ruling; // XXX: this ruling will be 0 if adjudicator was wrong, 1 if adjudicator is right, which is not what the Zorro starknet contract expects right now.

    starknetCore.sendMessageToL2(
      zorroL2Address,
      ZORRO_SUPER_ADJUDICATE_SELECTOR,
      payload
    );

    // prevent this same ruling from ever being enacted again. matters because
    // a profile could be re-challenged, re-adjudicated, and re-appealed —
    // we wouldn't want someone to be able to enact the old ruling against it.
    disputeIdToProfileId[profileId] = 0;

    emit RulingEnacted(profileId, disputeId, ruling);
  }
}
