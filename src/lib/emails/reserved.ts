import type { Locale } from '@/i18n/config';

type TierKey = 'light' | 'validator' | 'enterprise' | 'consortium' | 'genesis' | 'undecided';

const TIER_NAMES: Record<TierKey, string> = {
	light: 'Light',
	validator: 'Validator',
	enterprise: 'Enterprise',
	consortium: 'Consortium',
	genesis: 'Genesis',
	undecided: '',
};

const UNDECIDED_LABEL: Record<Locale, string> = {
	en: 'Not sure yet',
	fr: 'Pas encore sûr',
};

function resolveTierName(locale: Locale, tier: string | null): string | null {
	if (!tier) return null;
	if (!(tier in TIER_NAMES)) return null;
	const key = tier as TierKey;
	if (key === 'undecided') return UNDECIDED_LABEL[locale];
	return TIER_NAMES[key];
}

interface EmailCopy {
	subject: string;
	heading: string;
	body: string;
	tierLine: (name: string) => string;
	footer: string;
}

const COPY: Record<Locale, EmailCopy> = {
	en: {
		subject: `🔒 You're on the KalyChain Vault waitlist`,
		heading: 'Your spot is reserved',
		body: `Thanks for joining the KalyChain Vault waitlist. You're in line for early access — 48 hours before the public sale — and your whitelist price is locked for 72 hours after launch. We'll email you with instructions when it's time. Rewards are paid in KLC from every block the chain produces, so the earlier you join, the higher the APR you lock in.`,
		tierLine: (name: string) => `Tier you're interested in: ${name}`,
		footer: `You're receiving this because you joined the KalyChain Vault waitlist at vaults.kalychain.io.`,
	},
	fr: {
		subject: `🔒 Vous êtes sur la liste d'attente du Coffre KalyChain`,
		heading: `Votre place est réservée`,
		body: `Merci d'avoir rejoint la liste d'attente du Coffre KalyChain. Vous bénéficiez d'un accès anticipé — 48 heures avant la vente publique — et votre prix whitelist est bloqué pendant 72 heures après le lancement. Nous vous enverrons les instructions le moment venu. Les récompenses sont payées en KLC à chaque bloc produit par la chaîne, donc plus vous vous inscrivez tôt, meilleur est l'APR que vous verrouillez.`,
		tierLine: (name: string) => `Palier qui vous intéresse : ${name}`,
		footer: `Vous recevez cet e-mail car vous avez rejoint la liste d'attente du Coffre KalyChain sur vaults.kalychain.io.`,
	},
};

function buildHtml(copy: EmailCopy, tierName: string | null): string {
	const tierRow = tierName
		? `<tr>
				<td style="padding: 0 32px 20px;">
					<p style="margin: 0; font-size: 14px; color: #6b7280; background: #f3f4f6; border-radius: 6px; padding: 12px 16px;">
						${copy.tierLine(tierName)}
					</p>
				</td>
			</tr>`
		: '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${copy.heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; padding: 40px 16px;">
	<tr>
		<td align="center">
			<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
				<!-- Accent bar -->
				<tr>
					<td style="background-color: #f59e0b; height: 6px; font-size: 0; line-height: 0;">&nbsp;</td>
				</tr>
				<!-- Header -->
				<tr>
					<td style="padding: 32px 32px 24px;">
						<p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #f59e0b;">KalyChain Vault</p>
						<h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #111827; line-height: 1.25;">${copy.heading}</h1>
					</td>
				</tr>
				<!-- Body -->
				<tr>
					<td style="padding: 0 32px 24px;">
						<p style="margin: 0; font-size: 15px; line-height: 1.65; color: #374151;">${copy.body}</p>
					</td>
				</tr>
				<!-- Tier row (conditional) -->
				${tierRow}
				<!-- Divider -->
				<tr>
					<td style="padding: 0 32px;">
						<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
					</td>
				</tr>
				<!-- Footer -->
				<tr>
					<td style="padding: 20px 32px 32px;">
						<p style="margin: 0; font-size: 12px; line-height: 1.6; color: #9ca3af;">${copy.footer}</p>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>
</body>
</html>`;
}

export function reservedEmail(
	locale: Locale,
	opts: { tier: string | null },
): { subject: string; html: string } {
	const copy = COPY[locale];
	const tierName = resolveTierName(locale, opts.tier);
	return {
		subject: copy.subject,
		html: buildHtml(copy, tierName),
	};
}
