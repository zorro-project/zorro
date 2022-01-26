// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import 'hardhat/console.sol';
import {IArbitrator} from '@kleros/erc-792/contracts/IArbitrator.sol';

uint256 constant STARKNET_PRIME = 2**251 + 17 * 2**192 + 1;
uint256 constant MASK_250 = 2**250 - 1;

// Solidity doesn't seem to support compile-time evaluation of user-defined
// pure functions, so we inline these definitions here rather than employing
// a function call.
uint256 constant ZORRO_SUPER_ADJUDICATE_SELECTOR = uint256(
  keccak256('super_adjudicate') & bytes32(MASK_250)
);
uint256 constant ZORRO_APPEAL_SELECTOR = uint256(
  keccak256('appeal') & bytes32(MASK_250)
);

interface IStarknetCoreLike {
  // Sends a message to an L2 contract. Returns the hash of the message.
  function sendMessageToL2(
    uint256 to_address,
    uint256 selector,
    uint256[] calldata payload
  ) external returns (bytes32);
}

// Interface for https://github.com/kleros/arbitrable-proxy-contracts/blob/master/contracts/ArbitrableProxy.sol
interface IArbitrableProxyLike {
  function arbitrator() external returns (IArbitrator);

  function createDispute(
    bytes calldata _arbitratorExtraData,
    string calldata _metaEvidenceURI,
    uint256 _numRulingOptions
  ) external payable returns (uint256 disputeID);
}

contract SuperAdjudicator {
  struct ArbitratorConfiguration {
    bytes arbitratorExtraData;
    string metaEvidenceURI;
    uint256 numRulingOptions;
  }

  event ArbitratorConfigurationChanged(
    bytes arbitratorExtraData,
    string metaEvidenceURI,
    uint256 numRulingOptions
  );

  event Appealed(
    uint256 indexed profileId,
    uint256 indexed disputeId,
    address appellant
  );

  event RulingEnacted(
    uint256 indexed profileId,
    uint256 indexed disputeId,
    uint256 ruling
  );

  event Funded(address funder, uint256 amount);

  struct Appeal {
    uint256 profileId; // a profileId of 0 denotes an appeal which does not exist (was resolved, or never was created)
    address appellant;
  }

  // Set once during construction
  IStarknetCoreLike public immutable starknetCore;
  IArbitrableProxyLike public immutable arbitrableProxy;
  uint256 public immutable zorroL2Address;

  address public owner; // Owner can modify arbitrator configuration
  uint256 public bountySize; // wei
  ArbitratorConfiguration public arbitratorConfiguration;
  mapping(uint256 => Appeal) public disputeIdToAppeal;

  constructor(
    IStarknetCoreLike _starknetCore,
    IArbitrableProxyLike _arbitrableProxy,
    uint256 _zorroL2Address,
    address _owner,
    uint256 _bountySize,
    bytes memory _arbitratorExtraData,
    string memory _metaEvidenceURI,
    uint256 _numRulingOptions
  ) {
    starknetCore = _starknetCore;
    arbitrableProxy = _arbitrableProxy;
    zorroL2Address = _zorroL2Address;
    owner = _owner;
    bountySize = _bountySize;
    _setPolicy(_arbitratorExtraData, _metaEvidenceURI, _numRulingOptions);
  }

  function setOwner(address newOwner) external {
    require(msg.sender == owner, 'caller is not the owner');
    owner = newOwner;
  }

  function setBounty(uint256 newBountySize) external {
    require(msg.sender == owner, 'caller is not the owner');
    bountySize = newBountySize;
  }

  function setPolicy(
    bytes calldata arbitratorExtraData,
    string calldata metaEvidenceURI,
    uint256 numRulingOptions
  ) external {
    require(msg.sender == owner, 'caller is not the owner');
    _setPolicy(arbitratorExtraData, metaEvidenceURI, numRulingOptions);
  }

  function _setPolicy(
    bytes memory arbitratorExtraData,
    string memory metaEvidenceURI,
    uint256 numRulingOptions
  ) internal {
    arbitratorConfiguration.arbitratorExtraData = arbitratorExtraData;
    arbitratorConfiguration.metaEvidenceURI = metaEvidenceURI;
    arbitratorConfiguration.numRulingOptions = numRulingOptions;
    emit ArbitratorConfigurationChanged(
      arbitratorExtraData,
      metaEvidenceURI,
      numRulingOptions
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
      arbitratorConfiguration.metaEvidenceURI,
      arbitratorConfiguration.numRulingOptions
    );

    Appeal storage _appeal = disputeIdToAppeal[disputeId];
    _appeal.profileId = profileId;
    _appeal.appellant = msg.sender;

    uint256[] memory payload = new uint256[](2);
    payload[0] = profileId;
    payload[1] = disputeId;

    starknetCore.sendMessageToL2(
      zorroL2Address,
      ZORRO_APPEAL_SELECTOR,
      payload
    );

    emit Appealed(profileId, disputeId, msg.sender);
    return disputeId;
  }

  function enactRuling(uint256 disputeId) external {
    Appeal storage _appeal = disputeIdToAppeal[disputeId];
    require(
      _appeal.profileId != 0,
      'dispute never existed or was already enacted'
    );
    IArbitrator arbitrator = arbitrableProxy.arbitrator();
    IArbitrator.DisputeStatus status = arbitrator.disputeStatus(disputeId);
    require(
      status == IArbitrator.DisputeStatus.Solved,
      'still waiting for final ruling'
    );

    uint256 ruling = arbitrator.currentRuling(disputeId);
    uint256[] memory payload = new uint256[](3);
    payload[0] = _appeal.profileId;
    payload[1] = disputeId;
    payload[2] = ruling; // 0 if upholding adjudicator; 1 if overturning adjudicator

    // mark the appeal as handled prior to triggering any
    // side effects (there shouldn't be any opportunities for re-entrancy, but
    // the memory of The DAO lives on.)
    _appeal.profileId = 0;

    starknetCore.sendMessageToL2(
      zorroL2Address,
      ZORRO_SUPER_ADJUDICATE_SELECTOR,
      payload
    );

    // If the appellant won, pay them a bounty if possible.
    if (ruling == 1) {
      uint256 balance = address(this).balance;

      // using `send` rather than `transfer` because we don't want the caller
      // to be able to block this transaction from going through.
      payable(_appeal.appellant).send(
        bountySize < balance ? bountySize : balance
      );
    }

    emit RulingEnacted(_appeal.profileId, disputeId, ruling);
  }

  // Be able to receive eth (forms appeal bounty pool)
  receive() external payable {
    emit Funded(msg.sender, msg.value);
  }
}
