# KalyChain Vault

Landing page + dApp for the KalyChain Vault NFT program. Buy a vault NFT with a stablecoin, the
protocol converts part of the payment into protocol-owned liquidity (POL) on the KalySwap V3
KLC/stable pools, and the vault earns KLC from the RewardsPool until it hits its USD cap.

Next.js (App Router) · wagmi/viem · thirdweb · Tailwind · Supabase + Resend (waitlist).
Contracts live in a separate repo: `../vaults-core`.

---

## Operator funding — two separate pots

The protocol has **two** pools of KLC that serve different purposes. Confusing them is the easiest
operational mistake to make, so read this table before sending anything.

| | RewardsPool | VaultManager WKLC reserve |
|---|---|---|
| Pays for | Vault **yield** — what holders claim | The **POL seed side** of each purchase |
| Scales with vault sales | No | **Yes — this is the one that drains** |
| Funded by | 3 KLC/block block reward, automatic | Manual, by an operator |
| How to fund | Plain native-KLC transfer | **Must call `fundReserve()`** (payable) |
| Mainnet address | `0x8b80800Cf6dA88D59EB09CaE4Fd2196423c48b26` | `0x8ad3aD4a3F20672d39F6F87d6bdf1DF5386ac6A5` |

Short version: the **RewardsPool takes care of itself**; the **WKLC reserve is the one an operator
has to keep topped up** as vaults sell.

---

## 1. RewardsPool — vault yield (self-funding)

**The RewardsPool is self-funding — it receives the chain's block reward.** A flat **3 KLC per
block** is minted directly to the mainnet RewardsPool at the consensus layer, plus that block's
transaction fees. This is not a transfer: blocks with zero transactions still increase the pool's
balance by exactly 3 KLC, so you will see the balance climb continuously on the explorer.

Under normal operation **no manual funding is needed.** A manual top-up is only required if claims
start outpacing the emission (see the health check below).

### Health check — is a top-up needed?

```bash
RPC=https://rpc.kalychain.io/rpc
POOL=0x8b80800Cf6dA88D59EB09CaE4Fd2196423c48b26
cast balance $POOL --rpc-url $RPC --ether
cast call $POOL "lastDistributedBalance()(uint256)" --rpc-url $RPC
```

`balance - lastDistributedBalance` is the KLC that has arrived but not yet been folded into
`rewardPerWeightStored`. Accounting is pull-based: `_accrue()` runs on the next `claim`,
`claimMany`, `mature`, or `registerVault` and splits that surplus across all live vault weight.

- **Surplus growing** → healthy, emission exceeds claims. Do nothing.
- **Surplus trending toward zero** → claims are outpacing the 3 KLC/block emission. Top up manually.

### Manual top-up (only if the surplus is drying up)

| Network | Send KLC to |
|---|---|
| **Mainnet (3888)** | `0x8b80800Cf6dA88D59EB09CaE4Fd2196423c48b26` |
| Testnet (3889) | `0x57616e82d871Fc2f89F57352274b5A80940d7A28` |

Send **native KLC** as a plain transfer — no calldata, no function call, no role required.
`RewardsPool` has a payable `receive()`, and the deposit is picked up by the same `_accrue()` path
above. No admin call afterwards.

Do **not** send WKLC (the ERC-20) — only native KLC is accounted for; WKLC would be stranded.
Do **not** send KLC to the VaultManager — it has no `receive()`/`fallback()`, so a plain transfer
reverts (funds are not lost, the tx just fails). To fund the VaultManager, use `fundReserve()` — see
the next section.

---

## 2. VaultManager WKLC reserve — POL seed (needs topping up)

**This is the pot that scales with vault purchases.** Every buy splits the deposit: part is
market-bought into WKLC, and the rest of the stable has to be balanced against WKLC drawn from this
reserve so the full deposit deploys into an LP position in the same transaction
(`PolLib.deployPol`). The reserve therefore **drains as vaults sell** and must be refilled.

### Funding it — this one IS a function call

```bash
cast send 0x8ad3aD4a3F20672d39F6F87d6bdf1DF5386ac6A5 "fundReserve()" \
  --value <KLC amount> --rpc-url https://rpc.kalychain.io/rpc --private-key <key>
```

`fundReserve()` is `external payable` and **permissionless** — any wallet can top the reserve up, no
role required. It wraps the native KLC you send into WKLC and holds it on the VaultManager. A plain
transfer will **not** work (no `receive()`); it must be this call.

The reserve is deliberately not rescuable — `rescueERC20` explicitly rejects WKLC (`VM: wklc is
reserve`) so it can't be drained out from under a pending buy.

### Monitoring

```bash
cast call 0x8ad3aD4a3F20672d39F6F87d6bdf1DF5386ac6A5 "reserveWklc()(uint256)" \
  --rpc-url https://rpc.kalychain.io/rpc
```

Funding history is on-chain via the `ReserveFunded(address indexed from, uint256 wklcAmount)` event:

```bash
cast logs --from-block 51187545 --address 0x8ad3aD4a3F20672d39F6F87d6bdf1DF5386ac6A5 \
  "ReserveFunded(address,uint256)" --rpc-url https://rpc.kalychain.io/rpc
```

Observed so far: seeded with 10M KLC shortly after deploy, drained to ~7.7M over roughly a month of
sales (~1.8M KLC/month net at that volume), then topped back up to ~14.9M on 2026-08-05. Treat that
burn rate as a rough guide only — it tracks purchase volume, not time.

> **A dry reserve does not revert — it degrades silently.** `PolLib.sol` caps the seed leg at
> whatever is available (`wantWklc <= reserve ? wantWklc : reserve`). If the reserve is short, buys
> still succeed but under-seed the LP position, so the protocol quietly captures less POL than it
> should. There is no error to alert on — watch `reserveWklc()` trending down instead.

---

## Deployed addresses

All values below were read back from the chain (proxy getters + EIP-1967 slots), not just from
config. Source of truth in code: `src/lib/chain/addresses.ts`.

### Mainnet — chainId `3888`

RPC `https://rpc.kalychain.io/rpc` · Explorer `https://kalyscan.io`

| Contract | Address |
|---|---|
| VaultManager (UUPS proxy) | `0x8ad3aD4a3F20672d39F6F87d6bdf1DF5386ac6A5` |
| VaultManager implementation | `0x2888eB6558821cC672Fad3fA36a54a63FCc9EFec` |
| **RewardsPool (UUPS proxy) — KLC refill target** | `0x8b80800Cf6dA88D59EB09CaE4Fd2196423c48b26` |
| RewardsPool implementation | `0x548F014b5E580b68ED9AFc6D65992976377EC0d3` |
| WKLC | `0x069255299Bb729399f3CECaBdc73d15d3D10a2A3` |
| NonfungiblePositionManager (V3) | `0xfa25364Ec856E1C0dd6D14568456C842b288E519` |
| SwapRouter (V3) | `0xEAd6d6ea2aBbe807AC728Eb92c77865b62C41893` |
| Treasury / DAO treasury (holds POL LP NFTs) | `0x92564ec0d22BBd5e3FF978B977CA968e6c7d1c44` |
| Dev recipient (fee bucket) | `0x12BA3F424d630A583BdBCa56b0c1A0a7C1d7D66e` |

Accepted stables (`VaultManager.stables`, all enabled, 0.3% fee tier):

| Stable | Token | Decimals | KLC pool |
|---|---|---|---|
| USDT — **price anchor** | `0x2CA775C77B922A51FcF3097F52bFFdbc0250D99A` | 6 | `0x3848C7C8D088549194A264Cb1d639258AbE406a9` |
| KUSD | `0xCd02480926317748e95c5bBBbb7D1070b2327f1A` | 18 | `0xF8C867C0F07EBa68b2ACF07B9ffd45B1AA1dDcFE` |
| USDC (bridged, enabled 2026-08-17) | `0x9cAb0c396cF0F4325913f2269a0b72BD4d46E3A9` | 6 | `0x65Dd443DFc57F9731AE0fD157B8999976F5fe8aE` |

Deploy block: `51187545` (start block for event scans and the subgraph).

### Testnet — chainId `3889`

RPC `https://testnetrpc.kalychain.io/rpc` · Explorer `https://testnet.kalyscan.io`

| Contract | Address |
|---|---|
| VaultManager (UUPS proxy) | `0xb02f6b79CbB549F188c90f83035dD295d8AdF082` |
| VaultManager implementation | `0x39D4412a7c392ab799d6d76FfE5E20eF0Fa54264` |
| **RewardsPool (UUPS proxy) — KLC refill target** | `0x57616e82d871Fc2f89F57352274b5A80940d7A28` |
| RewardsPool implementation | `0x7650dD91fabDD21Ee3deE4C3d4d00fF58C155676` |
| WKLC | `0x069255299Bb729399f3CECaBdc73d15d3D10a2A3` |
| NonfungiblePositionManager (V3) | `0x8064558662896B2941B2BF88eb51182b4152d61B` |
| SwapRouter (V3) | `0x3246523054b0Bb123372ecf204740Cb04f6E713e` |
| Treasury / DAO treasury | `0x5aE2cf3fC0B99003C64bBDC7836D08064ED43Aab` |
| Dev recipient (fee bucket) | `0x5f255373428C995cE62205C87f605aBD4362BFc4` |

Accepted stables (all enabled, 0.3% fee tier):

| Stable | Token | Decimals | KLC pool |
|---|---|---|---|
| USDT — **price anchor** | `0x6Fdb0fEd277b878a0d80494b06EA054C99d2fdD2` | 6 | `0x4594540BD03928683042E479D4DDF8Ad8705Be5C` |
| KUSD | `0xd15F19c457AaaCB7A389B305Dac8611Cd2294c36` | 18 | `0x090077817153dF024D115942E656c965674E190c` |
| USDC (test token) | `0x148d19609F3Ad595F8455225510f89cF0F121013` | 6 | `0x86Cc2Bf4A68dfA9A7725170808205ae26c586142` |

Deploy block: `48374000` (v4 stack: 80/20 split + 3-level MLM + 8 packs + PolLib).

> **Testnet KUSD caveat.** The workspace-wide note calls `0xd15F19c4…` an old KUSD deployment, but
> it is the one the *testnet VaultManager* actually has enabled (`stables()` returns
> `enabled = true`), and `0x6c52f4af…` returns `enabled = false`. Don't "fix" this address without
> re-running `setStable` on the testnet VaultManager first.

### Subgraphs

| Subgraph | Mainnet | Testnet |
|---|---|---|
| Vault | `https://app.kalyswap.io/subgraphs/name/vault-subgraph-kalychain-mainnet` | none — falls back to RPC log scans |
| KalySwap V3 (TVL + KLC price) | `https://app.kalyswap.io/subgraphs/name/v3-subgraph-kalychain-mainnet` | none |

Source: `src/lib/chain/subgraph.ts`. Subgraphs serve historical series, aggregates, and the
affiliate graph; live values (claimable KLC, mark-to-market POL) always come from RPC.

---

## Fee split

Read live from the VaultManager (`n1Bps`/`n2Bps`/`n3Bps`/`devBps`/`daoBps`); current mainnet values:

| Bucket | Bps |
|---|---|
| Affiliate L1 | 600 |
| Affiliate L2 | 250 |
| Affiliate L3 | 150 |
| Dev | 200 |
| DAO treasury | 800 |

Unqualified affiliate legs roll into the DAO treasury.

## Tiers

On-chain (`VaultManager.tiers`), mainnet, tiers 0–7 all active:

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

Each vault earns KLC pro-rata to its weight until `earnedUsd` reaches its USD cap, then it matures
and its weight leaves the pool (excess is recycled to the remaining vaults).

---

## Development

Dev servers run through portless (see the workspace CLAUDE.md) — no raw ports.

```bash
npm install
npm run dev      # portless → https://kalyvault.localhost
npm run dev:raw  # plain next dev, if the portless proxy isn't up
npm test         # vitest
npm run build
```

Copy `.env.example` to `.env.local` and fill it in. Key vars:

- `NEXT_PUBLIC_CHAIN` — `mainnet` or `testnet`; selects the address set above.
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` — use the **same** value as the KalySwap frontend so users share
  one wallet (same email/social login → same address) across both apps.
- `NEXT_PUBLIC_WC_PROJECT_ID` — WalletConnect; optional, injected wallets work without it.
- `SUPABASE_URL` / `SUPABASE_SECRET_KEY` — waitlist storage (server-side only, bypasses RLS).
- `RESEND_API_KEY` / `RESEND_TOPIC_ID` / `RESEND_FROM` — waitlist email. `RESEND_FROM` must use the
  verified domain `vaults.kalychain.io` (plural) — the apex and the singular form are rejected.

### Layout

```
src/lib/chain/     addresses, ABIs, reads/writes, POL math, affiliate graph, subgraph client
src/components/    landing page sections
src/components/app dApp (vaults, buy, POL hero, affiliate dashboard, leaderboard)
src/i18n/          en + fr dictionaries
```
