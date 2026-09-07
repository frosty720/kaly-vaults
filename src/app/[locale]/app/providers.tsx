'use client';
import { ReactNode, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { ThirdwebProvider } from 'thirdweb/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { kalychain } from '@/lib/chain/chains';
import { useThirdwebWagmiBridge } from '@/lib/chain/thirdwebBridge';

// Wallet connection is driven by thirdweb's ConnectButton; the bridge below
// registers the connected wallet as a wagmi connector at runtime, so we keep
// the wagmi config connector-less and let every contract hook flow through it.
const wagmiConfig = createConfig({
	chains: [kalychain],
	transports: { [kalychain.id]: http() },
	ssr: true,
});

/** Runs inside both providers; syncs the active thirdweb wallet into wagmi. */
function Bridge({ children }: { children: ReactNode }) {
	useThirdwebWagmiBridge();
	return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
	const [qc] = useState(() => new QueryClient());
	return (
		<QueryClientProvider client={qc}>
			<WagmiProvider config={wagmiConfig}>
				<ThirdwebProvider>
					<Bridge>{children}</Bridge>
				</ThirdwebProvider>
			</WagmiProvider>
		</QueryClientProvider>
	);
}
