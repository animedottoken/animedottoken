import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Upload, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image_url: string;
  banner_image_url?: string;
  mint_price: number;
  max_supply: number;
  items_redeemed: number;
  royalty_percentage: number;
  is_active: boolean;
  is_live: boolean;
  creator_address: string;
}

interface CollectionEditorProps {
  collection: Collection;
  onUpdate: (collection: Collection) => void;
}

export const CollectionEditor = ({ collection, onUpdate }: CollectionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(collection);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const { publicKey } = useSolanaWallet();

  const canEdit = collection.items_redeemed === 0 && publicKey === collection.creator_address;

  useEffect(() => {
    setFormData(collection);
  }, [collection]);

  const handleInputChange = (field: keyof Collection, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadImage = async (file: File, type: 'avatar' | 'banner'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${collection.id}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('collection-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('collection-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let imageUrl = formData.image_url;
      let bannerUrl = formData.banner_image_url;

      // Upload new avatar if provided
      if (avatarFile) {
        const uploadedUrl = await uploadImage(avatarFile, 'avatar');
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload avatar image');
          setSaving(false);
          return;
        }
      }

      // Upload new banner if provided
      if (bannerFile) {
        const uploadedUrl = await uploadImage(bannerFile, 'banner');
        if (uploadedUrl) {
          bannerUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload banner image');
          setSaving(false);
          return;
        }
      }

      const updateData = {
        ...formData,
        image_url: imageUrl,
        banner_image_url: bannerUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('collections')
        .update(updateData)
        .eq('id', collection.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update collection');
        return;
      }

      toast.success('Collection updated successfully!');
      onUpdate(updateData as Collection);
      setIsEditing(false);
      setAvatarFile(null);
      setBannerFile(null);
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(collection);
    setAvatarFile(null);
    setBannerFile(null);
    setIsEditing(false);
  };

  const handleFileChange = (file: File | null, type: 'avatar' | 'banner') => {
    if (type === 'avatar') {
      setAvatarFile(file);
    } else {
      setBannerFile(file);
    }
  };

  if (!canEdit && !isEditing) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Collection is locked for editing</p>
              <p className="text-sm text-amber-700">
                {collection.items_redeemed > 0 
                  ? `${collection.items_redeemed} NFTs have been minted. Collections cannot be edited once minting begins.`
                  : 'You can only edit collections you created.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {isEditing ? 'Edit Collection' : 'Collection Settings'}
          </CardTitle>
          {!isEditing && canEdit && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Collection
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <>
            {/* Editable Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Images */}
              <div className="space-y-4">
                {/* Avatar */}
                <div>
                  <Label>Collection Avatar (Square)</Label>
                  <AspectRatio ratio={1}>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden group hover:border-primary/50 transition-colors">
                      {formData.image_url || avatarFile ? (
                        <div className="relative h-full">
                          <img
                            src={avatarFile ? URL.createObjectURL(avatarFile) : formData.image_url}
                            alt="Collection avatar"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer text-white text-sm font-medium">
                              <Upload className="h-4 w-4 mx-auto mb-1" />
                              Change Avatar
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'avatar')}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer h-full flex flex-col items-center justify-center hover:bg-muted/50 transition-colors">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Upload Avatar</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'avatar')}
                          />
                        </label>
                      )}
                    </div>
                  </AspectRatio>
                </div>

                {/* Banner */}
                <div>
                  <Label>Collection Banner (Optional)</Label>
                  <AspectRatio ratio={3}>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden group hover:border-primary/50 transition-colors">
                      {formData.banner_image_url || bannerFile ? (
                        <div className="relative h-full">
                          <img
                            src={bannerFile ? URL.createObjectURL(bannerFile) : formData.banner_image_url}
                            alt="Collection banner"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer text-white text-sm font-medium">
                              <Upload className="h-4 w-4 mx-auto mb-1" />
                              Change Banner
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'banner')}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer h-full flex flex-col items-center justify-center hover:bg-muted/50 transition-colors">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Upload Banner</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'banner')}
                          />
                        </label>
                      )}
                    </div>
                  </AspectRatio>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Collection Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter collection name"
                  />
                </div>

                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                    placeholder="e.g., ANIME"
                    maxLength={10}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your collection..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mint_price">Mint Price (SOL)</Label>
                    <Input
                      id="mint_price"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.mint_price}
                      onChange={(e) => {
                        const value = e.target.value.replace(',', '.');
                        handleInputChange('mint_price', parseFloat(value) || 0);
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_supply">Max Supply</Label>
                    <Input
                      id="max_supply"
                      type="number"
                      min="1"
                      value={formData.max_supply}
                      onChange={(e) => handleInputChange('max_supply', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="royalty">Royalty Percentage</Label>
                  <Input
                    id="royalty"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.royalty_percentage}
                    onChange={(e) => {
                      const value = e.target.value.replace(',', '.');
                      handleInputChange('royalty_percentage', parseFloat(value) || 0);
                    }}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_live"
                    checked={formData.is_live}
                    onCheckedChange={(checked) => handleInputChange('is_live', checked)}
                  />
                  <Label htmlFor="is_live">Collection is live for minting</Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button 
                onClick={handleCancel} 
                variant="outline"
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Read-only View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Collection Avatar</Label>
                  <AspectRatio ratio={1}>
                    <img
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  </AspectRatio>
                </div>
                {collection.banner_image_url && (
                  <div>
                    <Label>Collection Banner</Label>
                    <AspectRatio ratio={3}>
                      <img
                        src={collection.banner_image_url}
                        alt={`${collection.name} banner`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                    </AspectRatio>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Collection Details</Label>
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <span className="font-medium">{collection.name}</span>
                      <Badge variant="outline" className="ml-2">{collection.symbol}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{collection.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <div className="font-medium">{collection.mint_price} SOL</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Supply:</span>
                        <div className="font-medium">{collection.max_supply.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Royalty:</span>
                        <div className="font-medium">{collection.royalty_percentage}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="font-medium">
                          {collection.is_live ? (
                            <Badge className="bg-green-500">Live</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>⚠️ Editable:</strong> You can edit this collection because no NFTs have been minted yet. 
                      Once minting begins, collection settings will be locked permanently.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};