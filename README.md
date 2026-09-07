# KalyChain Vault

Landing page + dApp for the KalyChain Vault NFT program on **KalyChain (chain id 3890, native KMT)**.
Buy a vault NFT with a stablecoin, the protocol converts part of the payment into protocol-owned
liquidity (POL) on the KalySwap V3 KMT/stable pools, and the vault earns KMT from the RewardsPool
until it hits its USD cap.

Next.js (App Router) · wagmi/viem · thirdweb in-app wallet · Tailwind. RPC + subgraph only, no backend.
Contracts live in a separate repo: `../vaults-core`. Every address below is mirrored from
`kalychain-ops/files/kmt-3890/addresses.json` — `src/lib/chain/addresses.test.ts` fails if they drift.

> **Relaunch state (2026-08-27):** the 3890 stack is deployed with sales **paused** and zero vaults
> minted; vault migration + the KMT airdrop run at the final cut. The landing page and the buy
> section read `VaultManager.paused()` and say so — they never claim a live sale while it's paused.

---

## Operator funding — two separate pots

The protocol has **two** pools of KMT that serve different purposes. Confusing them is the easiest
operational mistake to make, so read this table before sending anything.

| | RewardsPool | VaultManager WKMT reserve |
|---|---|---|
| Pays for | Vault **yield** — what holders claim | The **POL seed side** of each purchase |
| Scales with vault sales | No | **Yes — this is the one that drains** |
| Funded by | 0.03 KMT/block block reward, automatic (since block 5100) | Manual, by an operator |
| How to fund | Plain native-KMT transfer | **Must call `fundReserve()`** (payable) |
| Address | `0x82eeCEcF8C3bbD94A3A11Abe04Ce3F49BbA35E52` | `0xDA2A7a2D504949896e709F546B6Bc06C2E7c5982` |

Short version: the **RewardsPool takes care of itself**; the **WKMT reserve is the one an operator
has to keep topped up** as vaults sell (131,370 WKMT at relaunch).

### RewardsPool health check

```bash
RPC=https://mainrpc.kalychain.io/rpc   # → production RPC after the DNS cut-over
POOL=0x82eeCEcF8C3bbD94A3A11Abe04Ce3F49BbA35E52
cast balance $POOL --rpc-url $RPC --ether
cast call $POOL "lastDistributedBalance()(uint256)" --rpc-url $RPC
```

`balance - lastDistributedBalance` is the KMT that has arrived but not yet been folded into
`rewardPerWeightStored`. Accounting is pull-based: `_accrue()` runs on the next `claim`,
`claimMany`, `mature`, or `registerVault`. Surplus growing → healthy. Surplus trending to zero →
claims outpace the emission; top up with a **plain native-KMT transfer** (payable `receive()`, no
admin call). Never send WKMT (stranded) and never send KMT to the VaultManager (no `receive()`).

### VaultManager WKMT reserve

```bash
cast send 0xDA2A7a2D504949896e709F546B6Bc06C2E7c5982 "fundReserve()" --value <KMT> --legacy --gas-price 21gwei \
  --rpc-url $RPC --private-key <key>
cast call 0xDA2A7a2D504949896e709F546B6Bc06C2E7c5982 "reserveWklc()(uint256)" --rpc-url $RPC
```

`fundReserve()` is permissionless and wraps the KMT you send. **A dry reserve does not revert — it
degrades silently** (`PolLib` caps the seed leg at what's available), so watch `reserveWklc()`.
Every KalyChain tx needs ≥ 21 gwei (legacy gas price or EIP-1559 tip) or it never mines.

---

## Deployed addresses — KalyChain 3890

RPC `https://mainrpc.kalychain.io/rpc` · Explorer `https://testnet.kalyscan.io` (hostnames switch
at cut-over; both are env-driven, see below). Source of truth in code: `src/lib/chain/addresses.ts`.

| Contract | Address |
|---|---|
| VaultManager (UUPS proxy) | `0xDA2A7a2D504949896e709F546B6Bc06C2E7c5982` |
| **RewardsPool (UUPS proxy) — KMT refill target** | `0x82eeCEcF8C3bbD94A3A11Abe04Ce3F49BbA35E52` |
| PolLib (delegatecall library) | `0x6F386FB67851d321a1C3589eb2e37464C1a25435` |
| WKMT | `0xf90F0Bd56558Ac12F7FC285571D38181d2feD69b` |
| NonfungiblePositionManager (V3) | `0xCa4a8fC696ADAE8edC042cB9E32Cd7F0A28EBdf0` |
| DAO Treasury (holds the POL LP NFTs) | `0xDF8CFefEa7DaA5E5B23c262A461aCcA6356BCA90` |

Accepted stables (`VaultManager.stables`) — **USDT only at launch** (USDC/DAI/KUSD not enabled):

| Stable | Token | Decimals | KMT pool (0.3%) |
|---|---|---|---|
| USDT — **price anchor** | `0x6318EcDbae6B469D39C38949eDC671f4bA8A6172` | 6 | `0xa9Ac6D3c75A883Cc5D6EfE7EbB973c68174bA61F` |

Deploy blocks `4581–4620` (event scans and the subgraph start at 4581).

### Subgraphs

| Subgraph | URL |
|---|---|
| Vault | `https://app.kalyswap.io/subgraphs/name/vault-subgraph-kmt` |
| KalySwap V3 (pool TVL + KMT price) | `https://app.kalyswap.io/subgraphs/name/v3-subgraph-kmt` |

Subgraphs serve historical series, aggregates, and the affiliate graph; live values (claimable KMT,
mark-to-market POL, `paused()`) always come from RPC. The KMT/USD price is the V3 bundle
(`ethPriceUSD` — WKMT is the base token); if that read fails the UI falls back to the labelled
$0.20 relaunch price (`BASE_KMT_PRICE`).

---

## Fee split

Read live from the VaultManager (`n1Bps`/`n2Bps`/`n3Bps`/`devBps`/`daoBps`), verified on 3890:
Affiliate L1 600 · L2 250 · L3 150 · Dev 200 · DAO treasury 800. Unqualified affiliate legs roll
into the DAO treasury.

## Tiers

On-chain (`VaultManager.tiers`), tiers 0–7 all active — identical to `src/lib/tiers.ts`:

| Tier | Price (USD) | APR | Weight |
|---|---|---|---|
| 0 | 50 | 30% | 150,000 |
| 1 | 100 | 40% | 400,000 |
| 2 | 1,000 | 50% | 5,000,000 |
| 3 | 5,000 | 60% | 30,000,000 |
| 4 | 10,000 | 70% | 70,000,000 |
| 5 | 25,000 | 80% | 200,000,000 |
| 6 | 50,000 | 100% | 500,000,000 |
| 7 | 100,000 | 140% | 1,400,000,000 |

Each vault earns KMT pro-rata to its weight until `earnedUsd` reaches its USD cap, then it matures
and its weight leaves the pool.

---

## Development

Dev servers run through portless (see the workspace CLAUDE.md) — no raw ports.

```bash
npm install
npm run dev      # portless → https://kalyvault.localhost
npm run dev:raw  # plain next dev, if the portless proxy isn't up
npm test         # vitest (84 tests incl. the 3890 migration guard + address-book sync)
npm run lint
npm run build
```

Copy `.env.example` to `.env.local`. Vars:

- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` — use the **same** value as the KalySwap frontend so users share
  one wallet (same email/social login → same address) across both apps.
- `NEXT_PUBLIC_RPC_URL` / `NEXT_PUBLIC_EXPLORER_URL` — **cut day: set these and rebuild.** Nothing
  else in the app hardcodes a KalyChain host.
- `NEXT_PUBLIC_VAULT_SUBGRAPH_URL` / `NEXT_PUBLIC_V3_SUBGRAPH_URL` — default to the `-kmt` deployments.

### Layout

```
src/lib/chain/     chains (ONE chain), addresses, ABIs, reads/writes, POL math, affiliate graph, subgraph client, status
src/components/    landing page sections
src/components/app dApp (vaults, buy, POL hero, affiliate dashboard, leaderboard)
src/i18n/          en + fr dictionaries
```
