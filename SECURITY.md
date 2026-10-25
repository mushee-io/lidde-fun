# Lidde Fun security guidance

Lidde Fun is an unaudited, experimental, valueless blockchain sandbox. No real monetary funds, leverage markets, investment claims, or guaranteed airdrops are supported.

Wallet spending is noncustodial. Every on-chain transaction requires an explicit wallet confirmation, with checks against pinned chain identity and bytecode hashes where configured. The browser never needs your recovery phrase or private key.

Operator writes are disabled by default; LIDDE_FUN_EMERGENCY_STOP=true overrides any enabling flag. The emergency flag disables application actions only, not independently callable on-chain contracts. Escrow campaigns have separate owner-initiated pause functions.

Keep Neon URLs, attestor private keys, RPC operator credentials and Vercel deployment tokens in protected environment secrets. Do not publish them in logs, GitHub issues or screenshots.

Before public beta: independent review of smart contracts and evidence attestations, key management and backup drills, API abuse testing, testnet reorg handling, two-wallet transaction receipts, browser accessibility checks, privacy policy and incident response exercises.

If repository security advisories are enabled, disclose findings privately through a GitHub Security Advisory for mushee-io/lidde-fun rather than by a public vulnerability issue. Never submit a mnemonic or unredacted customer secrets.
