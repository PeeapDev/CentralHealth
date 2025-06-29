"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock as ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function DateTimePicker({
  date,
  setDate,
  disabled = false,
  className,
  placeholder = "Pick a date and time"
}: DateTimePickerProps) {
  // Function to set time on the date
  const setDateTime = (hours: number, minutes: number) => {
    if (!date) {
      const newDate = new Date();
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
    } else {
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP p") : placeholder}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 opacity-70" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm" htmlFor="hours">Hours</label>
                <Input
                  id="hours"
                  className="w-full"
                  type="number"
                  min={0}
                  max={23}
                  value={date ? date.getHours() : ""}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value, 10);
                    if (!isNaN(hours) && hours >= 0 && hours <= 23) {
                      setDateTime(hours, date?.getMinutes() || 0);
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-sm" htmlFor="minutes">Minutes</label>
                <Input
                  id="minutes"
                  className="w-full"
                  type="number"
                  min={0}
                  max={59}
                  value={date ? date.getMinutes() : ""}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value, 10);
                    if (!isNaN(minutes) && minutes >= 0 && minutes <= 59) {
                      setDateTime(date?.getHours() || 0, minutes);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
