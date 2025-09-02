import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { useLivePrice } from "@/hooks/useLivePrice";
import { useTokenHolders } from "@/hooks/useTokenHolders";

const TOTAL_SUPPLY = 974338302;
const PAIR_ADDRESS = "H5EYz1skuMdwrddHuCfnvSps1Ns3Lhf7WdTQMfdT8Zwc";
const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";

export function OwnershipCalculator() {
  const [usdValue, setUsdValue] = useState("100");
  const { tokenData, loading } = useLivePrice(PAIR_ADDRESS);
  const holders = useTokenHolders(CONTRACT);

  const getUsdAmount = () => {
    const num = parseFloat(usdValue);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  const calculateTokens = () => {
    if (!tokenData?.price || tokenData.price <= 0) return 0;
    return getUsdAmount() / tokenData.price;
  };

  const calculatePercentage = () => {
    const tokens = calculateTokens();
    const percentage = (tokens / TOTAL_SUPPLY) * 100;
    return Math.min(100, percentage);
  };

  const handleBlur = () => {
    const num = parseFloat(usdValue);
    if (isNaN(num) || num < 0 || usdValue === "") {
      setUsdValue("0");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-primary" />
          Live Ownership Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="usd-input">Enter a USD Amount:</Label>
          <Input
            id="usd-input"
            type="number"
            inputMode="decimal"
            value={usdValue}
            onChange={(e) => setUsdValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="100"
            min="0"
            step="any"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Your $ANIME Tokens:</Label>
            <div className="p-3 bg-muted rounded-md font-mono text-sm">
              {loading ? (
                "Loading..."
              ) : tokenData?.price ? (
                calculateTokens().toLocaleString('en-US', { maximumFractionDigits: 0 })
              ) : (
                "Price unavailable"
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Your Share of Total Supply:</Label>
            <div className="p-3 bg-muted rounded-md font-mono text-sm">
              {loading ? (
                "Loading..."
              ) : tokenData?.price ? (
                `${calculatePercentage().toFixed(4)}%`
              ) : (
                "Price unavailable"
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-muted-foreground">
          Join over {holders ? holders.toLocaleString('en-US') : "1,200"} holders and become a key stakeholder in our movement. Your contribution, no matter the size, helps us build a new, decentralized economy on Solana.
        </div>
      </CardContent>
    </Card>
  );
}