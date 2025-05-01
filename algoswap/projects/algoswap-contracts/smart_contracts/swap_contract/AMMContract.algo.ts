import {
  Contract,
  Bytes,
  Asset,
  uint64,
  bytes,
  Uint64,
  assert,
  Txn,
} from '@algorandfoundation/algorand-typescript';
import { toBytes } from '@algorandfoundation/algorand-typescript-testing/encoders';
import { PaymentTransaction } from '@algorandfoundation/algorand-typescript-testing/impl/transactions';
import { Transaction } from '@algorandfoundation/algorand-typescript/gtxn';

class AMMContract extends Contract {
  // Global state
  public asset_a = new Map<bytes, uint64>();
  public asset_b = new Map<bytes, uint64>();
  public reserve_a = new Map<bytes, uint64>();
  public reserve_b = new Map<bytes, uint64>();
  public total_lp = new Map<bytes, uint64>();

  // Local state
  lp_balance = AccountStateMap<UInt64>(); 

  // Constants
  public FEE_NUM = 997; // 0.3% fee
  public FEE_DEN = 1000;

  // Create the AMM pool
  public createPool(assetIdA: Asset, assetIdB: Asset): boolean {
    this.asset_a.set(toBytes("asset_a"), assetIdA.id);
    this.asset_b.set(toBytes("asset_b"), assetIdB.id);
    this.reserve_a.set(toBytes("reserve_a"), Uint64(0));
    this.reserve_b.set(toBytes("reserve_b"), Uint64(0));
    this.total_lp.set(toBytes("total_lp"), Uint64(0));
    return Boolean(true);
  }

  // Add liquidity to the pool
  public addLiquidity(
    assetAAmount: uint64,
    assetBAmount: uint64,
    @beforeTransaction(1) paymentA: PaymentTransaction,
    @beforeTransaction(2) paymentB: PaymentTransaction,
  ): boolean {
    // Verify transactions
    assert(paymentA.sender === Txn.sender);
    assert(paymentB.sender === Txn.sender);
    assert(paymentA.amount === assetAAmount);
    assert(paymentB.amount === assetBAmount);

    const currentA = this.reserve_a.get(toBytes("reserve_a"));
    const currentB = this.reserve_b.get(toBytes("reserve_b"));
    const totalLp = this.total_lp.get(toBytes("total_lp"));

    if (totalLp === Uint64(0) || currentA === undefined || currentB === undefined || totalLp === undefined) {
      // First liquidity provision
      this.reserve_a.set(toBytes("reserve_a"), assetAAmount);
      this.reserve_b.set(toBytes("reserve_b"), assetBAmount);
      this.total_lp.set(toBytes("total_lp"), Uint64(1000));
      this.lp_balance(Txn.sender).put(Uint64(1000));
    } else {
      // Calculate LP tokens to mint based on the ratio
      const lpMintedA = assetAAmount * (totalLp) / (currentA); 
      const lpMintedB = assetBAmount * (totalLp) / (currentB);
      
      // Use the smaller amount to ensure price ratio is maintained
      const lpToMint = lpMintedA < (lpMintedB) ? lpMintedA : lpMintedB;  
      
      // Update reserves and LP tokens
      this.reserve_a.set(toBytes("reserve_a"), currentA + assetAAmount);
      this.reserve_b.set(toBytes("reserve_b"), currentB + assetBAmount);
      this.total_lp.set(toBytes("total_lp"), totalLp +  lpToMint);
      
      // Update user's LP balance
      const userLp = this.lp_balance(Txn.sender).get();
      this.lp_balance(Txn.sender).put(userLp.add(lpToMint)); 
    }

    return Boolean(true);
  }

  // Remove liquidity from the pool
  removeLiquidity(lpToBurn: UInt64): Bool {
    const totalLp = this.total_lp.get(Bytes.fromString("total_lp"));
    const userLp = this.lp_balance(this.txn.sender).get();
    
    // Verify user has enough LP tokens
    this.assert(lpToBurn > UInt64(0));
    this.assert(userLp >= lpToBurn);
    
    const currentA = this.reserve_a.get(Bytes.fromString("reserve_a"));
    const currentB = this.reserve_b.get(Bytes.fromString("reserve_b"));
    
    // Calculate output amounts proportional to LP tokens burned
    const amtA = currentA.mul(lpToBurn).div(totalLp);
    const amtB = currentB.mul(lpToBurn).div(totalLp);
    
    // Update reserves and LP totals
    this.reserve_a.put(Bytes.fromString("reserve_a"), currentA.sub(amtA));
    this.reserve_b.put(Bytes.fromString("reserve_b"), currentB.sub(amtB));
    this.total_lp.put(Bytes.fromString("total_lp"), totalLp.sub(lpToBurn));
    this.lp_balance(this.txn.sender).put(userLp.sub(lpToBurn));
    
    // Note: The actual transfer of assets to the user must be handled separately
    // through a transaction group in the client code
    
    return Bool(true);
  }

  // Swap tokens
  @method
  swap(
    sendAssetType: UInt64, // 1 if asset_a -> b, 2 if asset_b -> a
    swapAmount: UInt64,
    @beforeTransaction(1) payment: Transaction,
  ): Bool {
    // Verify transaction
    this.assert(payment.typeEnum === 'axfer');
    this.assert(payment.assetAmount === swapAmount);
    this.assert(payment.sender === this.txn.sender);
    
    if (sendAssetType === UInt64(1)) {
      // Swap asset A for asset B
      this.assert(payment.xferAsset === this.asset_a.get(Bytes.fromString("asset_a")));
      
      const resA = this.reserve_a.get(Bytes.fromString("reserve_a")).add(swapAmount);
      const resB = this.reserve_b.get(Bytes.fromString("reserve_b"));
      
      // Calculate constant product formula with fee
      const k = this.reserve_a.get(Bytes.fromString("reserve_a")).mul(this.reserve_b.get(Bytes.fromString("reserve_b")));
      const newB = k.mul(UInt64(this.FEE_DEN)).div(resA.mul(UInt64(this.FEE_NUM)));
      const outB = resB.sub(newB);
      
      // Update reserves
      this.reserve_a.put(Bytes.fromString("reserve_a"), resA);
      this.reserve_b.put(Bytes.fromString("reserve_b"), resB.sub(outB));
      
      // Note: The actual transfer of output asset to the user must be handled separately
    } else {
      // Swap asset B for asset A
      this.assert(payment.xferAsset === this.asset_b.get(Bytes.fromString("asset_b")));
      
      const resB = this.reserve_b.get(Bytes.fromString("reserve_b")).add(swapAmount);
      const resA = this.reserve_a.get(Bytes.fromString("reserve_a"));
      
      // Calculate constant product formula with fee
      const k = this.reserve_a.get(Bytes.fromString("reserve_a")).mul(this.reserve_b.get(Bytes.fromString("reserve_b")));
      const newA = k.mul(UInt64(this.FEE_DEN)).div(resB.mul(UInt64(this.FEE_NUM)));
      const outA = resA.sub(newA);
      
      // Update reserves
      this.reserve_b.put(Bytes.fromString("reserve_b"), resB);
      this.reserve_a.put(Bytes.fromString("reserve_a"), resA.sub(outA));
      
      // Note: The actual transfer of output asset to the user must be handled separately
    }
    
    return Bool(true);
  }
}
