import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComingSoonFeatureProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const ComingSoonFeature = ({ title, description, children }: ComingSoonFeatureProps) => {
  return (
    <div className="relative">
      {/* Greyed out content */}
      <div className="opacity-40 pointer-events-none grayscale">
        {children}
      </div>
      
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <Card className="mx-4 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Clock className="h-5 w-5 text-primary mr-2" />
              <Badge variant="outline" className="border-primary text-primary">
                Coming Soon
              </Badge>
            </div>
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{description}</p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://animedottoken.com', '_blank')}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Visit Live Site
              </Button>
              <p className="text-xs text-muted-foreground">
                Follow our channels for updates!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};