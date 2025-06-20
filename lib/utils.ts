import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Convert FHIR patient name format to string
export function patientNameToString(name: any): string {
  if (!name) return 'Unknown Patient'
  
  // If it's already a string, return it
  if (typeof name === 'string') return name
  
  // If it's an array of name objects
  if (Array.isArray(name) && name.length > 0) {
    const primaryName = name[0]
    
    // If there's a text property, use that directly
    if (primaryName.text) return primaryName.text
    
    // Otherwise build from given and family
    let fullName = ''
    
    // Add given names if available
    if (Array.isArray(primaryName.given)) {
      fullName = primaryName.given.join(' ')
    } else if (primaryName.given) {
      fullName = primaryName.given
    }
    
    // Add family name if available
    if (primaryName.family) {
      if (fullName) fullName += ' '
      fullName += primaryName.family
    }
    
    return fullName || 'Unknown Patient'
  }
  
  // Object with single name
  if (name.text) return name.text
  
  // Try to build from given and family
  let fullName = ''
  
  if (Array.isArray(name.given)) {
    fullName = name.given.join(' ')
  } else if (name.given) {
    fullName = name.given
  }
  
  if (name.family) {
    if (fullName) fullName += ' '
    fullName += name.family
  }
  
  return fullName || 'Unknown Patient'
}
