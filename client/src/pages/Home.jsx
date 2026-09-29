import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCatalog } from '../catalog';
import { useI18n } from '../i18n';
import { Img, Msg, Spinner } from '../components/Ui';
import { money, todayISO } from '../utils';

const Stars = ({ n }) => <span aria-label={`${n}/5`} className="text-gold-deep">{'★'.repeat(n)}<span className="text-ink/20">{'★'.repeat(5 - n)}</span></span>;

export default function Home() {
  const { data, error } = useCatalog();
  const { t } = useI18n();
  const nav = useNavigate();
  const { hash } = useLocation();
  const [date, setDate] = useState('');

  useEffect(() => {
    if (hash && data) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [hash, data]);

  if (error) return <div className="mx-auto max-w-lg p-10"><Msg>{error}</Msg></div>;
  if (!data) return <Spinner />;
  const { hall, sections, services, testimonials } = data;
  if (!hall) return <div className="p-10 text-center">لم تُضف بيانات القاعة بعد. شغّل: npm run db:seed</div>;

  return (
    <>
      {/* الهيرو: قوس معماري يحمل أداة التحقق من التوفّر */}
      <section className="pattern-gold bg-ink text-ivory">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:grid-cols-2 md:py-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl font-black leading-[1.15] text-gold sm:text-6xl">{hall.name}</h1>
            <p className="mt-5 max-w-md text-xl text-ivory/85">{hall.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/booking" className="btn btn-gold">{t('book_now')}</Link>
              <Link to="/#about" className="btn btn-ghost">{t('about_us')}</Link>
            </div>
          </motion.div>

          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-t-[999px] rounded-b-2xl border-2 border-gold/70 p-2">
              <div className="rounded-t-[999px] rounded-b-xl bg-ink-800/90 px-7 pb-8 pt-24 text-center">
                <h2 className="text-2xl font-black text-gold">{t('hero_check')}</h2>
                <label className="mt-5 block text-start">
                  <span className="mb-1 block text-sm text-ivory/70">{t('hero_pick_date')}</span>
                  <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-gold/40 bg-ink px-4 py-2.5 text-ivory outline-none focus:border-gold" />
                </label>
                <button className="btn btn-gold mt-4 w-full" onClick={() => nav(`/booking${date ? `?date=${date}` : ''}`)}>{t('hero_check_btn')}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-xl leading-9 text-ink/80">{hall.description}</p>
        {hall.capacity > 0 && <p className="mt-4 font-bold text-gold-deep">{t('up_to')} {hall.capacity} {t('guests_unit')}</p>}
      </section>

      <section id="services" className="bg-ivory-dark py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black">{t('services_title')}</h2>
          <p className="mt-1 text-ink/60">{t('services_sub')}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className="card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-2xl">{s.icon}</div>
                <h3 className="mt-3 text-lg font-black">{s.name}</h3>
                <p className="mt-1 text-sm leading-7 text-ink/70">{s.description}</p>
                {s.price > 0 && <p className="mt-2 text-sm font-bold text-gold-deep">{money(s.price)}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sections" className="bg-ink py-16 text-ivory">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-gold">{t('sections_title')}</h2>
          <p className="mt-1 text-ivory/60">{t('sections_sub')}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {sections.map((s) => (
              <article key={s.id} className="overflow-hidden rounded-2xl bg-ink-700 ring-1 ring-gold/20">
                <Img src={s.image} alt={s.name} className="h-52 w-full" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-black text-gold-light">{s.name}</h3>
                    <p className="whitespace-nowrap font-bold text-gold">{money(s.price)} <span className="text-xs font-normal text-ivory/60">/ {t('per_hour')}</span></p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-ivory/70">{s.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-ivory/60">{t('up_to')} {s.capacity} {t('guests_unit')}</span>
                    <Link to={`/booking?section=${s.id}`} className="btn btn-gold btn-sm">{t('book_section')}</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-black">{t('gallery_title')}</h2>
        {hall.images?.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            {hall.images.map((src, i) => <Img key={i} src={src} alt="" className={`w-full rounded-2xl ${i % 5 === 0 ? 'h-72 md:col-span-2' : 'h-52'}`} />)}
          </div>
        ) : <p className="mt-4 text-ink/60">{t('gallery_empty')}</p>}
      </section>

      {testimonials.length > 0 && (
        <section className="bg-ivory-dark py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-black">{t('reviews_title')}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((r) => (
                <figure key={r.id} className="card">
                  <Stars n={r.rating} />
                  <blockquote className="mt-2 leading-8 text-ink/80">{r.text}</blockquote>
                  <figcaption className="mt-3 font-bold">{r.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-black">{t('contact_title')}</h2>
          <dl className="mt-6 space-y-4">
            {hall.address && <div><dt className="label">{t('address')}</dt><dd>{hall.address}</dd></div>}
            {hall.phone && <div><dt className="label">{t('phone')}</dt><dd dir="ltr" className="text-start"><a href={`tel:${hall.phone.replace(/\s/g, '')}`}>{hall.phone}</a></dd></div>}
            {hall.email && <div><dt className="label">{t('email')}</dt><dd><a href={`mailto:${hall.email}`}>{hall.email}</a></dd></div>}
          </dl>
          <div className="mt-6 flex gap-3">
            {hall.instagram && <a className="btn btn-line btn-sm" href={hall.instagram} target="_blank" rel="noreferrer">Instagram</a>}
            {hall.facebook && <a className="btn btn-line btn-sm" href={hall.facebook} target="_blank" rel="noreferrer">Facebook</a>}
          </div>
        </div>
        {hall.map_embed_url ? (
          <iframe title="map" src={hall.map_embed_url} className="h-72 w-full rounded-2xl border-0 ring-1 ring-ink/10" loading="lazy" />
        ) : <Img className="h-72 w-full rounded-2xl" icon="📍" />}
      </section>
    </>
  );
}
