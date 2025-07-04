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

interface AntenatalDialogProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  initialPatient?: {
    id: string;
    name: string;
    medicalNumber?: string;
    photo?: string;
  };
}

export function NewAntenatalDialog({ open: externalOpen, setOpen: externalSetOpen, initialPatient }: AntenatalDialogProps = {}) {
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

  // Handle redirection to antenatal page for the patient
  const handleOpenAntenatalDashboard = () => {
    if (initialPatient?.id) {
      setLoading(true);
      // Redirect to the antenatal page for this specific patient
      startTransition(() => {
        setIsOpen(false);
        router.push(`/${hospitalName}/admin/patients/${initialPatient.id}/antenatal`);
        setLoading(false);
      });
    } else {
      toast({
        title: "Patient Required",
        description: "A patient must be selected before opening the antenatal dashboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Antenatal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Antenatal Care Dashboard</DialogTitle>
          <DialogDescription>
            View and manage antenatal records for the selected patient
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
            onClick={handleOpenAntenatalDashboard} 
            disabled={!initialPatient?.id || loading}
          >
            {loading ? "Loading..." : "Open Antenatal Dashboard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewAntenatalDialog;
