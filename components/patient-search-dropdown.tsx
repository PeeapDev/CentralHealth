"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/lib/hooks/use-debounce"

interface PatientResult {
  id: string
  name: string // Full name
  medicalId?: string
  medicalNumber?: string
  photo?: string
  hospitalId?: string
}

interface PatientSearchDropdownProps {
  hospitalName: string
  onSelectPatient?: (patient: PatientResult) => void
  placeholder?: string
  className?: string
}

export function PatientSearchDropdown({
  hospitalName,
  onSelectPatient,
  placeholder = "Search patients...",
  className = ""
}: PatientSearchDropdownProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PatientResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search patients when query changes
  useEffect(() => {
    const searchPatients = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append("search", debouncedQuery)
        params.append("hospitalId", hospitalName)
        params.append("pageSize", "5") // Limit results for dropdown

        const response = await fetch(`/api/patients/search?${params.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch patients")

        const data = await response.json()
        
        if (data && Array.isArray(data.patients)) {
          setResults(data.patients)
          setShowDropdown(true)
        } else {
          setResults([])
        }
      } catch (error) {
        console.error("Error searching patients:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    searchPatients()
  }, [debouncedQuery, hospitalName])

  // Get patient initials for avatar fallback
  const getPatientInitials = (name: string): string => {
    if (!name) return "?"
    
    const parts = name.split(" ")
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const handleSelectPatient = (patient: PatientResult) => {
    setQuery("")
    setShowDropdown(false)
    
    if (onSelectPatient) {
      onSelectPatient(patient)
    } else {
      // Default action: navigate to patient details
      router.push(`/${hospitalName}/admin/patients/${patient.id}`)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          className="pl-8"
        />
        {loading && (
          <div className="absolute right-2 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <ul className="py-1 max-h-60 overflow-auto">
            {results.map((patient) => (
              <li
                key={patient.id}
                className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center space-x-3"
                onClick={() => handleSelectPatient(patient)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={patient.photo || ""} alt={patient.name} />
                  <AvatarFallback>{getPatientInitials(patient.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{patient.name}</div>
                  {patient.medicalNumber && (
                    <div className="text-xs text-muted-foreground">
                      ID: {patient.medicalNumber}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDropdown && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No patients found
          </div>
        </div>
      )}
    </div>
  )
}
