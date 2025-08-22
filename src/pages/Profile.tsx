
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Settings, 
  Grid3X3, 
  Clock, 
  Edit, 
  ExternalLink,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useMintQueue } from '@/hooks/useMintQueue';
import { MintQueueStatus } from '@/components/MintQueueStatus';
import { CollectionEditor } from '@/components/CollectionEditor';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function Profile() {
  const { connected, publicKey } = useSolanaWallet();
  const { collections, loading: collectionsLoading, refreshCollections } = useCollections();
  const { activities, loading: activitiesLoading } = useUserActivity();
  const { jobs, loading: queueLoading, getJobProgress } = useMintQueue();
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'collections';

  // Auto-refresh collections when component mounts
  useEffect(() => {
    if (connected && publicKey) {
      console.log('Auto-refreshing collections for wallet:', publicKey);
      refreshCollections();
    }
  }, [connected, publicKey, refreshCollections]);

  const handleRefresh = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    toast.info('Refreshing collections...');
    await refreshCollections();
    toast.success('Collections refreshed!');
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view your profile and collections.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedCollection) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedCollection(null)}
            className="mb-4"
          >
            ← Back to Profile
          </Button>
        </div>
        <CollectionEditor 
          collection={selectedCollection} 
          onClose={() => setSelectedCollection(null)} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">My Profile</CardTitle>
                <p className="text-muted-foreground">
                  {publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Not connected'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              Devnet - Testing Mode
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Collections ({collections.length})
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Mint Queue ({jobs.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Activity ({activities.length})
          </TabsTrigger>
        </TabsList>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">My Collections</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={collectionsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${collectionsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button asChild size="sm">
                <Link to="/mint/collection">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Collection
                </Link>
              </Button>
            </div>
          </div>

          {collectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Grid3X3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Collections Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first NFT collection to get started.
                </p>
                <Button asChild>
                  <Link to="/mint/collection">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Collection
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="group hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-muted relative">
                    <img
                      src={collection.image_url || collection.banner_image_url || "/placeholder.svg"}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.src !== "/placeholder.svg") {
                          img.src = "/placeholder.svg";
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedCollection(collection)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link to={`/collection/${collection.id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg">{collection.name}</h4>
                      <div className="flex gap-1">
                        {collection.is_live ? (
                          <Badge variant="default" className="bg-green-500 text-white text-xs">
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Draft
                          </Badge>
                        )}
                        {collection.verified && (
                          <Badge variant="outline" className="text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {collection.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Supply:</span>
                        <span className="ml-1 font-medium">
                          {collection.supply_mode === 'open' ? '∞' : collection.max_supply?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Minted:</span>
                        <span className="ml-1 font-medium">{collection.items_redeemed || 0}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {collection.mint_price === 0 ? 'FREE' : `${collection.mint_price} SOL`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Mint Queue Tab */}
        <TabsContent value="queue">
          <MintQueueStatus 
            jobs={jobs} 
            loading={queueLoading} 
            getJobProgress={getJobProgress}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          
          {activitiesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
                <p className="text-muted-foreground">
                  Your recent activity will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        {activity.status && (
                          <Badge variant="outline" className="mt-2">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
