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
} from '@algorandfoundation/algorand-typescript';

export class AMMContract extends Contract {
  // Global state variables
  public assetA = GlobalState<Asset>()
  public assetB = GlobalState<Asset>()
  public reserveA = GlobalState<uint64>({ initialValue: Uint64(0) })
  public reserveB = GlobalState<uint64>({ initialValue: Uint64(0) })
  public totalLp = GlobalState<uint64>({ initialValue: Uint64(0) })
  
  // Local state using BoxMap for LP token balances
  public lpBalances = BoxMap<Account, uint64>({ keyPrefix: Bytes`lp_` })
  
  // Constants
  private readonly FEE_NUM = GlobalState<uint64>({ initialValue: Uint64(997) }); // 0.3% fee
  private readonly FEE_DEN = GlobalState<uint64>({ initialValue: Uint64(1000) });

  // Create the AMM pool
  public createPool(assetIdA: Asset, assetIdB: Asset): boolean {
    ensureBudget(3000)
    this.assetA.value = assetIdA;
    this.assetB.value = assetIdB;

    this.optInToAsset(assetIdA);
    this.optInToAsset(assetIdB);
    return true
  }

  // Opt in to an asset
  private optInToAsset(assetId: Asset): void {
    itxn.assetTransfer({
      assetAmount: 0,
      assetReceiver: Global.currentApplicationAddress,
      fee: 0,
      xferAsset: assetId,
    
    }).submit();
  }

  // Add liquidity to the pool
  public addLiquidity(
    assetAAmount: uint64,
    assetBAmount: uint64
  ): boolean {
    ensureBudget(8000)
    // Verify we're in a transaction group
    assert(Global.groupSize === 3, "Expected group size of 3 (app call + 2 asset transfers)"); 

    // We'll use the app arguments to determine the assets and amounts
    // instead of trying to directly access the other transactions
    assert(this.assetA.hasValue && this.assetB.hasValue, "Pool not initialized")
    
    if (this.totalLp.value === Uint64(0)) {
      // First liquidity provision
      this.reserveA.value = assetAAmount
      this.reserveB.value = assetBAmount
      this.totalLp.value = Uint64(1000)
      
      // Set user's LP balance
      this.lpBalances(Txn.sender).value = Uint64(1000)
    } else {
      // Calculate LP tokens to mint based on the ratio
      const lpMintedA: uint64 = assetAAmount * this.totalLp.value / this.reserveA.value
      const lpMintedB: uint64 = assetBAmount * this.totalLp.value / this.reserveB.value
      
      // Use the smaller amount to ensure price ratio is maintained
      const lpToMint = lpMintedA < lpMintedB ? lpMintedA : lpMintedB
      
      // Update reserves and LP tokens
      this.reserveA.value += assetAAmount
      this.reserveB.value += assetBAmount
      this.totalLp.value += lpToMint
      
      // Update user's LP balance
      if (!this.lpBalances(Txn.sender).exists) {
        this.lpBalances(Txn.sender).value = lpToMint
      } else {
        this.lpBalances(Txn.sender).value += lpToMint
      }
    }

    return true
  }

  // Remove liquidity from the pool
  public removeLiquidity(lpToBurn: uint64): boolean {
    ensureBudget(8000)
    assert(this.lpBalances(Txn.sender).exists, "No LP balance found")
    const userLp = this.lpBalances(Txn.sender).value
    
    // Verify user has enough LP tokens
    assert(lpToBurn > Uint64(0), "Must burn positive amount")
    assert(userLp >= lpToBurn, "Insufficient LP balance")
    
    // Calculate output amounts proportional to LP tokens burned
    const amtA: uint64 = this.reserveA.value * lpToBurn / this.totalLp.value
    const amtB: uint64 = this.reserveB.value * lpToBurn / this.totalLp.value
    
    // Update reserves and LP totals
    this.reserveA.value -= amtA
    this.reserveB.value -= amtB
    this.totalLp.value -= lpToBurn
    this.lpBalances(Txn.sender).value -= lpToBurn
    
    // Note: The actual transfer of assets to the user must be handled separately
    // through a transaction group in the client code
    
    return true
  }

  // Swap tokens
  public swap(
    sendAssetType: uint64, // 1 if asset_a -> b, 2 if asset_b -> a
    swapAmount: uint64
  ): boolean {
    ensureBudget(7000)
    // Verify we're in a transaction group
    assert(Global.groupSize === 2, "Expected group size of 2 (app call + asset transfer)"); 
    
    if (sendAssetType === Uint64(1)) {
      // Swap asset A for asset B
      const resA: uint64 = this.reserveA.value + swapAmount
      const resB: uint64 = this.reserveB.value
      
      // Calculate constant product formula with fee
      const k: uint64 = this.reserveA.value * this.reserveB.value
      const newB: uint64 = k * Uint64(this.FEE_DEN.value) / (resA * Uint64(this.FEE_NUM.value))
      const outB: uint64 = resB - newB
      
      // Update reserves
      this.reserveA.value = resA
      this.reserveB.value = resB - outB
      
      // Note: The actual transfer of output asset to the user must be handled separately
    } else {
      // Swap asset B for asset A
      const resB: uint64 = this.reserveB.value + swapAmount
      const resA: uint64 = this.reserveA.value
      
      // Calculate constant product formula with fee
      const k: uint64 = this.reserveA.value * this.reserveB.value
      const newA: uint64 = k * Uint64(this.FEE_DEN.value) / (resB * Uint64(this.FEE_NUM.value))
      const outA: uint64 = resA - newA
      
      // Update reserves
      this.reserveA.value = resA - outA
      this.reserveB.value = resB
      
      // Note: The actual transfer of output asset to the user must be handled separately
    }
    
    return true
  }

  // Opt in to the contract - sets up local storage for LP tokens
  public optIn(): boolean {
    ensureBudget(1000)
    // Create box for user's LP balance
    if (!this.lpBalances(Txn.sender).exists) {
      this.lpBalances(Txn.sender).value = Uint64(0)
    }
    return true
  }
  
  // Get user's LP balance (readonly method)
  public getLpBalance(account: Account): uint64 {
    if (!this.lpBalances(account).exists) {
      return Uint64(0)
    }
    return this.lpBalances(account).value
  }
  
  // // Get pool info (readonly method)
  // public getPoolInfo(): {
  //   asset_a: Asset,
  //   asset_b: Asset,
  //   reserve_a: uint64,
  //   reserve_b: uint64,
  //   total_lp: uint64
  // } {
  //   return {
  //     asset_a: this.assetA.value,
  //     asset_b: this.assetB.value,
  //     reserve_a: this.reserveA.value,
  //     reserve_b: this.reserveB.value,
  //     total_lp: this.totalLp.value
  //   }
  // }
}
