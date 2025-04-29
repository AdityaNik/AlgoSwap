import { Contract } from '@algorandfoundation/algorand-typescript';

export class SwapContract extends Contract {
  public registry: Map<string, number> = new Map();
  public admin: string;

  public constructor(admin: string) {
    super();
    this.admin = admin;
  }

  public registerPool(tokenAId: number, tokenBId: number, poolId: number): void {
    if (tokenAId === tokenBId) throw new Error("Cannot register identical tokens");
    const key = [tokenAId, tokenBId].sort((a, b) => a - b).join("-");
    this.registry.set(key, poolId);
  }

  public getPoolId(tokenAId: number, tokenBId: number): number {
    const key = [tokenAId, tokenBId].sort((a, b) => a - b).join("-");
    const poolId = this.registry.get(key);
    if (poolId === undefined) throw new Error("Pool not found");
    return poolId;
  }
}
