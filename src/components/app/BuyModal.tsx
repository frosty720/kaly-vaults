'use client';

import { useState } from 'react';
import { useReadContract, usePublicClient, useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { TIERS, splitPurchase } from '@/lib/tiers';
import { getAddresses } from '@/lib/chain/addresses';
import { ACTIVE_NETWORK } from '@/lib/chain/chains';
import { erc20Abi } from '@/lib/chain/abis';
import { useApprove, usePurchase } from '@/lib/chain/writes';
import { waitForSuccess } from '@/lib/chain/receipt';
import { txErrorMessage } from '@/lib/chain/txError';
import { purchaseAmount } from '@/lib/chain/buy';
import { fmtUsd } from '@/lib/format';
import { interpolate } from '@/lib/utils';
import type { Dictionary } from '@/i18n/dictionaries/en';

const A = getAddresses(ACTIVE_NETWORK);

// Payment options come from the per-network address book, so a stable enabled on one
// network (e.g. USDC on testnet) never shows on a network whose config lacks it.
const STABLE_KEYS = Object.keys(A.stables);
type StableKey = string;
const DEFAULT_STABLE: StableKey = STABLE_KEYS.includes('USDT') ? 'USDT' : STABLE_KEYS[0];

interface BuyModalProps {
	tierIndex: number;
	addr: `0x${string}`;
	onClose: () => void;
	onPurchased: () => void;
	t: Dictionary['app']['modal'];
}

export function BuyModal({ tierIndex, addr, onClose, onPurchased, t }: BuyModalProps) {
	const tier = TIERS[tierIndex];
	const [selectedStable, setSelectedStable] = useState<StableKey>(DEFAULT_STABLE);
	// Prefill from a referral link (?ref=0x…) so a shared link auto-sets the sponsor.
	const [referralInput, setReferralInput] = useState(() => {
		if (typeof window === 'undefined') return '';
		const r = new URLSearchParams(window.location.search).get('ref');
		return r && isAddress(r) ? r : '';
	});
	const [referralError, setReferralError] = useState('');
	const [purchased, setPurchased] = useState(false);
	const [approving, setApproving] = useState(false);
	const [buying, setBuying] = useState(false);
	const [txError, setTxError] = useState('');
	const publicClient = usePublicClient();
	// Wallet connection is driven by thirdweb's ConnectButton, but every write goes
	// through wagmi — thirdwebBridge.ts syncs one into the other and that sync can lag
	// or retry. While it hasn't landed, wagmi has no wallet to sign with and the write
	// escapes to the plain RPC transport, where our Besu node answers
	// "eth_sendTransaction is not supported" (it holds no keys). Gate the actions on
	// wagmi's own connection state, not thirdweb's, so that window isn't clickable.
	const { isConnected: signerReady } = useAccount();

	const stableInfo = A.stables[selectedStable];
	const vaultManager = A.vaultManager!;
	const amount = purchaseAmount(tier.price, stableInfo.decimals);

	// Referrer: only valid if non-empty and a valid address
	const referrerValid = referralInput !== '' && isAddress(referralInput);
	const referrer: `0x${string}` | undefined = referrerValid
		? (referralInput as `0x${string}`)
		: undefined;

	// Allowance check
	const {
		data: allowance,
		isLoading: allowanceLoading,
		refetch: refetchAllowance,
	} = useReadContract({
		address: stableInfo.address,
		abi: erc20Abi,
		functionName: 'allowance',
		args: [addr, vaultManager],
	});

	const needsApproval = allowance === undefined ? true : allowance < amount;

	const { approve } = useApprove();
	const { buy } = usePurchase();

	const split = splitPurchase(tier.price);
	const estimatedAnnual = tier.price * tier.baseApr;

	function handleStableChange(key: StableKey) {
		setSelectedStable(key);
	}

	function handleReferralChange(val: string) {
		setReferralInput(val);
		if (val !== '' && !isAddress(val)) {
			setReferralError(t.invalidAddress);
		} else {
			setReferralError('');
		}
	}

	function errMsg(e: unknown): string {
		return txErrorMessage(e, { reverted: t.txReverted, walletNotReady: t.walletNotReady });
	}

	async function handleApprove() {
		setTxError('');
		if (!signerReady) return setTxError(t.walletNotReady);
		setApproving(true);
		try {
			// writeContractAsync resolves on SUBMISSION, not on mine — wait for the receipt
			// (and require status success) before re-reading allowance, otherwise the
			// button never advances to "Buy".
			const hash = await approve(stableInfo.address, amount);
			if (publicClient && hash) await waitForSuccess(publicClient, hash);
			await refetchAllowance();
		} catch (e) {
			setTxError(errMsg(e));
		} finally {
			setApproving(false);
		}
	}

	async function handleBuy() {
		setTxError('');
		if (!signerReady) return setTxError(t.walletNotReady);
		setBuying(true);
		try {
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
			const hash = await buy(tierIndex, stableInfo.address, deadline, referrer);
			// Only show success once the purchase is mined AND has status success —
			// a mined-but-reverted buy must land in the catch path, not the success screen.
			if (publicClient && hash) await waitForSuccess(publicClient, hash);
			setPurchased(true);
			onPurchased();
			// Short pause so user sees the success state before modal closes
			setTimeout(() => onClose(), 1800);
		} catch (e) {
			setTxError(errMsg(e));
		} finally {
			setBuying(false);
		}
	}

	return (
		/* Full-screen backdrop */
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			{/* Modal card */}
			<div className="glass rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative">
				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
				>
					&times;
				</button>

				{/* Tier header */}
				<div>
					<p className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-300/80 mb-1">
						{t.title}
					</p>
					<h2 className="text-2xl font-bold text-white">
						{tier.name}{' '}
						<span className="text-amber-400 tabular-nums">{fmtUsd(tier.price)}</span>
					</h2>
					<p className="text-sm text-white/50 mt-0.5">
						{interpolate(t.nominalApr, { apr: (tier.baseApr * 100).toFixed(0) })}
					</p>
				</div>

				{purchased ? (
					<div className="py-8 text-center space-y-3">
						<div className="text-4xl">&#10003;</div>
						<p className="text-lg font-semibold text-white">{t.successTitle}</p>
						<p className="text-sm text-white/50">{t.successBody}</p>
					</div>
				) : (
					<>
						{/* Stable selector */}
						<div className="space-y-1.5">
							<label className="text-xs text-white/60 uppercase tracking-wider">
								{t.payWith}
							</label>
							<select
								value={selectedStable}
								onChange={(e) => handleStableChange(e.target.value as StableKey)}
								className="input-field w-full rounded-lg px-3 py-2.5 text-sm"
							>
								{STABLE_KEYS.map((key) => (
									<option key={key} value={key}>
										{key}
									</option>
								))}
							</select>
						</div>

						{/* Referral input */}
						<div className="space-y-1.5">
							<label className="text-xs text-white/60 uppercase tracking-wider">
								{t.referralLabel}
							</label>
							<input
								type="text"
								placeholder="0x…"
								value={referralInput}
								onChange={(e) => handleReferralChange(e.target.value)}
								className="input-field w-full rounded-lg px-3 py-2.5 text-sm font-mono"
							/>
							{referralError && (
								<p className="text-xs text-danger">{referralError}</p>
							)}
						</div>

						{/* Purchase split breakdown */}
						<div className="glass rounded-xl p-4 space-y-2.5 text-sm">
							<p className="text-xs uppercase tracking-wider text-amber-300/70 font-semibold mb-1">
								{t.flowTitle}
							</p>
							<SplitRow label={t.polRow} value={fmtUsd(split.pol)} accent />
							<SplitRow label={t.feesRow} value={fmtUsd(split.fees)} />
							<div className="pl-3 space-y-1.5 border-l border-white/10">
								<SplitRow label={t.affiliate} value={fmtUsd(split.affiliate)} />
								<SplitRow label={t.dev} value={fmtUsd(split.dev)} />
								<SplitRow label={t.dao} value={fmtUsd(split.dao)} />
							</div>
						</div>

						{/* Estimated annual reward — clearly labelled as estimate */}
						<div className="glass rounded-xl p-4 flex items-center justify-between text-sm">
							<span className="text-white/60 text-xs leading-snug">
								{t.estRewards}
								<br />
								<span className="text-white/30 text-[11px]">{t.estDisclaimer}</span>
							</span>
							<span className="font-bold text-amber-300 tabular-nums text-base">
								{fmtUsd(estimatedAnnual)}
							</span>
						</div>

						{/* Action button */}
						<div className="space-y-2">
							{txError && (
								<p className="text-xs text-danger break-words rounded-lg bg-danger/10 border border-danger/30 px-3 py-2">
									{txError}
								</p>
							)}
							{!signerReady ? (
								<button
									type="button"
									disabled
									className="btn-ghost w-full rounded-lg px-4 py-3 text-sm font-semibold"
								>
									{t.walletSyncing}
								</button>
							) : allowanceLoading ? (
								<button
									type="button"
									disabled
									className="btn-ghost w-full rounded-lg px-4 py-3 text-sm font-semibold"
								>
									{t.loadingAllowance}
								</button>
							) : needsApproval ? (
								<button
									type="button"
									onClick={handleApprove}
									disabled={approving}
									className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold"
								>
									{approving ? t.approving : interpolate(t.approve, { stable: selectedStable })}
								</button>
							) : (
								<button
									type="button"
									onClick={handleBuy}
									disabled={buying || (referralInput !== '' && !referrerValid)}
									className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold"
								>
									{buying ? t.buying : interpolate(t.buy, { name: tier.name })}
								</button>
							)}

							<button
								type="button"
								onClick={onClose}
								className="btn-ghost w-full rounded-lg px-4 py-2 text-sm"
							>
								{t.cancel}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function SplitRow({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent?: boolean;
}) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-white/60 text-xs">{label}</span>
			<span
				className={`tabular-nums text-xs font-semibold ${
					accent ? 'text-amber-300' : 'text-white'
				}`}
			>
				{value}
			</span>
		</div>
	);
}
