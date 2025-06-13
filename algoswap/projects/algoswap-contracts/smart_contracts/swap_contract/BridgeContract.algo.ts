import {
  Contract,
  Account,
  Asset,
  uint64,
  BoxMap,
  Bytes,
  GlobalState,
  assert,
  Txn,
  Global,
  Uint64,
  ensureBudget,
  itxn,
  bytes,
} from "@algorandfoundation/algorand-typescript";
import { itob } from "@algorandfoundation/algorand-typescript/op";

export class AlgoBridgeContract extends Contract {
  // Supported tokens and their configuration
  public supportedTokens = BoxMap<bytes, bytes>({ keyPrefix: Bytes`tok_` });
  public tokenDailyLimit = BoxMap<bytes, uint64>({ keyPrefix: Bytes`tdl_` });
  public tokenMinAmount = BoxMap<bytes, uint64>({ keyPrefix: Bytes`tmin_` });
  public tokenMaxAmount = BoxMap<bytes, uint64>({ keyPrefix: Bytes`tmax_` });
  public tokenDailyVolume = BoxMap<bytes, uint64>({ keyPrefix: Bytes`tdv_` });
  public tokenLastReset = BoxMap<bytes, uint64>({ keyPrefix: Bytes`tlr_` });

  // Per-user daily volume
  public userDailyVolume = BoxMap<bytes, uint64>({ keyPrefix: Bytes`udv_` });
  public userLastDay = BoxMap<bytes, uint64>({ keyPrefix: Bytes`uld_` });

  // Validators
  public validators = BoxMap<bytes, uint64>({ keyPrefix: Bytes`val_` });
  public validatorCount = GlobalState<uint64>({ initialValue: Uint64(1) });

  // Requests
  public requestCounter = GlobalState<uint64>({ initialValue: Uint64(0) });
  public processedTxHashes = BoxMap<bytes, uint64>({ keyPrefix: Bytes`ptx_` });

  // Constants
  public readonly USER_DAILY_LIMIT = Uint64(10000 * 1e6); // 10,000 tokens
  public readonly SIGNATURE_THRESHOLD = Uint64(2);

  // Utility: Encode token ID
  private getTokenKey(token: Asset): bytes {
    return itob(token.id);
  }

  // Validator-only check
  private assertValidator() {
    assert(this.validators(Txn.sender.bytes).exists, "Not a validator");
  }

  public setupToken(
    token: Asset,
    dailyLimit: uint64,
    minAmount: uint64,
    maxAmount: uint64
  ): boolean {
    const key = this.getTokenKey(token);
    this.supportedTokens(key).value = Bytes("1");
    this.tokenDailyLimit(key).value = dailyLimit;
    this.tokenMinAmount(key).value = minAmount;
    this.tokenMaxAmount(key).value = maxAmount;
    this.tokenDailyVolume(key).value = Uint64(0);
    this.tokenLastReset(key).value = Global.latestTimestamp;
    return true;
  }

  public addValidator(account: Account): boolean {
    assert(account.bytes !== Txn.sender.bytes, "Can't self-approve");
    this.validators(account.bytes).value = Uint64(1);
    this.validatorCount.value += Uint64(1);
    return true;
  }

  public lockToken(token: Asset, amount: uint64, algorandAddress: bytes): boolean {
    ensureBudget(10000);
    assert(amount > Uint64(0), "Amount must be > 0");
    const key = this.getTokenKey(token);
    assert(this.supportedTokens(key).exists, "Token not supported");

    const now = Global.latestTimestamp;
    const userKey = Txn.sender.bytes.concat(key);

    // Reset daily volume if needed
    if (now > this.tokenLastReset(key).value + Uint64(86400)) {
      this.tokenDailyVolume(key).value = Uint64(0);
      this.tokenLastReset(key).value = now;
    }

    if (now / Uint64(86400) > this.userLastDay(userKey).value) {
      this.userDailyVolume(userKey).value = Uint64(0);
      this.userLastDay(userKey).value = now / Uint64(86400);
    }

    // Check limits
    assert(amount >= this.tokenMinAmount(key).value, "Below min amount");
    assert(amount <= this.tokenMaxAmount(key).value, "Exceeds max amount");
    assert(
      this.tokenDailyVolume(key).value + amount <= this.tokenDailyLimit(key).value,
      "Token daily limit"
    );
    assert(
      this.userDailyVolume(userKey).value + amount <= this.USER_DAILY_LIMIT,
      "User daily limit"
    );

    this.tokenDailyVolume(key).value += amount;
    this.userDailyVolume(userKey).value += amount;
    this.requestCounter.value += Uint64(1);

    return true;
  }

  public mintToken(
    receiver: Account,
    token: Asset,
    amount: uint64,
    algorandTxHash: bytes
  ): boolean {
    ensureBudget(10000);
    this.assertValidator();
    assert(!this.processedTxHashes(algorandTxHash).exists, "Already processed");

    const key = this.getTokenKey(token);
    assert(this.supportedTokens(key).exists, "Unsupported token");

    this.processedTxHashes(algorandTxHash).value = Uint64(1);

    itxn.assetTransfer({
      xferAsset: token,
      assetAmount: amount,
      assetReceiver: receiver,
      fee: 0,
    }).submit();

    return true;
  }

  public emergencyWithdraw(token: Asset, amount: uint64): boolean {
    // Owner-only check
    assert(Txn.sender === Global.creatorAddress, "Only owner");
    itxn.assetTransfer({
      xferAsset: token,
      assetAmount: amount,
      assetReceiver: Global.creatorAddress,
      fee: 0,
    }).submit();
    return true;
  }
}
