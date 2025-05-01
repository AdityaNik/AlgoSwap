import {
  Contract,
  Asset,
  uint64,
  bytes,
  Uint64,
  assert,
  Txn,
  Account,
} from '@algorandfoundation/algorand-typescript';
import { toBytes } from '@algorandfoundation/algorand-typescript-testing/encoders';
import { PaymentTransaction } from '@algorandfoundation/algorand-typescript-testing/impl/transactions';

export class AMMContract extends Contract {
  // Global state
  public asset_a = new Map<bytes, uint64>();
  public asset_b = new Map<bytes, uint64>();
  public reserve_a = new Map<bytes, uint64>();
  public reserve_b = new Map<bytes, uint64>();
  public total_lp = new Map<bytes, uint64>();

  // Local state
  public lp_balance = new Map<Account, uint64>();

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
    paymentA: PaymentTransaction,
    paymentB: PaymentTransaction,
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
      this.lp_balance.set(Txn.sender, Uint64(1000));  
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
      const userLp = this.lp_balance.get(Txn.sender);
      if(userLp === undefined) {
        return false;
      }
      this.lp_balance.set(Txn.sender, (userLp + lpToMint));   
    }

    return Boolean(true);
  }

  // Remove liquidity from the pool
  public removeLiquidity(lpToBurn: uint64): boolean {
    const totalLp = this.total_lp.get(toBytes("total_lp"));
    const userLp = this.lp_balance.get(Txn.sender);
    
    if (userLp === undefined) {
      return false;
    }

    // Verify user has enough LP tokens
    assert(lpToBurn > Uint64(0));
    assert(userLp >= lpToBurn);
    
    const currentA = this.reserve_a.get(toBytes("reserve_a"));
    const currentB = this.reserve_b.get(toBytes("reserve_b"));
    
    // Calculate output amounts proportional to LP tokens burned
    if(currentA === undefined || currentB === undefined || totalLp === undefined) {
      return false;
    }
    const amtA = currentA * (lpToBurn) / (totalLp); 
    const amtB = currentB * (lpToBurn) / (totalLp);
    
    // Update reserves and LP totals
    this.reserve_a.set(toBytes("reserve_a"), currentA - amtA);
    this.reserve_b.set(toBytes("reserve_b"), currentB - amtB);
    this.total_lp.set(toBytes("total_lp"), totalLp - lpToBurn);
    this.lp_balance.set(Txn.sender, (userLp - lpToBurn));
    
    return true;
  }

  public swap(
    sendAssetType: uint64, // 1 if asset_a -> b, 2 if asset_b -> a
    swapAmount: uint64,
    payment: PaymentTransaction, 
  ): boolean {
    // Verify transaction\
    assert(payment.amount === swapAmount);
    assert(payment.sender === Txn.sender);
    
    if (sendAssetType === Uint64(1)) {
      // Swap asset A for asset B
     let temp = this.asset_a.get(toBytes("asset_a"));

      if(temp === undefined) {
        temp = Uint64(0);
      }
      const resA = temp + swapAmount;
      const resB = temp;
      
      // Calculate constant product formula with fee
      const temp2 = this.reserve_a.get(toBytes("reserve_a"));
      const temp3 = this.reserve_b.get(toBytes("reserve_b"));
      if(temp2 === undefined || temp3 === undefined) {  
        return false;
      }
      const k = temp2 * temp3;
      const newB = k * (Uint64(this.FEE_DEN)) / (resA * (Uint64(this.FEE_NUM)));      
      const outB = resB - newB; 
  
      // Update reser ves
      if(resB !== undefined) {
        this.reserve_a.set(toBytes("reserve_a"), resA);
        this.reserve_b.set(toBytes("reserve_b"), resB - outB);
      }
      // Note: The actual transfer of output asset to the user must be handled separately
    } else {
      // Swap asset B for asset A
      let temp = this.asset_b.get(toBytes("asset_b"));
      if(temp === undefined) {
        temp = Uint64(0);
      }
      const resB = temp + swapAmount; 
      const resA = this.reserve_a.get(toBytes("reserve_a"));
      
      // Calculate constant product formula with fee
      const temp2 = this.reserve_a.get(toBytes("reserve_a"));
      const temp3 = this.reserve_b.get(toBytes("reserve_b"));
      if(temp2 === undefined || temp3 === undefined) {  
        return false;
      }
      const k = temp2 * temp3;
      const newA = k * (Uint64(this.FEE_DEN)) / (resB * (Uint64(this.FEE_NUM)));
      if(resA === undefined) {
        return false;
      }
      const outA = resA - newA;
      
      // Update reserves
      if(resA !== undefined) {
        this.reserve_a.set(toBytes("reserve_a"), resA - outA);
        this.reserve_b.set(toBytes("reserve_b"), resB);
      }
      // Note: The actual transfer of output asset to the user must be handled separately
    }
    
    return true;
  }
}
