import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getKlcPrice } from '@/lib/price';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { LandingPage } from '@/components/LandingPage';

// Regenerate the page (with a fresh KLC price) at most every 5 minutes.
export const revalidate = 300;

export default async function Home({ params }: PageProps<'/[locale]'>) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();
	const dict = await getDictionary(locale);
	const klcPrice = await getKlcPrice();

	return (
		<>
			<Nav dict={dict} locale={locale} />
			<main className="flex-1 w-full">
				<LandingPage dict={dict} locale={locale} klcPrice={klcPrice} />
			</main>
			<Footer dict={dict} />
		</>
	);
}
