"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface SmsRecipient {
  type: "admin" | "user" | "hospital";
  count: number;
  selected: boolean;
}

interface SentSms {
  id: string;
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

export default function SuperadminSmsPage() {
  const [activeTab, setActiveTab] = useState<string>("compose")
  const [loading, setLoading] = useState<boolean>(false)
  const [sentMessages, setSentMessages] = useState<SentSms[]>([])
  
  // SMS composition state
  const [content, setContent] = useState<string>("")
  const [recipients, setRecipients] = useState<SmsRecipient[]>([
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
  
  const handleSendSms = async () => {
    // Validate inputs
    if (!content.trim()) {
      toast.error("Please enter SMS content")
      return
    }
    
    if (!recipients.some(r => r.selected)) {
      toast.error("Please select at least one recipient group")
      return
    }
    
    // Check SMS length
    if (content.length > 160) {
      toast.warning("SMS content exceeds 160 characters. It may be split into multiple messages.")
    }
    
    setLoading(true)
    
    try {
      // In a real app, this would be an API call to an SMS service provider
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a record of the sent SMS
      const newSms: SentSms = {
        id: `sms-${Date.now()}`,
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
      
      setSentMessages(prev => [newSms, ...prev])
      
      // Reset form
      setContent("")
      setRecipients(prev => prev.map(r => ({ ...r, selected: false })))
      
      // Show success message
      toast.success(`SMS sent to ${getTotalSelectedCount()} recipients`)
      
      // Switch to history tab
      setActiveTab("history")
    } catch (error) {
      console.error("Error sending SMS:", error)
      toast.error("Failed to send SMS")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SMS Communication</h1>
        <p className="text-muted-foreground">Send SMS messages to hospital administrators and users</p>
      </div>
      
      <Tabs defaultValue="compose" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">Compose SMS</TabsTrigger>
          <TabsTrigger value="history">SMS History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New SMS</CardTitle>
              <CardDescription>
                Compose and send an SMS to multiple recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">SMS Content</Label>
                  <span className={`text-xs ${content.length > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                    {content.length}/160 characters
                  </span>
                </div>
                <Textarea 
                  id="content" 
                  placeholder="Write your SMS content here..." 
                  className="min-h-[120px]" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={500} // Set a reasonable max length
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleSendSms} 
                disabled={loading || !content.trim() || !recipients.some(r => r.selected)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send SMS
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS History</CardTitle>
              <CardDescription>
                View previously sent SMS messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentMessages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Date Sent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentMessages.map((sms) => (
                      <TableRow key={sms.id}>
                        <TableCell className="font-medium">
                          <div className="max-w-md truncate">
                            {sms.content}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{sms.recipients.total} recipients</span>
                            <div className="flex">
                              {sms.recipients.admins > 0 && (
                                <Badge variant="outline" className="mr-1">
                                  {sms.recipients.admins} Admins
                                </Badge>
                              )}
                              {sms.recipients.users > 0 && (
                                <Badge variant="outline" className="mr-1">
                                  {sms.recipients.users} Users
                                </Badge>
                              )}
                              {sms.recipients.hospitals > 0 && (
                                <Badge variant="outline">
                                  {sms.recipients.hospitals} Hospitals
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(sms.sentAt), 'MMM d, yyyy h:mm a')}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={sms.status === "sent" ? "default" : 
                                   sms.status === "pending" ? "outline" : 
                                   "destructive"}
                          >
                            {sms.status === "sent" ? "Sent" : 
                             sms.status === "pending" ? "Pending" : 
                             "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No SMS messages sent yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("compose")} 
                    className="mt-2"
                  >
                    Compose your first SMS
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
