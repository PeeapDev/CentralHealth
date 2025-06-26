import { redirect } from 'next/navigation'

// Next.js 15.2.4+ requires careful handling of dynamic params
export default async function HospitalPage({
  params,
}: {
  params: { hospitalName: string }
}) {
  // Don't use Promise.resolve on params - this causes the error
  // Instead directly use the params in the async component
  const { hospitalName } = params;
  
  // Redirect from hospital root to hospital home page
  if (hospitalName) {
    redirect(`/${hospitalName}/home`)
  } else {
    // Fallback if hospital name is not available
    redirect('/')
  }
}