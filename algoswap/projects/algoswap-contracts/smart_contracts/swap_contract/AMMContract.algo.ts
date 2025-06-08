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
} from '@algorandfoundation/algorand-typescript';
import { itob } from '@algorandfoundation/algorand-typescript/op';

export class MultiPoolAMMContract extends Contract {
  // Pool storage using separate BoxMaps for each field
  // Since complex objects can't be stored directly, we'll store each field separately
  public poolAssetA = BoxMap<bytes, Asset>({ keyPrefix: Bytes`pa_` });
  public poolAssetB = BoxMap<bytes, Asset>({ keyPrefix: Bytes`pb_` });
  public poolReserveA = BoxMap<bytes, uint64>({ keyPrefix: Bytes`ra_` });
  public poolReserveB = BoxMap<bytes, uint64>({ keyPrefix: Bytes`rb_` });
  public poolTotalLp = BoxMap<bytes, uint64>({ keyPrefix: Bytes`lp_` });
  
  // LP balances storage
  // Key format: "lp_{poolKey}_{account}"
  public lpBalances = BoxMap<bytes, uint64>({ keyPrefix: Bytes`bal_` });
  
  // Constants
  private readonly FEE_NUM = GlobalState<uint64>({ initialValue: Uint64(997) }); // 0.3% fee
  private readonly FEE_DEN = GlobalState<uint64>({ initialValue: Uint64(1000) });

  // Helper function to create a consistent pool key
  private getPoolKey(assetIdA: Asset, assetIdB: Asset): bytes {
    // Ensure consistent ordering (smaller asset ID first)
    const idA = assetIdA.id;
    const idB = assetIdB.id;
    
    if (idA < idB) {
      // Convert uint64 to bytes manually
      const bytesA = itob(idA);
      const bytesB = itob(idB);
      return bytesA.concat(bytesB);
    } else {
      const bytesA = itob(idA);
      const bytesB = itob(idB);
      return bytesB.concat(bytesA);
    }
  }

  

  // Helper function to create LP balance key
  private getLpBalanceKey(poolKey: bytes, account: Account): bytes { 
    const accountBytes = account.bytes;
    return poolKey.concat(accountBytes);
  }

  // Create a new AMM pool
  public createPool(assetIdA: Asset, assetIdB: Asset): boolean {     
    // ensureBudget(5000);
    assert(assetIdA !== assetIdB, "Cannot create pool with same asset");
    
    const assetA = Asset(assetIdA.id);
    const assetB = Asset(assetIdB.id);

    const poolKey = this.getPoolKey(assetA, assetB);
    assert(!this.poolAssetA(poolKey).exists, "Pool already exists");

    // Determine correct order for assets
    const orderedAssetA = assetA.id < assetB.id ? assetA : assetB;
    const orderedAssetB = assetA.id < assetB.id ? assetB : assetA;

    // Create the pool by setting individual fields
    this.poolAssetA(poolKey).value = orderedAssetA;
    this.poolAssetB(poolKey).value = orderedAssetB;
    this.poolReserveA(poolKey).value = Uint64(0);
    this.poolReserveB(poolKey).value = Uint64(0);
    this.poolTotalLp(poolKey).value = Uint64(0);

    // Initialize creator's LP balance
    const lpKey = this.getLpBalanceKey(poolKey, Txn.sender);
    this.lpBalances(lpKey).value = Uint64(0);

    // Opt into both assets
    this.optInToAsset(orderedAssetA);
    this.optInToAsset(orderedAssetB);

    return true;
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

  // Add liquidity to a specific pool
  public addLiquidity(
    assetIdA: Asset,
    assetIdB: Asset,
    assetAAmount: uint64,
    assetBAmount: uint64
  ): boolean {
    ensureBudget(10000);
    
    assert(Global.groupSize === 3, "Expected group size of 3 (app call + 2 asset transfers)");
    
    const assetA = Asset(assetIdA.id);
    const assetB = Asset(assetIdB.id);

    const poolKey = this.getPoolKey(assetA, assetB);
    assert(this.poolAssetA(poolKey).exists, "Pool does not exist");
    
    const poolAssetA = this.poolAssetA(poolKey).value;
    const poolAssetB = this.poolAssetB(poolKey).value;
    const reserveA = this.poolReserveA(poolKey).value;
    const reserveB = this.poolReserveB(poolKey).value;
    const totalLp = this.poolTotalLp(poolKey).value;
    
    const lpKey = this.getLpBalanceKey(poolKey, Txn.sender);
    
    // Ensure amounts are in correct order
    const amountA = assetA.id === poolAssetA.id ? assetAAmount : assetBAmount;
    const amountB = assetA.id === poolAssetA.id ? assetBAmount : assetAAmount;
    
    if (totalLp === Uint64(0)) {
      // First liquidity provision
      this.poolReserveA(poolKey).value = amountA;
      this.poolReserveB(poolKey).value = amountB;
      this.poolTotalLp(poolKey).value = Uint64(1000);
      
      this.lpBalances(lpKey).value = Uint64(1000);
    } else {
      // Calculate LP tokens to mint
      const lpMintedA: uint64 = amountA * totalLp / reserveA;
      const lpMintedB: uint64 = amountB * totalLp / reserveB;
      
      const lpToMint = lpMintedA < lpMintedB ? lpMintedA : lpMintedB;
      
      // Update pool
      this.poolReserveA(poolKey).value = reserveA + amountA;
      this.poolReserveB(poolKey).value = reserveB + amountB;
      this.poolTotalLp(poolKey).value = totalLp + lpToMint;
      
      // Update user's LP balance
      if (!this.lpBalances(lpKey).exists) {
        this.lpBalances(lpKey).value = lpToMint;
      } else {
        this.lpBalances(lpKey).value += lpToMint;
      }
    }

    return true;
  }

  // Remove liquidity from a specific pool
  public removeLiquidity(
    assetIdA: Asset,
    assetIdB: Asset,
    lpToBurn: uint64
  ): boolean {
    ensureBudget(10000);

    const assetA = Asset(assetIdA.id);
    const assetB = Asset(assetIdB.id);
    
    const poolKey = this.getPoolKey(assetA, assetB);
    assert(this.poolAssetA(poolKey).exists, "Pool does not exist");
    
    const poolAssetA = this.poolAssetA(poolKey).value;
    const poolAssetB = this.poolAssetB(poolKey).value;
    const reserveA = this.poolReserveA(poolKey).value;
    const reserveB = this.poolReserveB(poolKey).value;
    const totalLp = this.poolTotalLp(poolKey).value;
    
    const lpKey = this.getLpBalanceKey(poolKey, Txn.sender);
    
    assert(this.lpBalances(lpKey).exists, "No LP balance found");
    const userLp = this.lpBalances(lpKey).value;
    
    assert(lpToBurn > Uint64(0), "Must burn positive amount");
    assert(userLp >= lpToBurn, "Insufficient LP balance");
    
    // Calculate output amounts
    const amtA: uint64 = reserveA * lpToBurn / totalLp;
    const amtB: uint64 = reserveB * lpToBurn / totalLp;
    
    // Update pool reserves
    this.poolReserveA(poolKey).value = reserveA - amtA;
    this.poolReserveB(poolKey).value = reserveB - amtB;
    this.poolTotalLp(poolKey).value = totalLp - lpToBurn;
    
    // Update user's LP balance
    this.lpBalances(lpKey).value -= lpToBurn;
    
    // Send assets back to user
    itxn.assetTransfer({
      assetAmount: amtA,
      assetReceiver: Txn.sender,
      fee: Uint64(1),
      xferAsset: poolAssetA,
      sender: Global.currentApplicationAddress
    }).submit();
    
    itxn.assetTransfer({
      assetAmount: amtB,
      assetReceiver: Txn.sender,
      fee: Uint64(1),
      xferAsset: poolAssetB,
      sender: Global.currentApplicationAddress
    }).submit();

    return true;
  }

  // Swap tokens in a specific pool
  public swap(
    assetIdA: Asset,
    assetIdB: Asset,
    sendAssetId: Asset,
    swapAmount: uint64
  ): boolean {
    ensureBudget(8000);
    
    assert(Global.groupSize === 2, "Expected group size of 2 (app call + asset transfer)");
    
    const poolKey = this.getPoolKey(assetIdA, assetIdB);
    assert(this.poolAssetA(poolKey).exists, "Pool does not exist");
    
    const poolAssetA = this.poolAssetA(poolKey).value;
    const poolAssetB = this.poolAssetB(poolKey).value;
    const reserveA = this.poolReserveA(poolKey).value;
    const reserveB = this.poolReserveB(poolKey).value;
    const totalLp = this.poolTotalLp(poolKey).value;
    
    // Determine which asset is being sent and which is being received
    let outputAmount: uint64;
    let newReserveA: uint64;
    let newReserveB: uint64;
    let outputAsset: Asset;
    
    if (sendAssetId === poolAssetA) {
      // Swapping A for B
      const k: uint64 = reserveA * reserveB;
      const newReserveATemp: uint64 = reserveA + swapAmount;
      const newReserveBTemp: uint64 = k * this.FEE_DEN.value / (newReserveATemp * this.FEE_NUM.value);
      
      outputAmount = reserveB - newReserveBTemp;
      newReserveA = newReserveATemp;
      newReserveB = reserveB - outputAmount;
      outputAsset = poolAssetB;
    } else {
      // Swapping B for A
      const k: uint64 = reserveA * reserveB;
      const newReserveBTemp: uint64 = reserveB + swapAmount;
      const newReserveATemp: uint64 = k * this.FEE_DEN.value / (newReserveBTemp * this.FEE_NUM.value);
      
      outputAmount = reserveA - newReserveATemp;
      newReserveA = reserveA - outputAmount;
      newReserveB = newReserveBTemp;
      outputAsset = poolAssetA;
    }
    
    // Update pool reserves
    this.poolReserveA(poolKey).value = newReserveA;
    this.poolReserveB(poolKey).value = newReserveB;
    // totalLp remains unchanged during swaps
    
    // Send output asset to user
    itxn.assetTransfer({
      assetAmount: outputAmount,
      assetReceiver: Txn.sender,
      fee: Uint64(1),
      xferAsset: outputAsset,
      sender: Global.currentApplicationAddress
    }).submit();

    return true;
  }

  // Get LP balance for a specific pool
  public getLpBalance(assetIdA: Asset, assetIdB: Asset, account: Account): uint64 {
    const poolKey = this.getPoolKey(assetIdA, assetIdB);
    const lpKey = this.getLpBalanceKey(poolKey, account);
    
    if (!this.lpBalances(lpKey).exists) {
      return Uint64(0);
    }
    return this.lpBalances(lpKey).value;
  }

  // Get pool information
  public getPoolInfo(assetIdA: Asset, assetIdB: Asset): [uint64, uint64, uint64, uint64, uint64] {
    const poolKey = this.getPoolKey(assetIdA, assetIdB);
    assert(this.poolAssetA(poolKey).exists, "Pool does not exist");
    
    const poolAssetA = this.poolAssetA(poolKey).value;
    const poolAssetB = this.poolAssetB(poolKey).value;
    const reserveA = this.poolReserveA(poolKey).value;
    const reserveB = this.poolReserveB(poolKey).value;
    const totalLp = this.poolTotalLp(poolKey).value;
    
    return [
      poolAssetA.id,
      poolAssetB.id,
      reserveA,
      reserveB,
      totalLp,
    ];
  }

  // Check if pool exists
  public poolExists(assetIdA: Asset, assetIdB: Asset): boolean {
    const poolKey = this.getPoolKey(assetIdA, assetIdB);
    return this.poolAssetA(poolKey).exists;
  }
}
