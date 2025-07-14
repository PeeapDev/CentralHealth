import { use } from 'react'

// Import the client component directly
import AntenatalClient from './antenatal-client'

// Server Component - Properly separates server and client concerns for Next.js App Router
export default function AntenatalPage({ params }: { params: Promise<{ hospitalName: string }> | { hospitalName: string } }) {
  // Properly unwrap params using React.use as per Next.js recommendation
  const resolvedParams = 'then' in params ? use(params) : params
  const hospitalName = resolvedParams.hospitalName
  
  return (
    <AntenatalClient hospitalName={hospitalName} />
  )
}
