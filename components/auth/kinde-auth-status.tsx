"use client";

import { 
  LogoutLink, 
  useKindeAuth 
} from "@kinde-oss/kinde-auth-nextjs";
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

export function KindeAuthStatus() {
  const { user, isAuthenticated, isLoading } = useKindeAuth();

  const handleLogout = () => {
    // Clear localStorage and cookies for compatibility with both auth systems
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.picture || ""} alt={user?.given_name || ""} />
            <AvatarFallback>
              {user?.given_name
                ? user.given_name.charAt(0)
                : "P"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.given_name} {user?.family_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {user?.id && (
              <p className="text-xs font-semibold text-primary">
                ID: {user.id.substring(0, 8)}...
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
        <DropdownMenuItem asChild>
          <LogoutLink className="flex w-full cursor-pointer items-center text-red-600 focus:text-red-600" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
