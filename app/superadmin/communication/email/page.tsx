"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, Send, X } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface EmailRecipient {
  type: "admin" | "user" | "hospital";
  count: number;
  selected: boolean;
}

interface SentEmail {
  id: string;
  subject: string;
  content: string;
  sentAt: string;
  recipients: {
    total: number;
    admins: number;
    users: number;
    hospitals: number;
  };
  status: "sent" | "pending" | "failed";
}

export default function SuperadminEmailPage() {
  const [activeTab, setActiveTab] = useState<string>("compose")
  const [loading, setLoading] = useState<boolean>(false)
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  
  // Email composition state
  const [subject, setSubject] = useState<string>("")
  const [content, setContent] = useState<string>("")
  const [recipients, setRecipients] = useState<EmailRecipient[]>([
    { type: "admin", count: 57, selected: false },
    { type: "user", count: 1243, selected: false },
    { type: "hospital", count: 28, selected: false },
  ])
  
  const handleRecipientChange = (type: "admin" | "user" | "hospital", checked: boolean) => {
    setRecipients(prev => prev.map(r => r.type === type ? { ...r, selected: checked } : r))
  }
  
  const getTotalSelectedCount = () => {
    return recipients.reduce((total, r) => r.selected ? total + r.count : total, 0)
  }
  
  const handleSendEmail = async () => {
    // Validate inputs
    if (!subject.trim()) {
      toast.error("Please enter an email subject")
      return
    }
    
    if (!content.trim()) {
      toast.error("Please enter email content")
      return
    }
    
    if (!recipients.some(r => r.selected)) {
      toast.error("Please select at least one recipient group")
      return
    }
    
    setLoading(true)
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a record of the sent email
      const newEmail: SentEmail = {
        id: `email-${Date.now()}`,
        subject,
        content,
        sentAt: new Date().toISOString(),
        recipients: {
          total: getTotalSelectedCount(),
          admins: recipients.find(r => r.type === "admin")?.selected ? recipients.find(r => r.type === "admin")?.count || 0 : 0,
          users: recipients.find(r => r.type === "user")?.selected ? recipients.find(r => r.type === "user")?.count || 0 : 0,
          hospitals: recipients.find(r => r.type === "hospital")?.selected ? recipients.find(r => r.type === "hospital")?.count || 0 : 0,
        },
        status: "sent"
      }
      
      setSentEmails(prev => [newEmail, ...prev])
      
      // Reset form
      setSubject("")
      setContent("")
      setRecipients(prev => prev.map(r => ({ ...r, selected: false })))
      
      // Show success message
      toast.success(`Email sent to ${getTotalSelectedCount()} recipients`)
      
      // Switch to history tab
      setActiveTab("history")
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error("Failed to send email")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Communication</h1>
        <p className="text-muted-foreground">Send emails to hospital administrators and users</p>
      </div>
      
      <Tabs defaultValue="compose" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">Compose Email</TabsTrigger>
          <TabsTrigger value="history">Email History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Email</CardTitle>
              <CardDescription>
                Compose and send an email to multiple recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="Enter email subject" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Recipients</Label>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      {recipients.map((recipient) => (
                        <div key={recipient.type} className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`recipient-${recipient.type}`} 
                              checked={recipient.selected}
                              onCheckedChange={(checked) => handleRecipientChange(recipient.type, !!checked)}
                            />
                            <Label htmlFor={`recipient-${recipient.type}`} className="capitalize">
                              {recipient.type === "admin" ? "All Hospital Administrators" : 
                               recipient.type === "user" ? "All Hospital Users" : 
                               "All Hospitals"}
                            </Label>
                          </div>
                          <Badge variant="secondary">
                            {recipient.count} {recipient.type === "admin" ? "Admins" : 
                                            recipient.type === "user" ? "Users" : 
                                            "Hospitals"}
                          </Badge>
                        </div>
                      ))}
                      
                      <div className="pt-2 flex items-center justify-between">
                        <Label className="font-semibold">Total Recipients</Label>
                        <Badge variant="default">
                          {getTotalSelectedCount()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea 
                  id="content" 
                  placeholder="Write your email content here..." 
                  className="min-h-[200px]" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleSendEmail} 
                disabled={loading || !subject.trim() || !content.trim() || !recipients.some(r => r.selected)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email History</CardTitle>
              <CardDescription>
                View previously sent emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentEmails.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Date Sent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">{email.subject}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{email.recipients.total} recipients</span>
                            <div className="flex">
                              {email.recipients.admins > 0 && (
                                <Badge variant="outline" className="mr-1">
                                  {email.recipients.admins} Admins
                                </Badge>
                              )}
                              {email.recipients.users > 0 && (
                                <Badge variant="outline" className="mr-1">
                                  {email.recipients.users} Users
                                </Badge>
                              )}
                              {email.recipients.hospitals > 0 && (
                                <Badge variant="outline">
                                  {email.recipients.hospitals} Hospitals
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={email.status === "sent" ? "default" : 
                                   email.status === "pending" ? "outline" : 
                                   "destructive"}
                          >
                            {email.status === "sent" ? "Sent" : 
                             email.status === "pending" ? "Pending" : 
                             "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Mail className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No emails sent yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("compose")} 
                    className="mt-2"
                  >
                    Compose your first email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
