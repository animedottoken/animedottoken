import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { useCollection } from "@/hooks/useCollection";
import { StandaloneMintWizard } from "@/components/StandaloneMintWizard";
import { NetworkSafetyBanner } from "@/components/NetworkSafetyBanner";
import { MintAccessGate } from "@/components/MintAccessGate";

export default function MintNFT() {
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collection') || '';
  const { collection } = useCollection(collectionId);
  const isCollectionContext = Boolean(collectionId);
  const [currentStep, setCurrentStep] = useState(1);

  const seoTitle = isCollectionContext
    ? `Mint NFT in ${collection?.name || 'Collection'} | Anime Token`
    : 'Mint Standalone NFT | Anime Token - Create Your Digital Art';
  const seoDescription = isCollectionContext
    ? `Mint an NFT into the ${collection?.name || 'selected'} collection on Solana. Upload your media and create a collectible.`
    : 'Mint your anime NFT directly on Solana blockchain. Upload your art and create unique digital collectibles.';
  const heading = isCollectionContext
    ? `Mint NFT in ${collection?.name || 'Collection'}`
    : 'Mint Standalone NFT';
  const subheading = isCollectionContext
    ? 'Create an NFT inside your collection. Upload your cover and media to mint on Solana.'
    : 'Create your standalone anime NFT quickly and easily. Upload your artwork and mint directly to the Solana blockchain.';

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <NetworkSafetyBanner />
          
          <MintAccessGate>
            {currentStep === 1 && (
              <div className="text-center mb-8 pt-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                  {heading}
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                  {subheading}
                </p>
              </div>
            )}

            <StandaloneMintWizard onStepChange={setCurrentStep} />
          </MintAccessGate>
        </div>
      </main>
    </>
  );
}