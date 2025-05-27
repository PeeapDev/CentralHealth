"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define error log structure
interface ErrorLog {
  id: string
  timestamp: string
  level: "error" | "warning" | "info"
  component: string
  message: string
  details: string
  resolved: boolean
}

// Sample error logs - would be replaced with API call in production
const sampleErrorLogs: ErrorLog[] = [
  {
    id: "err-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    level: "error",
    component: "Authentication",
    message: "SuperAdmin auth bypass detected",
    details: "SuperAdmin login succeeded without password verification. Auth middleware may be compromised.",
    resolved: false
  },
  {
    id: "err-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    level: "error",
    component: "Hospital Management",
    message: "Hospital deletion failed",
    details: "Attempt to delete hospital ID H-001 failed with error code DB_CONSTRAINT_ERROR. Foreign key constraints may be preventing deletion.",
    resolved: false
  },
  {
    id: "err-003",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    level: "warning",
    component: "Email Service",
    message: "Password reset email not sent",
    details: "SMTP connection refused when attempting to send password reset email to hospital admin. Check SMTP configuration in settings.",
    resolved: false
  },
  {
    id: "err-004",
    timestamp: new Date(Date.now() - 1000 * 60 * 350).toISOString(),
    level: "error",
    component: "Hospital Management",
    message: "Domain name validation error",
    details: "Hospital update failed due to domain name conflict. System reports domain as taken even when editing the same hospital.",
    resolved: false
  },
  {
    id: "err-005",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    level: "info",
    component: "System",
    message: "System resource usage high",
    details: "CPU usage exceeded 80% for more than 10 minutes. Consider optimizing database queries or increasing resources.",
    resolved: true
  }
]

export default function ErrorLogsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulating API call to get logs
    const fetchLogs = async () => {
      try {
        // In production, this would be an API call
        // const response = await fetch('/api/error-logs');
        // const data = await response.json();
        // setLogs(data);

        // Using sample data for now
        setTimeout(() => {
          setLogs(sampleErrorLogs);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching error logs:", error);
        toast.error("Failed to load error logs");
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const handleResolveError = (id: string) => {
    setLogs(prevLogs => 
      prevLogs.map(log => 
        log.id === id ? { ...log, resolved: true } : log
      )
    );
    toast.success("Error marked as resolved");
  };

  const handleClearResolved = () => {
    setLogs(prevLogs => prevLogs.filter(log => !log.resolved));
    toast.success("Resolved errors cleared");
  };

  const handleDeleteLog = (id: string) => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
    toast.success("Log entry deleted");
  };

  const filteredLogs = logs.filter(log => {
    // Filter by tab selection
    if (activeTab === "errors" && log.level !== "error") return false;
    if (activeTab === "warnings" && log.level !== "warning") return false;
    if (activeTab === "resolved" && !log.resolved) return false;
    if (activeTab === "unresolved" && log.resolved) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.component.toLowerCase().includes(query) ||
        log.message.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return <Badge variant="warning" className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
      case "info":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Info</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Error Logs</h1>
        <p className="text-muted-foreground">
          View and manage system errors and warnings
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleClearResolved}
            disabled={!logs.some(log => log.resolved)}
          >
            Clear Resolved
          </Button>
          <Button variant="default">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Export Logs
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-4">
          <TabsTrigger value="all">
            All
            <Badge variant="outline" className="ml-2">{logs.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="errors">
            Errors
            <Badge variant="outline" className="ml-2">{logs.filter(log => log.level === "error").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="warnings">
            Warnings
            <Badge variant="outline" className="ml-2">{logs.filter(log => log.level === "warning").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unresolved">
            Unresolved
            <Badge variant="outline" className="ml-2">{logs.filter(log => !log.resolved).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
            <Badge variant="outline" className="ml-2">{logs.filter(log => log.resolved).length}</Badge>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>System Error Log</CardTitle>
            <CardDescription>
              {loading ? "Loading logs..." : `Showing ${filteredLogs.length} of ${logs.length} log entries`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                {searchQuery ? "No logs match your search query" : "No logs to display"}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead className="w-1/3">Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className={log.resolved ? "bg-gray-50" : ""}>
                        <TableCell className="font-mono text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{getLevelBadge(log.level)}</TableCell>
                        <TableCell>{log.component}</TableCell>
                        <TableCell>
                          <div className="font-medium">{log.message}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs" title={log.details}>
                            {log.details}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.resolved ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800">Resolved</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800">Unresolved</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                // Show details in a modal or expand row
                                toast.info("Viewing full error details");
                              }}>
                                View Details
                              </DropdownMenuItem>
                              {!log.resolved && (
                                <DropdownMenuItem onClick={() => handleResolveError(log.id)}>
                                  Mark as Resolved
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteLog(log.id)}
                              >
                                Delete Log
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              System logs are retained for 30 days
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // In production, this would call an API endpoint
                toast.success("System log refresh triggered");
              }}
            >
              Refresh
            </Button>
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  )
}
