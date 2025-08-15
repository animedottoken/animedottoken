import React, { useState, useEffect } from 'react';
import { AdminPanel } from './AdminPanel';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff } from "lucide-react";

export const ProtectedAdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Check if already authenticated (session storage)
  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple password check - you can make this more secure
    if (password === 'anime2025') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setError('');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPassword('');
    // Go directly back to home page
    window.location.href = '/';
  };

  if (isAuthenticated) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <Button onClick={handleLogout} variant="outline" size="sm">
            ← Back to Home
          </Button>
        </div>
        <AdminPanel />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Admin Access</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter password to access admin panel
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full">
              Access Admin Panel
            </Button>
            
            <div className="text-center">
              <Button asChild variant="link" size="sm">
                <a href="/">Back to Home</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};