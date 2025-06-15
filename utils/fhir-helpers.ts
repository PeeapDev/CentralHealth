// Helper function to get initials from FHIR name object
export function getInitialsFromFhirName(nameObj: any): string {
  try {
    if (!nameObj) return "?";
    const nameData = typeof nameObj === 'string' ? JSON.parse(nameObj) : nameObj;
    let initials = '';
    if (nameData.given && nameData.given.length > 0) {
      initials += nameData.given[0][0];
    }
    if (nameData.family) {
      initials += nameData.family[0];
    }
    return initials.toUpperCase();
  } catch (e) {
    console.error("Error parsing name:", e);
    return "?";
  }
}

// Helper function to format name from FHIR structure
export function formatFhirName(nameObj: any): string {
  try {
    if (!nameObj) return "Unknown";
    const nameData = typeof nameObj === 'string' ? JSON.parse(nameObj) : nameObj;
    if (nameData.text) return nameData.text;
    let name = '';
    if (nameData.prefix && nameData.prefix.length > 0) {
      name += nameData.prefix[0] + ' ';
    }
    if (nameData.given && nameData.given.length > 0) {
      name += nameData.given.join(' ') + ' ';
    }
    if (nameData.family) {
      name += nameData.family;
    }
    return name.trim() || "Unknown";
  } catch (e) {
    console.error("Error formatting name:", e);
    return "Unknown";
  }
}
