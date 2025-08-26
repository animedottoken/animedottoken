import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportTradingDataButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const ExportTradingDataButton = ({ 
  variant = "outline", 
  size = "default" 
}: ExportTradingDataButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { publicKey, connected, connect, connecting } = useSolanaWallet();

  const handleExport = async (format: 'json' | 'csv') => {
    if (!connected || !publicKey) {
      await connect();
      return;
    }

    setIsExporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('export-trading-data', {
        body: {
          wallet_address: publicKey,
          format: format
        }
      });

      if (error) {
        throw error;
      }

      // Create and download the file
      const filename = `trading-data-${publicKey.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.${format}`;
      const content = format === 'json' ? JSON.stringify(data, null, 2) : data;
      const mimeType = format === 'json' ? 'application/json' : 'text/csv';
      
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Your trading data has been downloaded as ${filename}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export trading data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button 
          variant={variant} 
          size={size}
          disabled={connecting}
          onClick={() => connect()}
          className="text-foreground"
        >
          <Download className="w-4 h-4 mr-2" />
          {connecting ? 'Connecting...' : 'Connect to Export'}
        </Button>
        {!connecting && (
          <button 
            onClick={() => connect()}
            className="text-xs text-primary hover:text-primary/80 underline"
          >
            Connect now
          </button>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Data'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleExport('json')}
          disabled={isExporting}
        >
          <Database className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};