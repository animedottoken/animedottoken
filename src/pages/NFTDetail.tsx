import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ExternalLink, 
  Heart,
  ChevronDown,
  MoreVertical,
  Edit,
  Send,
  Flame,
  List as ListIcon,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EditNFTDialog } from '@/components/EditNFTDialog';
import { formatAttributes } from '@/lib/attributeHelpers';
import { FullscreenNFTViewer } from '@/components/FullscreenNFTViewer';

export default function NFTDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [nft, setNft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const fetchNFT = async () => {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setNft(data);

      // Check ownership
      if (user) {
        const { data: wallets } = await supabase
          .from('user_wallets')
          .select('wallet_address')
          .eq('user_id', user.id)
          .eq('is_verified', true);

        const userWallets = wallets?.map(w => w.wallet_address) || [];
        setIsOwner(userWallets.includes(data.owner_address));
      }

      // Fetch creator profile
      if (data.creator_user_id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('nickname, display_name, profile_image_url, verified')
          .eq('user_id', data.creator_user_id)
          .single();
        
        setCreatorProfile(profile);
      }

      // Fetch activities
      const { data: activitiesData } = await supabase
        .from('marketplace_activities')
        .select('*')
        .eq('nft_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      setActivities(activitiesData || []);

    } catch (error: any) {
      console.error('Error fetching NFT:', error);
      toast.error('Failed to load NFT details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFT();
  }, [id, user]);

  const handleBurnNFT = async () => {
    if (!confirm(`Are you sure you want to burn "${nft.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('nfts')
        .delete()
        .eq('id', nft.id);

      if (error) throw error;

      toast.success('NFT burned successfully! 🔥');
      navigate('/profile');
    } catch (error) {
      console.error('Error burning NFT:', error);
      toast.error('Failed to burn NFT');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">NFT not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </Card>
      </div>
    );
  }

  const explorerUrl = `https://solscan.io/token/${nft.mint_address}`;
  const creatorName = creatorProfile?.nickname || creatorProfile?.display_name || 'Unknown Creator';
  const description = nft.description || 'No description provided.';
  
  // Format attributes - convert from various formats to simple array
  const rawAttributes = nft.attributes || nft.metadata;
  const attributes = Array.isArray(rawAttributes) 
    ? rawAttributes.filter((attr: any) => attr.trait_type && attr.value)
    : formatAttributes(rawAttributes);
  
  const truncatedDesc = description.length > 200 ? description.slice(0, 200) + '...' : description;
  const shouldTruncate = description.length > 200;

  // Mock data for floor/items/owners (replace with real data when available)
  const floorPrice = null; // Replace with real data
  const totalItems = null; // Replace with real data
  const totalOwners = null; // Replace with real data

  return (
    <>
      <div className="container mx-auto px-4 py-6 max-w-6xl pb-24 lg:pb-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Hero: Image + Details (2-column grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Left: Image */}
          <div className="lg:col-span-6">
            <div 
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity border shadow-sm"
              onClick={() => setIsFullscreen(true)}
            >
              <img
                src={nft.image_url}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Small badges under image */}
            <div className="flex items-center gap-2 mt-3">
              {nft.is_listed && (
                <Badge variant="default" className="text-xs">Listed</Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-accent"
                      onClick={() => window.open(explorerUrl, '_blank')}
                    >
                      Verified <ExternalLink className="h-3 w-3 ml-1" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View on Solscan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-6 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{nft.name}</h1>
            </div>

            {/* Creator Row */}
            {creatorProfile && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={creatorProfile.profile_image_url} />
                  <AvatarFallback>{creatorName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/creator/${nft.creator_user_id}`}
                    className="font-medium hover:underline"
                  >
                    {creatorName}
                  </Link>
                  {creatorProfile.verified && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            )}

            {/* Price Card */}
            {nft.is_listed && nft.price ? (
              <Card className="p-6 bg-accent/50">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{nft.price}</span>
                      <span className="text-2xl text-muted-foreground">{nft.currency || 'SOL'}</span>
                    </div>
                  </div>

                  {!isOwner ? (
                    <div className="flex gap-3">
                      <Button size="lg" className="flex-1">
                        Buy now
                      </Button>
                      <Button size="lg" variant="secondary" className="flex-1">
                        Make offer
                      </Button>
                    </div>
                  ) : (
                    <Button size="lg" variant="outline" className="w-full">
                      <ListIcon className="h-4 w-4 mr-2" />
                      List for sale
                    </Button>
                  )}

                  {/* Royalties line */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground cursor-help">
                          Royalties 14.04% (enforced)
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This percentage goes to the creator on resales.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </Card>
            ) : (
              !isOwner ? (
                <Card className="p-6 bg-muted/50">
                  <p className="text-sm text-muted-foreground">Not currently listed for sale</p>
                </Card>
              ) : (
                <Button size="lg" className="w-full">
                  <ListIcon className="h-4 w-4 mr-2" />
                  List for sale
                </Button>
              )
            )}

            {/* Optional: Quick Stats Row */}
            {(floorPrice || totalItems || totalOwners) && (
              <div className="flex items-center gap-6 text-sm">
                {floorPrice && (
                  <div>
                    <span className="text-muted-foreground">Floor: </span>
                    <span className="font-medium">{floorPrice} SOL</span>
                  </div>
                )}
                {totalItems && (
                  <div>
                    <span className="text-muted-foreground">Items: </span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                )}
                {totalOwners && (
                  <div>
                    <span className="text-muted-foreground">Owners: </span>
                    <span className="font-medium">{totalOwners}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Owner Controls Dropdown */}
        {isOwner && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Owner Controls</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Manage <MoreVertical className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit metadata
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Transfer coming soon')}>
                    <Send className="h-4 w-4 mr-2" />
                    Transfer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBurnNFT} className="text-destructive">
                    <Flame className="h-4 w-4 mr-2" />
                    Burn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('List coming soon')}>
                    <ListIcon className="h-4 w-4 mr-2" />
                    List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        )}

        {/* Tabs: Overview / Activity */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full lg:w-auto mb-6">
            <TabsTrigger value="overview" className="flex-1 lg:flex-initial">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 lg:flex-initial">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Description */}
            {description && description !== 'No description provided.' ? (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {descriptionExpanded || !shouldTruncate ? description : truncatedDesc}
                </p>
                {shouldTruncate && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="mt-2 p-0 h-auto"
                  >
                    {descriptionExpanded ? 'Show less' : 'Read more'}
                  </Button>
                )}
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">No description.</p>
              </Card>
            )}

            {/* Attributes Table */}
            {attributes.length > 0 ? (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Attributes</h3>
                <div className="space-y-2">
                  {attributes.map((attr: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm text-muted-foreground">{attr.trait_type || attr.key}</span>
                      <span className="font-medium text-sm">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">No attributes provided.</p>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-0">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm capitalize">{activity.activity_type}</p>
                        {activity.price && (
                          <p className="text-xs text-muted-foreground">
                            {activity.price} {activity.currency || 'SOL'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                        {activity.transaction_signature && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => window.open(
                              `https://solscan.io/tx/${activity.transaction_signature}`,
                              '_blank'
                            )}
                          >
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Details Accordion (collapsed by default) */}
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="mt-6">
          <Card className="p-6">
            <CollapsibleTrigger className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
              <h3 className="font-semibold">Details</h3>
              <ChevronDown className={`h-5 w-5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Contract Address</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs">{nft.mint_address.slice(0, 4)}...{nft.mint_address.slice(-4)}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(explorerUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Token ID</span>
                <span className="text-sm font-mono">{nft.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Mint Date</span>
                <span className="text-sm">{new Date(nft.created_at).toLocaleDateString()}</span>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Mobile Sticky Buy Bar */}
      {nft.is_listed && nft.price && !isOwner && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t p-4 z-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-xl font-bold">{nft.price} {nft.currency || 'SOL'}</p>
            </div>
            <Button size="lg" className="flex-1">
              Buy now
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {isOwner && (
        <EditNFTDialog
          nft={nft}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUpdate={fetchNFT}
        />
      )}

      {/* Fullscreen Viewer */}
      <FullscreenNFTViewer
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        nftImage={nft.image_url}
        nftName={nft.name}
        nftId={nft.id}
        isOwner={isOwner}
      />
    </>
  );
}
