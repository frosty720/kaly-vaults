'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { TIERS } from '@/lib/tiers';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

type Status = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error';

interface WaitlistFormProps {
	dict: Dictionary;
	locale: Locale;
}

export function WaitlistForm({ dict, locale }: WaitlistFormProps) {
	const [email, setEmail] = useState('');
	const [wallet, setWallet] = useState('');
	const [tier, setTier] = useState<string>('');
	const [honeypot, setHoneypot] = useState('');
	const [status, setStatus] = useState<Status>('idle');
	const [errorMsg, setErrorMsg] = useState<string>('');

	const tierInterests = [
		...TIERS.map((t) => ({
			value: t.key,
			label: `${t.name} — $${t.price >= 1000 ? `${t.price / 1000}k` : t.price}`,
		})),
		{ value: 'undecided', label: dict.waitlist.tierNotSure },
	];

	const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	const isValidWallet = /^0x[a-fA-F0-9]{40}$/.test(wallet);
	const canSubmit = isValidEmail && isValidWallet && status !== 'submitting';

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;

		setStatus('submitting');
		setErrorMsg('');
		try {
			const res = await fetch('/api/waitlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					wallet,
					tier: tier || null,
					locale,
					hp: honeypot,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (res.status === 409) {
				setStatus('duplicate');
				return;
			}
			if (!res.ok) {
				setStatus('error');
				setErrorMsg(data?.error ?? `Request failed (${res.status})`);
				return;
			}
			setStatus('success');
		} catch (err) {
			setStatus('error');
			setErrorMsg(err instanceof Error ? err.message : 'Network error');
		}
	}

	if (status === 'success' || status === 'duplicate') {
		return (
			<section id="waitlist" className="relative py-16 sm:py-20">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="glass rounded-2xl p-8 sm:p-12 text-center">
						<CheckCircle2 className="w-14 h-14 text-amber-400 mx-auto" aria-hidden />
						<h2 className="mt-5 text-3xl sm:text-4xl font-bold text-white">
							{status === 'duplicate' ? dict.waitlist.duplicateTitle : dict.waitlist.successTitle}
						</h2>
						<p className="mt-3 text-white/70 max-w-xl mx-auto">
							{status === 'duplicate' ? dict.waitlist.duplicateBody : dict.waitlist.successBody}
						</p>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section id="waitlist" className="relative py-16 sm:py-20">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="glass rounded-2xl p-6 sm:p-10 grid md:grid-cols-2 gap-8 lg:gap-12">
					<div>
						<h2 className="heading-underline text-sm uppercase tracking-[0.2em] font-semibold text-amber-300 mb-5">
							{dict.waitlist.sectionLabel}
						</h2>
						<h3 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
							{dict.waitlist.headline}
						</h3>
						<p className="mt-4 text-white/70 leading-relaxed">{dict.waitlist.subhead}</p>
						<ul className="mt-6 space-y-3 text-sm text-white/80">
							{dict.waitlist.bullets.map((b) => (
								<Li key={b}>{b}</Li>
							))}
						</ul>
					</div>

					<form onSubmit={onSubmit} className="space-y-4" noValidate>
						<input
							type="text"
							name="company"
							tabIndex={-1}
							autoComplete="off"
							value={honeypot}
							onChange={(e) => setHoneypot(e.target.value)}
							className="absolute -left-[9999px]"
							aria-hidden
						/>

						<Field
							id="email"
							label={dict.waitlist.emailLabel}
							required
							error={email.length > 0 && !isValidEmail ? dict.waitlist.emailError : undefined}
						>
							<input
								id="email"
								type="email"
								required
								autoComplete="email"
								placeholder={dict.waitlist.emailPlaceholder}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="input-field w-full px-4 py-3 rounded-lg"
							/>
						</Field>

						<Field
							id="wallet"
							label={dict.waitlist.walletLabel}
							required
							error={wallet.length > 0 && !isValidWallet ? dict.waitlist.walletError : undefined}
						>
							<input
								id="wallet"
								type="text"
								required
								spellCheck={false}
								placeholder={dict.waitlist.walletPlaceholder}
								value={wallet}
								onChange={(e) => setWallet(e.target.value.trim())}
								className="input-field w-full px-4 py-3 rounded-lg font-mono text-sm"
							/>
						</Field>

						<Field id="tier" label={dict.waitlist.tierLabel}>
							<div className="grid grid-cols-2 gap-1.5">
								{tierInterests.map((t) => (
									<button
										key={t.value}
										type="button"
										onClick={() => setTier(tier === t.value ? '' : t.value)}
										aria-pressed={tier === t.value}
										className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors text-left ${
											tier === t.value
												? 'bg-amber-500 text-black shadow-md'
												: 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
										}`}
									>
										{t.label}
									</button>
								))}
							</div>
						</Field>

						<button
							type="submit"
							disabled={!canSubmit}
							className="btn-primary w-full px-5 py-3.5 rounded-lg text-base mt-2 inline-flex items-center justify-center gap-2"
						>
							{status === 'submitting' ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" aria-hidden />
									{dict.waitlist.submitting}
								</>
							) : (
								<>{dict.waitlist.submit}</>
							)}
						</button>

						{status === 'error' && (
							<div className="text-sm text-red-400 mt-2">
								{dict.waitlist.errorPrefix} {errorMsg || dict.waitlist.errorFallback}
							</div>
						)}
					</form>
				</div>
			</div>
		</section>
	);
}

function Field({
	id,
	label,
	required,
	error,
	children,
}: {
	id: string;
	label: string;
	required?: boolean;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label htmlFor={id} className="block text-xs uppercase tracking-wider text-amber-300/80 font-medium mb-2">
				{label}
				{required && <span className="text-amber-500 ml-1">*</span>}
			</label>
			{children}
			{error && <div className="mt-1.5 text-xs text-red-400">{error}</div>}
		</div>
	);
}

function Li({ children }: { children: React.ReactNode }) {
	return (
		<li className="flex items-start gap-2.5">
			<span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
			<span>{children}</span>
		</li>
	);
}
