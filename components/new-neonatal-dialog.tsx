"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface NeonatalDialogProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  initialPatient?: {
    id: string;
    name: string;
    medicalNumber?: string;
    photo?: string;
  };
}

export function NewNeonatalDialog({ open: externalOpen, setOpen: externalSetOpen, initialPatient }: NeonatalDialogProps = {}) {
  // Use internal state if external state is not provided
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname() || '';
  
  // Extract hospital name from pathname
  const pathParts = pathname.split('/');
  const hospitalName = pathParts[1] || ''; // Assuming format /{hospitalName}/...
  
  // Determine if we should use external or internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalSetOpen || setInternalOpen;

  // Handle redirection to neonatal page for the patient
  const handleOpenNeonatalDashboard = () => {
    if (initialPatient?.id) {
      setLoading(true);
      // Redirect to the neonatal page for this specific patient
      startTransition(() => {
        setIsOpen(false);
        router.push(`/${hospitalName}/admin/patients/${initialPatient.id}/neonatal`);
        setLoading(false);
      });
    } else {
      toast({
        title: "Patient Required",
        description: "A patient must be selected before opening the neonatal dashboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Neonatal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Neonatal Care Dashboard</DialogTitle>
          <DialogDescription>
            View and manage neonatal records for the selected patient
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="font-medium">{initialPatient?.name || 'No patient selected'}</div>
              <div className="text-sm text-muted-foreground">
                {initialPatient?.medicalNumber ? `Medical ID: ${initialPatient.medicalNumber}` : 'Please select a patient'}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleOpenNeonatalDashboard} 
            disabled={!initialPatient?.id || loading}
          >
            {loading ? "Loading..." : "Open Neonatal Dashboard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewNeonatalDialog;
