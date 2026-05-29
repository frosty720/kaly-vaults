import { describe, it, expect } from 'vitest';
import { reservedEmail } from './reserved';

describe('reservedEmail', () => {
	describe('EN locale', () => {
		it('subject contains KalyChain Vault waitlist', () => {
			const { subject } = reservedEmail('en', { tier: 'validator' });
			expect(subject).toContain('KalyChain Vault waitlist');
		});

		it('html contains heading and tier name for validator', () => {
			const { html } = reservedEmail('en', { tier: 'validator' });
			expect(html).toContain('Your spot is reserved');
			expect(html).toContain('Validator');
		});

		it('html contains Not sure yet for undecided tier', () => {
			const { html } = reservedEmail('en', { tier: 'undecided' });
			expect(html).toContain('Not sure yet');
		});

		it('html does NOT contain tier line when tier is null', () => {
			const { html } = reservedEmail('en', { tier: null });
			expect(html).not.toContain('Tier you\'re interested in');
		});

		it('html contains footer text', () => {
			const { html } = reservedEmail('en', { tier: null });
			expect(html).toContain('vaults.kalychain.io');
			expect(html).toContain('joined the KalyChain Vault waitlist');
		});
	});

	describe('FR locale', () => {
		it('subject contains liste d\'attente', () => {
			const { subject } = reservedEmail('fr', { tier: 'validator' });
			expect(subject).toContain(`liste d'attente`);
		});

		it('html contains French heading and tier name for validator', () => {
			const { html } = reservedEmail('fr', { tier: 'validator' });
			expect(html).toContain('Votre place est réservée');
			expect(html).toContain('Validator');
		});

		it('html contains Pas encore sur for undecided tier', () => {
			const { html } = reservedEmail('fr', { tier: 'undecided' });
			expect(html).toContain('Pas encore sûr');
		});

		it('html does NOT contain tier line when tier is null', () => {
			const { html } = reservedEmail('fr', { tier: null });
			expect(html).not.toContain('Palier qui vous intéresse');
		});

		it('html contains French footer text', () => {
			const { html } = reservedEmail('fr', { tier: null });
			expect(html).toContain('vaults.kalychain.io');
			expect(html).toContain('liste d\'attente');
		});
	});

	describe('unknown / null tier', () => {
		it('omits tier line for unknown tier key', () => {
			const { html } = reservedEmail('en', { tier: 'unknown-xyz' });
			expect(html).not.toContain('Tier you\'re interested in');
		});

		it('tier names map correctly', () => {
			const tiers: Array<[string, string]> = [
				['light', 'Light'],
				['validator', 'Validator'],
				['enterprise', 'Enterprise'],
				['consortium', 'Consortium'],
				['genesis', 'Genesis'],
			];
			for (const [key, name] of tiers) {
				const { html } = reservedEmail('en', { tier: key });
				expect(html).toContain(name);
			}
		});
	});
});
