// Import the client component directly
import AntenatalClient from './antenatal-client'

// Server Component - Properly separates server and client concerns for Next.js App Router
export default async function AntenatalPage({ params }: { params: { hospitalName: string } }) {
  // Make the component async to fix params usage warning
  const hospitalName = params.hospitalName
  
  return (
    <AntenatalClient hospitalName={hospitalName} />
  )
}
