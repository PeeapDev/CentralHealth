"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { AlertCircle, Bell, CheckCircle2, Loader2, Mail, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BroadcastChannel {
  id: string
  name: string
  type: "email" | "sms" | "notification"
  enabled: boolean
}

interface RecipientGroup {
  id: string
  name: string
  count: number
  selected: boolean
}

interface Broadcast {
  id: string
  subject: string
  content: string
  sentAt: string
  channels: Array<{ id: string; name: string; type: string }>
  recipientGroups: Array<{ id: string; name: string; count: number }>
  totalRecipients: number
  status: "sent" | "pending" | "failed" | "partial"
}

export default function BroadcastPage() {
  const [activeTab, setActiveTab] = useState<string>("compose")
  const [loading, setLoading] = useState<boolean>(false)
  const [subject, setSubject] = useState<string>("")
  const [content, setContent] = useState<string>("")
  const [broadcastHistory, setBroadcastHistory] = useState<Broadcast[]>([])
  const [priority, setPriority] = useState<"normal" | "high" | "urgent">("normal")
  
  // Channel options for sending broadcasts
  const [channels, setChannels] = useState<BroadcastChannel[]>([
    { id: "email", name: "Email", type: "email", enabled: true },
    { id: "sms", name: "SMS", type: "sms", enabled: false },
    { id: "notification", name: "In-App Notification", type: "notification", enabled: true },
  ])
  
  // Recipient groups
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([
    { id: "all-admins", name: "All Hospital Administrators", count: 57, selected: false },
    { id: "all-users", name: "All Hospital Users", count: 1243, selected: false },
    { id: "all-hospitals", name: "All Hospitals", count: 28, selected: false },
    { id: "hospital-central", name: "Central Hospital Staff", count: 53, selected: false },
    { id: "hospital-western", name: "Western Medical Center Staff", count: 48, selected: false },
    { id: "hospital-eastern", name: "Eastern Health Clinic Staff", count: 41, selected: false },
  ])
  
  const toggleChannel = (channelId: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId ? { ...channel, enabled: !channel.enabled } : channel
    ))
  }
  
  const toggleRecipientGroup = (groupId: string) => {
    setRecipientGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, selected: !group.selected } : group
    ))
  }
  
  const getSelectedChannelsCount = () => {
    return channels.filter(channel => channel.enabled).length
  }
  
  const getSelectedRecipientsCount = () => {
    return recipientGroups
      .filter(group => group.selected)
      .reduce((total, group) => total + group.count, 0)
  }
  
  const handleSendBroadcast = async () => {
    // Validate inputs
    if (!subject.trim()) {
      toast.error("Please enter a broadcast subject")
      return
    }
    
    if (!content.trim()) {
      toast.error("Please enter broadcast content")
      return
    }
    
    if (getSelectedChannelsCount() === 0) {
      toast.error("Please select at least one channel")
      return
    }
    
    if (getSelectedRecipientsCount() === 0) {
      toast.error("Please select at least one recipient group")
      return
    }
    
    setLoading(true)
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // Create a record of the broadcast
      const newBroadcast: Broadcast = {
        id: `broadcast-${Date.now()}`,
        subject,
        content,
        sentAt: new Date().toISOString(),
        channels: channels.filter(c => c.enabled).map(c => ({ id: c.id, name: c.name, type: c.type })),
        recipientGroups: recipientGroups.filter(g => g.selected).map(g => ({ id: g.id, name: g.name, count: g.count })),
        totalRecipients: getSelectedRecipientsCount(),
        status: "sent"
      }
      
      setBroadcastHistory(prev => [newBroadcast, ...prev])
      
      // Reset form
      setSubject("")
      setContent("")
      setPriority("normal")
      setRecipientGroups(prev => prev.map(group => ({ ...group, selected: false })))
      
      // Show success message
      toast.success(`Broadcast sent to ${getSelectedRecipientsCount()} recipients via ${getSelectedChannelsCount()} channels`)
      
      // Switch to history tab
      setActiveTab("history")
    } catch (error) {
      console.error("Error sending broadcast:", error)
      toast.error("Failed to send broadcast")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Broadcast Messages</h1>
        <p className="text-muted-foreground">Send messages across multiple channels to selected recipient groups</p>
      </div>
      
      <Tabs defaultValue="compose" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">Compose Broadcast</TabsTrigger>
          <TabsTrigger value="history">Broadcast History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Broadcast</CardTitle>
              <CardDescription>
                Create a message to send across multiple communication channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subject field */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="Enter broadcast subject" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              {/* Channels selection */}
              <div className="space-y-2">
                <Label>Channels</Label>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      {channels.map((channel) => (
                        <div key={channel.id} className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id={`channel-${channel.id}`} 
                              checked={channel.enabled}
                              onCheckedChange={() => toggleChannel(channel.id)}
                            />
                            <Label htmlFor={`channel-${channel.id}`}>
                              {channel.name}
                              {channel.id === "sms" && (
                                <Badge variant="outline" className="ml-2">Paid Service</Badge>
                              )}
                            </Label>
                          </div>
                          {channel.id === "email" && (
                            <span className="text-xs text-muted-foreground">Supports HTML</span>
                          )}
                          {channel.id === "sms" && (
                            <span className="text-xs text-muted-foreground">Character limit: 160</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Priority selection */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <RadioGroup defaultValue="normal" value={priority} onValueChange={(value: "normal" | "high" | "urgent") => setPriority(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="priority-normal" />
                    <Label htmlFor="priority-normal">Normal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="priority-high" />
                    <Label htmlFor="priority-high">High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="urgent" id="priority-urgent" />
                    <Label htmlFor="priority-urgent">Urgent</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Recipient groups selection */}
              <div className="space-y-2">
                <Label>Recipients</Label>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      {recipientGroups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`group-${group.id}`} 
                              checked={group.selected}
                              onCheckedChange={() => toggleRecipientGroup(group.id)}
                            />
                            <Label htmlFor={`group-${group.id}`}>{group.name}</Label>
                          </div>
                          <Badge variant="secondary">{group.count}</Badge>
                        </div>
                      ))}
                      
                      <div className="pt-2 flex items-center justify-between">
                        <Label className="font-semibold">Total Recipients</Label>
                        <Badge variant="default">
                          {getSelectedRecipientsCount()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Content field */}
              <div className="space-y-2">
                <Label htmlFor="content">Message Content</Label>
                <Textarea 
                  id="content" 
                  placeholder="Write your broadcast message here..." 
                  className="min-h-[200px]" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                {channels.some(c => c.id === "sms" && c.enabled) && content.length > 160 && (
                  <div className="flex items-center text-amber-500 text-sm mt-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    SMS content exceeds 160 characters. The message will be split into multiple SMS messages.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center">
                {getSelectedChannelsCount() > 0 && getSelectedRecipientsCount() > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{getSelectedChannelsCount()}</span> channels u2022 <span className="font-medium">{getSelectedRecipientsCount()}</span> recipients
                  </div>
                )}
              </div>
              <Button 
                onClick={handleSendBroadcast} 
                disabled={loading || !subject.trim() || !content.trim() || getSelectedChannelsCount() === 0 || getSelectedRecipientsCount() === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Broadcast
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast History</CardTitle>
              <CardDescription>
                View previously sent broadcast messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {broadcastHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Date Sent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcastHistory.map((broadcast) => (
                      <TableRow key={broadcast.id}>
                        <TableCell className="font-medium">{broadcast.subject}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {broadcast.channels.map(channel => (
                              <Badge key={channel.id} variant="outline">
                                {channel.type === "email" && <Mail className="h-3 w-3 mr-1" />}
                                {channel.type === "sms" && <MessageSquare className="h-3 w-3 mr-1" />}
                                {channel.type === "notification" && <Bell className="h-3 w-3 mr-1" />}
                                {channel.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{broadcast.totalRecipients} recipients</TableCell>
                        <TableCell>{format(new Date(broadcast.sentAt), 'MMM d, yyyy h:mm a')}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={broadcast.status === "sent" ? "default" : 
                                  broadcast.status === "partial" ? "secondary" :
                                  broadcast.status === "pending" ? "outline" : 
                                  "destructive"}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {broadcast.status === "sent" ? "Sent" : 
                            broadcast.status === "partial" ? "Partially Sent" :
                            broadcast.status === "pending" ? "Pending" : 
                            "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Send className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No broadcasts sent yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("compose")} 
                    className="mt-2"
                  >
                    Create your first broadcast
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
