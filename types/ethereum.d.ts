import type { Eip1193Provider } from "ethers"

type EthereumWithEvents = Eip1193Provider & {
  providers?: Eip1193Provider[]
  isMetaMask?: boolean
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: EthereumWithEvents
  }
}

export {}
