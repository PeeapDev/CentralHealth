'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get verification code and medical number from URL if available
  const [verificationCode, setVerificationCode] = useState(
    searchParams?.get('code') || ''
  )
  const [medicalNumber, setMedicalNumber] = useState(
    searchParams?.get('medicalNumber') || ''
  )
  
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Handle form submission
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    
    try {
      // Submit verification details to API
      const response = await fetch('/api/patients/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationCode,
          medicalNumber,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Show success message
        toast.success('Email verified successfully!')
        
        // Redirect to patient dashboard
        setTimeout(() => {
          router.push(data.redirectTo || '/patient/dashboard')
        }, 1500)
      } else {
        // Show error message
        setErrorMessage(data.error || 'Verification failed. Please try again.')
        toast.error(data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setErrorMessage('An unexpected error occurred. Please try again.')
      toast.error('Verification failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter the verification code sent to your email
          </p>
        </div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errorMessage && (
            <div className="mb-4 bg-red-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleVerify}>
            <div>
              <label htmlFor="medicalNumber" className="block text-sm font-medium text-gray-700">
                Medical Number
              </label>
              <div className="mt-1">
                <input
                  id="medicalNumber"
                  name="medicalNumber"
                  type="text"
                  placeholder="P12345"
                  required
                  value={medicalNumber}
                  onChange={(e) => setMedicalNumber(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm">
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Go back to registration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
