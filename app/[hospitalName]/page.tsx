import { redirect } from 'next/navigation'

export default async function HospitalPage({ params }: { params: { hospitalName: string | Promise<string> } }) {
  // Redirect from hospital root to hospital home page for consistent user experience
  // In Next.js 14+, dynamic route params must be awaited
  const hospitalName = await params.hospitalName;
  
  if (hospitalName) {
    redirect(`/${hospitalName}/home`)
  } else {
    // Fallback if hospital name is not available
    redirect('/') 
  }
}
