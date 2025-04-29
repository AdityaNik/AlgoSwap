import { Contract } from '@algorandfoundation/algorand-typescript'

export class LiquidityPoolContract extends Contract {
  public tokenAId: number;
  public tokenBId: number;
  public lpTokenId: number = 0;
  private reserveA: number = 0;
  private reserveB: number = 0;
  private totalSupply: number = 0;
  public feeBps: number;
  public isStable: boolean;


  public constructor(tokenAId: number, tokenBId: number, feeBps: number, isStable: boolean) {
    super();
    this.tokenAId = tokenAId;
    this.tokenBId = tokenBId;
    this.feeBps = feeBps;
    this.isStable = isStable;
  }

  public configureLpToken(lpTokenId: number): void {
    if (this.lpTokenId !== 0) throw new Error("LP token already configured");
    this.lpTokenId = lpTokenId;
  }

  public addLiquidity(tokenAAmount: number, tokenBAmount: number, minLpAmount: number): number {
    let lpAmount: number;

    if (this.totalSupply === 0) {
      lpAmount = Math.sqrt(tokenAAmount * tokenBAmount);
    } else {
      const lpA = (tokenAAmount * this.totalSupply) / this.reserveA;
      const lpB = (tokenBAmount * this.totalSupply) / this.reserveB;
      lpAmount = Math.min(lpA, lpB);
    }

    if (lpAmount < minLpAmount) throw new Error("Insufficient LP tokens");

    this.reserveA += tokenAAmount;
    this.reserveB += tokenBAmount;
    this.totalSupply += lpAmount;

    return lpAmount;
  }

  public removeLiquidity(lpAmount: number, minTokenA: number, minTokenB: number): [number, number] {
    const tokenAOut = (lpAmount * this.reserveA) / this.totalSupply;
    const tokenBOut = (lpAmount * this.reserveB) / this.totalSupply;

    if (tokenAOut < minTokenA || tokenBOut < minTokenB)
      throw new Error("Insufficient output");

    this.reserveA -= tokenAOut;
    this.reserveB -= tokenBOut;
    this.totalSupply -= lpAmount;

    return [tokenAOut, tokenBOut];
  }


  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
