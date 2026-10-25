# Lidde Fun — PurrFlow-referenced trading workspace redesign
Date: 25 October 2026

## Scope
This is an original Lidde Fun implementation in Next.js/React/TypeScript with Inter, Lucide and scoped CSS. The ten supplied PurrFlow desktop screenshots provided geometry, dark colour and interaction references only. Their names, token logos, prices, trades, performance and fictional accounts were not copied or displayed as Lidde data.

The prior homepage had sample tokens, sample prices, pretend market caps and simulated sample quests. The new terminal reads only from existing canonical Lidde Fun APIs and displays accurate empty states when the isolated sandbox network is not running. Source logic for launchpad, swaps, first pools, quest issuance, eligibility, XP, portfolio and notifications is unchanged and remains independently accessible.

## Screens implemented

- `/`, `/quests`, and `/quest`: 90px header, 336px independent scroll sidebar, five changing sidebar tabs, real escrow-backed quest feature/banner with overlapping avatars, verified claim progress, "more quests" cards, create-quest link, split workspace and fixed bottom ticker.
- `/discover`: canonical indexed token and pool information. Token list categories New, Active, Trending and Crypto use indexed verified source fields. Graduated is empty until verified graduation events exist.
- `/token/[address]`: token identity, real pool association, known reserve ratio, pair links and canonical Sync history via existing `PairHistory`. No unsupported fiat prices, market caps or implied creator verification.
- `/perp/[market]`: three-column reference layout when screen width permits: left discovery panel, centre chart/risk data and right order entry research panel. Buy/Sell, amount shortcuts, risk leverage 1x–10x, timeframe, line/candle preference, chart settings, fullscreen and TP/SL form controls update UI. A real perpetual exchange is NOT deployed; order submission is disabled, and all market-price, OHLCV, funding and open-interest fields correctly show unavailable. The existing `/perps` simulator is preserved.
- `/leaderboard`: verified XP leaderboard, including original wallet-signed import and privacy controls, within the new terminal shell. Sidebar supports real XP ranks or canonical token swap counts; no invented PnL or fund returns.
- `/trader/[address]`: on-chain verified portfolio where available, opted-in XP, and follow/unfollow options. If backend is unavailable, follows are explicitly browser-local.
- `/names`: honest unconfigured `.very` identity registrar/resolver state without inventing a smart contract. Wallet ownership and registrations are NOT operational.
- `/privacy`, `/terms`, `/help`: reachable placeholders clearly marked incomplete for legal public-launch approval.

## Reusable interaction and data layer

- Global search matches verified token names, contracts, wallet addresses and verified quests; keyboard slash focuses the input and Enter navigates.
- Sidebar tabs, token subcategories, Perp category tabs, window controls, tracked-wallet activity, quest selection and split-right/bottom layouts all change actual state.
- Split setting and local followed wallets persist to localStorage. A separate server-backed optional signed follow API supports privacy-conscious ownership; database migration `db/migrations/016_social_follows.sql` was applied to existing project `lidde-fun-quests`. The signed server system obeys the existing emergency-write stop and requires the trusted app origin and Neon runtime credentials.
- Read-only `/api/workspace/activity` retrieves the canonical DEX swap feed from the configured source and independently validates successful Router transaction receipts, canonical block hash, pair provenance, event log index and raw token amounts before showing an event. Missing infrastructure returns HTTP 503, empty events; never substitute sample swaps or USD amounts.
- The bottom ticker uses only indexed pair reserve ratios and indicates "Disconnected" otherwise.
- Responsive sidebar toggle, mobile five-action navigation, keyboard and ARIA accessibility, reduced-motion policy.

## Existing user workflows preserved

- `/launch` demo token creator and `/pools/create` first pool.
- `/trade` verified spot trading.
- `/portfolio` balances, LP management.
- `/quests/create` wallet-signed quest creator.
- `/quests/[id]` verified task proof and signed claim flow.
- `/alerts`, `/community`, `/lab`, `/beta`, `/network` and escrow/XP APIs.

## Deployment, testing and true blockers

The source compiles in GitHub Actions. A separate Chromium acceptance suite under `e2e/workspace.spec.ts` covers tab selections, splits, quest integrity, the perps disabled state, no fabricated token data, token detail, mobile navigation and safe unconfigured API state.

It is still **not a public exchange or verified VERY Mainnet deployment**. The deployed sandbox and indexer remain unconfigured, contracts were only tested on disposable Anvil, `.very` ownership cannot be confirmed and the Vercel team previously returned HTTP 403 on project creation. An external independent contract security audit and multi-wallet public testnet receipt acceptance have not occurred.

Do not enable real-value trades or levered positions based on a successful screenshot test or this UI alone.

## Source

- Core shell: `components/workspace/workspace.tsx`
- Quest feature cards: `components/workspace/quest-board.tsx`
- Perpetual terminal: `components/workspace/perp-terminal.tsx`
- Token detail and trader profile: `components/workspace/token-detail.tsx`, `components/workspace/trader-profile.tsx`
- Verified activity API: `app/api/workspace/activity/route.ts`
- Signed social API: `app/api/workspace/follows/route.ts`
- Styles: `app/globals.css`
- Browser acceptance: `e2e/workspace.spec.ts`
