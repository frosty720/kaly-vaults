'use client';
import { useState } from 'react';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { getAddresses } from './addresses';
import { ACTIVE_NETWORK } from './chains';
import { erc20Abi, vaultManagerAbi, rewardsPoolAbi } from './abis';
import { waitForSuccess } from './receipt';
import { resolveGas } from './gas';

const A = getAddresses(ACTIVE_NETWORK);

// KalyChain (Besu) reports baseFee ~7 wei and eth_maxPriorityFeePerGas = 0, so any wallet
// that trusts the chain's fee suggestions (viem's default, MetaMask) builds a tx at ~10 wei
// — far below the node's effective minimum, so it never mines and sits stuck "pending".
// We pin EXPLICIT EIP-1559 fees + a gas limit on every write, matching the values the
// KalySwap frontend uses on this same chain (30 gwei / 3 gwei). 1559 (not legacy gasPrice)
// because MetaMask honours explicit maxFeePerGas/maxPriorityFeePerGas as "site suggested"
// on a 1559 chain but drops a legacy gasPrice hint. Cost is still trivial on KalyChain.
const FEES = {
	maxFeePerGas: 30_000_000_000n, // 30 gwei (matches KalySwap)
	maxPriorityFeePerGas: 3_000_000_000n, // 3 gwei (matches KalySwap)
} as const;

// Fallback gas limits, used ONLY when live estimation fails (Besu estimation is
// unreliable for some txs). Deliberately generous, which is safe as a last resort
// but NOT safe as a default: `gas * maxFeePerGas` is the balance a wallet demands
// before it will sign, so a fat constant prices out buyers who can easily afford
// the real cost. See gas.ts for the incident this comes from.
const GAS_APPROVE = 100_000n;
const GAS_PURCHASE = 3_000_000n; // swap + full-range LP mint is heavy
const GAS_CLAIM = 800_000n; // claimMany over a few vaults needs more headroom than single claim

// Floors — the resolved limit never drops below these even if the node estimates
// low, so a bad estimate can never cause an out-of-gas revert (which would burn
// the user's gas rather than merely blocking them).
//
// PURCHASE floor is measured, not guessed: across all 70 purchases settled on
// mainnet as of 2026-07-28, gasUsed ranged 702,021 – 846,275 (median 764,646,
// p90 820,534). 1,200,000 sits 42% above the all-time maximum. Re-measure before
// lowering it, and raise it if the purchase path ever gains work.
const GAS_FLOOR_PURCHASE = 1_200_000n;
// CLAIM keeps its original pinned value as the floor — behaviour is unchanged
// unless estimation asks for MORE (claimMany scales with the number of vaults).
const GAS_FLOOR_CLAIM = GAS_CLAIM;

export function useApprove() {
	const { writeContractAsync, ...rest } = useWriteContract();
	const approve = async (stable: `0x${string}`, amount: bigint) =>
		writeContractAsync({ address: stable, abi: erc20Abi, functionName: 'approve', args: [A.vaultManager!, amount], gas: GAS_APPROVE, ...FEES });
	return { approve, ...rest };
}

export function usePurchase() {
	const { writeContractAsync, ...rest } = useWriteContract();
	const client = usePublicClient();
	const { address } = useAccount();
	// vaultManagerAbi has two `purchase` overloads. viem resolves overloads by matching the
	// args tuple to the correct overload signature — 3-element args → 3-arg overload,
	// 4-element args → 4-arg overload. No explicit signature string needed. Each branch
	// estimates inline so the args tuple keeps its literal type for that resolution.
	const buy = async (tier: number, stable: `0x${string}`, deadline: bigint, referrer?: `0x${string}`) => {
		if (referrer) {
			const gas = await resolveGas(async () => {
				if (!client || !address) throw new Error('estimation unavailable');
				return client.estimateContractGas({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'purchase', args: [tier, stable, deadline, referrer], account: address });
			}, { floor: GAS_FLOOR_PURCHASE, fallback: GAS_PURCHASE });
			return writeContractAsync({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'purchase', args: [tier, stable, deadline, referrer], gas, ...FEES });
		}
		const gas = await resolveGas(async () => {
			if (!client || !address) throw new Error('estimation unavailable');
			return client.estimateContractGas({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'purchase', args: [tier, stable, deadline], account: address });
		}, { floor: GAS_FLOOR_PURCHASE, fallback: GAS_PURCHASE });
		return writeContractAsync({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'purchase', args: [tier, stable, deadline], gas, ...FEES });
	};
	return { buy, ...rest };
}

export function useClaim() {
	const { writeContractAsync, isPending: isWriting } = useWriteContract();
	const client = usePublicClient();
	const { address } = useAccount();
	const [isConfirming, setIsConfirming] = useState(false);
	// v2 RewardsPool: per-vault claimMany(uint256[] tokenIds).
	// Wait for the receipt (and require status success — a mined-but-reverted claim
	// must throw, not resolve) before resolving so the caller's refetch reads
	// POST-claim state (otherwise the UI briefly shows the stale pre-claim
	// "claimable" until the next poll).
	const claim = async (ids: bigint[]) => {
		const gas = await resolveGas(async () => {
			if (!client || !address) throw new Error('estimation unavailable');
			return client.estimateContractGas({ address: A.rewardsPool!, abi: rewardsPoolAbi, functionName: 'claimMany', args: [ids], account: address });
		}, { floor: GAS_FLOOR_CLAIM, fallback: GAS_CLAIM });
		const hash = await writeContractAsync({ address: A.rewardsPool!, abi: rewardsPoolAbi, functionName: 'claimMany', args: [ids], gas, ...FEES });
		if (client) {
			setIsConfirming(true);
			try {
				await waitForSuccess(client, hash);
			} finally {
				setIsConfirming(false);
			}
		}
		return hash;
	};
	// isPending stays true through both submission and on-chain confirmation.
	return { claim, isPending: isWriting || isConfirming };
}
