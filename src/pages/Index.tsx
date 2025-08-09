import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/hero-anime.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";

const Index = () => {
  const copyContract = async () => {
    await navigator.clipboard.writeText(CONTRACT);
    toast.success("Adresa kontraktu zkopírována");
  };

  return (
    <main className="min-h-screen py-12 md:py-20 container">
      <Helmet>
        <title>ANIME Token CZ | Oficiální komunita na Solaně</title>
        <meta name="description" content="Oficiální komunita ANIME tokenu na Solaně. Mise, detaily tokenu, odkazy na Telegram a X. Přidej se k příběhu!" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
        <meta property="og:title" content="ANIME Token CZ | Oficiální komunita" />
        <meta property="og:description" content="Komunita okolo ANIME tokenu na Solaně." />
        <meta property="og:type" content="website" />
      </Helmet>

      <header className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border bg-card shadow-glow">
        <img
          src={heroImage}
          alt="Cinematic anime ilustrace s kytarou – hero obrázek ANIME tokenu"
          loading="eager"
          className="h-[320px] w-full object-cover md:h-[420px]"
        />
        <div className="absolute inset-0 grid place-items-center px-6">
          <div className="max-w-3xl rounded-xl border border-white/10 bg-black/40 p-6 md:p-10 backdrop-blur-md" style={{ backgroundImage: 'var(--gradient-hero)' }}>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Oficiální centrum komunity ANIME tokenu.
            </h1>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Komunitní obnova ANIME tokenu na Solaně. Budujeme decentralizovaný prostor pro fanoušky anime na celém světě.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero">
                <a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer">Připojit se na Telegram</a>
              </Button>
              <Button asChild variant="glass">
                <a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer">Sledovat na X</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Naše mise</CardTitle>
            <CardDescription>
              ANIME token začal s velkými sny, ale původní tvůrce jej opustil. Dnes štafetu drží komunita držitelů. Naší misí je vybudovat živé, decentralizované místo, kde se fanoušci anime spojí, podělí a budou slavit svou vášeň.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Oficiální detaily tokenu</CardTitle>
            <CardDescription>Transparentní informace o tokenu ANIME.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Název</span>
              <span className="font-semibold">ANIME</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Blockchain</span>
              <span className="font-semibold">Solana</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Kontrakt</span>
              <div className="flex items-center gap-2">
                <code className="rounded-md bg-secondary px-2 py-1 text-sm">{CONTRACT}</code>
                <Button variant="outline" size="sm" onClick={copyContract}>Kopírovat</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto mt-16 max-w-5xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold">Staň se součástí příběhu</h2>
        <p className="mt-3 text-muted-foreground">Konverzace běží právě teď. Přidej se a pomoz formovat budoucnost ANIME tokenu.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="hero">
            <a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer">Připojit se na Telegram</a>
          </Button>
          <Button asChild variant="glass">
            <a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer">Sledovat na X</a>
          </Button>
        </div>
      </section>

      <script type="application/ld+json">{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ANIME Token',
        url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080',
        sameAs: ['https://x.com/AnimeDotToken','https://t.me/AnimeDotTokenCommunity']
      })}</script>
    </main>
  );
};

export default Index;
