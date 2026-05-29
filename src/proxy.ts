import { NextResponse, type NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n/config';

function detectLocale(request: NextRequest): Locale {
	const headers: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		headers[key] = value;
	});
	const languages = new Negotiator({ headers }).languages();
	try {
		return match(languages, LOCALES as readonly string[], DEFAULT_LOCALE) as Locale;
	} catch {
		return DEFAULT_LOCALE;
	}
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip if any supported locale already in the path
	const hasLocale = LOCALES.some(
		(l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
	);
	if (hasLocale) return;

	// Redirect bare root and unprefixed paths to the detected locale
	const locale = detectLocale(request);
	const url = request.nextUrl.clone();
	url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
	return NextResponse.redirect(url);
}

export const config = {
	matcher: [
		// Skip Next internals, API routes, and static assets
		'/((?!_next|api|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?)).*)',
	],
};
