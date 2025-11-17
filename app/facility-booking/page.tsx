"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Building2, CalendarIcon, Plus, Search, User, Trash2, Edit } from 'lucide-react';
import { format, addDays, differenceInDays } from "date-fns";
import { cn } from "../../lib/utils";

// Types
type FacilityType = "dorm" | "classroom" | "range" | "amphitheater" | "auditorium" | "gym" | "pool" | "other";
type ProfileType = "Applicant" | "Cadet" | "Trooper" | "Instructor" | "Administrator";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileType: ProfileType;
  createdAt: string;
}

interface Reservation {
  id: string;
  facilityType: FacilityType;
  facilityNumber?: string;
  profileId: string;
  profileName: string;
  checkIn: string;
  checkOut: string;
  purpose: string;
  specialRequests?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  needsCleaning?: boolean;
}

// Zod Schemas
const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^($$)?\d{3}($$)?[-.\s]?\d{3}[-.\s]?\d{4}$/, "Invalid phone number format"),
  profileType: z.enum(["Applicant", "Cadet", "Trooper", "Instructor", "Administrator"]),
});

const reservationSchema = z.object({
  facilityType: z.enum(["dorm", "classroom", "range", "amphitheater", "auditorium", "gym", "pool", "other"]),
  facilityNumber: z.string().optional(),
  profileId: z.string().min(1, "Please select a profile"),
  checkIn: z.date({ required_error: "Check-in date is required" }),
  checkOut: z.date({ required_error: "Check-out date is required" }),
  purpose: z.string().min(10, "Purpose must be at least 10 characters").max(500),
  specialRequests: z.string().max(500).optional(),
}).refine((data) => data.checkOut > data.checkIn, {
  message: "Check-out must be after check-in",
  path: ["checkOut"],
}).refine((data) => {
  const days = differenceInDays(data.checkOut, data.checkIn);
  return days <= 180; // 6 months max
}, {
  message: "Reservation cannot exceed 6 months",
  path: ["checkOut"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type ReservationFormData = z.infer<typeof reservationSchema>;

export default function FacilityBooking() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<"book" | "manage" | "profiles">("book");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedProfiles = localStorage.getItem("psp_profiles");
      const storedReservations = localStorage.getItem("psp_reservations");
      
      if (storedProfiles) {
        setProfiles(JSON.parse(storedProfiles));
      }
      if (storedReservations) {
        setReservations(JSON.parse(storedReservations));
      }
    }
  }, []);

  // Profile Form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      profileType: "Cadet",
    },
  });

  // Reservation Form
  const reservationForm = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      facilityType: "dorm",
      profileId: "",
      purpose: "",
      specialRequests: "",
    },
  });

  // Handle profile submission
  const onProfileSubmit = (data: ProfileFormData) => {
    if (typeof window === "undefined") return;

    if (editingProfile) {
      // Update existing profile
      const updatedProfiles = profiles.map(p => 
        p.id === editingProfile.id 
          ? { ...p, ...data }
          : p
      );
      setProfiles(updatedProfiles);
      localStorage.setItem("psp_profiles", JSON.stringify(updatedProfiles));
      toast.success("Profile updated successfully!");
      setEditingProfile(null);
    } else {
      // Create new profile
      const newProfile: Profile = {
        id: `PROF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date().toISOString(),
      };

      const updatedProfiles = [...profiles, newProfile];
      setProfiles(updatedProfiles);
      localStorage.setItem("psp_profiles", JSON.stringify(updatedProfiles));
      toast.success("Profile created successfully!");
    }

    profileForm.reset();
    setShowProfileDialog(false);
  };

  // Handle reservation submission
  const onReservationSubmit = (data: ReservationFormData) => {
    if (typeof window === "undefined") return;

    const profile = profiles.find(p => p.id === data.profileId);
    if (!profile) {
      toast.error("Profile not found");
      return;
    }

    const newReservation: Reservation = {
      id: `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      profileName: `${profile.firstName} ${profile.lastName}`,
      checkIn: data.checkIn.toISOString(),
      checkOut: data.checkOut.toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
      needsCleaning: false,
    };

    const updatedReservations = [...reservations, newReservation];
    setReservations(updatedReservations);
    localStorage.setItem("psp_reservations", JSON.stringify(updatedReservations));

    toast.success("Reservation created successfully!");
    reservationForm.reset();
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
  };

  // Delete profile
  const deleteProfile = (id: string) => {
    if (typeof window === "undefined") return;
    
    const updatedProfiles = profiles.filter(p => p.id !== id);
    setProfiles(updatedProfiles);
    localStorage.setItem("psp_profiles", JSON.stringify(updatedProfiles));
    toast.success("Profile deleted");
  };

  // Cancel reservation
  const cancelReservation = (id: string) => {
    if (typeof window === "undefined") return;
    
    const updatedReservations = reservations.map(r => 
      r.id === id ? { ...r, status: "cancelled" as const, needsCleaning: r.status === "active" } : r
    );
    setReservations(updatedReservations);
    localStorage.setItem("psp_reservations", JSON.stringify(updatedReservations));
    toast.success("Reservation cancelled");
  };

  // Mark as needing cleaning
  const markForCleaning = (id: string) => {
    if (typeof window === "undefined") return;
    
    const updatedReservations = reservations.map(r => 
      r.id === id ? { ...r, needsCleaning: true } : r
    );
    setReservations(updatedReservations);
    localStorage.setItem("psp_reservations", JSON.stringify(updatedReservations));
    toast.info("Room marked for cleaning");
  };

  // Generate room numbers for dorms (1-300)
  const dormRooms = Array.from({ length: 300 }, (_, i) => (i + 1).toString().padStart(3, "0"));
  const classrooms = Array.from({ length: 12 }, (_, i) => `CR-${i + 1}`);

  // Open edit profile dialog
  const openEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    profileForm.reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      profileType: profile.profileType,
    });
    setShowProfileDialog(true);
  };

  // Handle dialog close and reset editing state
  const handleDialogClose = (open: boolean) => {
    setShowProfileDialog(open);
    if (!open) {
      setEditingProfile(null);
      profileForm.reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Facility Booking System
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Reserve dorm rooms, classrooms, and training facilities
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-gray-200 dark:bg-gray-800 p-1 mb-6">
          <button
            onClick={() => setActiveTab("book")}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-all",
              activeTab === "book"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Building2 className="w-4 h-4 inline-block mr-2" />
            Book Facility
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-all",
              activeTab === "manage"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Search className="w-4 h-4 inline-block mr-2" />
            Manage Reservations
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-all",
              activeTab === "profiles"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <User className="w-4 h-4 inline-block mr-2" />
            Profile Management
          </button>
        </div>

        {/* Book Facility Tab */}
        {activeTab === "book" && (
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Create New Reservation</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Reserve a facility for cadets, troopers, or law enforcement personnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={reservationForm.handleSubmit(onReservationSubmit)} className="space-y-6">
                {/* Facility Type */}
                <div className="space-y-2">
                  <Label htmlFor="facilityType" className="text-gray-900 dark:text-white">Facility Type</Label>
                  <Select
                    value={reservationForm.watch("facilityType")}
                    onValueChange={(value) => reservationForm.setValue("facilityType", value as FacilityType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select facility type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dorm">Dorm Room</SelectItem>
                      <SelectItem value="classroom">Classroom</SelectItem>
                      <SelectItem value="range">Range</SelectItem>
                      <SelectItem value="amphitheater">Amphitheater</SelectItem>
                      <SelectItem value="auditorium">Auditorium</SelectItem>
                      <SelectItem value="gym">Gym</SelectItem>
                      <SelectItem value="pool">Pool</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {reservationForm.formState.errors.facilityType && (
                    <p className="text-sm text-red-600">{reservationForm.formState.errors.facilityType.message}</p>
                  )}
                </div>

                {/* Facility Number */}
                {reservationForm.watch("facilityType") === "dorm" && (
                  <div className="space-y-2">
                    <Label htmlFor="facilityNumber" className="text-gray-900 dark:text-white">Dorm Room Number</Label>
                    <Select
                      value={reservationForm.watch("facilityNumber")}
                      onValueChange={(value) => reservationForm.setValue("facilityNumber", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room number (001-300)" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {dormRooms.map((room) => (
                          <SelectItem key={room} value={room}>Room {room}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {reservationForm.watch("facilityType") === "classroom" && (
                  <div className="space-y-2">
                    <Label htmlFor="facilityNumber" className="text-gray-900 dark:text-white">Classroom</Label>
                    <Select
                      value={reservationForm.watch("facilityNumber")}
                      onValueChange={(value) => reservationForm.setValue("facilityNumber", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select classroom" />
                      </SelectTrigger>
                      <SelectContent>
                        {classrooms.map((room) => (
                          <SelectItem key={room} value={room}>{room}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Profile Selection */}
                <div className="space-y-2">
                  <Label htmlFor="profileId" className="text-gray-900 dark:text-white">
                    Select Profile
                    {profiles.length === 0 && (
                      <span className="text-sm text-amber-600 ml-2">(Create a profile first)</span>
                    )}
                  </Label>
                  <Select
                    value={reservationForm.watch("profileId")}
                    onValueChange={(value) => reservationForm.setValue("profileId", value)}
                    disabled={profiles.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.firstName} {profile.lastName} - {profile.profileType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {reservationForm.formState.errors.profileId && (
                    <p className="text-sm text-red-600">{reservationForm.formState.errors.profileId.message}</p>
                  )}
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">Check-in Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkInDate && "text-gray-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkInDate}
                          onSelect={(date) => {
                            setCheckInDate(date);
                            if (date) reservationForm.setValue("checkIn", date);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {reservationForm.formState.errors.checkIn && (
                      <p className="text-sm text-red-600">{reservationForm.formState.errors.checkIn.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">Check-out Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkOutDate && "text-gray-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOutDate ? format(checkOutDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkOutDate}
                          onSelect={(date) => {
                            setCheckOutDate(date);
                            if (date) reservationForm.setValue("checkOut", date);
                          }}
                          disabled={(date) => !checkInDate || date <= checkInDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {reservationForm.formState.errors.checkOut && (
                      <p className="text-sm text-red-600">{reservationForm.formState.errors.checkOut.message}</p>
                    )}
                  </div>
                </div>

                {/* Duration Display */}
                {checkInDate && checkOutDate && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Duration: {differenceInDays(checkOutDate, checkInDate)} night(s)
                    </p>
                  </div>
                )}

                {/* Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-gray-900 dark:text-white">Purpose of Reservation</Label>
                  <Textarea
                    {...reservationForm.register("purpose")}
                    placeholder="Training session, examination period, guest accommodation, etc."
                    rows={3}
                  />
                  {reservationForm.formState.errors.purpose && (
                    <p className="text-sm text-red-600">{reservationForm.formState.errors.purpose.message}</p>
                  )}
                </div>

                {/* Special Requests */}
                <div className="space-y-2">
                  <Label htmlFor="specialRequests" className="text-gray-900 dark:text-white">Special Requests (Optional)</Label>
                  <Textarea
                    {...reservationForm.register("specialRequests")}
                    placeholder="Accessibility needs, equipment requirements, etc."
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Create Reservation
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Manage Reservations Tab */}
        {activeTab === "manage" && (
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">No reservations yet</p>
                </CardContent>
              </Card>
            ) : (
              reservations.map((reservation) => (
                <Card key={reservation.id} className="bg-white dark:bg-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-gray-900 dark:text-white">
                          {reservation.facilityType.charAt(0).toUpperCase() + reservation.facilityType.slice(1)}
                          {reservation.facilityNumber && ` - ${reservation.facilityNumber}`}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                          {reservation.profileName}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            reservation.status === "active" ? "default" :
                            reservation.status === "completed" ? "secondary" : "destructive"
                          }
                        >
                          {reservation.status}
                        </Badge>
                        {reservation.needsCleaning && (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            Needs Cleaning
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Check-in</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {format(new Date(reservation.checkIn), "PPP")}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Check-out</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {format(new Date(reservation.checkOut), "PPP")}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Purpose</p>
                        <p className="text-gray-900 dark:text-white">{reservation.purpose}</p>
                      </div>
                      {reservation.specialRequests && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Special Requests</p>
                          <p className="text-gray-900 dark:text-white">{reservation.specialRequests}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        {reservation.status === "active" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markForCleaning(reservation.id)}
                              disabled={reservation.needsCleaning}
                            >
                              Mark for Cleaning
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => cancelReservation(reservation.id)}
                            >
                              Cancel Reservation
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Profile Management Tab */}
        {activeTab === "profiles" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={showProfileDialog} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingProfile ? "Edit Profile" : "Create New Profile"}</DialogTitle>
                    <DialogDescription>
                      {editingProfile ? "Update profile information" : "Add a person to the profile management system"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input {...profileForm.register("firstName")} placeholder="John" />
                        {profileForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600">{profileForm.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input {...profileForm.register("lastName")} placeholder="Doe" />
                        {profileForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600">{profileForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input {...profileForm.register("email")} type="email" placeholder="john.doe@example.com" />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input {...profileForm.register("phone")} type="tel" placeholder="(555) 123-4567" />
                      {profileForm.formState.errors.phone && (
                        <p className="text-sm text-red-600">{profileForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profileType">Profile Type</Label>
                      <Select
                        value={profileForm.watch("profileType")}
                        onValueChange={(value) => profileForm.setValue("profileType", value as ProfileType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Applicant">Applicant</SelectItem>
                          <SelectItem value="Cadet">Cadet</SelectItem>
                          <SelectItem value="Trooper">Trooper</SelectItem>
                          <SelectItem value="Instructor">Instructor</SelectItem>
                          <SelectItem value="Administrator">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full">
                      {editingProfile ? "Update Profile" : "Create Profile"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {profiles.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="py-12 text-center">
                  <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 mb-4">No profiles yet</p>
                  <Button onClick={() => setShowProfileDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Profile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((profile) => (
                  <Card key={profile.id} className="bg-white dark:bg-gray-800">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white">
                            {profile.firstName} {profile.lastName}
                          </CardTitle>
                          <Badge className="mt-1">{profile.profileType}</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditProfile(profile)}
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProfile(profile.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-gray-900 dark:text-white">{profile.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="text-gray-900 dark:text-white">{profile.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">ID</p>
                          <p className="text-xs font-mono text-gray-900 dark:text-white">{profile.id}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
