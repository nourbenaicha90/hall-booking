import { useCatalog } from '../catalog';
import { useI18n } from '../i18n';

export default function Footer() {
  const { data } = useCatalog();
  const { t } = useI18n();
  const h = data?.hall;
  return (
    <footer className="no-print bg-ink py-8 text-center text-sm text-ivory/60">
      <p className="font-display text-lg font-black text-gold">{h?.name || t('brand_default')}</p>
      {h?.tagline && <p className="mt-1">{h.tagline}</p>}
      <p className="mt-4">© {new Date().getFullYear()} {h?.name || t('brand_default')} — {t('rights')}</p>
    </footer>
  );
}
