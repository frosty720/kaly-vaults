import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getKmtPrice } from '@/lib/price';
import { getSalesPaused } from '@/lib/chain/status';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { LandingPage } from '@/components/LandingPage';

// Regenerate the page (fresh KMT price + sales-paused flag) at most every 5 minutes.
export const revalidate = 300;

export default async function Home({ params }: PageProps<'/[locale]'>) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();
	const dict = await getDictionary(locale);
	const [kmtPrice, salesPaused] = await Promise.all([getKmtPrice(), getSalesPaused()]);

	return (
		<>
			<Nav dict={dict} locale={locale} />
			<main className="flex-1 w-full">
				<LandingPage dict={dict} locale={locale} kmtPrice={kmtPrice} salesPaused={salesPaused} />
			</main>
			<Footer dict={dict} />
		</>
	);
}
