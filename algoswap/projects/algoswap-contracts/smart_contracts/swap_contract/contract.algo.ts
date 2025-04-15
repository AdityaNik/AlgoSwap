import { Contract } from '@algorandfoundation/algorand-typescript'

export class SwapContract extends Contract {
  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
