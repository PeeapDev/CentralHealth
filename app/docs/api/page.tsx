"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Copy, ExternalLink, Play } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function ApiDocsPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const endpoints = [
    {
      category: "Authentication",
      items: [
        {
          method: "POST",
          path: "/api/v1/auth/login",
          description: "Authenticate user and get JWT token",
          body: {
            hospitalSlug: "smart-hospital",
            email: "admin@smarthospital.com",
            password: "admin123",
          },
          response: {
            success: true,
            data: {
              token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              user: {
                id: "user_id",
                firstName: "John",
                lastName: "Smith",
                email: "admin@smarthospital.com",
                role: "admin",
                hospital: {
                  id: "hospital_id",
                  name: "Smart Hospital",
                  slug: "smart-hospital",
                },
              },
            },
          },
        },
        {
          method: "GET",
          path: "/api/v1/auth/me",
          description: "Get current authenticated user information",
          headers: ["Authorization: Bearer {token}"],
          response: {
            success: true,
            data: {
              id: "user_id",
              firstName: "John",
              lastName: "Smith",
              email: "admin@smarthospital.com",
              role: "admin",
              hospital: {
                id: "hospital_id",
                name: "Smart Hospital",
                slug: "smart-hospital",
              },
            },
          },
        },
      ],
    },
    {
      category: "Patients",
      items: [
        {
          method: "GET",
          path: "/api/v1/patients",
          description: "Get list of patients with pagination and search",
          params: "?page=1&limit=20&search=john&status=active",
          headers: ["Authorization: Bearer {token}"],
          response: {
            success: true,
            data: {
              patients: [
                {
                  id: "P001",
                  patientId: "PAT001",
                  firstName: "John",
                  lastName: "Doe",
                  email: "john.doe@example.com",
                  phone: "+1234567890",
                  dateOfBirth: "1990-01-01",
                  gender: "male",
                  bloodGroup: "O+",
                  status: "active",
                  lastVisit: "2024-05-20T10:00:00Z",
                },
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 50,
                pages: 3,
              },
            },
          },
        },
        {
          method: "POST",
          path: "/api/v1/patients",
          description: "Create a new patient record",
          headers: ["Authorization: Bearer {token}"],
          body: {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            phone: "+1234567891",
            dateOfBirth: "1985-03-15",
            gender: "female",
            bloodGroup: "A+",
            address: {
              street: "123 Main St",
              city: "New York",
              state: "NY",
              zipCode: "10001",
            },
          },
          response: {
            success: true,
            data: {
              id: "P002",
              patientId: "PAT002",
              firstName: "Jane",
              lastName: "Smith",
              status: "active",
              createdAt: "2024-05-24T10:00:00Z",
            },
          },
        },
      ],
    },
    {
      category: "Appointments",
      items: [
        {
          method: "GET",
          path: "/api/v1/appointments",
          description: "Get list of appointments with filters",
          params: "?date=2024-05-24&doctorId=D001&status=scheduled",
          headers: ["Authorization: Bearer {token}"],
          response: {
            success: true,
            data: {
              appointments: [
                {
                  id: "A001",
                  patient: {
                    id: "P001",
                    name: "John Doe",
                    patientId: "PAT001",
                  },
                  doctor: {
                    id: "D001",
                    name: "Dr. Smith",
                    specialization: "Cardiology",
                  },
                  appointmentDate: "2024-05-24T10:00:00Z",
                  duration: 30,
                  status: "scheduled",
                  reason: "Regular checkup",
                  fees: {
                    consultation: 100,
                    total: 100,
                  },
                },
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 25,
                pages: 2,
              },
            },
          },
        },
        {
          method: "POST",
          path: "/api/v1/appointments",
          description: "Create a new appointment",
          headers: ["Authorization: Bearer {token}"],
          body: {
            patientId: "P001",
            doctorId: "D001",
            appointmentDate: "2024-05-25T10:00:00Z",
            duration: 30,
            reason: "Regular checkup",
            type: "consultation",
          },
          response: {
            success: true,
            data: {
              id: "A002",
              patientId: "P001",
              doctorId: "D001",
              appointmentDate: "2024-05-25T10:00:00Z",
              status: "scheduled",
              createdAt: "2024-05-24T10:00:00Z",
            },
          },
        },
      ],
    },
    {
      category: "Medical Records",
      items: [
        {
          method: "GET",
          path: "/api/v1/medical-records",
          description: "Get medical records for a patient",
          params: "?patientId=P001&type=consultation",
          headers: ["Authorization: Bearer {token}"],
          response: {
            success: true,
            data: {
              records: [
                {
                  id: "MR001",
                  patientId: "P001",
                  doctorId: "D001",
                  appointmentId: "A001",
                  recordType: "consultation",
                  date: "2024-05-20T10:00:00Z",
                  diagnosis: ["Hypertension", "Diabetes Type 2"],
                  prescription: [
                    {
                      medication: "Metformin",
                      dosage: "500mg",
                      frequency: "Twice daily",
                      duration: "30 days",
                    },
                  ],
                  vitals: {
                    temperature: 98.6,
                    bloodPressure: "120/80",
                    heartRate: 72,
                    weight: 70,
                  },
                  notes: "Patient is responding well to treatment",
                },
              ],
            },
          },
        },
        {
          method: "POST",
          path: "/api/v1/medical-records",
          description: "Create a new medical record",
          headers: ["Authorization: Bearer {token}"],
          body: {
            patientId: "P001",
            appointmentId: "A001",
            recordType: "consultation",
            diagnosis: ["Common Cold"],
            prescription: [
              {
                medication: "Paracetamol",
                dosage: "500mg",
                frequency: "Three times daily",
                duration: "5 days",
              },
            ],
            vitals: {
              temperature: 99.2,
              bloodPressure: "118/75",
              heartRate: 78,
            },
            notes: "Patient has mild fever and cough",
          },
          response: {
            success: true,
            data: {
              id: "MR002",
              patientId: "P001",
              recordType: "consultation",
              createdAt: "2024-05-24T10:00:00Z",
            },
          },
        },
      ],
    },
    {
      category: "Billing",
      items: [
        {
          method: "GET",
          path: "/api/v1/billing",
          description: "Get billing invoices with filters",
          params: "?patientId=P001&status=pending&startDate=2024-05-01",
          headers: ["Authorization: Bearer {token}"],
          response: {
            success: true,
            data: {
              invoices: [
                {
                  id: "INV001",
                  invoiceNumber: "INV-2024-001",
                  patientId: "P001",
                  patient: {
                    name: "John Doe",
                    patientId: "PAT001",
                  },
                  invoiceDate: "2024-05-20",
                  dueDate: "2024-06-20",
                  items: [
                    {
                      description: "Consultation Fee",
                      quantity: 1,
                      unitPrice: 100,
                      total: 100,
                    },
                    {
                      description: "Lab Test - Blood Sugar",
                      quantity: 1,
                      unitPrice: 50,
                      total: 50,
                    },
                  ],
                  subtotal: 150,
                  tax: 15,
                  total: 165,
                  status: "pending",
                  paidAmount: 0,
                },
              ],
            },
          },
        },
        {
          method: "POST",
          path: "/api/v1/billing",
          description: "Create a new invoice",
          headers: ["Authorization: Bearer {token}"],
          body: {
            patientId: "P001",
            appointmentId: "A001",
            items: [
              {
                description: "Consultation Fee",
                quantity: 1,
                unitPrice: 100,
                category: "consultation",
              },
            ],
            dueDate: "2024-06-24",
          },
          response: {
            success: true,
            data: {
              id: "INV002",
              invoiceNumber: "INV-2024-002",
              total: 100,
              status: "pending",
              createdAt: "2024-05-24T10:00:00Z",
            },
          },
        },
      ],
    },
    {
      category: "Dashboard",
      items: [
        {
          method: "GET",
          path: "/api/v1/dashboard/stats",
          description: "Get dashboard statistics and analytics",
          headers: ["Authorization: Bearer {token}"],
          response: {
            success: true,
            data: {
              overview: {
                totalPatients: 1250,
                todayAppointments: 45,
                pendingBills: 23,
                totalRevenue: 125000,
                activeStaff: 35,
              },
              charts: {
                appointmentTrends: [
                  { date: "2024-05-20", count: 25 },
                  { date: "2024-05-21", count: 30 },
                  { date: "2024-05-22", count: 28 },
                ],
                revenueByMonth: [
                  { month: "Jan", revenue: 95000 },
                  { month: "Feb", revenue: 105000 },
                  { month: "Mar", revenue: 115000 },
                ],
                patientsByDepartment: [
                  { department: "Cardiology", count: 150 },
                  { department: "Neurology", count: 120 },
                  { department: "Orthopedics", count: 200 },
                ],
              },
            },
          },
        },
      ],
    },
  ]

  const flutterExample = `
// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'https://yourdomain.com/api/v1';
  String? _token;

  // Login
  Future<Map<String, dynamic>> login(String hospitalSlug, String email, String password) async {
    final response = await http.post(
      Uri.parse('\$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'hospitalSlug': hospitalSlug,
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _token = data['data']['token'];
      return data;
    } else {
      throw Exception('Login failed');
    }
  }

  // Get Patients
  Future<Map<String, dynamic>> getPatients({int page = 1, String? search}) async {
    final response = await http.get(
      Uri.parse('\$baseUrl/patients?page=\$page&search=\${search ?? ''}'),
      headers: {
        'Authorization': 'Bearer \$_token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load patients');
    }
  }

  // Create Appointment
  Future<Map<String, dynamic>> createAppointment(Map<String, dynamic> appointmentData) async {
    final response = await http.post(
      Uri.parse('\$baseUrl/appointments'),
      headers: {
        'Authorization': 'Bearer \$_token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(appointmentData),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create appointment');
    }
  }
}
`

  const errorResponseExample = `{
  "success": false,
  "error": {
    "code": 400,
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "must be a valid email"
    }
  }
}`

  const rateLimitInfo = `
  # Rate Limiting

  Our API enforces rate limits to ensure fair usage and prevent abuse. The limits are applied per IP address.

  ## Limits

  - **General endpoints:** 100 requests per minute
  - **Authentication endpoints:** 20 requests per minute

  ## Headers

  The following headers are returned with each API response to indicate the current rate limit status:

  - \`X-RateLimit-Limit\`: The maximum number of requests allowed within the time window.
  - \`X-RateLimit-Remaining\`: The number of requests remaining in the current time window.
  - \`X-RateLimit-Reset\`: The time at which the rate limit resets, in UTC epoch seconds.

  ## Example

  \`\`\`
  HTTP/1.1 200 OK
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1672531200
  \`\`\`

  ## Exceeding the Limit

  When the rate limit is exceeded, the API returns a \`429 Too Many Requests\` error with a message indicating the retry time.

  \`\`\`
  HTTP/1.1 429 Too Many Requests
  Content-Type: application/json

  {
    "error": {
      "code": 429,
      "message": "Too Many Requests",
      "details": "Rate limit exceeded. Retry after 60 seconds."
    }
  }
  \`\`\`

  Please ensure your application handles rate limiting appropriately by monitoring the rate limit headers and implementing retry logic with exponential backoff.
  `

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="mb-4">
          <Code className="w-3 h-3 mr-1" />
          API Documentation
        </Badge>
        <h1 className="text-4xl font-bold">Hospital Management API</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Complete REST API documentation for integrating with the Hospital Management System. Build mobile apps, web
          applications, and custom integrations.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/api-test">
              <Play className="w-4 h-4 mr-2" />
              Test APIs
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs/mobile-sdk">
              Mobile SDK
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="flutter">Flutter SDK</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Base URL</CardTitle>
                <CardDescription>All API requests should be made to this base URL</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded flex-1">https://yourdomain.com/api/v1</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard("https://yourdomain.com/api/v1")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Type</CardTitle>
                <CardDescription>All requests should include this header</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded flex-1">Content-Type: application/json</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard("Content-Type: application/json")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>Include JWT token in Authorization header</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded flex-1">Authorization: Bearer YOUR_JWT_TOKEN</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard("Authorization: Bearer YOUR_JWT_TOKEN")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Format</CardTitle>
                <CardDescription>All responses follow this structure</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                  {`{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="authentication">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Flow</CardTitle>
              <CardDescription>How to authenticate and use JWT tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">1. Login Request</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {`POST /api/v1/auth/login
Content-Type: application/json

{
  "hospitalSlug": "smart-hospital",
  "email": "admin@smarthospital.com",
  "password": "admin123"
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Login Response</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {`{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Smith",
      "email": "admin@smarthospital.com",
      "role": "admin",
      "hospital": {
        "id": "hospital_id",
        "name": "Smart Hospital",
        "slug": "smart-hospital"
      }
    }
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Using the Token</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {`GET /api/v1/patients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints">
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="space-y-4">
                <h2 className="text-2xl font-bold">{endpoint.category}</h2>
                {endpoint.items.map((item, itemIndex) => (
                  <Card key={itemIndex}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.method === "GET" ? "default" : "secondary"}>{item.method}</Badge>
                        <code className="text-sm">{item.path}</code>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {item.headers && (
                        <div>
                          <h4 className="font-semibold mb-2">Headers</h4>
                          <ul className="list-disc pl-5">
                            {item.headers.map((header, headerIndex) => (
                              <li key={headerIndex}>
                                <code className="bg-muted px-3 py-2 rounded">{header}</code>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.body && (
                        <div>
                          <h4 className="font-semibold mb-2">Request Body</h4>
                          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(item.body, null, 2)}
                          </pre>
                        </div>
                      )}

                      {item.params && (
                        <div>
                          <h4 className="font-semibold mb-2">Query Parameters</h4>
                          <code className="bg-muted px-3 py-2 rounded">{item.params}</code>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2">Response</h4>
                        <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                          {JSON.stringify(item.response, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="flutter">
          <Card>
            <CardHeader>
              <CardTitle>Flutter Integration</CardTitle>
              <CardDescription>Complete Flutter service class for API integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">API Service Implementation</h3>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(flutterExample)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">{flutterExample}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Error Response Example</h2>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto">{errorResponseExample}</pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Rate Limiting</h2>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto">{rateLimitInfo}</pre>
      </div>
    </div>
  )
}
