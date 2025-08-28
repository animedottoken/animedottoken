import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function SupportHelpCard() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Need Help & Support</CardTitle>
        <CardDescription className="text-sm">
          Get help from our team and community on Discord.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button asChild className="w-full">
          <a href="https://discord.com/invite/HmSJdT5MRX" target="_blank" rel="noreferrer noopener">
            Open Discord
          </a>
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Fastest responses on Discord.
        </p>
      </CardContent>
    </Card>
  );
}