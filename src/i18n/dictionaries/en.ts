const en = {
	meta: {
		title: 'KalyChain Vault — Earn passive KLC backed by the chain',
		description:
			'Every block KalyChain produces flows directly to Vault holders. Buy once, earn forever. Join the waitlist to lock in early pricing and the highest APR before public launch.',
		ogDescription:
			'Every block KalyChain produces flows directly to Vault holders. Five tiers from $100 to $100k, 15–35% APR base, scaling with KLC price.',
	},

	nav: {
		ecosystem: 'Ecosystem',
		kalyswap: 'KalySwap',
		kusd: 'KUSD',
		rails: 'KalyRails',
		docs: 'Docs',
		joinWaitlist: 'Join Waitlist',
	},

	hero: {
		badge: 'Vault Waitlist Now Open',
		headlineBefore: 'Earn',
		headlineAccent: 'passive KLC',
		headlineAfter: 'backed by the chain itself',
		subhead:
			'Every block KalyChain produces flows directly to Vault holders. Buy once, earn forever. Early waitlist members lock in the highest APR before public launch.',
		stats: {
			blocksPerDay: 'Blocks per day',
			rewardPerBlock: 'Reward per block',
			aprRange: 'APR range',
			tiers: 'For every investor',
			tiersValue: '5 Tiers',
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
		sectionTitle: 'The Five Vault Tiers',
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
		body: 'Figures use today’s KLC price ({todayPrice}). Because rewards are paid in KLC, your USD returns multiply with every price move.',
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
		step2Label: 'What happens to the 91%',
		step3Label: 'Why it keeps compounding',
		feesShare: '9% fees',
		polShare: '91% → Protocol-Owned Liquidity',
		feesCaption: '9% fees: 3% dev · 3% ambassador · 3% builders',
		polCaption: '91% becomes permanent liquidity',
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
		successTitle: 'You’re on the list',
		successBody:
			'Early access opens 48 hours before public sale. We’ll email instructions when it’s time. Your whitelist price is locked for 72 hours after launch.',
		duplicateTitle: 'You’re already on the list',
		duplicateBody:
			'Good news — that email is already registered. We’ll reach out with early access details 48 hours before public sale.',
	},

	footer: {
		copyright: 'All rights reserved.',
		links: {
			website: 'kalychain.io',
			twitter: 'Twitter / X',
			telegram: 'Telegram',
			docs: 'Docs',
			terms: 'Terms',
		},
	},

	langSwitcher: {
		ariaLabel: 'Switch language',
	},
};

export default en;
export type Dictionary = typeof en;
