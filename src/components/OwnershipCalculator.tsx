import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calculator } from "lucide-react";
import { useLivePrice } from "@/hooks/useLivePrice";
import { useTokenHolders } from "@/hooks/useTokenHolders";
import { TOTAL_SUPPLY } from "@/constants/supply";
const PAIR_ADDRESS = "H5EYz1skuMdwrddHuCfnvSps1Ns3Lhf7WdTQMfdT8Zwc";
const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";

export function OwnershipCalculator() {
  const [usdValue, setUsdValue] = useState("100");
  const [wasClamped, setWasClamped] = useState(false);
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

  const getMaxUsd = () => {
    if (!tokenData?.price || tokenData.price <= 0) return null;
    return tokenData.price * TOTAL_SUPPLY;
  };

  const isAtMax = () => {
    const maxUsd = getMaxUsd();
    return maxUsd && getUsdAmount() >= maxUsd;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maxUsd = getMaxUsd();
    
    if (maxUsd && value && parseFloat(value) > maxUsd) {
      setUsdValue(String(maxUsd));
      setWasClamped(true);
    } else {
      setUsdValue(value);
      setWasClamped(false);
    }
  };

  const handleBlur = () => {
    const num = parseFloat(usdValue);
    const maxUsd = getMaxUsd();
    
    if (isNaN(num) || num < 0 || usdValue === "") {
      setUsdValue("0");
      setWasClamped(false);
    } else if (maxUsd && num > maxUsd) {
      setUsdValue(String(maxUsd));
      setWasClamped(true);
    }
  };

  const handleMaxClick = () => {
    const maxUsd = getMaxUsd();
    if (maxUsd) {
      setUsdValue(String(maxUsd));
      setWasClamped(true);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(value);
  };

  // Re-clamp when price changes
  useEffect(() => {
    const maxUsd = getMaxUsd();
    if (maxUsd && getUsdAmount() > maxUsd) {
      setUsdValue(String(maxUsd));
      setWasClamped(true);
    }
  }, [tokenData?.price]);

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
          <div className="flex gap-2">
            <Input
              id="usd-input"
              type="number"
              inputMode="decimal"
              value={usdValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="100"
              min="0"
              step="any"
              className={wasClamped || isAtMax() ? "border-destructive focus:border-destructive" : ""}
              aria-invalid={wasClamped || isAtMax()}
              aria-describedby="usd-helper"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleMaxClick}
              disabled={!getMaxUsd()}
              className="px-3 whitespace-nowrap"
            >
              MAX
            </Button>
          </div>
          <div id="usd-helper" className="text-sm text-muted-foreground">
            {loading ? (
              "Loading price..."
            ) : !tokenData?.price ? (
              "Price unavailable"
            ) : wasClamped || isAtMax() ? (
              `Capped at maximum: ${formatCurrency(getMaxUsd()!)} to own 100% of supply (${formatNumber(TOTAL_SUPPLY)} $ANIME)`
            ) : (
              `Maximum you can invest at current price: ${formatCurrency(getMaxUsd()!)} (100% of supply)`
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Your $ANIME Tokens:</Label>
            <div className={`p-3 bg-muted rounded-md font-mono text-sm ${(wasClamped || isAtMax()) && tokenData?.price ? "text-destructive" : ""}`}>
              {loading ? (
                "Loading..."
              ) : tokenData?.price ? (
                formatNumber(calculateTokens())
              ) : (
                "Price unavailable"
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Your Share of Supply:</Label>
            <div className={`p-3 bg-muted rounded-md font-mono text-sm ${(wasClamped || isAtMax()) && tokenData?.price ? "text-destructive" : ""}`}>
              {loading ? (
                "Loading..."
              ) : tokenData?.price ? (
                `${calculatePercentage().toFixed(4)}%${isAtMax() ? " (max)" : ""}`
              ) : (
                "Price unavailable"
              )}
            </div>
          </div>
        </div>

        {tokenData?.price && (
          <div className="space-y-2">
            <Label>Share Progress:</Label>
            <Progress 
              value={calculatePercentage()} 
              className="h-3"
              title={`${calculatePercentage().toFixed(4)}% of total supply`}
            />
            <div className="text-xs text-muted-foreground text-center">
              {calculatePercentage().toFixed(2)}% of {formatNumber(TOTAL_SUPPLY)} total tokens
            </div>
          </div>
        )}

        <div className="text-center text-muted-foreground">
          Join over {holders ? holders.toLocaleString('en-US') : "1,200"} holders and become a key stakeholder in our movement. Your contribution, no matter the size, helps us build a new, decentralized economy on Solana.
        </div>
      </CardContent>
    </Card>
  );
}