import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Calendar, Hash, Image } from "lucide-react";
import { toast } from "sonner";
import type { UserNFT } from "@/hooks/useUserNFTs";

export default function NFTDetail() {
  const { id } = useParams<{ id: string }>();
  const [nft, setNft] = useState<UserNFT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNFT = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('nfts')
          .select(`
            id,
            name,
            symbol,
            description,
            image_url,
            mint_address,
            collection_id,
            owner_address,
            attributes,
            created_at,
            updated_at,
            collections (
              name
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        const transformedNFT: UserNFT = {
          id: data.id,
          name: data.name,
          symbol: data.symbol,
          description: data.description,
          image_url: data.image_url,
          mint_address: data.mint_address,
          collection_id: data.collection_id,
          owner_address: data.owner_address,
          metadata: data.attributes,
          created_at: data.created_at,
          updated_at: data.updated_at,
          collection_name: (data as any).collections?.name
        };

        setNft(transformedNFT);
      } catch (error) {
        console.error('Error fetching NFT:', error);
        toast.error('Failed to load NFT details');
      } finally {
        setLoading(false);
      }
    };

    fetchNFT();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6 w-1/4" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">NFT Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The NFT you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/profile?tab=nfts">
                Back to My NFTs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Helmet>
        <title>{nft.name} - NFT Details</title>
        <meta name="description" content={nft.description || `View details for ${nft.name} NFT`} />
      </Helmet>

      {/* Back Button */}
      <Button variant="outline" asChild className="mb-6">
        <Link to="/profile?tab=nfts">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My NFTs
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* NFT Image */}
        <div className="space-y-4">
          <Card>
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={nft.image_url || "/placeholder.svg"}
                alt={nft.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.src !== "/placeholder.svg") {
                    img.src = "/placeholder.svg";
                  }
                }}
              />
            </div>
          </Card>
        </div>

        {/* NFT Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">NFT</Badge>
              {nft.symbol && (
                <Badge variant="outline" className="text-xs">
                  {nft.symbol}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{nft.name}</h1>
            {nft.collection_name && (
              <p className="text-lg text-muted-foreground">
                From collection: <span className="font-medium">{nft.collection_name}</span>
              </p>
            )}
          </div>

          {nft.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{nft.description}</p>
              </CardContent>
            </Card>
          )}

          {/* NFT Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NFT Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Minted</span>
                </div>
                <span className="text-sm font-medium">
                  {new Date(nft.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              {nft.mint_address && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Mint Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {nft.mint_address.slice(0, 8)}...{nft.mint_address.slice(-8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(nft.mint_address!);
                        toast.success('Mint address copied to clipboard');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Owner</span>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {nft.owner_address.slice(0, 8)}...{nft.owner_address.slice(-8)}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Properties */}
          {nft.metadata && Array.isArray(nft.metadata) && nft.metadata.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {nft.metadata.map((attr: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        {attr.trait_type}
                      </div>
                      <div className="font-medium">{attr.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}