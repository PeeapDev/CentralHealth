"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface DoctorCardProps {
  id: string;
  name: string;
  hospital: string;
  profession: string;
  yearsOfService: number;
  imageUrl?: string;
  onSelect: (doctorId: string) => void;
}

export function DoctorCard({
  id,
  name,
  hospital,
  profession,
  yearsOfService,
  imageUrl,
  onSelect
}: DoctorCardProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  // Create a 3-letter abbreviation for the doctor's initials to display in the avatar
  const displayInitials = name.split(' ')
    .map(n => n[0]?.toUpperCase() || '')
    .slice(0, 3)
    .join('');
    
  // Use the first character as a simple deterministic way to assign a consistent
  // abbreviation for the doctor's hospital/institution
  const hospitalAbbr = hospital.substring(0, 3).toUpperCase();
  
  return (
    <Card 
      className="min-w-[230px] max-w-[230px] h-[100px] cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 bg-pink-50 border border-pink-100 relative overflow-hidden rounded-md"
      onClick={() => onSelect(id)}
    >
      <CardContent className="p-3 flex flex-row items-center h-full">
        <div className="flex-shrink-0 w-[60px] h-[60px] rounded-full overflow-hidden relative flex items-center justify-center bg-blue-800 text-white font-bold text-lg">
          {displayInitials}
        </div>
        <div className="flex-1 pl-3 flex flex-col justify-center">
          <h3 className="font-semibold text-sm truncate w-full">Dr. {name}</h3>
          <p className="text-xs text-gray-600">{hospital}</p>
          <p className="text-xs text-gray-600">{profession}</p>
          <span className="absolute bottom-2 right-2 text-red-500 text-xs">★</span>
        </div>
      </CardContent>
    </Card>
  );
}
