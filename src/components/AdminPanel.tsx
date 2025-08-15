import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Eye, Clock, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Submission {
  id: string;
  image_url: string;
  caption: string;
  author: string;
  author_bio: string;
  contact: string | null;
  tags: string[];
  type: string;
  edition_type: string;
  status: string;
  created_at: string;
}

export const AdminPanel = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-list-submissions');
      if (error) throw error;
      setSubmissions(data?.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-submission', {
        body: { id, status },
      });
      if (error) throw error;

      const updated = data?.submission as Submission | null;
      if (updated) {
        setSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, status: updated.status } : sub));
      }

      toast({
        title: "Success",
        description: `Submission ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({
        title: "Error", 
        description: "Failed to update submission",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const pendingSubmissions = submissions.filter(sub => sub.status === 'pending');
  const reviewedSubmissions = submissions.filter(sub => sub.status !== 'pending');

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading submissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Eye className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage NFT submissions and approvals</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/">Back to Home</a>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingSubmissions.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {submissions.filter(s => s.status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {submissions.filter(s => s.status === 'rejected').length}
                </p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Submissions */}
      {pendingSubmissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-yellow-600 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Pending Review ({pendingSubmissions.length})
          </h2>
          
          <div className="grid gap-6">
            {pendingSubmissions.map((submission) => (
              <Card key={submission.id} className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Image Preview */}
                    <div className="space-y-4">
                      <div className="aspect-square w-full max-w-sm mx-auto bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={submission.image_url} 
                          alt={submission.caption}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLElement).parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"><ImageIcon class="h-12 w-12" /><span class="ml-2">Image not available</span></div>`;
                            }
                          }}
                        />
                      </div>
                      
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>

                    {/* Submission Details */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Submission Details</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Caption</label>
                            <p className="text-sm bg-background p-2 rounded border">{submission.caption}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Artist</label>
                              <p className="text-sm">{submission.author}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Type</label>
                              <p className="text-sm capitalize">{submission.type}</p>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Artist Bio</label>
                            <p className="text-sm bg-background p-2 rounded border">{submission.author_bio}</p>
                          </div>
                          
                          {submission.contact && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Contact</label>
                              <p className="text-sm">{submission.contact}</p>
                            </div>
                          )}
                          
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Tags</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {submission.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Submitted: {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed Submissions */}
      {reviewedSubmissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recently Reviewed</h2>
          
          <div className="grid gap-4">
            {reviewedSubmissions.slice(0, 10).map((submission) => (
              <Card key={submission.id} className="border-muted">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={submission.image_url} 
                        alt={submission.caption}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{submission.author}</p>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{submission.caption}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {submission.status === 'approved' && (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                    {submission.status === 'rejected' && (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {submissions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
            <p className="text-muted-foreground">New submissions will appear here for review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};