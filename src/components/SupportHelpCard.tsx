import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function SupportHelpCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Need Help & Support</CardTitle>
        <CardDescription>
          Get help from our team and community on Discord or Telegram.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild className="w-full">
          <a href="https://discord.com/invite/HmSJdT5MRX" target="_blank" rel="noreferrer noopener">
            Open Discord
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer noopener">
            Open Telegram
          </a>
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Fastest responses on Discord.
        </p>
      </CardContent>
    </Card>
  );
}