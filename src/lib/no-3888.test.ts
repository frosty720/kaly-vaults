/**
 * Guards the 2026-08-27 migration to KalyChain 3890 (KMT). The app models ONE chain; the
 * 3888/3889 fleets, their contracts, "KLC" as the reward asset and the waitlist/countdown
 * copy must not come back. Host literals live only in src/lib/chain/chains.ts and the two
 * subgraph URL defaults in subgraph.ts, so the cut-day hostname switch stays env-only.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..');

const FORBIDDEN: RegExp[] = [
	/\b388[89]\b/,
	/NEXT_PUBLIC_CHAIN\b/,
	/kalyMainnet|kalyTestnet|kalyKmt|ACTIVE_NETWORK|NetworkName/,
	/vault-subgraph-kalychain-mainnet|v3-subgraph-kalychain-mainnet/,
	/api\.coingecko\.com|dexOverview/,
	// 3888/3889 contracts + tokens
	/0x8ad3aD4a3F20672d39F6F87d6bdf1DF5386ac6A5|0x8b80800Cf6dA88D59EB09CaE4Fd2196423c48b26|0xb02f6b79CbB549F188c90f83035dD295d8AdF082|0x57616e82d871Fc2f89F57352274b5A80940d7A28|0x069255299Bb729399f3CECaBdc73d15d3D10a2A3|0x2CA775C77B922A51FcF3097F52bFFdbc0250D99A|0x9cAb0c396cF0F4325913f2269a0b72BD4d46E3A9|0x6E92CAC380F7A7B86f4163fad0df2F277B16Edc6|0xCC93b84cEed74Dc28c746b7697d6fA477ffFf65a|0xCd02480926317748e95c5bBBbb7D1070b2327f1A/i,
	// user-facing copy
	/\bKLC\b/,
	/waitlist|Countdown|VAULT_LAUNCH/i,
];

// The cut-over notice must name the old ticker ("KLC is now KMT at 110:1") — that copy lives
// only in the i18n dictionaries. Everywhere else \bKLC\b stays forbidden.
const KLC_RE = /\bKLC\b/;
const KLC_COPY_ALLOWED = ['i18n/dictionaries/en.ts', 'i18n/dictionaries/fr.ts'];

const HOST = /[a-z0-9.-]*(kalyscan\.io|kalychain\.io\/rpc|app\.kalyswap\.io)/;
const HOST_ALLOWED = ['lib/chain/chains.ts', 'lib/chain/subgraph.ts'];

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
	}
	return out;
}

describe('KalyChain 3890 migration guard', () => {
	it('the deleted files stay deleted', () => {
		for (const rel of ['components/WaitlistForm.tsx', 'components/Countdown.tsx', 'app/api', 'lib/supabase.ts', 'lib/resend.ts', 'lib/emails', 'lib/countdown.ts']) {
			expect(existsSync(join(SRC, rel)), `${rel} was re-added`).toBe(false);
		}
	});

	it('no source references the old chains, their contracts, KLC copy or the waitlist', () => {
		const offenders: string[] = [];
		for (const file of walk(SRC)) {
			const text = readFileSync(file, 'utf8');
			for (const re of FORBIDDEN) {
				if (re.source === KLC_RE.source && KLC_COPY_ALLOWED.some((a) => file.endsWith(a))) continue;
				if (re.test(text)) offenders.push(`${file.replace(SRC, 'src')} matches ${re}`);
			}
		}
		expect(offenders).toEqual([]);
	});

	it('host literals live only in the chain/subgraph config', () => {
		const offenders = walk(SRC)
			.filter((f) => !HOST_ALLOWED.some((a) => f.endsWith(a)))
			.filter((f) => HOST.test(readFileSync(f, 'utf8')))
			.map((f) => f.replace(SRC, 'src'));
		expect(offenders).toEqual([]);
	});
});
