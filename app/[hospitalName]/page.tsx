import { redirect } from 'next/navigation'

// Next.js 15.2.4+ requires careful handling of dynamic params
export default async function HospitalPage({
  params,
}: {
  params: { hospitalName: string }
}) {
  try {
    // Properly handle params in async component by awaiting them
    const resolvedParams = await Promise.resolve(params);
    const { hospitalName } = resolvedParams;
    
    // Redirect from hospital root to hospital home page
    if (hospitalName) {
      redirect(`/${hospitalName}/home`)
    } else {
      // Fallback if hospital name is not available
      redirect('/')
    }
  } catch (error) {
    console.error('Error resolving hospital parameters:', error);
    redirect('/');
  }
}