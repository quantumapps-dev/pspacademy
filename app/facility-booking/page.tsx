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
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { toast } from "sonner";
import { Building2, CalendarIcon, Plus, Search, Trash2, AlertCircle } from 'lucide-react';
import { format, addDays, differenceInDays, isWithinInterval, parseISO } from "date-fns";
import { cn } from "../../lib/utils";

// Types
type FacilityType = "dorm" | "classroom" | "range" | "amphitheater" | "auditorium" | "gym" | "pool" | "other";
// type ProfileType = "Applicant" | "Cadet" | "PSP" | "Other LE";
// type ContactMethod = "Email" | "Phone" | "Mail";

// interface Profile {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   bestContact: ContactMethod;
//   homeAddress: string;
//   mailingAddress?: string;
//   profileType: ProfileType;
//   isActive: boolean;
//   photoUrl?: string;
//   dateOfBirth: string;
//   // LE-specific fields
//   leAgency?: string;
//   leContactInfo?: string;
//   leBusinessAddress?: string;
//   leTitle?: string;
//   employmentStartDate?: string;
//   createdAt: string;
// }

interface Reservation {
  id: string;
  facilityType: FacilityType;
  facilityNumber?: string;
  guestName: string; // Changed from profileId
  guestEmail: string; // Added guest email
  checkIn: string;
  checkOut: string;
  purpose: string;
  specialRequests?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  needsCleaning?: boolean;
}

// Zod Schemas
const reservationSchema = z.object({
  facilityType: z.enum(["dorm", "classroom", "range", "amphitheater", "auditorium", "gym", "pool", "other"]),
  facilityNumber: z.string().optional(),
  guestName: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  guestEmail: z.string().email("Invalid email address").optional(),
  instructorName: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  instructorEmail: z.string().email("Invalid email address").optional(),
  checkIn: z.date({ required_error: "Start date is required" }),
  checkOut: z.date({ required_error: "End date is required" }),
  purpose: z.string().min(10, "Purpose must be at least 10 characters").max(500),
  specialRequests: z.string().max(500).optional(),
}).refine((data) => {
  // If facility type is Dorm Room, guestName and guestEmail are required
  if (data.facilityType === "dorm") {
    return data.guestName && data.guestEmail;
  }
  // Otherwise, instructorName and instructorEmail are required
  return data.instructorName && data.instructorEmail;
}, {
  message: "Required contact information is missing",
  path: ["guestName"],
}).refine((data) => data.checkOut > data.checkIn, {
  message: "End date must be after start date",
  path: ["checkOut"],
}).refine((data) => {
  const days = differenceInDays(data.checkOut, data.checkIn);
  return days <= 180; // 6 months max
}, {
  message: "Reservation cannot exceed 6 months",
  path: ["checkOut"],
});

// type ProfileFormData = z.infer<typeof profileSchema>;
type ReservationFormData = z.infer<typeof reservationSchema>;

export default function FacilityBooking() {
  // const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  // Removed Profile Management tab
  const [activeTab, setActiveTab] = useState<"book" | "manage">("book");
  // Removed profile-related state
  // const [showProfileDialog, setShowProfileDialog] = useState(false);
  // const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  // const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  // const [dobDate, setDobDate] = useState<Date>();
  // const [employmentDate, setEmploymentDate] = useState<Date>();

  const [selectedFacility, setSelectedFacility] = useState<{type: FacilityType, number?: string} | null>(null);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [hasConflict, setHasConflict] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // const storedProfiles = localStorage.getItem("psp_profiles");
      const storedReservations = localStorage.getItem("psp_reservations");
      
      // if (storedProfiles) {
      //   setProfiles(JSON.parse(storedProfiles));
      // }
      if (storedReservations) {
        setReservations(JSON.parse(storedReservations));
      }
    }
  }, []);

  // Profile Form
  // Removed profile form
  // const profileForm = useForm<ProfileFormData>({
  //   resolver: zodResolver(profileSchema),
  //   defaultValues: {
  //     firstName: "",
  //     lastName: "",
  //     email: "",
  //     phone: "",
  //     bestContact: "Email",
  //     homeAddress: "",
  //     mailingAddress: "",
  //     profileType: "Cadet",
  //     isActive: true,
  //     photoUrl: "",
  //   },
  // });

  // Reservation Form
  const reservationForm = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      facilityType: "dorm",
      // Removed profileId and added guestName and guestEmail
      guestName: "",
      guestEmail: "",
      instructorName: "",
      instructorEmail: "",
      purpose: "",
      specialRequests: "",
    },
  });

  // Handle profile submission
  // Removed profile submission handler
  // const onProfileSubmit = (data: ProfileFormData) => {
  //   if (typeof window === "undefined") return;

  //   if (editingProfile) {
  //     // Update existing profile
  //     const updatedProfiles = profiles.map(p => 
  //       p.id === editingProfile.id 
  //         ? { 
  //             ...p, 
  //             ...data,
  //             dateOfBirth: data.dateOfBirth.toISOString(),
  //             employmentStartDate: data.employmentStartDate?.toISOString(),
  //           }
  //         : p
  //     );
  //     setProfiles(updatedProfiles);
  //     localStorage.setItem("psp_profiles", JSON.stringify(updatedProfiles));
  //     toast.success("Profile updated successfully!");
  //     setEditingProfile(null);
  //   } else {
  //     // Create new profile
  //     const newProfile: Profile = {
  //       id: `PROF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  //       ...data,
  //       dateOfBirth: data.dateOfBirth.toISOString(),
  //       employmentStartDate: data.employmentStartDate?.toISOString(),
  //       createdAt: new Date().toISOString(),
  //     };

  //     const updatedProfiles = [...profiles, newProfile];
  //     setProfiles(updatedProfiles);
  //     localStorage.setItem("psp_profiles", JSON.stringify(updatedProfiles));
  //     toast.success("Profile created successfully!");
  //   }

  //   profileForm.reset();
  //   setDobDate(undefined);
  //   setEmploymentDate(undefined);
  //   setShowProfileDialog(false);
  // };

  const getBookedDatesForFacility = (facilityType: FacilityType, facilityNumber?: string) => {
    if (typeof window === "undefined") return [];
    
    const facilityReservations = reservations.filter(r => 
      r.status === "active" && 
      r.facilityType === facilityType &&
      (!facilityNumber || r.facilityNumber === facilityNumber)
    );

    const dates: Date[] = [];
    facilityReservations.forEach(reservation => {
      const start = parseISO(reservation.checkIn);
      const end = parseISO(reservation.checkOut);
      
      // Add all dates in the reservation range
      let currentDate = start;
      while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
    });

    return dates;
  };

  const checkForConflicts = (facilityType: FacilityType, facilityNumber: string | undefined, checkIn: Date, checkOut: Date) => {
    if (typeof window === "undefined") return false;
    
    const facilityReservations = reservations.filter(r => 
      r.status === "active" && 
      r.facilityType === facilityType &&
      (!facilityNumber || r.facilityNumber === facilityNumber)
    );

    return facilityReservations.some(reservation => {
      const existingStart = parseISO(reservation.checkIn);
      const existingEnd = parseISO(reservation.checkOut);
      
      // Check if dates overlap
      return (
        (checkIn >= existingStart && checkIn <= existingEnd) ||
        (checkOut >= existingStart && checkOut <= existingEnd) ||
        (checkIn <= existingStart && checkOut >= existingEnd)
      );
    });
  };

  useEffect(() => {
    if (selectedFacility) {
      const dates = getBookedDatesForFacility(selectedFacility.type, selectedFacility.number);
      setBookedDates(dates);
    } else {
      setBookedDates([]);
    }
  }, [selectedFacility, reservations]);

  useEffect(() => {
    if (checkInDate && checkOutDate && selectedFacility) {
      const conflict = checkForConflicts(
        selectedFacility.type,
        selectedFacility.number,
        checkInDate,
        checkOutDate
      );
      setHasConflict(conflict);
    } else {
      setHasConflict(false);
    }
  }, [checkInDate, checkOutDate, selectedFacility, reservations]);


  // Handle reservation submission
  const onReservationSubmit = (data: ReservationFormData) => {
    if (typeof window === "undefined") return;

    // Check for conflicts before saving
    const hasConflict = checkForConflicts(
      data.facilityType,
      data.facilityNumber,
      data.checkIn,
      data.checkOut
    );

    if (hasConflict) {
      toast.error("This facility is already booked for the selected dates. Please choose different dates.");
      return;
    }

    const newReservation: Reservation = {
      id: `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      guestName: data.facilityType === "dorm" ? data.guestName! : data.instructorName!,
      guestEmail: data.facilityType === "dorm" ? data.guestEmail! : data.instructorEmail!,
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
    setSelectedFacility(null); // Reset selected facility on submission
  };

  // Delete profile
  // Removed delete profile function
  // const deleteProfile = (id: string) => {
  //   if (typeof window === "undefined") return;
    
  //   const updatedProfiles = profiles.filter(p => p.id !== id);
  //   setProfiles(updatedProfiles);
  //   localStorage.setItem("psp_profiles", JSON.stringify(updatedProfiles));
  //   toast.success("Profile deleted");
  // };

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

  // Handle photo upload
  // Removed photo upload handler
  // const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     if (file.size > 5 * 1024 * 1024) {
  //       toast.error("File size must be less than 5MB");
  //       return;
  //     }
      
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       profileForm.setValue("photoUrl", reader.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // Generate room numbers for dorms (1-300)
  const dormRooms = Array.from({ length: 300 }, (_, i) => (i + 1).toString().padStart(3, "0"));
  const classrooms = Array.from({ length: 12 }, (_, i) => `CR-${i + 1}`);

  // Open edit profile dialog
  // Removed openEditProfile function
  // const openEditProfile = (profile: Profile) => {
  //   setEditingProfile(profile);
  //   const dobDate = new Date(profile.dateOfBirth);
  //   setDobDate(dobDate);
    
  //   if (profile.employmentStartDate) {
  //     const empDate = new Date(profile.employmentStartDate);
  //     setEmploymentDate(empDate);
  //   }

  //   profileForm.reset({
  //     firstName: profile.firstName,
  //     lastName: profile.lastName,
  //     email: profile.email,
  //     phone: profile.phone,
  //     bestContact: profile.bestContact,
  //     homeAddress: profile.homeAddress,
  //     mailingAddress: profile.mailingAddress || "",
  //     profileType: profile.profileType,
  //     isActive: profile.isActive,
  //     photoUrl: profile.photoUrl || "",
  //     dateOfBirth: dobDate,
  //     leAgency: profile.leAgency || "",
  //     leContactInfo: profile.leContactInfo || "",
  //     leBusinessAddress: profile.leBusinessAddress || "",
  //     leTitle: profile.leTitle || "",
  //     employmentStartDate: profile.employmentStartDate ? new Date(profile.employmentStartDate) : undefined,
  //   });
  //   setShowProfileDialog(true);
  // };

  // Handle dialog close and reset editing state
  // Removed dialog close handler
  // const handleDialogClose = (open: boolean) => {
  //   setShowProfileDialog(open);
  //   if (!open) {
  //     setEditingProfile(null);
  //     setDobDate(undefined);
  //     setEmploymentDate(undefined);
  //     profileForm.reset();
  //   }
  // };

  // Watch profile type for conditional rendering
  // Removed watchProfileType
  // const watchProfileType = profileForm.watch("profileType");
  // const isLEProfile = watchProfileType === "PSP" || watchProfileType === "Other LE";

  const watchFacilityType = reservationForm.watch("facilityType");
  const isDormRoom = watchFacilityType === "dorm";

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
          {/* Removed Profile Management tab button */}
          {/* <button
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
          </button> */}
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
                    onValueChange={(value) => {
                      reservationForm.setValue("facilityType", value as FacilityType);
                      setSelectedFacility({ type: value as FacilityType });
                      reservationForm.setValue("facilityNumber", undefined);
                      setCheckInDate(undefined);
                      setCheckOutDate(undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="[Select Facility]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>[Select Facility]</SelectItem>
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
                      onValueChange={(value) => {
                        reservationForm.setValue("facilityNumber", value);
                        setSelectedFacility({ type: "dorm", number: value });
                        setCheckInDate(undefined);
                        setCheckOutDate(undefined);
                      }}
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
                      onValueChange={(value) => {
                        reservationForm.setValue("facilityNumber", value);
                        setSelectedFacility({ type: "classroom", number: value });
                        setCheckInDate(undefined);
                        setCheckOutDate(undefined);
                      }}
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

                {selectedFacility && (reservationForm.watch("facilityNumber") || !["dorm", "classroom"].includes(selectedFacility.type)) && (
                  <div className="space-y-3">
                    <Label className="text-gray-900 dark:text-white">Availability Calendar</Label>
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="flex gap-4 mb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded"></div>
                          <span className="text-gray-700 dark:text-gray-300">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded"></div>
                          <span className="text-gray-700 dark:text-gray-300">Booked</span>
                        </div>
                      </div>
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        disabled={(date) => date < new Date() || bookedDates.some(bookedDate => 
                          bookedDate.toDateString() === date.toDateString()
                        )}
                        modifiers={{
                          booked: bookedDates,
                        }}
                        modifiersClassNames={{
                          booked: "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 line-through",
                        }}
                        className="rounded-md border-none"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Red dates are already booked. You cannot select these dates.
                      </p>
                    </div>
                  </div>
                )}

                {isDormRoom ? (
                  // Guest Information for Dorm Rooms
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guestName" className="text-gray-900 dark:text-white">Guest Name</Label>
                      <Input {...reservationForm.register("guestName")} placeholder="John Doe" />
                      {reservationForm.formState.errors.guestName && (
                        <p className="text-sm text-red-600">{reservationForm.formState.errors.guestName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guestEmail" className="text-gray-900 dark:text-white">Guest Email</Label>
                      <Input {...reservationForm.register("guestEmail")} type="email" placeholder="john.doe@example.com" />
                      {reservationForm.formState.errors.guestEmail && (
                        <p className="text-sm text-red-600">{reservationForm.formState.errors.guestEmail.message}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Instructor Information for Other Facilities
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instructorName" className="text-gray-900 dark:text-white">Instructor Name</Label>
                      <Input {...reservationForm.register("instructorName")} placeholder="Jane Smith" />
                      {reservationForm.formState.errors.instructorName && (
                        <p className="text-sm text-red-600">{reservationForm.formState.errors.instructorName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instructorEmail" className="text-gray-900 dark:text-white">Instructor Email</Label>
                      <Input {...reservationForm.register("instructorEmail")} type="email" placeholder="jane.smith@psp.gov" />
                      {reservationForm.formState.errors.instructorEmail && (
                        <p className="text-sm text-red-600">{reservationForm.formState.errors.instructorEmail.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkInDate && "text-gray-500"
                          )}
                          disabled={!selectedFacility || (["dorm", "classroom"].includes(selectedFacility.type) && !reservationForm.watch("facilityNumber"))}
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
                          disabled={(date) => {
                            if (date < new Date()) return true;
                            return bookedDates.some(bookedDate => 
                              bookedDate.toDateString() === date.toDateString()
                            );
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {reservationForm.formState.errors.checkIn && (
                      <p className="text-sm text-red-600">{reservationForm.formState.errors.checkIn.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkOutDate && "text-gray-500"
                          )}
                          disabled={!checkInDate}
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
                          disabled={(date) => {
                            if (!checkInDate || date <= checkInDate) return true;
                            return bookedDates.some(bookedDate => 
                              bookedDate.toDateString() === date.toDateString()
                            );
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {reservationForm.formState.errors.checkOut && (
                      <p className="text-sm text-red-600">{reservationForm.formState.errors.checkOut.message}</p>
                    )}
                  </div>
                </div>

                {hasConflict && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This facility is already booked for the selected dates. Please choose different dates.
                    </AlertDescription>
                  </Alert>
                )}

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

                <Button type="submit" className="w-full" size="lg" disabled={hasConflict}>
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
                        {/* Display guestName instead of profileName */}
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                          {reservation.guestName}
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
                      {/* Added guest email display */}
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Guest Email</p>
                        <p className="text-gray-900 dark:text-white">{reservation.guestEmail}</p>
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
        {/* Removed Profile Management tab content */}
        {/* {activeTab === "profiles" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={showProfileDialog} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProfile ? "Edit Profile" : "Create New Profile"}</DialogTitle>
                    <DialogDescription>
                      {editingProfile ? "Update profile information" : "Add a person to the profile management system"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label>Profile Photo</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={profileForm.watch("photoUrl") || "/placeholder.svg"} />
                          <AvatarFallback>
                            {profileForm.watch("firstName")?.[0]}{profileForm.watch("lastName")?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Label htmlFor="photo-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                              <Upload className="w-4 h-4" />
                              <span className="text-sm">Upload Photo</span>
                            </div>
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG)</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input {...profileForm.register("firstName")} placeholder="John" />
                        {profileForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600">{profileForm.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input {...profileForm.register("lastName")} placeholder="Doe" />
                        {profileForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600">{profileForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dobDate && "text-gray-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dobDate ? format(dobDate, "PPP") : "Select date of birth"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dobDate}
                            onSelect={(date) => {
                              setDobDate(date);
                              if (date) profileForm.setValue("dateOfBirth", date);
                            }}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {profileForm.formState.errors.dateOfBirth && (
                        <p className="text-sm text-red-600">{profileForm.formState.errors.dateOfBirth.message}</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input {...profileForm.register("email")} type="email" placeholder="john.doe@example.com" />
                        {profileForm.formState.errors.email && (
                          <p className="text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input {...profileForm.register("phone")} type="tel" placeholder="(555) 123-4567" />
                        {profileForm.formState.errors.phone && (
                          <p className="text-sm text-red-600">{profileForm.formState.errors.phone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bestContact">Best Way to Contact *</Label>
                        <Select
                          value={profileForm.watch("bestContact")}
                          onValueChange={(value) => profileForm.setValue("bestContact", value as ContactMethod)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Phone">Phone</SelectItem>
                            <SelectItem value="Mail">Mail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Address Information</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="homeAddress">Home Address *</Label>
                        <Textarea
                          {...profileForm.register("homeAddress")}
                          placeholder="123 Main St, City, State ZIP"
                          rows={2}
                        />
                        {profileForm.formState.errors.homeAddress && (
                          <p className="text-sm text-red-600">{profileForm.formState.errors.homeAddress.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mailingAddress">Mailing Address (if different)</Label>
                        <Textarea
                          {...profileForm.register("mailingAddress")}
                          placeholder="P.O. Box 123, City, State ZIP"
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Profile Settings</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profileType">Profile Type *</Label>
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
                            <SelectItem value="PSP">PSP (Pennsylvania State Police)</SelectItem>
                            <SelectItem value="Other LE">Other Law Enforcement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="isActive">Active Status</Label>
                          <p className="text-sm text-gray-500">Is this profile currently active?</p>
                        </div>
                        <Switch
                          checked={profileForm.watch("isActive")}
                          onCheckedChange={(checked) => profileForm.setValue("isActive", checked)}
                        />
                      </div>
                    </div>

                    {isLEProfile && (
                      <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Law Enforcement Information</h3>
                        
                        <div className="space-y-2">
                          <Label htmlFor="leAgency">LE Agency *</Label>
                          <Input
                            {...profileForm.register("leAgency")}
                            placeholder="Agency name"
                          />
                          {profileForm.formState.errors.leAgency && (
                            <p className="text-sm text-red-600">{profileForm.formState.errors.leAgency.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="leTitle">Title *</Label>
                          <Input
                            {...profileForm.register("leTitle")}
                            placeholder="Officer, Detective, etc."
                          />
                          {profileForm.formState.errors.leTitle && (
                            <p className="text-sm text-red-600">{profileForm.formState.errors.leTitle.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="leContactInfo">LE Contact Information *</Label>
                          <Textarea
                            {...profileForm.register("leContactInfo")}
                            placeholder="Work phone, work email, etc."
                            rows={2}
                          />
                          {profileForm.formState.errors.leContactInfo && (
                            <p className="text-sm text-red-600">{profileForm.formState.errors.leContactInfo.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="leBusinessAddress">LE Business/Mailing Address *</Label>
                          <Textarea
                            {...profileForm.register("leBusinessAddress")}
                            placeholder="Agency address"
                            rows={2}
                          />
                          {profileForm.formState.errors.leBusinessAddress && (
                            <p className="text-sm text-red-600">{profileForm.formState.errors.leBusinessAddress.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Employment Start Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !employmentDate && "text-gray-500"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {employmentDate ? format(employmentDate, "PPP") : "Select employment start date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={employmentDate}
                                onSelect={(date) => {
                                  setEmploymentDate(date);
                                  if (date) profileForm.setValue("employmentStartDate", date);
                                }}
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {profileForm.formState.errors.employmentStartDate && (
                            <p className="text-sm text-red-600">{profileForm.formState.errors.employmentStartDate.message}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full" size="lg">
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
                      <div className="flex justify-between items-start mb-2">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={profile.photoUrl || "/placeholder.svg"} />
                          <AvatarFallback>
                            {profile.firstName[0]}{profile.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
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
                      <div>
                        <CardTitle className="text-gray-900 dark:text-white">
                          {profile.firstName} {profile.lastName}
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge>{profile.profileType}</Badge>
                          <Badge variant={profile.isActive ? "default" : "secondary"}>
                            {profile.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-gray-900 dark:text-white break-all">{profile.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="text-gray-900 dark:text-white">{profile.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Best Contact</p>
                          <p className="text-gray-900 dark:text-white">{profile.bestContact}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">DOB</p>
                          <p className="text-gray-900 dark:text-white">{format(new Date(profile.dateOfBirth), "PP")}</p>
                        </div>
                        {(profile.profileType === "PSP" || profile.profileType === "Other LE") && (
                          <>
                            <div className="pt-2 border-t">
                              <p className="text-gray-500 dark:text-gray-400">LE Agency</p>
                              <p className="text-gray-900 dark:text-white font-medium">{profile.leAgency}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Title</p>
                              <p className="text-gray-900 dark:text-white">{profile.leTitle}</p>
                            </div>
                          </>
                        )}
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
        )} */}
      </div>
    </div>
  );
}
