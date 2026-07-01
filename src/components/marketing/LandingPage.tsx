import Link from "next/link";
import {
  IconChart,
  IconCheck,
  IconFlow,
  IconLayers,
  IconPin,
  IconShield,
  IconWheel,
} from "./icons";

const btnPrimary =
  "inline-flex items-center justify-center rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover";
const btnSecondary =
  "inline-flex items-center justify-center rounded-sm border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface";
const btnGhostDark =
  "inline-flex items-center justify-center rounded-sm border border-zinc-700 bg-transparent px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900";
const card =
  "rounded-sm border border-border bg-white";
const cardDark =
  "rounded-sm border border-zinc-800 bg-zinc-950";

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink text-[11px] font-bold tracking-wider text-white">
            RF
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">Roue Fidélité</span>
        </Link>
        <nav className="flex items-center gap-8">
          <a
            href="#fonctionnalites"
            className="hidden text-[13px] font-medium text-muted hover:text-ink sm:block"
          >
            Fonctionnalités
          </a>
          <a
            href="#comment-ca-marche"
            className="hidden text-[13px] font-medium text-muted hover:text-ink sm:block"
          >
            Processus
          </a>
          <Link href="/login" className={btnPrimary}>
            Espace commerçant
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="marketing-grid border-b border-zinc-800 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <div>
          <p className="section-label text-cyan-400">Infrastructure fidélisation · Da Nang</p>
          <h1 className="mt-5 text-[2.5rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            Chaque scan QR devient une relation client mesurable
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-zinc-400">
            Parcours mobile structuré : vérification, engagement social, avis Google et
            distribution de récompenses. Déployé en minutes, opéré depuis un tableau de bord
            unique.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/login" className={btnPrimary}>
              Déployer un commerce
            </Link>
            <a href="#comment-ca-marche" className={btnGhostDark}>
              Voir le processus
            </a>
          </div>
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-zinc-800 pt-8">
            {[
              { label: "Mise en ligne", value: "< 10 min" },
              { label: "Client", value: "Mobile web" },
              { label: "Fraude", value: "Multi-couche" },
            ].map((item) => (
              <div key={item.label}>
                <dt className="section-label text-zinc-500">{item.label}</dt>
                <dd className="mt-1 font-mono text-sm font-medium text-zinc-100">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={`${cardDark} p-0 shadow-2xl shadow-black/40`}>
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-zinc-600" />
              <span className="h-2 w-2 rounded-sm bg-zinc-600" />
              <span className="h-2 w-2 rounded-sm bg-zinc-600" />
            </div>
            <span className="font-mono text-[11px] text-zinc-500">session / r / cafe-bienvenue</span>
          </div>
          <div className="border-b border-zinc-800 p-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-sm bg-zinc-800" />
              <div>
                <p className="text-sm font-semibold text-white">Café Bienvenue</p>
                <p className="font-mono text-xs text-zinc-500">merchant.active · trial</p>
              </div>
            </div>
          </div>
          <div className="space-y-0 divide-y divide-zinc-800 p-2">
            {[
              { id: "01", label: "Vérification SMS", status: "complete" },
              { id: "02", label: "Engagement social", status: "complete" },
              { id: "03", label: "Avis Google", status: "complete" },
              { id: "04", label: "Distribution prix", status: "active" },
            ].map((row) => (
              <div
                key={row.id}
                className={`flex items-center gap-4 px-3 py-3 ${
                  row.status === "active" ? "bg-cyan-950/40" : ""
                }`}
              >
                <span className="font-mono text-xs text-zinc-500">{row.id}</span>
                <span className="flex-1 text-sm text-zinc-200">{row.label}</span>
                <span
                  className={`rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    row.status === "complete"
                      ? "bg-zinc-800 text-zinc-400"
                      : "bg-cyan-900 text-cyan-300"
                  }`}
                >
                  {row.status === "complete" ? "ok" : "live"}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 bg-zinc-900/80 p-5">
            <p className="section-label text-zinc-500">Récompense émise</p>
            <p className="mt-2 text-lg font-semibold text-white">Boisson offerte</p>
            <p className="mt-2 font-mono text-sm text-cyan-400">REF · A7F2-B9C1</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: "Identité par établissement",
    description:
      "URL dédiée, QR code, logo et palette. Chaque point de vente conserve sa marque sans développement sur mesure.",
    Icon: IconLayers,
  },
  {
    title: "Pipeline client structuré",
    description:
      "Étapes séquentielles avec validation à chaque niveau. Le client reste dans le navigateur, sans application.",
    Icon: IconFlow,
  },
  {
    title: "Moteur de récompenses",
    description:
      "Probabilités, stocks et libellés configurables. Distribution contrôlée et traçable en caisse.",
    Icon: IconWheel,
  },
  {
    title: "Contrôle anti-abus",
    description:
      "OTP, empreinte appareil et revue d'avis. Limite stricte : un numéro, un tirage par commerce sur 30 jours.",
    Icon: IconShield,
  },
  {
    title: "Tableau de bord opérationnel",
    description:
      "Métriques, modération des preuves d'avis, export QR. Vue consolidée pour le gérant.",
    Icon: IconChart,
  },
  {
    title: "Déploiement local",
    description:
      "Conçu pour le marché de Da Nang : restaurants, cafés et commerces de proximité.",
    Icon: IconPin,
  },
];

function Features() {
  return (
    <section id="fonctionnalites" className="border-b border-border bg-white py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="section-label text-accent">Plateforme</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Infrastructure complète, interface épurée
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            Les composants nécessaires à la fidélisation sur place, intégrés dans un seul système
            cohérent.
          </p>
        </div>
        <div className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, description, Icon }) => (
            <article key={title} className="bg-white p-7">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border text-accent">
                <Icon />
              </div>
              <h3 className="mt-5 text-[17px] font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    num: "01",
    title: "Scan du QR",
    text: "Accès immédiat à la page brandée depuis table ou comptoir.",
  },
  {
    num: "02",
    title: "Authentification",
    text: "Numéro vérifié par SMS. Règle d'usage appliquée avant toute récompense.",
  },
  {
    num: "03",
    title: "Engagement & avis",
    text: "Redirections sociales et Google. Preuve d'avis soumise pour contrôle.",
  },
  {
    num: "04",
    title: "Émission du prix",
    text: "Tirage pondéré. Code unique présenté en caisse pour validation.",
  },
];

function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="border-b border-border bg-surface py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="section-label text-accent">Processus</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Quatre étapes, un flux maîtrisé
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            De l&apos;arrivée sur la page à la remise du gain — chaque transition est définie et
            journalisée.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.num} className={`${card} p-6`}>
              <p className="font-mono text-2xl font-medium text-accent">{step.num}</p>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForMerchants() {
  return (
    <section className="border-b border-border bg-white py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <div>
            <p className="section-label text-accent">Opérations</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Pilotage centralisé
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              Configuration, modération et reporting depuis un espace commerçant dédié. Aucune
              intervention technique requise au quotidien.
            </p>
            <ul className="mt-10 space-y-4 border-t border-border pt-8">
              {[
                "Export QR haute résolution",
                "Gestion des probabilités et stocks",
                "Historique des participations",
                "Suivi agrégé des avis Google",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-ink">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-accent-subtle text-accent">
                    <IconCheck />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={`${cardDark} overflow-hidden`}>
            <div className="border-b border-zinc-800 px-5 py-3">
              <p className="section-label text-zinc-500">Aperçu · tableau de bord</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-zinc-800">
              <div className="bg-zinc-950 p-5">
                <p className="section-label text-zinc-500">Spins</p>
                <p className="mt-2 font-mono text-3xl font-medium text-white">127</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">période · 30j</p>
              </div>
              <div className="bg-zinc-950 p-5">
                <p className="section-label text-zinc-500">Social</p>
                <p className="mt-2 font-mono text-3xl font-medium text-white">98</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">conversions</p>
              </div>
              <div className="col-span-2 bg-zinc-950 p-5">
                <p className="section-label text-zinc-500">Distribution des prix</p>
                <div className="mt-4 space-y-4">
                  {[
                    { label: "10% réduction", pct: 42 },
                    { label: "Boisson offerte", pct: 31 },
                    { label: "Dessert offert", pct: 18 },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-zinc-400">{row.label}</span>
                        <span className="text-zinc-200">{row.pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-sm bg-zinc-800">
                        <div
                          className="h-full rounded-sm bg-cyan-600"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-ink py-24">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <p className="section-label text-cyan-400">Démarrage</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Mettez votre programme en production
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-zinc-400">
          Créez votre espace, configurez la roue, imprimez le QR. Vos clients interagissent en
          moins d&apos;une minute.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-sm bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            Accéder à la plateforme
          </Link>
          <a href="mailto:contact@example.com" className={btnGhostDark}>
            Contact commercial
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} Roue Fidélité — Da Nang, VN
        </p>
        <div className="flex gap-8 text-[13px] font-medium text-muted">
          <Link href="/login" className="hover:text-ink">
            Connexion
          </Link>
          <a href="#fonctionnalites" className="hover:text-ink">
            Fonctionnalités
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
        <Features />
        <HowItWorks />
        <ForMerchants />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
