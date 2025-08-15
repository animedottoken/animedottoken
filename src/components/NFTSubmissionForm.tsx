import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const submissionSchema = z.object({
  image_url: z.string().min(1, "Image is required"),
  caption: z.string().min(10, "Caption must be at least 10 characters").max(200, "Caption must not exceed 200 characters"),
  author: z.string().min(1, "Author name is required").max(50, "Author name must not exceed 50 characters"),
  author_bio: z.string().min(10, "Author bio must be at least 10 characters").max(200, "Author bio must not exceed 200 characters"),
  contact: z.string().optional(),
  tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
  edition_type: z.enum(['standard', 'limited']),
  type: z.enum(['picture', 'video', 'animation', 'music', 'other'])
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

const availableTags = [
  'Digital Art', 'AI Art', 'Meme', 'Pixel Art', 'Others'
];

export const NFTSubmissionForm = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      image_url: '',
      caption: '',
      author: '',
      author_bio: '',
      contact: '',
      tags: [],
      edition_type: 'standard',
      type: 'picture'
    }
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image or video file.",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        form.setValue('image_url', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : selectedTags.length < 3
      ? [...selectedTags, tag]
      : selectedTags;
    
    if (selectedTags.length >= 3 && !selectedTags.includes(tag)) {
      toast({
        title: "Maximum tags reached",
        description: "You can only select up to 3 tags.",
        variant: "destructive"
      });
      return;
    }

    setSelectedTags(newTags);
    form.setValue('tags', newTags);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    form.setValue('tags', newTags);
  };

  const onSubmit = async (data: SubmissionFormData) => {
    try {
      setIsSubmitting(true);

      const response = await supabase.functions.invoke('submit-content', {
        body: data
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Submission successful!",
        description: "Your NFT has been submitted for review. You'll be notified once it's approved.",
      });

      // Reset form
      form.reset();
      setSelectedTags([]);
      setImageFile(null);
      setImagePreview('');

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit Your NFT to $ANIME Gallery
        </CardTitle>
        <CardDescription>
          Share your anime-inspired digital art with the community. All submissions are reviewed before being featured.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NFT Image/Animation/Video *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      {imagePreview ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                          <div className="space-y-4">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="max-h-48 mx-auto rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setImagePreview('');
                                setImageFile(null);
                                form.setValue('image_url', '');
                              }}
                            >
                              Change Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="image-upload"
                          className="block w-full cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 rounded-lg p-8 text-center transition-all duration-200"
                        >
                          <div className="space-y-4">
                            <Upload className="h-12 w-12 mx-auto text-primary animate-pulse" />
                            <div className="space-y-2">
                              <div className="text-primary font-medium text-lg">
                                Click to upload or drag and drop
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Square format (1:1 ratio) recommended
                              </div>
                            </div>
                          </div>
                        </label>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload your NFT in square format for best display. Supports images, animations, and videos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NFT Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NFT Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="picture">🖼️ Picture</SelectItem>
                      <SelectItem value="video">📹 Video</SelectItem>
                      <SelectItem value="animation">🎬 Animation</SelectItem>
                      <SelectItem value="music">🎵 Music</SelectItem>
                      <SelectItem value="other">📋 Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of content you're submitting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Caption */}
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your NFT in 1-2 sentences. What does it represent or what's the story behind it?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/200 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Author Name */}
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist Name/Handle *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your artist name or handle" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be displayed as the creator of the NFT
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Author Bio */}
            <FormField
              control={form.control}
              name="author_bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist Bio *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself in 1-2 sentences. e.g., 'Digital artist blending anime and cyber themes from Berlin.'"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/200 characters - Brief introduction about yourself as an artist
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact (Optional) */}
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Social Contact (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="@yourhandle (Twitter/X) or yourname#1234 (Discord)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Twitter/X handle (with @) or Discord username for community connection. No email or phone numbers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-3">
              <FormLabel>Tags (Select up to 3)</FormLabel>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className="text-xs"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Edition Type */}
            <FormField
              control={form.control}
              name="edition_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edition Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="standard">🔓 Standard - Available to everyone</SelectItem>
                      <SelectItem value="limited">⭐ Limited Edition - Restricted number of copies</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Standard = regular availability. Limited = few copies.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};