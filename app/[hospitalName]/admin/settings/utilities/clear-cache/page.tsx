"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ClearCachePage() {
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [results, setResults] = useState<{
    localStorage: { cleared: boolean, items: string[] },
    cookies: { cleared: boolean, items: string[] },
    nextCache: { cleared: boolean }
  }>({
    localStorage: { cleared: false, items: [] },
    cookies: { cleared: false, items: [] },
    nextCache: { cleared: false }
  });

  // Function to clear localStorage
  const clearLocalStorage = () => {
    const problematicItems: string[] = [];
    
    // Check all localStorage items for problematic values
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value && (
            value.includes('MOHAM') || 
            value.includes('9K3F4') ||
            value.includes('patient') || 
            value.includes('medical') || 
            key.includes('patient') || 
            key.includes('medical')
          )) {
            problematicItems.push(key);
            localStorage.removeItem(key);
          }
        } catch (e) {
          console.error("Error reading localStorage item:", e);
        }
      }
    }

    // Update state with results
    setResults(prev => ({
      ...prev,
      localStorage: {
        cleared: true,
        items: problematicItems
      }
    }));

    return problematicItems;
  };

  // Function to clear cookies
  const clearCookies = () => {
    const cookieItems: string[] = [];
    const cookies = document.cookie.split(";");

    cookies.forEach(cookie => {
      const parts = cookie.split("=");
      const name = parts[0].trim();
      
      if (name.includes('patient') || name.includes('session') || name.includes('token')) {
        cookieItems.push(name);
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });

    // Update state with results
    setResults(prev => ({
      ...prev,
      cookies: {
        cleared: true,
        items: cookieItems
      }
    }));

    return cookieItems;
  };

  // Function to clear Next.js cache via API endpoint
  const clearNextCache = async () => {
    try {
      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResults(prev => ({
          ...prev,
          nextCache: { cleared: true }
        }));
        return true;
      } else {
        console.error('Failed to clear server cache:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error clearing server cache:', error);
      return false;
    }
  };

  // Main function to clear all caches
  const handleClearAll = async () => {
    setIsClearing(true);
    
    try {
      // Clear browser storage
      const localStorageItems = clearLocalStorage();
      
      // Clear cookies
      const cookieItems = clearCookies();
      
      // Try to clear server cache (might not work if API not implemented)
      const nextCacheCleared = await clearNextCache().catch(() => false);
      
      // Show success toast
      toast({
        title: "Cache Cleared Successfully",
        description: 
          `Removed ${localStorageItems.length} localStorage items and ${cookieItems.length} cookies. ${
            nextCacheCleared ? "Server cache was also cleared." : ""
          }`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error clearing cache:', error);
      
      toast({
        title: "Cache Clearing Error",
        description: "An error occurred while clearing the cache. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Cache Management</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Clear Application Cache
              <Badge variant="outline" className="ml-2">Administrator Only</Badge>
            </CardTitle>
            <CardDescription>
              Remove all cached patient data, sessions, and authentication tokens from the browser.
              This helps resolve issues with incorrect medical IDs or session persistence problems.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Important Notes</h3>
                    <ul className="text-sm text-amber-700 mt-1 space-y-1 list-disc pl-4">
                      <li>This will log you out from the current session</li>
                      <li>All locally stored patient preferences will be reset</li>
                      <li>You will need to log in again after clearing the cache</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>

              {results.localStorage.cleared && (
                <div className="bg-gray-50 p-4 rounded-md border">
                  <h3 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Local Storage Cleared
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {results.localStorage.items.length > 0 ? (
                      <>Removed {results.localStorage.items.length} items.</>
                    ) : (
                      <>No problematic items found.</>
                    )}
                  </p>
                </div>
              )}

              {results.cookies.cleared && (
                <div className="bg-gray-50 p-4 rounded-md border">
                  <h3 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Cookies Cleared
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {results.cookies.items.length > 0 ? (
                      <>Removed {results.cookies.items.length} cookies.</>
                    ) : (
                      <>No session cookies found.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="destructive"
              onClick={handleClearAll}
              disabled={isClearing}
              className="flex items-center gap-2"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Clear All Cache
                </>
              )}
            </Button>
            
            {(results.localStorage.cleared || results.cookies.cleared) && (
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Reload Application
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
