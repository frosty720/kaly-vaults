'use client';

import { WalletButton } from './WalletButton';
import type { Dictionary } from '@/i18n/dictionaries/en';

interface ConnectPromptProps {
	t: Dictionary['app']['connect'];
	connectLabel: string;
}

export function ConnectPrompt({ t, connectLabel }: ConnectPromptProps) {
	return (
		<div className="glass rounded-2xl p-8 sm:p-10 text-center fade-up bg-gradient-to-br from-amber-500/[0.05] to-transparent">
			<div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30">
				<span className="pulse-dot" aria-hidden="true" />
			</div>
			<h3 className="text-lg font-bold text-white mb-1.5">{t.title}</h3>
			<p className="text-white/55 text-sm mb-6 max-w-sm mx-auto">{t.body}</p>
			<div className="flex justify-center">
				<WalletButton label={connectLabel} />
			</div>
		</div>
	);
}
