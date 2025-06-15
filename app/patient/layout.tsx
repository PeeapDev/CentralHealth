"use client"

export default function PatientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen">
      {/* Simple layout that just renders children */}
      {children}
    </div>
  )
}
