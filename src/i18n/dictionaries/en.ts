const en = {
	meta: {
		title: 'KalyChain Vault — Earn passive KLC backed by the chain',
		description:
			'Every block KalyChain produces flows directly to Vault holders. Buy once, earn forever. The sale is live — buy a pack and start earning every block.',
		ogDescription:
			'Every block KalyChain produces flows directly to Vault holders. Eight packs from $50 to $100k, scaling with KLC price.',
	},

	nav: {
		ecosystem: 'Ecosystem',
		kalyswap: 'KalySwap',
		kusd: 'KUSD',
		rails: 'KalyRails',
		docs: 'Docs',
		joinWaitlist: 'Join Waitlist',
		launchApp: 'Launch App',
	},

	hero: {
		badge: 'Vault Sale Now Live',
		headlineBefore: 'Earn',
		headlineAccent: 'passive KLC',
		headlineAfter: 'backed by the chain itself',
		subhead:
			'Every block KalyChain produces flows directly to Vault holders. Buy once, earn forever. The sale is live — pick a pack and start earning every block.',
		stats: {
			blocksPerDay: 'Blocks per day',
			rewardPerBlock: 'Reward per block',
			aprRange: 'APR range',
			tiers: 'For every investor',
			tiersValue: '8 Packs',
		},
		countdown: {
			title: 'Public launch in',
			launched: 'The vault is live',
			days: 'Days',
			hours: 'Hours',
			minutes: 'Minutes',
			seconds: 'Seconds',
		},
	},

	calculator: {
		sectionTitle: 'Investment Calculator',
		investmentAmount: 'Investment Amount',
		vaultTier: 'Vault Tier (sets your APR)',
		klcPriceScenario: 'KLC Price Scenario',
		priceToday: 'today',
		priceTimesToday: '× today',
		baseNftPrice: 'NFT base price',
		target: 'target',
		projectedReturns: 'Projected Returns',
		effectiveApr: 'Effective APR',
		// Template — use interpolate(..., { base, mult })
		breakdown: '= {base} base × {mult} KLC price',
		annual: 'Annual',
		monthly: 'Monthly',
		breakeven: 'Break-even',
		roi3yr: '3-yr ROI',
		mappingPrefix: 'Your',
		mappingMiddle: '≈',
		mappingSuffix:
			'. Rewards are paid in KLC, so dollar returns scale linearly with KLC price.',
		// Template — { n, name }
		nftSingular: '{n} {name} NFT',
		nftPlural: '{n} {name} NFTs',
		nftFractional: '{n}× a {name} NFT',
	},

	tiers: {
		sectionTitle: 'The 8 Vault Tiers',
		valuesShownAt: 'All values shown at',
		klcPriceSuffix: 'KLC price',
		mostPopular: 'Most Popular',
		joinWaitlist: 'Join Waitlist',
		apr: 'APR',
		annual: 'Annual',
		monthly: 'Monthly',
		breakeven: 'Break-even',
		roi3yr: '3-yr ROI',
		audiences: {
			light: 'Everyone',
			validator: 'Crypto investors',
			enterprise: 'Fintechs & business',
			consortium: 'Institutions',
			genesis: 'Funds & whales',
		},
	},

	scaling: {
		boldLead: 'Returns scale with KLC price.',
		// Template — { todayPrice }
		body: 'Figures use today\'s KLC price ({todayPrice}). Because rewards are paid in KLC, your USD returns multiply with every price move.',
		// Template — { val }
		at2x: 'At 2× price: Genesis earns {val}/yr.',
		at5x: 'At 5×: {val}/yr.',
		at10x: 'At 10×: {val}/yr.',
		floor:
			'The underlying KLC reward is fixed — your upside is not. An APR floor of 15% protects all holders from dilution as the vault fills.',
	},

	flow: {
		sectionLabel: 'How the Vault works',
		heading: 'Every purchase makes KLC stronger',
		step1Label: 'Where every dollar goes',
		step2Label: 'What happens to the 80%',
		step3Label: 'Why it keeps compounding',
		feesShare: '20% growth & ops',
		polShare: '80% → Protocol-Owned Liquidity',
		feesCaption: '20%: 10% affiliate (3 levels) · 2% dev · 8% DAO',
		polCaption: '80% buys KLC and locks it as liquidity',
		polMechanism:
			'Every purchase buys KLC on the open market and pairs it into locked, protocol-owned liquidity. Early on, the protocol adds KLC from its own reserve to deepen new pools instantly — as liquidity grows, purchases shift to buying all their KLC on the market.',
		paidLabel: 'You buy a vault',
		// Template — { amount }
		paidAmount: '{amount} paid',
		acceptedPrefix: 'in',
		swapToKlc: '50% swapped to KLC',
		pairedLp: 'paired into KLC/stable LP',
		lockedForever: 'Locked forever',
		treasury: 'in DAO Treasury',
		rewardsTitle: 'And forever, in parallel',
		// Template — { klcPerBlock }
		rewardsStream:
			'Every block: {klcPerBlock} KLC → RewardsPool → paid to you, proportional to your vault · DEX fees on the locked LP top it up',
		wheelMoreSales: 'More vault sales',
		wheelDeeperLiquidity: 'Deeper locked liquidity',
		wheelPriceUp: 'KLC price rises',
		wheelHigherApr: 'Higher effective APR',
		wheelCenter: 'The Flywheel',
		// Template — { aprFloor }
		floorNote:
			'Liquidity is never withdrawn, so it only deepens — and a {aprFloor} APR floor pauses sales before holders get diluted.',
	},

	waitlist: {
		sectionLabel: 'Reserve Your Vault',
		headline: 'Lock in early pricing before public launch',
		subhead:
			'Each tranche sold raises the price — the sooner you join, the better your position. Waitlist members get the highest available APR.',
		bullets: [
			'No payment required to join the waitlist',
			'Early access 48 hours before public sale',
			'Whitelist price guaranteed for 72 hours after launch',
		],
		emailLabel: 'Email',
		emailPlaceholder: 'you@example.com',
		emailError: 'Enter a valid email address',
		walletLabel: 'Wallet address',
		walletPlaceholder: '0x…',
		walletError: 'Must be a valid 0x EVM address',
		tierLabel: 'Tier interest (optional)',
		tierNotSure: 'Not sure yet',
		submit: 'Join the Vault Waitlist →',
		submitting: 'Submitting…',
		errorPrefix: 'Something went wrong:',
		errorFallback: 'please try again.',
		successTitle: 'You\'re on the list',
		successBody:
			'Early access opens 48 hours before public sale. We\'ll email instructions when it\'s time. Your whitelist price is locked for 72 hours after launch.',
		duplicateTitle: 'You\'re already on the list',
		duplicateBody:
			'Good news — that email is already registered. We\'ll reach out with early access details 48 hours before public sale.',
	},

	footer: {
		copyright: 'All rights reserved.',
		links: {
			website: 'kalychain.io',
			twitter: 'Twitter / X',
			telegram: 'Telegram',
			discord: 'Discord',
			docs: 'Docs',
			terms: 'Terms',
		},
	},

	langSwitcher: {
		ariaLabel: 'Switch language',
	},

	app: {
		connectWallet: 'Connect Wallet',
		footerNote: 'All figures are read live from KalyChain. Stablecoins valued at $1; KLC priced live.',
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
			aprSub: 'Paid in KLC, per tier',
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
			swappedToKlc: 'Swapped to KLC',
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
		},
		position: {
			title: 'Your Position',
			claimableNow: 'Claimable now',
			error: 'Couldn\'t load rewards',
			priceUnavailable: 'KLC price unavailable',
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
			body: 'Sign in with email, a social account, or any wallet to view your position, claim KLC rewards, and buy vaults. The same login works across KalySwap and Kaly Vaults.',
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
