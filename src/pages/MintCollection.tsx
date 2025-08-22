import { Helmet } from "react-helmet-async";
import { UnifiedMintInterface } from "@/components/UnifiedMintInterface";

export default function MintCollection() {
  return (
    <>
      <Helmet>
        <title>Create Collection & Mint NFT | Anime Token - Launch Your NFT Collection</title>
        <meta name="description" content="Create and launch your anime NFT collection on Solana. Set up royalties, pricing, and collection details." />
        <meta name="keywords" content="NFT collection, create collection, Solana NFT, anime collection, blockchain" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center mb-8 pt-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent leading-tight">
              Create Collection & Mint NFT
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Create your anime NFT collection with our step-by-step process. Set up your collection details, customize settings, and launch your project.
            </p>
          </div>

          <div className="flex justify-center">
            <UnifiedMintInterface mode="collection" />
          </div>
        </div>
      </main>
    </>
  );
}