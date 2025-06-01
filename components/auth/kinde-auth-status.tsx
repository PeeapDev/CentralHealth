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

// Patient authentication status component using session-based auth
export function PatientAuthStatus() {
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Fetch patient data from session API
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/patients/session/me');
        
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API endpoint to clear cookies properly
      await fetch('/api/patients/session/logout', {
        method: 'POST',
      });
      
      // Clear any local storage items as backup
      localStorage.removeItem("medicalNumber");
      localStorage.removeItem("patientName");
      localStorage.removeItem("patientInfo");
      localStorage.removeItem("token");
      localStorage.removeItem("isPatientLoggedIn");
      
      // Redirect to root path as per existing system
      window.location.replace('/');
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback redirect
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={patient?.photo || ""} alt={patient?.name || ""} />
            <AvatarFallback>
              {patient?.name
                ? patient.name.charAt(0).toUpperCase()
                : "P"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {patient?.name || "Patient"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {patient?.email || ""}
            </p>
            {patient?.medicalNumber && (
              <p className="text-xs font-semibold text-primary">
                Medical #: {patient.medicalNumber}
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
          className="flex w-full cursor-pointer items-center text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
