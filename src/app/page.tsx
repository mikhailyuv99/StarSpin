import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center text-white">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Roue Fidélité</h1>
        <p className="mb-10 max-w-2xl text-lg text-white/90">
          Plateforme de fidélisation pour restaurants et commerces à Da Nang.
          QR code, réseaux sociaux, avis Google, roue de la fortune.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-full bg-white px-8 py-3 font-semibold text-orange-600 shadow-lg hover:bg-white/90"
          >
            Espace commerçant
          </Link>
          <a
            href="mailto:contact@example.com"
            className="rounded-full border-2 border-white px-8 py-3 font-semibold text-white hover:bg-white/10"
          >
            Demander une démo
          </a>
        </div>

        <div className="mt-20 grid w-full gap-6 sm:grid-cols-3">
          {[
            { title: "QR Code", desc: "Page brandée par commerce" },
            { title: "Anti-abus", desc: "OTP SMS + fingerprint" },
            { title: "Roue", desc: "Prix pondérés et stocks" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl bg-white/15 p-6 backdrop-blur">
              <h3 className="mb-2 font-bold">{item.title}</h3>
              <p className="text-sm text-white/80">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
