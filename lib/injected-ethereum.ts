import type { Eip1193Provider } from "ethers"

export type InjectedEthereum = Eip1193Provider & {
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

/**
 * When multiple wallets are installed, `window.ethereum` may be a proxy.
 * Prefer MetaMask if present, otherwise the primary injected provider.
 */
export function getInjectedEthereum(): InjectedEthereum | null {
  if (typeof window === "undefined") return null
  const eth = window.ethereum
  if (!eth) return null
  const multi = eth.providers
  if (multi?.length) {
    const mm = multi.find((p: Eip1193Provider & { isMetaMask?: boolean }) => p.isMetaMask)
    return (mm ?? multi[0]) as InjectedEthereum
  }
  return eth as InjectedEthereum
}

export function isInjectedWalletAvailable(): boolean {
  return getInjectedEthereum() !== null
}

/**
 * Revoke this site's access to account addresses (EIP-2255). After this, the next
 * `eth_requestAccounts` should show the wallet's connection prompt again.
 * Does not lock the wallet or ask for the wallet password — that is only controlled
 * inside the wallet app (e.g. MetaMask → Lock).
 */
export async function revokeSiteWalletPermissions(eth: InjectedEthereum): Promise<boolean> {
  try {
    await eth.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }],
    })
    return true
  } catch {
    return false
  }
}

function normalizeHexChainId(id: string): string {
  const s = id.toLowerCase().replace(/^0x/, "")
  return `0x${BigInt(`0x${s}`).toString(16)}`
}

export function getTargetChainIdHex(): string | null {
  const raw = process.env.NEXT_PUBLIC_CHAIN_ID?.trim()
  if (!raw) return null
  try {
    return raw.startsWith("0x") ? normalizeHexChainId(raw) : normalizeHexChainId(`0x${BigInt(raw).toString(16)}`)
  } catch {
    return null
  }
}

export async function ensureWalletChain(eth: InjectedEthereum): Promise<void> {
  const target = getTargetChainIdHex()
  if (!target) return

  const current = (await eth.request({ method: "eth_chainId" })) as string
  if (normalizeHexChainId(current) === target) return

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: target }],
    })
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL?.trim()
    if (code === 4902 && rpcUrl) {
      const name = process.env.NEXT_PUBLIC_CHAIN_NAME?.trim() || "Configured network"
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: target,
            chainName: name,
            nativeCurrency: {
              name: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME || "Ether",
              symbol: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL || "ETH",
              decimals: 18,
            },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL
              ? [process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL]
              : undefined,
          },
        ],
      })
      return
    }
    throw err
  }
}

export function getWalletErrorMessage(error: unknown): string {
  const e = error as { code?: number; message?: string }
  if (e?.code === 4001) {
    return "Connection was rejected. Approve the request in your wallet to continue."
  }
  if (e?.code === -32002) {
    return "A wallet request is already open. Check your wallet extension."
  }
  if (typeof e?.message === "string" && e.message.includes("User denied")) {
    return "Connection was rejected in your wallet."
  }
  return e?.message || "Could not connect to your wallet. Please try again."
}
