import { parseAbi } from 'viem';

export const vaultManagerAbi = parseAbi([
	'function tiers(uint256) view returns (uint256 priceUSD, uint16 aprBps, uint256 weight, string metadataURI, bool active)',
	'function tierOf(uint256) view returns (uint8)',
	'function vaultWeight(uint256) view returns (uint256)',
	'function totalWeight() view returns (uint256)',
	'function ownerOf(uint256) view returns (address)',
	'function purchase(uint8 tier, address stable, uint256 deadline) returns (uint256)',
	'function purchase(uint8 tier, address stable, uint256 deadline, address referrer) returns (uint256)',
	'function klcUsdPrice() view returns (uint256)',
	'function priceAnchorStable() view returns (address)',
	'function reserveWklc() view returns (uint256)',
	'function tierCapBps(uint256) view returns (uint256)',
	'function sponsorOf(address) view returns (address)',
	'event Purchased(address indexed buyer, uint256 indexed tokenId, uint8 tier, address stable, uint256 paid)',
	'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
	'event PolDeployed(address indexed stable, uint256 swapped, uint256 wklcOut, uint256 positionId)',
	'event SponsorSet(address indexed buyer, address indexed sponsor)',
	'event FeesRouted(address indexed buyer, address indexed stable, address n1, address n2, address n3, uint256 n1Amt, uint256 n2Amt, uint256 n3Amt, uint256 devAmt, uint256 daoAmt)',
]);

export const rewardsPoolAbi = parseAbi([
	'function earned(uint256 tokenId) view returns (uint256)',
	'function earnedUsdOf(uint256 tokenId) view returns (uint256)',
	'function capUsdOf(uint256 tokenId) view returns (uint256)',
	'function isMatured(uint256 tokenId) view returns (bool)',
	'function vaultWeight(uint256 tokenId) view returns (uint256)',
	'function claim(uint256 tokenId)',
	'function claimMany(uint256[] tokenIds)',
	'function mature(uint256 tokenId)',
	'event Claimed(uint256 indexed tokenId, address indexed owner, uint256 amount)',
]);

export const erc20Abi = parseAbi([
	'function allowance(address owner, address spender) view returns (uint256)',
	'function approve(address spender, uint256 value) returns (bool)',
	'function balanceOf(address) view returns (uint256)',
]);

export const v3PoolAbi = parseAbi([
	'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 a, uint16 b, uint16 c, uint8 d, bool e)',
	'function liquidity() view returns (uint128)',
	'function token0() view returns (address)',
]);

export const positionManagerAbi = parseAbi([
	'function positions(uint256) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 fg0, uint256 fg1, uint128 tokensOwed0, uint128 tokensOwed1)',
	'function ownerOf(uint256) view returns (address)',
	// ERC721Enumerable — used to enumerate all treasury-owned positions
	'function balanceOf(address) view returns (uint256)',
	'function tokenOfOwnerByIndex(address, uint256) view returns (uint256)',
]);
