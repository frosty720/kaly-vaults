const en = {
	meta: {
		title: 'KalyChain Vault — Earn passive KMT backed by the chain',
		description:
			'Every block KalyChain produces flows directly to Vault holders. Buy once, earn passive KMT — eight packs from $50 to $100k.',
		ogDescription:
			'Every block KalyChain produces flows directly to Vault holders. Eight packs from $50 to $100k, scaling with KMT price.',
	},

	nav: {
		ecosystem: 'Ecosystem',
		kalyswap: 'KalySwap',
		kusd: 'KUSD',
		rails: 'KalyRails',
		docs: 'Docs',
		launchApp: 'Launch App',
	},

	// Shown once per browser (see CutoverNotice) until dismissed — announces the chain relaunch.
	cutover: {
		badge: 'New chain live',
		title: 'KalyChain has moved to a new chain',
		body: 'KalyChain has relaunched. KLC is now KMT at a 110:1 ratio — your vaults, rewards, and balances were migrated automatically.',
		action: 'Connect your wallet to the new network to continue.',
		// {wallet} is the wallet's own name (MetaMask, Rabby, …) — users run several at once,
		// so naming the one being asked is what makes the prompt findable.
		addNetwork: 'Add network in {wallet}',
		adding: 'Check {wallet}…',
		pickWallet: 'You have more than one wallet installed — pick the one you use here.',
		added: 'Connected to {network}. You\'re on the new chain.',
		cancelled: 'Request cancelled in {wallet}. Nothing changed — you can try again.',
		wrongChain: '{wallet} accepted the request but is still on another network. Open it and switch to "{network}" manually.',
		noWallet: 'Using the built-in Kaly wallet? Nothing to do — it connects to the new network automatically.',
		error: '{wallet} could not add the network. If it already has a KalyChain entry using this RPC, remove that old entry first, then try again.',
		dismiss: 'Continue',
	},

	hero: {
		// Chosen at render time from VaultManager.paused(): live / paused / unknown (neutral)
		badge: 'KalyChain Vaults',
		badgeLive: 'Vault Sale Now Live',
		badgePaused: 'Vault sales paused for the KalyChain relaunch',
		headlineBefore: 'Earn',
		headlineAccent: 'passive KMT',
		headlineAfter: 'backed by the chain itself',
		subhead:
			'Every block KalyChain produces flows directly to Vault holders. Buy once, earn passive KMT — pick a pack and start earning every block.',
		subheadPaused:
			'Every block KalyChain produces flows directly to Vault holders. Sales are paused while KalyChain relaunches on KMT — existing vaults migrate automatically and sales reopen at the cut-over.',
		stats: {
			blocksPerDay: 'Blocks per day',
			rewardPerBlock: 'Reward per block',
			aprRange: 'APR range',
			tiers: 'For every investor',
			tiersValue: '8 Packs',
		},
	},

	calculator: {
		sectionTitle: 'Investment Calculator',
		investmentAmount: 'Investment Amount',
		vaultTier: 'Vault Tier (sets your APR)',
		klcPriceScenario: 'KMT Price Scenario',
		priceToday: 'today',
		priceTimesToday: '× today',
		baseNftPrice: 'NFT base price',
		target: 'target',
		projectedReturns: 'Projected Returns',
		effectiveApr: 'Effective APR',
		// Template — use interpolate(..., { base, mult })
		breakdown: '= {base} base × {mult} KMT price',
		annual: 'Annual',
		monthly: 'Monthly',
		breakeven: 'Break-even',
		roi3yr: '3-yr ROI',
		mappingPrefix: 'Your',
		mappingMiddle: '≈',
		mappingSuffix:
			'. Rewards are paid in KMT, so dollar returns scale linearly with KMT price.',
		// Template — { n, name }
		nftSingular: '{n} {name} NFT',
		nftPlural: '{n} {name} NFTs',
		nftFractional: '{n}× a {name} NFT',
	},

	tiers: {
		sectionTitle: 'The 8 Vault Tiers',
		valuesShownAt: 'All values shown at',
		klcPriceSuffix: 'KMT price',
		mostPopular: 'Most Popular',
		apr: 'APR',
		annual: 'Annual',
		monthly: 'Monthly',
		breakeven: 'Break-even',
		roi3yr: '3-yr ROI',
		// Keyed by TierKey (src/lib/tiers.ts)
		audiences: {
			starter: 'Everyone',
			basic: 'Getting started',
			pro1k: 'Crypto investors',
			pro5k: 'SMEs',
			premium10k: 'Enterprises',
			premium25k: 'Institutions',
			elite50k: 'Funds',
			whale100k: 'Whales',
		},
	},

	scaling: {
		boldLead: 'Returns scale with KMT price.',
		// Template — { todayPrice }
		body: 'Figures use today\'s KMT price ({todayPrice}). Because rewards are paid in KMT, your USD returns multiply with every price move.',
		// Template — { val }
		at2x: 'At 2× price: Whale 100K earns {val}/yr.',
		at5x: 'At 5×: {val}/yr.',
		at10x: 'At 10×: {val}/yr.',
		floor:
			'The underlying KMT reward is fixed — your upside is not. An APR floor of 15% protects all holders from dilution as the vault fills.',
	},

	flow: {
		sectionLabel: 'How the Vault works',
		heading: 'Every purchase makes KMT stronger',
		step1Label: 'Where every dollar goes',
		step2Label: 'What happens to the 80%',
		step3Label: 'Why it keeps compounding',
		feesShare: '20% growth & ops',
		polShare: '80% → Protocol-Owned Liquidity',
		feesCaption: '20%: 10% affiliate (3 levels) · 2% dev · 8% DAO',
		polCaption: '80% buys KMT and locks it as liquidity',
		polMechanism:
			'Every purchase buys KMT on the open market and pairs it into locked, protocol-owned liquidity. Early on, the protocol adds KMT from its own reserve to deepen new pools instantly — as liquidity grows, purchases shift to buying all their KMT on the market.',
		paidLabel: 'You buy a vault',
		// Template — { amount }
		paidAmount: '{amount} paid',
		acceptedPrefix: 'in',
		swapToKlc: '50% swapped to KMT',
		pairedLp: 'paired into KMT/stable LP',
		lockedForever: 'Locked forever',
		treasury: 'in DAO Treasury',
		rewardsTitle: 'And forever, in parallel',
		// Template — { klcPerBlock }
		rewardsStream:
			'Every block: {kmtPerBlock} KMT → RewardsPool → paid to you, proportional to your vault · DEX fees on the locked LP top it up',
		wheelMoreSales: 'More vault sales',
		wheelDeeperLiquidity: 'Deeper locked liquidity',
		wheelPriceUp: 'KMT price rises',
		wheelHigherApr: 'Higher effective APR',
		wheelCenter: 'The Flywheel',
		// Template — { aprFloor }
		floorNote:
			'Liquidity is never withdrawn, so it only deepens — and a {aprFloor} APR floor pauses sales before holders get diluted.',
	},

	footer: {
		copyright: 'All rights reserved.',
		links: {
			website: 'kalychain.io',
			twitter: 'Twitter / X',
			telegram: 'Telegram',
			discord: 'Discord',
			docs: 'Docs',
		},
	},

	langSwitcher: {
		ariaLabel: 'Switch language',
	},

	app: {
		connectWallet: 'Connect Wallet',
		footerNote: 'All figures are read live from KalyChain. Stablecoins valued at $1; KMT priced live.',
		pol: {
			label: 'Protocol-Owned Liquidity',
			liveValue: 'live value',
			live: 'live',
			totalPool: 'Total pool liquidity',
			error: 'Couldn\'t load POL data',
			empty: 'No POL deposits yet',
			added: 'added',
			footnote: 'Live market value of the DAO treasury\'s V3 positions. Stablecoins valued at $1',
			klcLiveSuffix: 'live',
			pending: 'pending deployment',
		},
		kpi: {
			polLabel: 'Protocol Liquidity',
			polSub: 'Live DAO LP value',
			depositedLabel: 'Total Deposited',
			depositedSub: 'Paid by vault buyers',
			mintedLabel: 'Vaults Minted',
			mintedSub: 'NFTs issued',
			aprLabel: 'Base APR',
			aprSub: 'Paid in KMT, per tier',
		},
		buy: {
			headingBefore: 'Choose your',
			headingAccent: 'vault',
			subtitle: 'Backed by protocol-owned liquidity',
			popular: 'Popular',
			// Template — { name }
			buyTier: 'Buy {name}',
			connectToBuy: 'Connect to buy',
			aprSuffix: 'APR',
			pausedTitle: 'Sales paused.',
			pausedBody: 'KalyChain is relaunching on KMT. Existing vaults migrate automatically; purchases reopen at the cut-over.',
			pausedButton: 'Sales paused',
		},
		modal: {
			title: 'Purchase Vault',
			// Template — { apr }
			nominalApr: 'Nominal APR: {apr}%',
			successTitle: 'Purchase successful!',
			successBody: 'Your vault NFT is being minted.',
			payWith: 'Pay with',
			referralLabel: 'Referral address (optional)',
			invalidAddress: 'Invalid address',
			flowTitle: 'How your funds flow',
			polRow: 'Protocol-owned liquidity (80%)',
			swappedToKlc: 'Swapped to KMT',
			pairedLp: 'Paired as stable LP',
			feesRow: 'Growth & operations (20%)',
			affiliate: 'Affiliate (3 levels)',
			dev: 'Dev',
			dao: 'DAO treasury',
			ambassador: 'Ambassador',
			builders: 'Builders',
			estRewards: 'Estimated annual rewards at nominal APR',
			estDisclaimer: 'estimate only — not guaranteed',
			loadingAllowance: 'Loading allowance…',
			// Template — { stable }
			approve: 'Approve {stable}',
			approving: 'Approving…',
			// Template — { name }
			buy: 'Buy {name} Vault',
			buying: 'Buying…',
			cancel: 'Cancel',
			walletSyncing: 'Connecting wallet…',
			walletNotReady: 'Your wallet isn\'t ready to sign yet — nothing was sent and you were not charged. Wait a moment and try again.',
			txReverted: 'The transaction was rejected on-chain — you were not charged. Please try again in a moment.',
		},
		position: {
			title: 'Your Position',
			claimableNow: 'Claimable now',
			error: 'Couldn\'t load rewards',
			priceUnavailable: 'KMT price unavailable',
			claim: 'Claim',
			claiming: 'Claiming…',
			invested: 'Invested',
			weight: 'Weight',
		},
		vaults: {
			title: 'Your Vaults',
			error: 'Couldn\'t load vaults',
			empty: 'You don\'t own any vaults yet',
			weight: 'Weight',
			apr: 'APR',
			matured: 'Matured',
			maturityProgress: 'Maturity',
			buyAgain: 'No longer earning — buy again to keep earning',
		},
		connect: {
			title: 'Connect to manage your vaults',
			body: 'Sign in with email, a social account, or any wallet to view your position, claim KMT rewards, and buy vaults. The same login works across KalySwap and Kaly Vaults.',
		},
		affiliate: {
			title: 'Your affiliate dashboard',
			sponsoredBy: 'Sponsored by',
			linkLabel: 'Your referral link',
			copy: 'Copy',
			copied: 'Copied!',
			referrals: 'Referrals',
			downline: 'Downline',
			earned: 'Commissions',
			rank: 'Rank',
			noRank: 'No rank yet',
			toNext: '{n} more sales to {rank}',
			loyalty: 'Loyalty',
			activityLabel: 'Activity',
			activity_active: 'Active',
			activity_reduced: 'Reduced',
			activity_suspended: 'Suspended',
			activity_none: 'No sales',
			yourReferrals: 'Your direct referrals',
			error: 'Couldn\'t load affiliate data',
			footnote: 'Commissions (N1 6% · N2 2.5% · N3 1.5%) are paid in the purchase stablecoin, instantly, to affiliates who hold a vault. Rank bonuses (Bronze +5% → Diamond +35%) are paid quarterly.',
		},
		leaderboard: {
			title: 'Affiliate leaderboard',
			affiliate: 'Affiliate',
			referrals: 'Referrals',
			commission: 'Commission',
			you: 'you',
			empty: 'No affiliates yet — be the first.',
			error: 'Couldn\'t load leaderboard',
			footnote: 'Ranked by total commission, then referrals. Live from on-chain events.',
		},
	},
};

export default en;
export type Dictionary = typeof en;
