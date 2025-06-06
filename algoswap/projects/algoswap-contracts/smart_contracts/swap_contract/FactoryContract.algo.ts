// import {
//   Contract,
//   Account,
//   Asset,
//   uint64,
//   BoxMap,
//   Bytes,
//   GlobalState,
//   assert,
//   Txn,
//   Global,
//   Uint64,
//   ensureBudget,
//   itxn,
//   Application,
//   bytes,
// } from '@algorandfoundation/algorand-typescript';
// import { Byte } from '@algorandfoundation/algorand-typescript/arc4';

// export class AMMFactoryContract extends Contract {
//   // Global state to track total number of pools created
//   private totalPools = GlobalState<uint64>({ initialValue: Uint64(0) });

//   // Box storage for pool mappings
//   public poolRegistry = BoxMap<bytes, Application>({ keyPrefix: Bytes.fromBase64('pool_') });

//   // Maps pool ID to asset pair info
//   public poolAssets = BoxMap<Application, bytes>({ keyPrefix: Bytes.fromBase64('assets_') });

//   // Maps user address to a list of pool IDs they created
//   public userPools = BoxMap<Account, bytes>({ keyPrefix: Bytes.fromBase64('user_') });

//   // Create a new AMM pool
//   public createPool(
//     assetIdA: Asset,
//     assetIdB: Asset,
//     ammApprovalProgram: bytes,
//     ammClearProgram: bytes
//   ): Application {
//     ensureBudget(10000);

//     // Ensure asset IDs are different and non-zero
//     assert(assetIdA.id !== assetIdB.id, 'Assets must be different');
//     assert(assetIdA.id > Uint64(0) && assetIdB.id > Uint64(0), 'Invalid asset IDs');

//     // Deterministic asset order (lowest ID first)
//     const firstAsset = assetIdA.id < assetIdB.id ? assetIdA : assetIdB;
//     const secondAsset = assetIdA.id < assetIdB.id ? assetIdB : assetIdA;

//     // Create key for the asset pair
//     const pairKey = this.createPairKey(firstAsset.id, secondAsset.id);

//     // Check for duplicate pool
//     assert(!this.poolRegistry(pairKey).exists, 'Pool already exists for this asset pair');

//     // Deploy new AMM contract
//     const appCallTxn = itxn.applicationCall({
//       approvalProgram: ammApprovalProgram,
//       clearStateProgram: ammClearProgram,
//       globalNumUint: 8, // Adjust to your needs
//       globalNumBytes: 0,
//       localNumUint: 0,
//       localNumBytes: 0,
//       extraProgramPages: 1, // Or more based on contract size
//       fee: Uint64(1000),
//     }).submit();

//     const newPool = appCallTxn.createdApp;

//     // Save pool to registry
//     this.poolRegistry(pairKey).value = newPool;

//     // Store asset pair metadata
//     const assetPairInfo = this.createAssetPairInfo(firstAsset.id, secondAsset.id);
//     this.poolAssets(newPool).value = assetPairInfo;

//     // Track pools created by user
//     this.addUserPool(Txn.sender, newPool);

//     // Increment total pool count
//     this.totalPools.value += Uint64(1);

//     // Initialize the pool via internal call
//     itxn.applicationCall({
//       appId: newPool,
//       appArgs: [Bytes.fromBase64('createPool')],
//       assets: [firstAsset, secondAsset],
//       fee: Uint64(1000),
//     }).submit();

//     return newPool;
//   }

//   // Internal helper: create key for asset pair
//   private createPairKey(assetIdA: uint64, assetIdB: uint64): bytes {
//     return Bytes.bind([
//       Bytes(assetIdA),
//       Bytes(assetIdB),
//     ]);
//   }

//   // Internal helper: encode asset pair metadata
//   private createAssetPairInfo(assetIdA: uint64, assetIdB: uint64): Bytes {
//     return Bytes.bind([
//       Bytes(assetIdA),
//       Bytes(assetIdB),
//     ]);
//   }

//   // Internal helper: track user's created pools
//   private addUserPool(user: Account, poolId: Application): void {
//     const current = this.userPools(user).get() ?? Bytes.from('');
//     const delimiter = Bytes.fromBase64('|');
//     const poolIdBytes = Bytes(poolId.id);

//     const updated = current.length > Uint64(0)
//       ? Bytes.concat([current, delimiter, poolIdBytes])
//       : poolIdBytes;

//     this.userPools(user).value = updated;
//   }

//   // Optional helper: read all user pools
//   public getUserPools(user: Account): uint64[] {
//     const data = this.userPools(user).get();
//     if (!data) return [];

//     const parts = Bytes.split(data, Bytes.from('|'));
//     return parts.map((b) => b.toUint64());
//   }
// }
