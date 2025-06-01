"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserAuthStatus() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication status from session
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        // First try to get user data from localStorage (for session compatibility)
        const userRole = localStorage.getItem("user_role");
        const userEmail = localStorage.getItem("user_email");
        const token = localStorage.getItem("token") || document.cookie.includes("token=");
        
        if (userRole && userEmail && token) {
          setUserData({
            name: userEmail.split('@')[0],
            email: userEmail,
            role: userRole
          });
          setIsAuthenticated(true);
        } else {
          // If not in localStorage, try to fetch from session API
          const response = await fetch('/api/auth/session');
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.user) {
              setUserData(data.user);
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
            }
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("medicalNumber");
      localStorage.removeItem("patientName");
      localStorage.removeItem("token");
      localStorage.removeItem("isPatientLoggedIn");
      localStorage.removeItem("patientInfo");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_email");
      
      // Delete cookies
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "hospitalToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Call logout API
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Redirect to root path as per existing system
      window.location.replace('/');
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback redirect even if API fails
      window.location.replace('/');
    }
  };

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <Button size="sm" variant="ghost" asChild>
        <a href="/">Sign In</a>
      </Button>
    );
  }

  const initials = userData?.name 
    ? userData.name.split(' ').map((n: string) => n.charAt(0).toUpperCase()).join('')
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.photo || ""} alt={userData?.name || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userData?.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData?.email || ""}
            </p>
            {userData?.role && (
              <p className="text-xs font-semibold text-primary">
                Role: {userData.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/patient/dashboard" className="flex w-full cursor-pointer items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
