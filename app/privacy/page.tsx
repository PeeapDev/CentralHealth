"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { ArrowLeft, Shield, Calendar, Lock, Eye, Database } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
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
                <Shield className="w-6 h-6" />
                Privacy Policy
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Last updated: May 24, 2025
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  HIPAA Compliant
                </div>
              </div>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Information We Collect
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    We collect information necessary to provide hospital management services:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Patient medical records and health information</li>
                    <li>Hospital staff and administrator account information</li>
                    <li>Appointment and scheduling data</li>
                    <li>Billing and payment information</li>
                    <li>System usage and performance data</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    How We Use Your Information
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    Your information is used solely for healthcare management purposes:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Providing medical care and treatment coordination</li>
                    <li>Managing hospital operations and scheduling</li>
                    <li>Processing billing and insurance claims</li>
                    <li>Generating medical reports and analytics</li>
                    <li>Ensuring system security and compliance</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Data Security & Protection</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">Encryption</h4>
                      <p className="text-sm text-green-700">
                        All data is encrypted in transit and at rest using industry-standard AES-256 encryption.
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Access Control</h4>
                      <p className="text-sm text-blue-700">
                        Role-based access ensures only authorized personnel can view sensitive information.
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">Audit Logs</h4>
                      <p className="text-sm text-purple-700">
                        Comprehensive logging tracks all system access and data modifications.
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-orange-800 mb-2">Backup & Recovery</h4>
                      <p className="text-sm text-orange-700">
                        Regular backups ensure data availability and disaster recovery capabilities.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">HIPAA Compliance</h3>
                  <p className="text-muted-foreground mb-3">
                    Our system is designed to comply with the Health Insurance Portability and Accountability Act
                    (HIPAA):
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Business Associate Agreements (BAA) are in place with all vendors</li>
                    <li>Minimum necessary standard is applied to all data access</li>
                    <li>Patient rights are protected including access and amendment rights</li>
                    <li>Breach notification procedures are established and tested</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Data Retention</h3>
                  <p className="text-muted-foreground">
                    Medical records are retained according to legal requirements and hospital policies. Typically, adult
                    medical records are kept for 7-10 years, while pediatric records are retained until the patient
                    reaches age of majority plus the retention period.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Your Rights</h3>
                  <p className="text-muted-foreground mb-3">
                    Under HIPAA and other privacy laws, you have the right to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Access your medical records</li>
                    <li>Request amendments to your information</li>
                    <li>Request restrictions on use and disclosure</li>
                    <li>Request confidential communications</li>
                    <li>File a complaint if you believe your privacy rights have been violated</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-muted-foreground mb-2">
                      For privacy-related questions or concerns, contact our Privacy Officer:
                    </p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>Email: privacy@hospitalmgmt.com</li>
                      <li>Phone: +1 (555) 123-4567 ext. 101</li>
                      <li>Address: Privacy Officer, 123 Healthcare Ave, Medical City, MC 12345</li>
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
