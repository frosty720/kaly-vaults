import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { LOCALES, isLocale, LOCALE_HTML_LANG } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import '../globals.css';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
	display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
	variable: '--font-jetbrains-mono',
	subsets: ['latin'],
	display: 'swap',
});

export async function generateStaticParams() {
	return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: LayoutProps<'/[locale]'>): Promise<Metadata> {
	const { locale } = await params;
	if (!isLocale(locale)) return {};
	const dict = await getDictionary(locale);
	return {
		metadataBase: new URL('https://vaults.kalychain.io'),
		title: dict.meta.title,
		description: dict.meta.description,
		openGraph: {
			title: dict.meta.title,
			description: dict.meta.ogDescription,
			type: 'website',
			locale: locale === 'fr' ? 'fr_FR' : 'en_US',
			alternateLocale: locale === 'fr' ? ['en_US'] : ['fr_FR'],
		},
		alternates: {
			canonical: `/${locale}`,
			languages: {
				en: '/en',
				fr: '/fr',
			},
		},
	};
}

export default async function RootLayout({
	children,
	params,
}: LayoutProps<'/[locale]'>) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();

	return (
		<html
			lang={LOCALE_HTML_LANG[locale]}
			className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	);
}
