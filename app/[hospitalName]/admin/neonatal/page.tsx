import { NeonatalDashboard } from "@/components/neonatal/neonatal-dashboard"

// Server component wrapper to handle param unwrapping
export default function NeonatalPageWrapper({ params }: { params: { hospitalName: string } }) {
  // Extract hospitalName from params for the client component
  const hospitalName = params.hospitalName;
  return <NeonatalDashboard hospitalName={hospitalName} />;
}
