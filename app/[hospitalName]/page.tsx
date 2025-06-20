import { redirect } from 'next/navigation'

// For Next.js 15.2.4, use an async component to properly handle dynamic params
export default async function HospitalPage({
  params,
}: {
  params: { hospitalName: string }
}) {
  // In Next.js 15.2.4, dynamic params must be properly awaited
  const hospitalName = await Promise.resolve(params.hospitalName)
  
  // Redirect from hospital root to hospital home page
  if (hospitalName) {
    redirect(`/${hospitalName}/home`)
  } else {
    // Fallback if hospital name is not available
    redirect('/')
  }
}