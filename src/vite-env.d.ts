/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
  readonly VITE_SATOHASH_URL: string
  readonly VITE_NOSTR_RELAY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  nostr?: {
    getPublicKey(): Promise<string>
    signEvent(event: unknown): Promise<unknown>
    nip04?: {
      encrypt(pubkey: string, plaintext: string): Promise<string>
      decrypt(pubkey: string, ciphertext: string): Promise<string>
    }
  }
}