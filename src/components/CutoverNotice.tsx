'use client';

import { useEffect, useState } from 'react';
import {
	connectToKalyChain,
	currentChainId,
	discoverWallets,
	isOnKalyChain,
	WALLET_CHAIN_NAME,
	type WalletChoice,
} from '@/lib/chain/cutoverWallet';
import type { Dictionary } from '@/i18n/dictionaries/en';

/**
 * One-time cut-over announcement: KalyChain relaunched, old ticker → KMT at 110:1.
 * Mounted in the [locale] layout so it covers the landing page AND /app. It runs
 * OUTSIDE the wagmi/thirdweb providers (the landing page has none), so it talks
 * straight to EIP-1193 providers; thirdweb in-app wallets need no action (their
 * chain comes from app config).
 *
 * Wallets are enumerated (EIP-6963) rather than taken from `window.ethereum`: a
 * browser running two wallets would otherwise send the prompt to whichever won the
 * injection race, leaving the user approving in the wrong one. After the request we
 * VERIFY the chain — a resolved promise is not proof the wallet switched.
 */

export const CUTOVER_STORAGE_KEY = 'kmt-cutover-notice-v1';

export function isCutoverDismissed(): boolean {
	try {
		return localStorage.getItem(CUTOVER_STORAGE_KEY) === '1';
	} catch {
		return false;
	}
}

export function dismissCutover(): void {
	try {
		localStorage.setItem(CUTOVER_STORAGE_KEY, '1');
	} catch {
		// Storage unavailable (private mode) — the notice just shows again next visit.
	}
}

/** Fill {wallet} / {network} placeholders in a dictionary string. */
export function fillTemplate(template: string, values: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export function CutoverNotice({ t }: { t: Dictionary['cutover'] }) {
	const [open, setOpen] = useState(false);
	const [wallets, setWallets] = useState<WalletChoice[]>([]);
	const [busyId, setBusyId] = useState('');
	const [done, setDone] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		// Deliberately an effect, not lazy useState: this is a client component but Next still
		// server-renders it, where localStorage does not exist. Reading it in the initializer
		// would render "open" on the server and "dismissed" on the client — a hydration mismatch.
		// eslint-disable-next-line react-hooks/set-state-in-effect -- see above; must run post-hydration
		if (!isCutoverDismissed()) setOpen(true);
		let live = true;
		discoverWallets().then((found) => {
			if (live) setWallets(found);
		});
		return () => {
			live = false;
		};
	}, []);

	if (!open) return null;

	function close() {
		dismissCutover();
		setOpen(false);
	}

	async function handleConnect(wallet: WalletChoice) {
		setBusyId(wallet.uuid);
		setError('');
		try {
			const result = await connectToKalyChain(wallet.provider);
			if (result === 'cancelled') {
				setError(fillTemplate(t.cancelled, { wallet: wallet.name }));
				return;
			}
			// Never claim success on the request alone: confirm the wallet is actually on the chain.
			if (isOnKalyChain(await currentChainId(wallet.provider))) {
				setDone(true);
				return;
			}
			setError(
				fillTemplate(t.wrongChain, { wallet: wallet.name, network: WALLET_CHAIN_NAME }),
			);
		} catch {
			setError(fillTemplate(t.error, { wallet: wallet.name }));
		} finally {
			setBusyId('');
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="cutover-title"
		>
			<div className="glass rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-5 relative">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium tracking-wider uppercase">
					<span className="pulse-dot" aria-hidden />
					{t.badge}
				</div>

				<h2 id="cutover-title" className="text-2xl font-bold text-white leading-tight">
					{t.title}
				</h2>

				<p className="text-sm text-white/70 leading-relaxed">{t.body}</p>
				<p className="text-sm font-semibold text-amber-300">{t.action}</p>

				{done ? (
					<p className="text-sm text-white/80 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
						&#10003; {fillTemplate(t.added, { network: WALLET_CHAIN_NAME })}
					</p>
				) : (
					<>
						{wallets.length > 1 && (
							<p className="text-xs text-white/50 leading-relaxed">{t.pickWallet}</p>
						)}
						<div className="flex flex-col gap-2">
							{wallets.map((wallet) => (
								<button
									key={wallet.uuid}
									type="button"
									onClick={() => handleConnect(wallet)}
									disabled={busyId !== ''}
									className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
								>
									{wallet.icon && (
										// eslint-disable-next-line @next/next/no-img-element -- wallet-supplied data: URI
										<img src={wallet.icon} alt="" className="h-4 w-4 rounded" aria-hidden />
									)}
									{fillTemplate(busyId === wallet.uuid ? t.adding : t.addNetwork, {
										wallet: wallet.name,
									})}
								</button>
							))}
						</div>
					</>
				)}

				{/* Always visible so in-app users never think the button is for them. */}
				<p className="text-xs text-white/50 leading-relaxed">{t.noWallet}</p>

				{error && (
					<p className="text-xs text-danger break-words rounded-lg bg-danger/10 border border-danger/30 px-3 py-2">
						{error}
					</p>
				)}

				<button
					type="button"
					onClick={close}
					className="btn-ghost w-full rounded-lg px-4 py-2 text-sm"
				>
					{t.dismiss}
				</button>
			</div>
		</div>
	);
}
