export const metadata = {
  title: 'Politika privatnosti — BasketBG',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-court-bg text-white px-5 py-8 max-w-2xl mx-auto">
      <h1 className="font-display font-black text-2xl uppercase mb-2">Politika privatnosti</h1>
      <p className="text-court-text text-sm mb-8">Poslednje ažurirano: jul 2026.</p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-court-text">
        <section>
          <h2 className="text-white font-semibold text-base mb-2">1. Koje podatke prikupljamo</h2>
          <p>
            BasketBG prikuplja sledeće podatke kada napraviš nalog i koristiš aplikaciju:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Email adresa i lozinka (za prijavu i registraciju)</li>
            <li>Ime, prezime i korisničko ime koje uneseš</li>
            <li>Profilna slika koju otpremiš (dobrovoljno)</li>
            <li>Lokacija uređaja (samo uz tvoju dozvolu, za prikaz terena blizu tebe)</li>
            <li>Sadržaj koji objaviš — okupljanja, komentari, poruke u chatu</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">2. Kako koristimo podatke</h2>
          <p>
            Podaci se koriste isključivo za funkcionisanje aplikacije: prikazivanje terena i
            igara u tvojoj blizini, omogućavanje prijave na okupljanja, chat sa drugim
            igračima i prikaz tvog profila ostalim korisnicima. Ne prodajemo niti delimo
            tvoje podatke trećim stranama u marketinške svrhe.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">3. Čuvanje podataka</h2>
          <p>
            Podaci se čuvaju na Supabase infrastrukturi (EU/US serveri, u zavisnosti od
            regiona) dok god je tvoj nalog aktivan. Profilna slika se čuva u Supabase
            Storage servisu.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">4. Tvoja prava</h2>
          <p>
            Možeš u svakom trenutku da izmeniš svoje podatke kroz profil u aplikaciji, ili
            da zatražiš brisanje naloga i svih povezanih podataka slanjem zahteva na
            kontakt email ispod.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">5. Lokacija</h2>
          <p>
            Pristup lokaciji se traži isključivo da bi ti prikazali tereni i igre najbliže
            tebi. Lokacija se ne čuva trajno niti se deli sa trećim stranama — koristi se
            samo u trenutku učitavanja stranice.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">6. Kontakt</h2>
          <p>
            Za sva pitanja u vezi sa privatnošću ili zahteve za brisanje podataka, piši na:{' '}
            <a href="mailto:kontakt@basketbg.rs" className="text-orange-500 underline">
              kontakt@basketbg.rs
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
