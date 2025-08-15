import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLivePrice } from "@/hooks/useLivePrice";
import { useTokenHolders } from "@/hooks/useTokenHolders";

const TOTAL_SUPPLY = 974338302;
const PAIR_ADDRESS = "H5EYz1skuMdwrddHuCfnvSps1Ns3Lhf7WdTQMfdT8Zwc";
const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";

export function OwnershipCalculator() {
  const [usdAmount, setUsdAmount] = useState(100);
  const { tokenData, loading } = useLivePrice(PAIR_ADDRESS);
  const holders = useTokenHolders(CONTRACT);

  const calculateTokens = () => {
    if (!tokenData?.price || tokenData.price <= 0) return 0;
    return usdAmount / tokenData.price;
  };

  const calculatePercentage = () => {
    const tokens = calculateTokens();
    return (tokens / TOTAL_SUPPLY) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Ownership Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="usd-input">Enter a USD Amount:</Label>
          <Input
            id="usd-input"
            type="number"
            value={usdAmount}
            onChange={(e) => setUsdAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="100"
            min="0"
            step="1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="space-y-2">
            <Label>Live Holder Rank:</Label>
            <div className="p-3 bg-muted rounded-md font-mono text-sm">
              {holders ? (
                `Top ${Math.ceil((calculatePercentage() / 100) * holders)} of ${holders.toLocaleString()}`
              ) : (
                "Loading..."
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}