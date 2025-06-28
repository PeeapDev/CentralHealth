import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'

// Next.js 15.2.4+ requires careful handling of dynamic params
export default async function HospitalPage({
  params,
}: {
  params: { hospitalName: string }
}) {
  // Properly handle params as an async operation
  const hospitalName = params?.hospitalName;
  
  // Immediately return for special system paths that aren't hospitals
  const systemPaths = ['favicon.ico', 'robots.txt', 'sitemap.xml'];
  if (hospitalName && systemPaths.includes(hospitalName)) {
    // Return 404 for system paths in hospital routes
    notFound();
  }

  // For actual hospital subdomains, redirect to home page
  if (hospitalName) {
    // Use server-safe redirect with absolute paths
    return redirect(`/${hospitalName}/home`);
  }
  
  // Fallback if hospital name is not available
  return redirect('/');
}