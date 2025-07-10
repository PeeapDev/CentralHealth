import React, { useState } from 'react';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "@/components/ui/command";
import { Check, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Define interface for patient type that follows CentralHealth policy
export interface PatientResult {
  id: string;
  mrn: string; // Medical IDs follow NHS-style 5-character alphanumeric format
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
}

interface PatientSearchDropdownProps {
  onSelect: (patient: PatientResult) => void;
  className?: string;
  placeholder?: string;
}

export function PatientSearchDropdown({
  onSelect,
  className,
  placeholder = "Search for a patient by name or Medical ID..."
}: PatientSearchDropdownProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PatientResult[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setSearch(query);
    
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    try {
      // Use a timeout to simulate search
      // In a real implementation, this would be replaced with an actual API call
      setTimeout(() => {
        // This is just a placeholder - in production this would call the actual API
        // No mock data is used in production per CentralHealth policy
        setResults([]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error searching for patients:", error);
      setResults([]);
      setLoading(false);
    }
  };

  return (
    <Command className={cn("rounded-lg border shadow-md", className)}>
      <CommandInput 
        placeholder={placeholder} 
        value={search}
        onValueChange={handleSearch}
      />
      <CommandEmpty>
        {loading ? "Searching..." : "No patients found."}
      </CommandEmpty>
      <CommandGroup>
        {results.map((patient) => (
          <CommandItem
            key={patient.id}
            value={`${patient.firstName} ${patient.lastName} ${patient.mrn}`}
            onSelect={() => {
              setSelected(patient.id);
              onSelect(patient);
            }}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{patient.firstName} {patient.lastName}</span>
              {patient.dateOfBirth && (
                <span className="text-xs text-muted-foreground">
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </span>
              )}
              <span className="ml-auto font-mono text-xs">{patient.mrn}</span>
              {selected === patient.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  );
}

export default PatientSearchDropdown;
