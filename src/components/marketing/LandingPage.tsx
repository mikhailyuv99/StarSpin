import Link from "next/link";

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-sm font-bold text-white">
            RF
          </span>
          <span className="text-lg font-bold text-slate-900">Roue Fidélité</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <a href="#fonctionnalites" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
            Fonctionnalités
          </a>
          <a href="#comment-ca-marche" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
            Comment ça marche
          </a>
          <Link
            href="/login"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
          >
            Espace commerçant
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="mb-4 inline-block rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
            Fidélisation locale · Da Nang
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-tight">
            Transformez chaque scan QR en client fidèle
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Une page brandée, un parcours guidé (réseaux sociaux, avis Google) et une roue de
            la fortune pour récompenser vos clients — sans application à installer.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-orange-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-orange-700"
            >
              Créer mon commerce
            </Link>
            <a
              href="#comment-ca-marche"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              Voir le parcours client
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-slate-700">
            <li className="flex items-center gap-2">
              <span className="text-orange-600">✓</span> Setup en 10 minutes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-600">✓</span> 100% mobile web
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-600">✓</span> Anti-abus intégré
            </li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500" />
              <div>
                <p className="font-bold text-slate-900">Café Bienvenue</p>
                <p className="text-sm text-slate-500">/r/cafe-bienvenue</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { step: "1", label: "Vérification SMS", done: true },
                { step: "2", label: "Follow Instagram", done: true },
                { step: "3", label: "Avis Google", done: true },
                { step: "4", label: "Tourner la roue", active: true },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                    item.active
                      ? "border-2 border-orange-500 bg-orange-50"
                      : item.done
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.active
                        ? "bg-orange-600 text-white"
                        : item.done
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {item.done ? "✓" : item.step}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-slate-900 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Prix gagné</p>
              <p className="mt-1 text-lg font-bold text-white">Boisson offerte</p>
              <p className="mt-2 font-mono text-sm text-amber-400">CODE · A7F2B9C1</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: "Page brandée par commerce",
    description:
      "Logo, couleurs et liens sociaux personnalisés. Chaque établissement a sa propre URL et son QR code.",
    icon: "🎨",
  },
  {
    title: "Parcours client guidé",
    description:
      "Téléphone, follow, avis Google puis roue — un funnel clair qui maximise l'engagement à chaque étape.",
    icon: "📱",
  },
  {
    title: "Roue configurable",
    description:
      "Définissez vos prix, probabilités et stocks. Réductions, produits offerts, ou cases « perdu ».",
    icon: "🎡",
  },
  {
    title: "Anti-abus multicouche",
    description:
      "OTP SMS, empreinte appareil et validation d'avis. Un numéro = un spin par commerce tous les 30 jours.",
    icon: "🛡️",
  },
  {
    title: "Dashboard commerçant",
    description:
      "Stats, gestion des prix, validation des captures d'avis et téléchargement du QR en un clic.",
    icon: "📊",
  },
  {
    title: "Pensé pour Da Nang",
    description:
      "Simple à maintenir, adapté aux restaurants et commerces locaux. Pas de complexité inutile.",
    icon: "📍",
  },
];

function Features() {
  return (
    <section id="fonctionnalites" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Tout ce qu&apos;il faut pour fidéliser sur place
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Un outil complet, sans application mobile à développer ni parcours compliqué pour vos clients.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-2xl" role="img" aria-hidden>
                {f.icon}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
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
    title: "Le client scanne le QR",
    text: "Sur table ou comptoir. Il arrive sur votre page aux couleurs de votre établissement.",
  },
  {
    num: "02",
    title: "Il valide son numéro",
    text: "Code SMS pour limiter les abus. Un numéro ne peut jouer qu'une fois par mois chez vous.",
  },
  {
    num: "03",
    title: "Il suit & laisse un avis",
    text: "Liens vers vos réseaux et Google. Capture d'avis uploadée pour vérification.",
  },
  {
    num: "04",
    title: "Il tourne la roue",
    text: "Prix tiré selon vos probabilités. Code unique à présenter en caisse.",
  },
];

function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="border-y border-slate-200 bg-slate-900 py-20 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Comment ça marche</h2>
          <p className="mt-4 text-lg text-slate-300">
            Quatre étapes. Zéro friction inutile. Vos clients restent dans leur navigateur.
          </p>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.num} className="relative">
              <p className="text-4xl font-bold text-orange-500">{step.num}</p>
              <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForMerchants() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Vous gardez le contrôle
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Depuis votre dashboard, configurez tout sans toucher au code : branding, prix de la
              roue, suivi des participations et validation des avis en attente.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "QR code PNG prêt à imprimer",
                "Prix avec poids de probabilité et stock limité",
                "Historique des spins et stats journalières",
                "Suivi du nombre d'avis Google (optionnel)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Spins ce mois</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">127</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Follows sociaux</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">98</p>
              </div>
              <div className="col-span-2 rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Prix les plus tirés</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">10% réduction</span>
                    <span className="font-semibold text-slate-900">42%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[42%] rounded-full bg-orange-500" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Boisson offerte</span>
                    <span className="font-semibold text-slate-900">31%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[31%] rounded-full bg-amber-500" />
                  </div>
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
    <section className="bg-orange-600 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Prêt à lancer votre roue ?
        </h2>
        <p className="mt-4 text-lg text-orange-100">
          Créez votre page, imprimez le QR, placez-le sur vos tables. Vos clients jouent en
          quelques secondes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-orange-700 shadow-md hover:bg-orange-50"
          >
            Commencer gratuitement
          </Link>
          <a
            href="mailto:contact@example.com"
            className="rounded-lg border-2 border-white px-8 py-3 text-base font-semibold text-white hover:bg-orange-700"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p className="text-sm text-slate-600">
          © {new Date().getFullYear()} Roue Fidélité · Da Nang, Vietnam
        </p>
        <div className="flex gap-6 text-sm font-medium text-slate-600">
          <Link href="/login" className="hover:text-slate-900">
            Connexion commerçant
          </Link>
          <a href="#fonctionnalites" className="hover:text-slate-900">
            Fonctionnalités
          </a>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
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
