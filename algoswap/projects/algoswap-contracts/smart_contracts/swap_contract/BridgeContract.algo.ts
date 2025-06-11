import {
  Contract,
  Account,
  Asset,
  uint64,
  GlobalState,
  BoxMap,
  Bytes,
  Txn,
  assert,
  itxn,
  Global,
  bytes,
  Uint64,
  ensureBudget,
} from '@algorandfoundation/algorand-typescript';

export class BridgeAlgoContract extends Contract {
  public requests = BoxMap<uint64, bytes>({ keyPrefix: Bytes`req_` });
  public processedTxHashes = BoxMap<bytes, boolean>({ keyPrefix: Bytes`hash_` });
  public validators = BoxMap<bytes, boolean>({ keyPrefix: Bytes`val_` });
  public supportedTokens = BoxMap<uint64, boolean>({ keyPrefix: Bytes`tok_` });

  private readonly requestCounter = GlobalState<uint64>({ initialValue: Uint64(0) });
  private readonly isSetupComplete = GlobalState<boolean>({ initialValue: false });

  public setup(validators: Account[], supportedAssets: Asset[]): boolean {
    assert(!this.isSetupComplete.value, 'Setup already completed');
    for (const validator of validators) {
      this.validators(validator.bytes).value = true;
    }
    for (const asset of supportedAssets) {
      this.supportedTokens(asset.id).value = true;
    }
    this.isSetupComplete.value = true;
    return true;
  }

  public lockTokens(assetId: Asset, amount: uint64, ethAddress: bytes): boolean {
    ensureBudget(10000);
    assert(this.isSetupComplete.value, 'Bridge not setup yet');
    assert(this.supportedTokens(assetId.id).value, 'Token not supported');
    assert(ethAddress.length > 0, 'Invalid ETH address');
    assert(amount > 0, 'Amount must be greater than 0');

    itxn.assetTransfer({
      assetAmount: amount,
      assetReceiver: Global.currentApplicationAddress,
      xferAsset: assetId,
      fee: 0,
    }).submit();

    const newId = this.requestCounter.value + Uint64(1);
    this.requests(newId).value = ethAddress;
    this.requestCounter.value = newId;
    return true;
  }

  public unlockTokens(
    recipient: Account,
    assetId: Asset,
    amount: uint64,
    ethTxHash: bytes,
    caller: Account
  ): boolean {
    ensureBudget(10000);
    assert(this.isSetupComplete.value, 'Bridge not setup yet');
    assert(this.supportedTokens(assetId.id).value, 'Token not supported');
    assert(this.validators(caller.bytes).value, 'Not a validator');
    assert(!this.processedTxHashes(ethTxHash).exists, 'Tx already processed');

    itxn.assetTransfer({
      assetAmount: amount,
      assetReceiver: recipient,
      xferAsset: assetId,
      fee: 0,
    }).submit();

    this.processedTxHashes(ethTxHash).value = true;
    return true;
  }

  public emergencyUnlock(
    requestId: uint64,
    recipient: Account,
    assetId: Asset,
    amount: uint64
  ): boolean {
    ensureBudget(10000);
    assert(this.isSetupComplete.value, 'Bridge not setup yet');
    assert(this.supportedTokens(assetId.id).value, 'Token not supported');
    // time checks should be enforced in calling logic

    itxn.assetTransfer({
      assetAmount: amount,
      assetReceiver: recipient,
      xferAsset: assetId,
      fee: 0,
    }).submit();
    return true;
  }

  public addValidator(validator: Account): boolean {
    assert(!this.validators(validator.bytes).value, 'Validator already exists');
    this.validators(validator.bytes).value = true;
    return true;
  }

  public removeValidator(validator: Account): boolean {
    assert(this.validators(validator.bytes).value, 'Validator does not exist');
    this.validators(validator.bytes).delete();
    return true;
  }

  public addSupportedToken(assetId: Asset): boolean {
    assert(!this.supportedTokens(assetId.id).value, 'Token already supported');
    this.supportedTokens(assetId.id).value = true;
    return true;
  }

  public removeSupportedToken(assetId: Asset): boolean {
    assert(this.supportedTokens(assetId.id).value, 'Token not supported');
    this.supportedTokens(assetId.id).delete();
    return true;
  }
}
