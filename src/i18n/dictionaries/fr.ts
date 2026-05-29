import type { Dictionary } from './en';

const fr: Dictionary = {
	meta: {
		title: 'Coffre-fort KalyChain — Gagnez du KLC passif adossé à la chaîne',
		description:
			'Chaque bloc produit par KalyChain est reversé directement aux détenteurs du Coffre. Achetez une fois, gagnez pour toujours. Inscrivez-vous à la liste d’attente pour bloquer un prix anticipé et le meilleur APR avant le lancement public.',
		ogDescription:
			'Chaque bloc produit par KalyChain va directement aux détenteurs du Coffre. Cinq paliers de 100 $ à 100 000 $, APR de base de 15 à 35 %, qui augmente avec le prix du KLC.',
	},

	nav: {
		ecosystem: 'Écosystème',
		kalyswap: 'KalySwap',
		kusd: 'KUSD',
		rails: 'KalyRails',
		docs: 'Docs',
		joinWaitlist: 'Liste d’attente',
	},

	hero: {
		badge: 'Liste d’attente du Coffre ouverte',
		headlineBefore: 'Gagnez',
		headlineAccent: 'du KLC passif',
		headlineAfter: 'adossé à la chaîne elle-même',
		subhead:
			'Chaque bloc produit par KalyChain est reversé directement aux détenteurs du Coffre. Achetez une fois, gagnez pour toujours. Les inscrits anticipés bloquent l’APR le plus élevé avant le lancement public.',
		stats: {
			blocksPerDay: 'Blocs par jour',
			rewardPerBlock: 'Récompense par bloc',
			aprRange: 'Fourchette d’APR',
			tiers: 'Pour chaque investisseur',
			tiersValue: '5 paliers',
		},
	},

	calculator: {
		sectionTitle: 'Calculateur d’investissement',
		investmentAmount: 'Montant à investir',
		vaultTier: 'Palier du Coffre (détermine votre APR)',
		klcPriceScenario: 'Scénario de prix du KLC',
		priceToday: 'aujourd’hui',
		priceTimesToday: '× aujourd’hui',
		baseNftPrice: 'Prix de base du NFT',
		target: 'cible',
		projectedReturns: 'Rendements projetés',
		effectiveApr: 'APR effectif',
		breakdown: '= {base} de base × {mult} prix du KLC',
		annual: 'Annuel',
		monthly: 'Mensuel',
		breakeven: 'Seuil de rentabilité',
		roi3yr: 'ROI 3 ans',
		mappingPrefix: 'Votre',
		mappingMiddle: '≈',
		mappingSuffix:
			'. Les récompenses sont payées en KLC, donc vos gains en dollars évoluent linéairement avec le prix du KLC.',
		nftSingular: '{n} NFT {name}',
		nftPlural: '{n} NFT {name}',
		nftFractional: '{n}× un NFT {name}',
	},

	tiers: {
		sectionTitle: 'Les cinq paliers du Coffre',
		valuesShownAt: 'Valeurs affichées à',
		klcPriceSuffix: 'du prix du KLC',
		mostPopular: 'Le plus populaire',
		joinWaitlist: 'Liste d’attente',
		apr: 'APR',
		annual: 'Annuel',
		monthly: 'Mensuel',
		breakeven: 'Rentabilité',
		roi3yr: 'ROI 3 ans',
		audiences: {
			light: 'Tout le monde',
			validator: 'Investisseurs crypto',
			enterprise: 'Fintechs & entreprises',
			consortium: 'Institutions',
			genesis: 'Fonds & gros porteurs',
		},
	},

	scaling: {
		boldLead: 'Les rendements évoluent avec le prix du KLC.',
		body: 'Les chiffres utilisent le prix actuel du KLC ({todayPrice}). Comme les récompenses sont payées en KLC, vos rendements en dollars sont multipliés à chaque hausse de prix.',
		at2x: 'À 2× le prix : Genesis génère {val}/an.',
		at5x: 'À 5× : {val}/an.',
		at10x: 'À 10× : {val}/an.',
		floor:
			'La récompense KLC sous-jacente est fixe — votre potentiel ne l’est pas. Un plancher d’APR de 15 % protège tous les détenteurs de la dilution à mesure que le Coffre se remplit.',
	},

	flow: {
		sectionLabel: 'Comment fonctionne le Coffre',
		heading: 'Chaque achat renforce le KLC',
		step1Label: 'Où va chaque dollar',
		step2Label: 'Ce qui arrive aux 91 %',
		step3Label: 'Pourquoi l’effet se renforce',
		feesShare: '9 % de frais',
		polShare: '91 % → Liquidité détenue par le protocole',
		feesCaption: '9 % de frais : 3 % dev · 3 % ambassadeur · 3 % builders',
		polCaption: '91 % devient une liquidité permanente',
		paidLabel: 'Vous achetez un coffre',
		paidAmount: '{amount} versé',
		acceptedPrefix: 'en',
		swapToKlc: '50 % converti en KLC',
		pairedLp: 'injecté en LP KLC/stable',
		lockedForever: 'Verrouillé pour toujours',
		treasury: 'dans la Trésorerie de la DAO',
		rewardsTitle: 'Et pour toujours, en parallèle',
		rewardsStream:
			'À chaque bloc : {klcPerBlock} KLC → RewardsPool → versés à vous, au prorata de votre coffre · les frais du DEX sur la LP verrouillée s’y ajoutent',
		wheelMoreSales: 'Plus de ventes de coffres',
		wheelDeeperLiquidity: 'Liquidité verrouillée plus profonde',
		wheelPriceUp: 'Le prix du KLC monte',
		wheelHigherApr: 'APR effectif plus élevé',
		wheelCenter: 'Le cercle vertueux',
		floorNote:
			'La liquidité n’est jamais retirée, elle ne fait que s’approfondir — et un plancher d’APR de {aprFloor} met en pause les ventes avant toute dilution des détenteurs.',
	},

	waitlist: {
		sectionLabel: 'Réservez votre Coffre',
		headline: 'Bloquez un prix anticipé avant le lancement public',
		subhead:
			'Chaque tranche vendue fait monter le prix — plus vous vous inscrivez tôt, meilleure est votre position. Les inscrits à la liste obtiennent l’APR le plus élevé disponible.',
		bullets: [
			'Aucun paiement requis pour rejoindre la liste d’attente',
			'Accès anticipé 48 heures avant la vente publique',
			'Prix de la whitelist garanti pendant 72 heures après le lancement',
		],
		emailLabel: 'Adresse e-mail',
		emailPlaceholder: 'vous@exemple.com',
		emailError: 'Saisissez une adresse e-mail valide',
		walletLabel: 'Adresse du portefeuille',
		walletPlaceholder: '0x…',
		walletError: 'Doit être une adresse EVM 0x valide',
		tierLabel: 'Palier qui vous intéresse (optionnel)',
		tierNotSure: 'Je ne sais pas encore',
		submit: 'Rejoindre la liste d’attente →',
		submitting: 'Envoi…',
		errorPrefix: 'Une erreur s’est produite :',
		errorFallback: 'veuillez réessayer.',
		successTitle: 'Vous êtes sur la liste',
		successBody:
			'L’accès anticipé ouvre 48 heures avant la vente publique. Nous vous enverrons les instructions par e-mail le moment venu. Votre prix whitelist est verrouillé pendant 72 heures après le lancement.',
		duplicateTitle: 'Vous êtes déjà sur la liste',
		duplicateBody:
			'Bonne nouvelle — cet e-mail est déjà enregistré. Nous vous contacterons avec les détails d’accès anticipé 48 heures avant la vente publique.',
	},

	footer: {
		copyright: 'Tous droits réservés.',
		links: {
			website: 'kalychain.io',
			twitter: 'Twitter / X',
			telegram: 'Telegram',
			docs: 'Docs',
			terms: 'Mentions légales',
		},
	},

	langSwitcher: {
		ariaLabel: 'Changer de langue',
	},
};

export default fr;
