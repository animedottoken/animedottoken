import { Helmet } from "react-helmet-async";
import { UnifiedMintInterface } from "@/components/UnifiedMintInterface";

export default function MintNFT() {
  return (
    <>
      <Helmet>
        <title>Mint NFT | Anime Token - Create Your Digital Art</title>
        <meta name="description" content="Mint your anime NFT directly on Solana blockchain. Upload your art and create unique digital collectibles." />
        <meta name="keywords" content="mint NFT, create NFT, Solana NFT, anime art, digital collectibles" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center mb-8 pt-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Mint Your NFT
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Create your standalone anime NFT quickly and easily. Upload your artwork and mint directly to the Solana blockchain.
            </p>
          </div>

          <div className="flex justify-center">
            <UnifiedMintInterface />
          </div>
        </div>
      </main>
    </>
  );
}