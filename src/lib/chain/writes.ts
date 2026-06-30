'use client';
import { useState } from 'react';
import { useWriteContract, usePublicClient } from 'wagmi';
import { getAddresses } from './addresses';
import { ACTIVE_NETWORK } from './chains';
import { erc20Abi, vaultManagerAbi, rewardsPoolAbi } from './abis';

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

// Explicit gas limits (KalySwap pins these too — Besu estimation is unreliable for some txs).
const GAS_APPROVE = 100_000n;
const GAS_PURCHASE = 3_000_000n; // swap + full-range LP mint is heavy
const GAS_CLAIM = 800_000n; // claimMany over a few vaults needs more headroom than single claim

export function useApprove() {
	const { writeContractAsync, ...rest } = useWriteContract();
	const approve = async (stable: `0x${string}`, amount: bigint) =>
		writeContractAsync({ address: stable, abi: erc20Abi, functionName: 'approve', args: [A.vaultManager!, amount], gas: GAS_APPROVE, ...FEES });
	return { approve, ...rest };
}

export function usePurchase() {
	const { writeContractAsync, ...rest } = useWriteContract();
	// vaultManagerAbi has two `purchase` overloads. viem resolves overloads by matching the
	// args tuple to the correct overload signature — 3-element args → 3-arg overload,
	// 4-element args → 4-arg overload. No explicit signature string needed.
	const buy = async (tier: number, stable: `0x${string}`, deadline: bigint, referrer?: `0x${string}`) =>
		referrer
			? writeContractAsync({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'purchase', args: [tier, stable, deadline, referrer], gas: GAS_PURCHASE, ...FEES })
			: writeContractAsync({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'purchase', args: [tier, stable, deadline], gas: GAS_PURCHASE, ...FEES });
	return { buy, ...rest };
}

export function useClaim() {
	const { writeContractAsync, isPending: isWriting } = useWriteContract();
	const client = usePublicClient();
	const [isConfirming, setIsConfirming] = useState(false);
	// v2 RewardsPool: per-vault claimMany(uint256[] tokenIds).
	// Wait for the receipt before resolving so the caller's refetch reads POST-claim state
	// (otherwise the UI briefly shows the stale pre-claim "claimable" until the next poll).
	const claim = async (ids: bigint[]) => {
		const hash = await writeContractAsync({ address: A.rewardsPool!, abi: rewardsPoolAbi, functionName: 'claimMany', args: [ids], gas: GAS_CLAIM, ...FEES });
		if (client) {
			setIsConfirming(true);
			try {
				await client.waitForTransactionReceipt({ hash });
			} finally {
				setIsConfirming(false);
			}
		}
		return hash;
	};
	// isPending stays true through both submission and on-chain confirmation.
	return { claim, isPending: isWriting || isConfirming };
}
