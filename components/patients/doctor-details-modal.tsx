"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, Video } from "lucide-react";

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

interface DoctorDetailsModalProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAppointment: (doctorId: string, type: 'in-person' | 'consultation') => void;
}

export function DoctorDetailsModal({
  doctor,
  open,
  onOpenChange,
  onBookAppointment
}: DoctorDetailsModalProps) {
  if (!doctor) return null;
  
  const initials = doctor.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-yellow-50 via-pink-50 to-pink-100">
        <DialogHeader>
          <DialogTitle className="text-xl">Doctor Details</DialogTitle>
          <DialogDescription>
            View details and book appointments
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center mt-2">
          <Avatar className="w-32 h-32 mb-4">
            <AvatarImage src={doctor.imageUrl} alt={doctor.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
          </Avatar>
          
          <h2 className="text-2xl font-bold">{doctor.name}</h2>
          <p className="text-lg text-gray-700 mb-1">{doctor.profession}</p>
          <p className="text-sm text-gray-600">{doctor.hospital}</p>
          <p className="text-sm text-gray-600">{doctor.yearsOfService} years of service</p>
          
          <div className="mt-4 w-full">
            <h3 className="font-semibold">About</h3>
            <p className="text-sm text-gray-600 mt-1">{doctor.about}</p>
          </div>
          
          <div className="mt-4 w-full">
            <h3 className="font-semibold">Availability</h3>
            <div className="text-sm text-gray-600 mt-1">
              <p><span className="font-medium">Days:</span> {doctor.availability?.days.join(', ') || 'Not specified'}</p>
              <p><span className="font-medium">Hours:</span> {doctor.availability?.hours || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center gap-4 w-full">
            <Button 
              onClick={() => onBookAppointment(doctor.id, 'in-person')}
              className="flex-1" 
              variant="default"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
            
            <Button 
              onClick={() => onBookAppointment(doctor.id, 'consultation')}
              className="flex-1" 
              variant="secondary"
            >
              <Video className="mr-2 h-4 w-4" />
              Book Consultation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
