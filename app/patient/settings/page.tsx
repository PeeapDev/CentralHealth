"use client"

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Phone, Mail, MapPin, Lock, Camera, Save, BabyIcon, UserRoundCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout";
import { usePatientProfile, updatePatientProfile, PatientProfile } from "@/hooks/use-patient-profile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { calculateAge } from "@/lib/format-patient-data";

// Define SpecializedCareSettings interface
interface SpecializedCareSettings {
  enableNeonatal: boolean;
  enableAntenatal: boolean;
  showMaternalCare: boolean;
}

// Define default settings
const DEFAULT_SPECIALIZED_CARE_SETTINGS: SpecializedCareSettings = {
  enableNeonatal: false,
  enableAntenatal: false,
  showMaternalCare: false,
};

export default function PatientSettings() {
  const router = useRouter();
  const { profile, isLoading, error } = usePatientProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<Partial<PatientProfile>>({});
  const [specializedCareSettings, setSpecializedCareSettings] = useState<SpecializedCareSettings>(DEFAULT_SPECIALIZED_CARE_SETTINGS);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const isEligibleForMaternal = useMemo(() => {
    if (!profile?.dateOfBirth || !profile?.gender) return false;
    const isFemale = profile.gender.toLowerCase() === 'female' || profile.gender.toLowerCase() === 'f';
    if (!isFemale) return false;
    const age = calculateAge(profile.dateOfBirth);
    return age >= 15 && age <= 50;
  }, [profile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedSettings = localStorage.getItem('specializedCareSettings');
    if (storedSettings) {
      try {
        setSpecializedCareSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error('Failed to parse specialized care settings:', e);
      }
    }
  }, []);

  const saveSpecializedCareSettings = (settings: SpecializedCareSettings) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('specializedCareSettings', JSON.stringify(settings));
      const event = new CustomEvent('specializedCareSettingsChanged', { detail: settings });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error saving specialized care settings:', error);
    }
  };

  const handleMaternalCareToggle = (checked: boolean) => {
    const newSettings = { ...specializedCareSettings, showMaternalCare: checked };
    setSpecializedCareSettings(newSettings);
    saveSpecializedCareSettings(newSettings);
    toast.success(checked ? "Maternal care dashboard enabled." : "Maternal care dashboard disabled.", { duration: 3000 });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAllergiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const allergies = value.split(',').map(s => s.trim());
    setFormData(prev => ({ ...prev, allergies }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updatePatientProfile(formData);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <DashboardLayout currentPage="settings"><div className="flex items-center justify-center h-full"><p>Loading profile...</p></div></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout currentPage="settings"><div className="flex items-center justify-center h-full"><p className="text-red-500">Error: {error}</p></div></DashboardLayout>;
  }

  return (
    <DashboardLayout currentPage="settings">
      <div className="container py-6 space-y-6 max-w-5xl">
        <header>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and feature settings.</p>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={`${formData.firstName || ''} ${formData.lastName || ''}`} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={formData.phone || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={formData.address || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input id="emergencyContact" value={formData.emergencyContact || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                    <Input id="allergies" value={Array.isArray(formData.allergies) ? formData.allergies.join(', ') : ''} onChange={handleAllergiesChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Input id="bloodType" value={formData.bloodType || ''} onChange={handleInputChange} />
                  </div>
                  <Button type="submit" disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save Changes'}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Feature Settings</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Specialized Care Dashboards</h3>
                  {isEligibleForMaternal ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="maternal-care" className="font-medium">Maternal Care Dashboard</Label>
                        <p className="text-sm text-muted-foreground">Enable this to see specialized dashboards for antenatal and neonatal care.</p>
                      </div>
                      <Switch id="maternal-care" checked={specializedCareSettings.showMaternalCare} onCheckedChange={handleMaternalCareToggle} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-4 border rounded-lg">
                      Maternal care features are available for female patients between the ages of 15 and 50.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">Security settings coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
