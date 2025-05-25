"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { ArrowLeft, FileText, Calendar, Shield } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumbs */}
        <BreadcrumbNav className="mb-6" />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="w-6 h-6" />
                Terms of Service
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Last updated: May 24, 2025
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Version 1.0
                </div>
              </div>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h3>
                  <p className="text-muted-foreground">
                    By accessing and using the Hospital Management System ("Service"), you accept and agree to be bound
                    by the terms and provision of this agreement.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">2. Use License</h3>
                  <p className="text-muted-foreground mb-3">
                    Permission is granted to temporarily download one copy of the Hospital Management System per
                    hospital for personal, non-commercial transitory viewing only.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>This is the grant of a license, not a transfer of title</li>
                    <li>Under this license you may not modify or copy the materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained in the Service</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">3. Data Protection & Privacy</h3>
                  <p className="text-muted-foreground mb-3">
                    We are committed to protecting patient data and hospital information in accordance with healthcare
                    regulations:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>All patient data is encrypted and stored securely</li>
                    <li>Access controls ensure only authorized personnel can view sensitive information</li>
                    <li>Regular security audits and compliance checks are performed</li>
                    <li>Data backup and disaster recovery procedures are in place</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">4. User Responsibilities</h3>
                  <p className="text-muted-foreground mb-3">Hospital administrators and users are responsible for:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Maintaining the confidentiality of login credentials</li>
                    <li>Ensuring accurate data entry and record keeping</li>
                    <li>Following hospital policies and procedures</li>
                    <li>Reporting any security incidents or data breaches</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">5. Service Availability</h3>
                  <p className="text-muted-foreground">
                    We strive to maintain 99.9% uptime for our services. Scheduled maintenance will be announced in
                    advance. Emergency maintenance may occur without prior notice to ensure system security and
                    stability.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">6. Limitation of Liability</h3>
                  <p className="text-muted-foreground">
                    In no event shall the Hospital Management System or its suppliers be liable for any damages
                    (including, without limitation, damages for loss of data or profit, or due to business interruption)
                    arising out of the use or inability to use the Service.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">7. Contact Information</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-muted-foreground mb-2">
                      If you have any questions about these Terms of Service, please contact us:
                    </p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>Email: legal@hospitalmgmt.com</li>
                      <li>Phone: +1 (555) 123-4567</li>
                      <li>Address: 123 Healthcare Ave, Medical City, MC 12345</li>
                    </ul>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
