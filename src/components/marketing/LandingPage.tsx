"use client";

import Link from "next/link";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";

const LIME = "#d4ff00";

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-sm text-xs font-black tracking-tight text-ink"
            style={{ backgroundColor: LIME }}
          >
            RF
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white">Roue Fidélité</span>
        </Link>
        <nav className="flex items-center gap-6">
          <a href="#jeu" className="hidden text-[13px] font-semibold text-zinc-400 hover:text-white sm:block">
            Le jeu
          </a>
          <a href="#commercants" className="hidden text-[13px] font-semibold text-zinc-400 hover:text-white sm:block">
            Commerçants
          </a>
          <Link
            href="/login"
            className="rounded-sm px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110"
            style={{ backgroundColor: LIME }}
          >
            Espace pro
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HeroWheel() {
  const slices = [
    { color: LIME, label: "10%" },
    { color: "#fff", label: "Café" },
    { color: "#52525b", label: "20%" },
    { color: "#a1a1aa", label: "Dessert" },
    { color: "#3f3f46", label: "Merci" },
    { color: "#71717a", label: "15%" },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <div className="hero-wheel absolute inset-0 rounded-full border-4 border-white/20 shadow-[0_0_80px_rgba(212,255,0,0.15)]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          {slices.map((s, i) => {
            const start = (i / slices.length) * 360;
            const end = ((i + 1) / slices.length) * 360;
            const mid = (start + end) / 2;
            const rad = ((mid - 90) * Math.PI) / 180;
            const tx = 100 + 58 * Math.cos(rad);
            const ty = 100 + 58 * Math.sin(rad);
            const large = end - start > 180 ? 1 : 0;
            const sRad = ((end - 90) * Math.PI) / 180;
            const eRad = ((start - 90) * Math.PI) / 180;
            const x1 = 100 + 92 * Math.cos(sRad);
            const y1 = 100 + 92 * Math.sin(sRad);
            const x2 = 100 + 92 * Math.cos(eRad);
            const y2 = 100 + 92 * Math.sin(eRad);
            return (
              <g key={s.label}>
                <path
                  d={`M100 100 L${x1} ${y1} A92 92 0 ${large} 0 ${x2} ${y2} Z`}
                  fill={s.color}
                  stroke="#18181b"
                  strokeWidth={1}
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid}, ${tx}, ${ty})`}
                  fill={s.color === "#fff" || s.color === LIME ? "#09090b" : "#fff"}
                  fontSize={9}
                  fontWeight={700}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="22" fill="#09090b" stroke="#fff" strokeWidth={2} />
          <text x="100" y="103" textAnchor="middle" fill={LIME} fontSize={10} fontWeight={800}>
            SPIN
          </text>
        </svg>
      </div>
      <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-2xl">▼</div>
      <div
        className="absolute -inset-4 -z-10 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${LIME}40, transparent 70%)` }}
      />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-800 bg-ink text-white">
      <div className="marketing-dots pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: LIME }} />
            Da Nang · Fidélisation gamifiée
          </p>
          <h1 className="mt-6 text-[2.35rem] font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Transformez chaque client en{" "}
            <span style={{ color: LIME }}>joueur</span> qui revient
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
            QR code sur table → SMS → réseaux → avis Google →{" "}
            <strong className="font-semibold text-white">roue de la fortune</strong>. Zéro appli.
            Zéro friction. Des clients qui postent, suivent et reviennent.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-sm px-6 py-3 text-sm font-bold text-ink transition hover:brightness-110"
              style={{ backgroundColor: LIME }}
            >
              Lancer mon commerce
            </Link>
            <a
              href="#jeu"
              className="rounded-sm border border-zinc-600 px-6 py-3 text-sm font-bold text-white transition hover:border-zinc-400 hover:bg-zinc-900"
            >
              Voir le parcours client
            </a>
          </div>
          <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-zinc-800 pt-8">
            {[
              { v: "< 60s", l: "Parcours client" },
              { v: "1 QR", l: "Mise en place" },
              { v: "0 app", l: "À installer" },
            ].map((s) => (
              <div key={s.l}>
                <dd className="font-mono text-xl font-bold text-white">{s.v}</dd>
                <dt className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {s.l}
                </dt>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.12} y={40}>
          <HeroWheel />
          <p className="mt-6 text-center font-mono text-xs text-zinc-500">
            Aperçu live · Café Bienvenue · spin #1847
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const GAME_STEPS = [
  { emoji: "📱", title: "Scan QR", desc: "Page brandée du commerce. Pas d'appli, pas de compte." },
  { emoji: "✅", title: "SMS validé", desc: "Un numéro = un tirage. Anti-triche intégré." },
  { emoji: "❤️", title: "Follow social", desc: "Instagram, Facebook ou TikTok en un tap." },
  { emoji: "⭐", title: "Avis Google", desc: "Capture d'écran → roue débloquée." },
  { emoji: "🎰", title: "Spin & win", desc: "Prix pondérés, code unique en caisse." },
];

function GameFlow() {
  return (
    <section id="jeu" className="border-b border-border bg-white py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="section-label text-muted">Le parcours</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Cinq niveaux. Un seul objectif :{" "}
            <span className="underline decoration-[3px] underline-offset-4" style={{ textDecorationColor: LIME }}>
              faire revenir le client
            </span>
          </h2>
        </Reveal>

        <RevealStagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {GAME_STEPS.map((step, i) => (
            <RevealItem key={step.title}>
              <article className="group relative h-full rounded-sm border border-border bg-surface p-5 transition hover:border-ink hover:shadow-lg">
                <span className="font-mono text-xs font-bold text-muted">0{i + 1}</span>
                <p className="mt-3 text-3xl">{step.emoji}</p>
                <h3 className="mt-3 text-base font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
              </article>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

const PERKS = [
  {
    title: "Roue avec vos vrais prix",
    desc: "Chaque segment affiche le libellé. Probabilités et stocks depuis le dashboard.",
  },
  {
    title: "Anti-abus multi-couche",
    desc: "OTP SMS, empreinte appareil, modération des captures. Un tirage par numéro.",
  },
  {
    title: "Votre marque, pas la nôtre",
    desc: "Logo, couleurs, URL dédiée. Le client vit l'expérience de votre établissement.",
  },
  {
    title: "Stats qui comptent",
    desc: "Spins, conversions sociales, distribution des gains. Pilotage en temps réel.",
  },
];

function Perks() {
  return (
    <section className="border-b border-border bg-surface py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="section-label text-muted">Pourquoi ça marche</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              La gamification n&apos;est pas un gadget — c&apos;est un moteur de croissance
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              Les clients ne &quot;remplissent pas un formulaire&quot;. Ils jouent, gagnent, et
              partagent. Vous récoltez avis, abonnés et données — sans équipe marketing.
            </p>
          </Reveal>

          <RevealStagger className="grid gap-3 sm:grid-cols-2">
            {PERKS.map((p) => (
              <RevealItem key={p.title}>
                <div className="h-full rounded-sm border border-border bg-white p-5">
                  <h3 className="text-sm font-bold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}

function Merchants() {
  return (
    <section id="commercants" className="border-b border-border bg-white py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="section-label text-muted">Commerçants</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
            En ligne avant la fin du service
          </h2>
          <p className="mt-4 text-[17px] text-muted">
            Créez votre espace, configurez la roue, imprimez le QR. C&apos;est tout.
          </p>
        </Reveal>

        <RevealStagger className="mt-14 grid gap-6 lg:grid-cols-3">
          {[
            {
              step: "1",
              title: "Configurez",
              items: ["Logo & couleurs", "Prix et probabilités", "Liens sociaux & Google"],
            },
            {
              step: "2",
              title: "Imprimez",
              items: ["QR haute résolution", "Posez sur tables / comptoir", "Clients scannent"],
            },
            {
              step: "3",
              title: "Pilotez",
              items: ["Modérez les avis", "Suivez les spins", "Ajustez les gains"],
            },
          ].map((card) => (
            <RevealItem key={card.step}>
              <div className="h-full rounded-sm border-2 border-ink bg-ink p-6 text-white">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-sm font-mono text-sm font-bold text-ink"
                  style={{ backgroundColor: LIME }}
                >
                  {card.step}
                </span>
                <h3 className="mt-4 text-xl font-bold">{card.title}</h3>
                <ul className="mt-4 space-y-2">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                      <span style={{ color: LIME }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden bg-ink py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${LIME}55, transparent)`,
        }}
      />
      <Reveal className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Prêt à faire tourner la roue ?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
          Rejoignez les cafés et restaurants de Da Nang qui transforment leurs clients en ambassadeurs.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-sm px-8 py-3.5 text-sm font-bold text-ink transition hover:brightness-110"
            style={{ backgroundColor: LIME }}
          >
            Démarrer gratuitement
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} Roue Fidélité — Da Nang, Vietnam
        </p>
        <div className="flex gap-8 text-[13px] font-semibold text-muted">
          <Link href="/login" className="hover:text-ink">
            Connexion
          </Link>
          <a href="#jeu" className="hover:text-ink">
            Le jeu
          </a>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <Nav />
      <main>
        <Hero />
        <GameFlow />
        <Perks />
        <Merchants />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
