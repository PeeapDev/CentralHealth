"use client"

import { useState } from 'react'
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Search, Filter, Star, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function MedicalShopPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("shop")
  
  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "shop") {
      setCurrentPage("shop")
    } else {
      // Navigate to other pages
      router.push(`/patient/${page}`)
    }
  }
  
  // Sample product data
  const products = [
    {
      id: 1,
      name: "Digital Blood Pressure Monitor",
      category: "Devices",
      price: "$89.99",
      rating: 4.7,
      image: "/placeholder.svg?height=200&width=200",
      prescription: false
    },
    {
      id: 2,
      name: "Compression Socks (3 Pack)",
      category: "Accessories",
      price: "$34.99",
      rating: 4.5,
      image: "/placeholder.svg?height=200&width=200",
      prescription: false
    },
    {
      id: 3,
      name: "Premium Pill Organizer",
      category: "Accessories",
      price: "$24.99",
      rating: 4.8,
      image: "/placeholder.svg?height=200&width=200",
      prescription: false
    },
    {
      id: 4,
      name: "Diabetic Test Strips",
      category: "Supplies",
      price: "$49.99",
      rating: 4.9,
      image: "/placeholder.svg?height=200&width=200",
      prescription: true
    },
    {
      id: 5,
      name: "Digital Thermometer",
      category: "Devices",
      price: "$19.99",
      rating: 4.6,
      image: "/placeholder.svg?height=200&width=200",
      prescription: false
    },
    {
      id: 6,
      name: "Medical-Grade Face Masks (50)",
      category: "Supplies",
      price: "$29.99",
      rating: 4.8,
      image: "/placeholder.svg?height=200&width=200",
      prescription: false
    }
  ]
  
  // Sample categories
  const categories = [
    "All Products",
    "Prescription Items",
    "Devices",
    "Supplies",
    "Accessories",
    "Over-the-Counter",
    "Vitamins & Supplements"
  ]
  
  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Medical Shop" }]}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Medical Shop</h1>
            <p className="text-gray-500 mt-1">Purchase medical supplies and equipment</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">Cart (3)</span>
            <Button variant="outline" size="sm" className="ml-2">View Cart</Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 space-y-6">
            <div className="bg-white shadow-sm rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      id={category}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={category} className="ml-2 text-sm text-gray-700">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="flex justify-between items-center">
                  <Input type="number" placeholder="Min" className="w-20 h-8" />
                  <span className="mx-2">-</span>
                  <Input type="number" placeholder="Max" className="w-20 h-8" />
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">Apply</Button>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1">
            <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search medical products..." className="pl-10" />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
                  <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                      {product.prescription && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Rx
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm ml-1">{product.rating}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-bold">{product.price}</span>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
