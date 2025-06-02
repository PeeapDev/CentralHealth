"use client"

import { useState, useRef } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, Form } from '@/components/ui/form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Upload, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// No required fields since photo upload is optional
const formSchema = z.object({
  photo: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface PhotoUploadFormProps {
  formData: any
  updateFormData: (data: any) => void
  onNext: () => void
  onPrevious: () => void
}

export default function PhotoUploadForm({ formData, updateFormData, onNext, onPrevious }: PhotoUploadFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string>(formData.photo || '')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      photo: formData.photo || '',
    },
  })

  // Start camera stream
  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 480 },
          height: { ideal: 480 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setCameraActive(true)
    } catch (err) {
      console.error('Error accessing camera:', err)
      setCameraError('Unable to access your camera. Please check your permissions.')
    }
  }

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    setCameraActive(false)
  }

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        // Match canvas size to video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw video frame on canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to base64 data URL
        const dataUrl = canvas.toDataURL('image/jpeg')
        setPhotoPreview(dataUrl)
        form.setValue('photo', dataUrl)
        
        // Stop camera after capture
        stopCamera()
      }
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (file) {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setPhotoPreview(dataUrl)
        form.setValue('photo', dataUrl)
      }
      
      reader.readAsDataURL(file)
    }
  }

  function onSubmit(data: FormData) {
    updateFormData({ photo: photoPreview })
    onNext()
  }

  // Skip this step
  const handleSkip = () => {
    // Clear any existing photo if skipping
    updateFormData({ photo: '' })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Photo Upload</h2>
        <p className="text-muted-foreground">
          Add a photo for your medical ID card (optional but recommended)
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            {photoPreview ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Avatar className="h-48 w-48 border-2 border-primary">
                    <AvatarImage src={photoPreview} alt="Preview" />
                    <AvatarFallback>Photo</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex justify-center">
                  <Button
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setPhotoPreview('')
                      form.setValue('photo', '')
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retake Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {cameraActive ? (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 mx-auto" style={{ width: '320px', height: '240px' }}>
                      <video 
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex justify-center space-x-2">
                      <Button
                        type="button"
                        onClick={capturePhoto}
                        className="flex items-center"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={stopCamera}
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 w-full">
                      <div className="space-y-2 text-center">
                        <div className="flex justify-center">
                          <Avatar className="h-24 w-24">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              Photo
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Take a photo or upload an image for your ID card
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center space-x-2">
                      <Button 
                        type="button" 
                        onClick={startCamera}
                        className="flex items-center"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Use Camera
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
                
                {cameraError && (
                  <Alert variant="destructive">
                    <AlertDescription>{cameraError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrevious}>
              Back
            </Button>
            <div className="space-x-2">
              <Button type="button" variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
              <Button type="submit" disabled={!photoPreview}>
                Continue
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
