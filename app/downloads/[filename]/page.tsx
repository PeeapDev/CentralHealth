'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'

export default function DownloadPage() {
  const params = useParams()
  const filename = params.filename as string
  const [countdown, setCountdown] = useState(3)
  const [downloadStarted, setDownloadStarted] = useState(false)

  // Determine OS and version info from the filename
  const getOsInfo = () => {
    if (filename.includes('windows')) return { os: 'Windows', version: '1.0.0' }
    if (filename.includes('mac')) return { os: 'macOS', version: '1.0.0' }
    if (filename.includes('linux')) return { os: 'Linux', version: '1.0.0' }
    return { os: 'Unknown OS', version: '1.0.0' }
  }

  const { os, version } = getOsInfo()

  // Auto-start download after countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    
    if (countdown === 0 && !downloadStarted) {
      setDownloadStarted(true)
      // In a real implementation, this would trigger the actual file download
      console.log(`Starting download for: ${filename}`)
    }
  }, [countdown, downloadStarted, filename])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">MediCore Offline App</CardTitle>
          <CardDescription>
            {os} version {version}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {downloadStarted ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium">Your download is starting</h3>
              <p className="text-muted-foreground">
                If your download doesn't start automatically,{' '}
                <button 
                  className="text-blue-600 hover:underline" 
                  onClick={() => window.alert('This is a placeholder for the actual download functionality.')}
                >
                  click here
                </button>
              </p>
              
              <div className="border rounded-md p-4 bg-muted/50 mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This is a demo application. In a production environment, 
                  this would trigger the actual file download.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <div className="text-2xl font-bold">{countdown}</div>
              </div>
              <h3 className="text-lg font-medium">Preparing your download</h3>
              <p className="text-muted-foreground">Your download will begin in {countdown} seconds...</p>
            </div>
          )}
          
          <div className="space-y-2 border-t pt-4 mt-6">
            <p className="text-sm font-medium">Installation instructions:</p>
            <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
              <li>Once downloaded, open the installer file</li>
              <li>Follow the setup wizard instructions</li>
              <li>Launch the application and log in with your credentials</li>
              <li>For first-time use, ensure you're online to download your initial data</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Homepage
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
