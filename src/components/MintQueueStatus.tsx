import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useMintQueue, type MintJob } from '@/hooks/useMintQueue';
import { formatDistanceToNow } from 'date-fns';

interface MintQueueStatusProps {
  className?: string;
}

export const MintQueueStatus = ({ className }: MintQueueStatusProps) => {
  const { jobs, loading, getJobProgress } = useMintQueue();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'all'>('active');

  const getStatusIcon = (status: MintJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: MintJob['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'secondary'
    } as const;

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const filteredJobs = jobs.filter(job => {
    switch (selectedTab) {
      case 'active':
        return job.status === 'pending' || job.status === 'processing';
      case 'completed':
        return job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled';
      case 'all':
      default:
        return true;
    }
  });

  const activeJobs = jobs.filter(job => 
    job.status === 'pending' || job.status === 'processing'
  ).length;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading mint jobs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mint Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No mint jobs yet</p>
            <p className="text-sm">Your minting activities will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mint Queue
            {activeJobs > 0 && (
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                {activeJobs} active
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active ({activeJobs})</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All ({jobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            <div className="space-y-4">
              {filteredJobs.map(job => {
                const progress = getJobProgress(job.id);
                if (!progress) return null;

                return (
                  <Card key={job.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-sm">
                              {job.total_quantity} NFTs
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Job #{job.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(job.status)}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>
                            {progress.completedItems} / {job.total_quantity} completed
                          </span>
                        </div>
                        <Progress 
                          value={progress.progressPercentage} 
                          className="h-2"
                        />
                      </div>

                      {/* Status Details */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Completed:</span>
                          <span className="ml-1 font-medium text-green-600">
                            {progress.completedItems}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Pending:</span>
                          <span className="ml-1 font-medium">
                            {progress.pendingItems}
                          </span>
                        </div>

                        {progress.processingItems > 0 && (
                          <div>
                            <span className="text-muted-foreground">Processing:</span>
                            <span className="ml-1 font-medium text-blue-600">
                              {progress.processingItems}
                            </span>
                          </div>
                        )}

                        {progress.failedItems > 0 && (
                          <div>
                            <span className="text-muted-foreground">Failed:</span>
                            <span className="ml-1 font-medium text-red-600">
                              {progress.failedItems}
                            </span>
                          </div>
                        )}

                        <div>
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="ml-1 font-medium">
                            {job.total_cost === 0 ? 'FREE' : `${job.total_cost} SOL`}
                          </span>
                        </div>

                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="ml-1">
                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {/* Error Message */}
                      {job.error_message && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                          <strong>Error:</strong> {job.error_message}
                        </div>
                      )}

                      {/* Completed Items with Links */}
                      {progress.items.filter(item => item.nft_mint_address).length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-2">Minted NFTs:</p>
                          <div className="grid grid-cols-1 gap-1 max-h-20 overflow-y-auto">
                            {progress.items
                              .filter(item => item.nft_mint_address)
                              .slice(0, 3)
                              .map(item => (
                              <div key={item.id} className="flex items-center gap-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="font-mono">
                                  {item.nft_mint_address?.slice(0, 8)}...
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                  onClick={() => {
                                    window.open(
                                      `https://solscan.io/token/${item.nft_mint_address}`,
                                      '_blank'
                                    );
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            {progress.items.filter(item => item.nft_mint_address).length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{progress.items.filter(item => item.nft_mint_address).length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};