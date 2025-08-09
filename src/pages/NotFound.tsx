import { Helmet } from "react-helmet-async";

const NotFound = () => {
  return (
    <main className="min-h-screen grid place-items-center bg-background text-foreground p-6">
      <Helmet>
        <title>Stránka nenalezena | ANIME Token</title>
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/404'} />
      </Helmet>
      <div className="text-center">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Jejda! Tato stránka neexistuje.</p>
        <a href="/" className="mt-6 inline-block">
          <span className="underline decoration-primary/50 underline-offset-4 hover:text-primary transition-colors">Zpět na úvod</span>
        </a>
      </div>
    </main>
  );
};

export default NotFound;
