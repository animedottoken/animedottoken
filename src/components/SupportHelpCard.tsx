import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function SupportHelpCard() {
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center pb-3 px-4 pt-4">
        <div className="flex justify-center mb-1">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-base">Need Help & Support</CardTitle>
        <CardDescription className="text-xs">
          Get help from our team and community on Discord.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <Button asChild className="w-full" size="sm">
          <a href="https://discord.gg/jqxCbvZvn7" target="_blank" rel="noreferrer noopener">
            Open Discord
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}