import type { PublicClient } from 'viem';
import { vaultManagerAbi, positionManagerAbi } from './abis';

export function reconcileOwnedTokenIds(received: bigint[], sentAway: bigint[]): bigint[] {
	const out = new Set(received.map(String));
	for (const id of sentAway) out.delete(String(id));
	return [...out].map((s) => BigInt(s));
}

const CHUNK = 50000n; // stay under Besu getLogs range caps

async function getLogsChunked(
	client: PublicClient,
	params: { address: `0x${string}`; event: any; args?: any; fromBlock: bigint; toBlock: bigint },
) {
	const out: any[] = [];
	for (let from = params.fromBlock; from <= params.toBlock; from += CHUNK + 1n) {
		const to = from + CHUNK > params.toBlock ? params.toBlock : from + CHUNK;
		out.push(
			...(await client.getLogs({ address: params.address, event: params.event, args: params.args, fromBlock: from, toBlock: to })),
		);
	}
	return out;
}

// Candidate token ids a wallet owns (confirm with ownerOf afterwards).
export async function getOwnedVaultTokenIds(
	client: PublicClient, vaultManager: `0x${string}`, owner: `0x${string}`, fromBlock: bigint,
): Promise<bigint[]> {
	const transferEvent = vaultManagerAbi.find((x: any) => x.type === 'event' && x.name === 'Transfer');
	const head = await client.getBlockNumber();
	const inbound = await getLogsChunked(client, { address: vaultManager, event: transferEvent, args: { to: owner }, fromBlock, toBlock: head });
	const outbound = await getLogsChunked(client, { address: vaultManager, event: transferEvent, args: { from: owner }, fromBlock, toBlock: head });
	return reconcileOwnedTokenIds(inbound.map((l) => l.args.tokenId), outbound.map((l) => l.args.tokenId));
}

// All vault purchases (drives protocol KPIs: total deposited + vaults minted).
export async function getPurchases(
	client: PublicClient, vaultManager: `0x${string}`, fromBlock: bigint,
): Promise<{ tier: number; stable: `0x${string}`; paid: bigint; tokenId: bigint }[]> {
	const ev = vaultManagerAbi.find((x: any) => x.type === 'event' && x.name === 'Purchased');
	const head = await client.getBlockNumber();
	const logs = await getLogsChunked(client, { address: vaultManager, event: ev, fromBlock, toBlock: head });
	return logs.map((l) => ({
		tier: Number(l.args.tier),
		stable: l.args.stable,
		paid: l.args.paid,
		tokenId: l.args.tokenId,
	}));
}

// All PolDeployed events across all polSources (sparkline history). Sorted chronologically.
// Pass polSources (all VaultManager addresses, old + new) to capture the full history.
export async function getPolDeployments(
	client: PublicClient, polSources: `0x${string}`[], fromBlock: bigint,
): Promise<{ stable: `0x${string}`; swapped: bigint; positionId: bigint; blockNumber: bigint }[]> {
	const ev = vaultManagerAbi.find((x: any) => x.type === 'event' && x.name === 'PolDeployed');
	const head = await client.getBlockNumber();
	const all: { stable: `0x${string}`; swapped: bigint; positionId: bigint; blockNumber: bigint }[] = [];
	for (const src of polSources) {
		const logs = await getLogsChunked(client, { address: src, event: ev, fromBlock, toBlock: head });
		for (const l of logs) {
			all.push({ stable: l.args.stable, swapped: l.args.swapped, positionId: l.args.positionId, blockNumber: l.blockNumber });
		}
	}
	// Sort by block number so the sparkline series is chronologically ordered
	all.sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0));
	return all;
}

// Enumerate all LP positions the treasury currently owns via ERC721Enumerable on the NPM.
export async function getTreasuryPositionIds(
	client: PublicClient,
	positionManager: `0x${string}`,
	treasury: `0x${string}`,
): Promise<bigint[]> {
	const balance = await client.readContract({
		address: positionManager,
		abi: positionManagerAbi,
		functionName: 'balanceOf',
		args: [treasury],
	}) as bigint;
	const ids: bigint[] = [];
	for (let i = 0n; i < balance; i++) {
		const id = await client.readContract({
			address: positionManager,
			abi: positionManagerAbi,
			functionName: 'tokenOfOwnerByIndex',
			args: [treasury, i],
		}) as bigint;
		ids.push(id);
	}
	return ids;
}
