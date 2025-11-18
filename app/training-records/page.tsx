"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, BookOpen, Upload, Trash2, FileText, Clock, Calendar, Users, UserPlus, X } from 'lucide-react';
import { toast } from "sonner";

// Types
interface ClassMaterial {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

interface TrainingClass {
  id: string;
  name: string;
  description: string;
  duration: number;
  durationType: "hours" | "days" | "weeks";
  prerequisites: string[];
  materials: ClassMaterial[];
  createdAt: string;
}

interface ScheduledClass {
  id: string;
  classId: string;
  className: string;
  startDate: string;
  maxAttendees: number;
  participants: Participant[];
  createdAt: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  type: string;
}

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
}

// Zod schema for class creation
const classSchema = z.object({
  name: z.string().min(3, "Class name must be at least 3 characters").max(100, "Class name is too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description is too long"),
  duration: z.coerce.number().min(1, "Duration must be at least 1").max(1000, "Duration is too long"),
  durationType: z.enum(["hours", "days", "weeks"], {
    errorMap: () => ({ message: "Please select a duration type" }),
  }),
  prerequisites: z.string().optional(),
});

// Zod schema for scheduled class
const scheduledClassSchema = z.object({
  classId: z.string().min(1, "Please select a class"),
  startDate: z.string().min(1, "Start date is required"),
  maxAttendees: z.coerce.number().min(1, "Must have at least 1 attendee").max(100, "Cannot exceed 100 attendees"),
});

type ClassFormData = z.infer<typeof classSchema>;
type ScheduledClassFormData = z.infer<typeof scheduledClassSchema>;

export default function TrainingRecordsPage() {
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<TrainingClass | null>(null);
  const [materials, setMaterials] = useState<ClassMaterial[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [selectedClassForSchedule, setSelectedClassForSchedule] = useState<TrainingClass | null>(null);
  const [mounted, setMounted] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [currentScheduledClassId, setCurrentScheduledClassId] = useState<string | null>(null);
  const [isParticipantDialogOpen, setIsParticipantDialogOpen] = useState(false);


  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
  });

  const {
    register: registerSchedule,
    handleSubmit: handleSubmitSchedule,
    reset: resetSchedule,
    setValue: setValueSchedule,
    formState: { errors: errorsSchedule },
  } = useForm<ScheduledClassFormData>({
    resolver: zodResolver(scheduledClassSchema),
  });

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedClasses = localStorage.getItem("training-classes");
      if (storedClasses) {
        setClasses(JSON.parse(storedClasses));
      }
      const storedScheduled = localStorage.getItem("scheduled-classes");
      if (storedScheduled) {
        setScheduledClasses(JSON.parse(storedScheduled));
      }
      const storedProfiles = localStorage.getItem("psp-profiles");
      if (storedProfiles) {
        const parsedProfiles = JSON.parse(storedProfiles);
        setProfiles(parsedProfiles);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("training-classes", JSON.stringify(classes));
    }
  }, [classes, mounted]);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("scheduled-classes", JSON.stringify(scheduledClasses));
    }
  }, [scheduledClasses, mounted]);

  const onSubmit = (data: ClassFormData) => {
    const prerequisites = data.prerequisites
      ? data.prerequisites.split(",").map((p) => p.trim()).filter((p) => p.length > 0)
      : [];

    const newClass: TrainingClass = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      duration: data.duration,
      durationType: data.durationType,
      prerequisites,
      materials: materials,
      createdAt: new Date().toISOString(),
    };

    setClasses([...classes, newClass]);
    setMaterials([]);
    reset();
    toast.success("Class created successfully!");
  };

  const onScheduleSubmit = (data: ScheduledClassFormData) => {
    const selectedClass = classes.find(c => c.id === data.classId);
    if (!selectedClass) {
      toast.error("Selected class not found");
      return;
    }

    const newScheduledClass: ScheduledClass = {
      id: Date.now().toString(),
      classId: data.classId,
      className: selectedClass.name,
      startDate: data.startDate,
      maxAttendees: data.maxAttendees,
      participants: [], // Initialize with empty participants array
      createdAt: new Date().toISOString(),
    };

    setScheduledClasses([...scheduledClasses, newScheduledClass]);
    resetSchedule();
    setSelectedClassForSchedule(null);
    toast.success("Class scheduled successfully!");
  };

  const handleClassSelection = (classId: string) => {
    setValueSchedule("classId", classId);
    const selected = classes.find(c => c.id === classId);
    setSelectedClassForSchedule(selected || null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMaterials: ClassMaterial[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: formatFileSize(file.size),
      uploadedAt: new Date().toISOString(),
    }));

    setMaterials([...materials, ...newMaterials]);
    toast.success(`${newMaterials.length} file(s) uploaded successfully!`);
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
    toast.info("Material removed");
  };

  const deleteClass = (id: string) => {
    setClasses(classes.filter((c) => c.id !== id));
    toast.success("Class deleted successfully!");
  };

  const deleteScheduledClass = (id: string) => {
    setScheduledClasses(scheduledClasses.filter((c) => c.id !== id));
    toast.success("Scheduled class deleted successfully!");
  };

  const openParticipantDialog = (scheduledClassId: string) => {
    setCurrentScheduledClassId(scheduledClassId);
    const scheduledClass = scheduledClasses.find(sc => sc.id === scheduledClassId);
    if (scheduledClass) {
      setSelectedParticipants(scheduledClass.participants.map(p => p.id));
    }
    setIsParticipantDialogOpen(true);
  };

  const toggleParticipant = (profileId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(profileId)) {
        return prev.filter(id => id !== profileId);
      } else {
        return [...prev, profileId];
      }
    });
  };

  const saveParticipants = () => {
    if (!currentScheduledClassId) return;

    const scheduledClass = scheduledClasses.find(sc => sc.id === currentScheduledClassId);
    if (!scheduledClass) return;

    // Check if number of participants exceeds max attendees
    if (selectedParticipants.length > scheduledClass.maxAttendees) {
      toast.error(`Cannot add more than ${scheduledClass.maxAttendees} participants`);
      return;
    }

    const participants: Participant[] = selectedParticipants.map(profileId => {
      const profile = profiles.find(p => p.id === profileId);
      return {
        id: profile?.id || profileId,
        name: profile ? `${profile.firstName} ${profile.lastName}` : "Unknown",
        email: profile?.email || "",
        type: profile?.type || "",
      };
    });

    setScheduledClasses(prev => prev.map(sc => 
      sc.id === currentScheduledClassId 
        ? { ...sc, participants }
        : sc
    ));

    setIsParticipantDialogOpen(false);
    setCurrentScheduledClassId(null);
    setSelectedParticipants([]);
    toast.success(`${participants.length} participant(s) added successfully!`);
  };

  const removeParticipant = (scheduledClassId: string, participantId: string) => {
    setScheduledClasses(prev => prev.map(sc => 
      sc.id === scheduledClassId 
        ? { ...sc, participants: sc.participants.filter(p => p.id !== participantId) }
        : sc
    ));
    toast.info("Participant removed");
  };


  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getDurationDisplay = (duration: number, type: string): string => {
    return `${duration} ${type}${duration > 1 ? "" : ""}`;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Training Records Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create and manage training classes, upload curriculum materials, and set prerequisites
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="create">Create Class</TabsTrigger>
            <TabsTrigger value="classes">All Classes</TabsTrigger>
            <TabsTrigger value="roster">Schedule Class</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-6">
            {classes.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Classes Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Get started by creating your first training class
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <Card key={cls.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-start justify-between">
                        <span className="flex-1">{cls.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteClass(cls.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 line-clamp-2">
                        {cls.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="w-4 h-4" />
                        <span>{getDurationDisplay(cls.duration, cls.durationType)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <FileText className="w-4 h-4" />
                        <span>{cls.materials.length} Material(s)</span>
                      </div>

                      {cls.prerequisites.length > 0 && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Prerequisites:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {cls.prerequisites.map((prereq, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded"
                              >
                                {prereq}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {cls.materials.length > 0 && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Class Materials:
                          </p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {cls.materials.map((material) => (
                              <div
                                key={material.id}
                                className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded"
                              >
                                <FileText className="w-3 h-3 flex-shrink-0" />
                                <span className="flex-1 truncate">{material.name}</span>
                                <span className="text-xs text-gray-500">{material.size}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="roster" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Schedule a Class</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Create a scheduled session for an available class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitSchedule(onScheduleSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="classId" className="text-gray-900 dark:text-white">
                      Select Class <span className="text-red-500">*</span>
                    </Label>
                    <Select onValueChange={handleClassSelection}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No classes available. Create a class first.
                          </div>
                        ) : (
                          classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errorsSchedule.classId && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errorsSchedule.classId.message}</p>
                    )}
                  </div>

                  {selectedClassForSchedule && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedClassForSchedule.name}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedClassForSchedule.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Duration: {getDurationDisplay(selectedClassForSchedule.duration, selectedClassForSchedule.durationType)}</span>
                      </div>

                      {selectedClassForSchedule.prerequisites.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Prerequisites:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedClassForSchedule.prerequisites.map((prereq, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded"
                              >
                                {prereq}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-gray-900 dark:text-white">
                        Class Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...registerSchedule("startDate")}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                      {errorsSchedule.startDate && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errorsSchedule.startDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxAttendees" className="text-gray-900 dark:text-white">
                        Max Number of Attendees <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="maxAttendees"
                        type="number"
                        {...registerSchedule("maxAttendees")}
                        placeholder="e.g., 30"
                        min="1"
                        max="100"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                      {errorsSchedule.maxAttendees && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errorsSchedule.maxAttendees.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetSchedule();
                        setSelectedClassForSchedule(null);
                      }}
                    >
                      Clear Form
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Class
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Scheduled Classes
              </h2>
              
              {scheduledClasses.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Scheduled Classes
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Schedule your first class session above
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scheduledClasses.map((scheduled) => {
                    const classDetails = classes.find(c => c.id === scheduled.classId);
                    return (
                      <Card key={scheduled.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900 dark:text-white flex items-start justify-between">
                            <span className="flex-1">{scheduled.className}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteScheduledClass(scheduled.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Calendar className="w-4 h-4" />
                            <span>Start: {new Date(scheduled.startDate).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Users className="w-4 h-4" />
                            <span>Enrolled: {scheduled.participants.length} / {scheduled.maxAttendees}</span>
                          </div>

                          {classDetails && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                                <Clock className="w-4 h-4" />
                                <span>{getDurationDisplay(classDetails.duration, classDetails.durationType)}</span>
                              </div>
                              
                              {classDetails.prerequisites.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Prerequisites:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {classDetails.prerequisites.map((prereq, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded"
                                      >
                                        {prereq}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {scheduled.participants.length > 0 && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Participants:
                              </p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {scheduled.participants.map((participant) => (
                                  <div
                                    key={participant.id}
                                    className="flex items-center justify-between gap-2 text-xs bg-gray-50 dark:bg-gray-700/50 p-2 rounded"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {participant.name}
                                      </p>
                                      <p className="text-gray-600 dark:text-gray-400 truncate">
                                        {participant.email}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeParticipant(scheduled.id, participant.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-6 w-6 p-0"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={() => openParticipantDialog(scheduled.id)}
                            className="w-full mt-3 bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Manage Participants
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Create New Training Class</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Add a new class with curriculum materials and prerequisites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-900 dark:text-white">
                      Class Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g., Advanced Firearms Training"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-900 dark:text-white">
                      Class Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Provide a detailed description of the class content and objectives"
                      rows={4}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-gray-900 dark:text-white">
                        Duration <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        {...register("duration")}
                        placeholder="e.g., 40"
                        min="1"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                      {errors.duration && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.duration.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="durationType" className="text-gray-900 dark:text-white">
                        Duration Type <span className="text-red-500">*</span>
                      </Label>
                      <Select onValueChange={(value) => setValue("durationType", value as "hours" | "days" | "weeks")}>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.durationType && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.durationType.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prerequisites" className="text-gray-900 dark:text-white">
                      Prerequisites (comma-separated)
                    </Label>
                    <Input
                      id="prerequisites"
                      {...register("prerequisites")}
                      placeholder="e.g., Basic Firearms, Physical Fitness Test"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Separate multiple prerequisites with commas
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-900 dark:text-white">Class Materials & Curriculum</Label>
                    <div className="flex items-center gap-3">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm font-medium">Upload Files</span>
                        </div>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF, DOC, PPT, XLS, TXT files
                      </p>
                    </div>

                    {materials.length > 0 && (
                      <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Uploaded Materials ({materials.length})
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {materials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {material.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {material.size}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMaterial(material.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        setMaterials([]);
                      }}
                    >
                      Clear Form
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Class
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isParticipantDialogOpen} onOpenChange={setIsParticipantDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Manage Class Participants</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                Select participants to add to this class session
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {profiles.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No profiles available. Create user registrations or applications first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Checkbox
                        id={profile.id}
                        checked={selectedParticipants.includes(profile.id)}
                        onCheckedChange={() => toggleParticipant(profile.id)}
                      />
                      <label
                        htmlFor={profile.id}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {profile.firstName} {profile.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {profile.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Type: {profile.type}
                        </p>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedParticipants.length} participant(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsParticipantDialogOpen(false);
                      setSelectedParticipants([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveParticipants}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={selectedParticipants.length === 0}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Participants
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
