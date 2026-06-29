export const fmtUsd = (n: number) =>
	'$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtKlc = (n: number) =>
	`${n.toLocaleString('en-US', { maximumFractionDigits: 4 })} KLC`;

export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
