import { createPublicClient, http } from 'viem';
import { kalychain } from './chains';
import { ADDRESSES } from './addresses';
import { vaultManagerAbi } from './abis';

/**
 * Is the VaultManager paused? Read server-side for the landing page (ISR) so the copy can
 * say "sales paused" instead of "the sale is live" while it is. `null` = the read failed,
 * in which case the page shows the neutral copy rather than guessing.
 */
export async function getSalesPaused(): Promise<boolean | null> {
	try {
		const client = createPublicClient({ chain: kalychain, transport: http(kalychain.rpcUrls.default.http[0]) });
		return await client.readContract({ address: ADDRESSES.vaultManager, abi: vaultManagerAbi, functionName: 'paused' });
	} catch {
		return null;
	}
}
