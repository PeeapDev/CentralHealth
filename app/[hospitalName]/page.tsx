import { redirect } from 'next/navigation'

export default async function HospitalPage({ params }: { params: { hospitalName: string } }) {
  // Redirect from hospital root to hospital home page for consistent user experience
  redirect(`/${params.hospitalName}/home`)
}
