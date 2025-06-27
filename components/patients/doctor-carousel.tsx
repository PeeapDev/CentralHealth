"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DoctorCard } from './doctor-card';
import { DoctorDetailsModal } from './doctor-details-modal';

// This will be replaced with data from the real API
// Only used for UI development, will be removed in production
interface Doctor {
  id: string;
  name: string;
  hospital: string;
  profession: string;
  yearsOfService: number;
  about: string;
  imageUrl?: string;
  availability?: {
    days: string[];
    hours: string;
  };
}

interface DoctorCarouselProps {
  title: string;
  doctors: Doctor[];
  onAppointmentRequest: (doctorId: string, appointmentType: 'in-person' | 'consultation') => void;
  singleLine?: boolean;
}

export function DoctorCarousel({ 
  title,
  doctors,
  onAppointmentRequest,
  singleLine = false
}: DoctorCarouselProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const scrollAmount = 345; // Landscape card width (320px) + gap (25px)
    const currentScroll = carouselRef.current.scrollLeft;
    
    carouselRef.current.scrollTo({
      left: direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount,
      behavior: 'smooth'
    });
  };
  
  // Add auto-scrolling effect on component mount
  useEffect(() => {
    // Only enable auto-scroll when there are enough doctors
    if (doctors.length <= 3) return;
    
    const interval = setInterval(() => {
      // Calculate if we're at the end of the carousel
      if (carouselRef.current) {
        const isAtEnd = carouselRef.current.scrollLeft + carouselRef.current.offsetWidth >= 
                       carouselRef.current.scrollWidth - 50;
                       
        if (isAtEnd) {
          // Reset to beginning if at end
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Otherwise scroll right
          scroll('right');
        }
      }
    }, 5000); // Auto-scroll every 5 seconds
    
    return () => clearInterval(interval);
  }, [doctors.length]);

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = doctors.find(doc => doc.id === doctorId);
    if (doctor) {
      setSelectedDoctor(doctor);
      setIsDialogOpen(true);
    }
  };

  const handleBookAppointment = (doctorId: string, appointmentType: 'in-person' | 'consultation') => {
    onAppointmentRequest(doctorId, appointmentType);
    setIsDialogOpen(false);
  };

  return (
    <div className="relative w-full mb-6">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      )}
      
      <div className="relative group">
        <div 
          ref={carouselRef}
          className={`flex ${singleLine ? 'flex-nowrap' : 'flex-wrap'} gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-4 ${singleLine ? 'pr-16' : 'pr-10'}`}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {doctors.map(doctor => (
            <DoctorCard
              key={doctor.id}
              id={doctor.id}
              name={doctor.name}
              hospital={doctor.hospital}
              profession={doctor.profession}
              yearsOfService={doctor.yearsOfService}
              imageUrl={doctor.imageUrl}
              onSelect={handleDoctorSelect}
            />
          ))}
        </div>
        
        {/* Navigation arrow - right only to match the screenshot */}
        {doctors.length > 3 && (
          <Button
            variant="ghost" 
            size="icon" 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Doctor Details Modal */}
      <DoctorDetailsModal
        doctor={selectedDoctor}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onBookAppointment={handleBookAppointment}
      />
    </div>
  );
}
