"use client"

import { PatientFormData } from "../multi-step-form"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  CreditCard, 
  Banknote, 
  Building, 
  ShieldCheck, 
  AlertTriangle
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Payment providers in Sierra Leone
const INSURANCE_PROVIDERS = [
  "National Health Insurance Scheme (NHIS)",
  "Sierra Leone Health Insurance (SLHI)",
  "NASSIT Health Insurance",
  "BlueCross Sierra Leone",
  "MedGuard Insurance",
  "Other"
]

interface PaymentMethodStepProps {
  formData: PatientFormData
  updateFormData: (data: Partial<PatientFormData>) => void
}

export function PaymentMethodStep({ formData, updateFormData }: PaymentMethodStepProps) {
  return (
    <div className="space-y-6">
      <Alert variant="default">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Payment Information</AlertTitle>
        <AlertDescription>
          This information is optional but helps hospitals prepare billing and insurance verification in advance.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <Label>Preferred Payment Method</Label>
        <RadioGroup
          value={formData.paymentMethod || ""}
          onValueChange={(value) => updateFormData({ paymentMethod: value })}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
        >
          <Card className={`cursor-pointer ${formData.paymentMethod === "cash" ? "border-primary" : ""}`}>
            <CardHeader className="flex flex-row items-start space-x-2 pb-2">
              <RadioGroupItem value="cash" id="cash" className="mt-1" />
              <div className="flex flex-col space-y-0.5">
                <Label htmlFor="cash" className="font-medium cursor-pointer">Cash Payment</Label>
                <p className="text-sm text-muted-foreground">Pay directly at the hospital</p>
              </div>
              <Banknote className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-2 pt-0">
              <p className="text-xs text-muted-foreground">
                Standard cash payment at the facility for each visit and service. Most common in Sierra Leone.
              </p>
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer ${formData.paymentMethod === "mobile" ? "border-primary" : ""}`}>
            <CardHeader className="flex flex-row items-start space-x-2 pb-2">
              <RadioGroupItem value="mobile" id="mobile" className="mt-1" />
              <div className="flex flex-col space-y-0.5">
                <Label htmlFor="mobile" className="font-medium cursor-pointer">Mobile Money</Label>
                <p className="text-sm text-muted-foreground">Orange Money, Africell Money</p>
              </div>
              <CreditCard className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-2 pt-0">
              <p className="text-xs text-muted-foreground">
                Pay using mobile money services widely available throughout Sierra Leone.
              </p>
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer ${formData.paymentMethod === "bank" ? "border-primary" : ""}`}>
            <CardHeader className="flex flex-row items-start space-x-2 pb-2">
              <RadioGroupItem value="bank" id="bank" className="mt-1" />
              <div className="flex flex-col space-y-0.5">
                <Label htmlFor="bank" className="font-medium cursor-pointer">Bank Transfer</Label>
                <p className="text-sm text-muted-foreground">Direct bank payment</p>
              </div>
              <Building className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-2 pt-0">
              <p className="text-xs text-muted-foreground">
                Transfer payment directly to the hospital's bank account before or after service.
              </p>
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer ${formData.paymentMethod === "insurance" ? "border-primary" : ""}`}>
            <CardHeader className="flex flex-row items-start space-x-2 pb-2">
              <RadioGroupItem value="insurance" id="insurance" className="mt-1" />
              <div className="flex flex-col space-y-0.5">
                <Label htmlFor="insurance" className="font-medium cursor-pointer">Health Insurance</Label>
                <p className="text-sm text-muted-foreground">Coverage through insurance</p>
              </div>
              <ShieldCheck className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-2 pt-0">
              <p className="text-xs text-muted-foreground">
                Payment through health insurance provider. You'll need to provide insurance details.
              </p>
            </CardContent>
          </Card>
        </RadioGroup>
      </div>
      
      {/* Show insurance details only if insurance is selected */}
      {formData.paymentMethod === "insurance" && (
        <div className="space-y-4 border rounded-md p-4 animate-in fade-in-50 duration-300">
          <div className="space-y-2">
            <Label htmlFor="insuranceProvider">Insurance Provider</Label>
            <select
              id="insuranceProvider"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.insuranceProvider || ""}
              onChange={(e) => updateFormData({ insuranceProvider: e.target.value })}
            >
              <option value="">Select insurance provider</option>
              {INSURANCE_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="insuranceNumber">Insurance/Policy Number</Label>
            <Input
              id="insuranceNumber"
              placeholder="Enter your insurance or policy number"
              value={formData.insuranceNumber || ""}
              onChange={(e) => updateFormData({ insuranceNumber: e.target.value })}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Please bring your insurance card to your first hospital visit. The hospital will verify your coverage.
          </p>
        </div>
      )}
      
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Important Payment Information for Sierra Leone</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
            <li>Most healthcare facilities in Sierra Leone require upfront payment for services.</li>
            <li>National Health Insurance Scheme (NHIS) may cover basic services at public hospitals.</li>
            <li>Private insurance options are available but with limited coverage areas.</li>
            <li>Mobile money (Orange Money, Africell Money) is widely accepted in urban areas.</li>
            <li>Some hospitals offer payment plans for expensive procedures.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
