import { Helmet } from "react-helmet-async";
import { UnifiedMintInterface } from "@/components/UnifiedMintInterface";
import { NetworkSafetyBanner } from "@/components/NetworkSafetyBanner";

export default function MintCollection() {
  return (
    <>
      <Helmet>
        <title>Mint Collection + NFT | Anime Token - Launch Your NFT Collection</title>
        <meta name="description" content="Create and launch your anime NFT collection on Solana. Set up royalties, pricing, and collection details." />
        <meta name="keywords" content="NFT collection, create collection, Solana NFT, anime collection, blockchain" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
          <NetworkSafetyBanner />
          <div className="flex justify-center">
            <UnifiedMintInterface />
          </div>
        </div>
      </main>
    </>
  );
}