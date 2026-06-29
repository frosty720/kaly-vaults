import { getDictionary } from '@/i18n/get-dictionary';
import { isLocale } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { notFound } from 'next/navigation';
import { AppProviders } from './providers';
import { VaultApp } from '@/components/app/VaultApp';

export const dynamic = 'force-dynamic';

export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();
	const dict = await getDictionary(locale as Locale);
	return (
		<AppProviders>
			<VaultApp dict={dict} locale={locale as Locale} />
		</AppProviders>
	);
}
