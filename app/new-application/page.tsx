"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must not exceed 50 characters"),
  middleName: z.string().max(50, "Middle name must not exceed 50 characters").optional().or(z.literal("")),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must not exceed 50 characters"),
  suffix: z.string().max(10, "Suffix must not exceed 10 characters").optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^$$?([0-9]{3})$$?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, "Please enter a valid 10-digit US phone number"),
  phoneType: z.enum(["Mobile", "Home", "Work"], {
    errorMap: () => ({ message: "Please select a phone type" })
  }),
  homeAddress: z.string().min(10, "Please enter a complete home address"),
  mailingAddress: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }, "You must be at least 18 years old to apply"),
});

type FormData = z.infer<typeof formSchema>;

const STORAGE_KEY = "psp-academy-application-draft";

export default function NewApplication() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      email: "",
      phone: "",
      phoneType: undefined,
      homeAddress: "",
      mailingAddress: "",
      dateOfBirth: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (isClient) {
      try {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          form.reset(parsedDraft);
          toast.info("Previous draft loaded");
        }
      } catch (error) {
        console.error("[v0] Error loading draft:", error);
      }
    }
  }, [isClient, form]);

  useEffect(() => {
    if (isClient) {
      const subscription = form.watch((value) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch (error) {
          console.error("[v0] Error saving draft:", error);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isClient]);

  const steps = [
    {
      title: "Personal Information",
      description: "Enter your basic information",
      fields: ["firstName", "middleName", "lastName", "suffix"] as const,
    },
    {
      title: "Contact Information",
      description: "Provide your contact details",
      fields: ["email", "phone", "phoneType"] as const,
    },
    {
      title: "Address Information",
      description: "Enter your address details",
      fields: ["homeAddress", "mailingAddress"] as const,
    },
    {
      title: "Date of Birth",
      description: "Verify your age eligibility",
      fields: ["dateOfBirth"] as const,
    },
  ];

  const currentStepFields = steps[currentStep].fields;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateCurrentStep = async () => {
    const isValid = await form.trigger(currentStepFields as any);
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: FormData) => {
    if (!isClient) return;

    try {
      const appId = `PSP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const applicationData = {
        id: appId,
        data: data,
        submittedAt: new Date().toISOString(),
        status: "Submitted",
      };
      
      localStorage.setItem(`psp-application-${appId}`, JSON.stringify(applicationData));
      
      const existingApps = localStorage.getItem("psp-applications-list");
      const appsList = existingApps ? JSON.parse(existingApps) : [];
      appsList.push(appId);
      localStorage.setItem("psp-applications-list", JSON.stringify(appsList));
      
      localStorage.removeItem(STORAGE_KEY);
      
      setApplicationId(appId);
      toast.success("Application submitted successfully!");
      form.reset();
    } catch (error) {
      console.error("[v0] Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (applicationId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">Application Submitted</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Your application has been successfully submitted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Your Application ID:</p>
                <p className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400">{applicationId}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                Please save this ID to track your application status
              </p>
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => {
                  setApplicationId(null);
                  setCurrentStep(0);
                }}>
                  Submit Another Application
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/track-application"}>
                  Track Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            PSP Academy Application
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete all steps to submit your application
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`text-xs ${
                  index === currentStep
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : index < currentStep
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">{steps[currentStep].title}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} className="bg-white dark:bg-gray-900" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Middle Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Michael" {...field} className="bg-white dark:bg-gray-900" />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} className="bg-white dark:bg-gray-900" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="suffix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Suffix</FormLabel>
                          <FormControl>
                            <Input placeholder="Jr., Sr., III, etc." {...field} className="bg-white dark:bg-gray-900" />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} className="bg-white dark:bg-gray-900" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Phone Number *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 123-4567" {...field} className="bg-white dark:bg-gray-900" />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            10-digit US phone number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Phone Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white dark:bg-gray-900">
                                <SelectValue placeholder="Select phone type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mobile">Mobile</SelectItem>
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Work">Work</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="homeAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Home Address *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="123 Main Street&#10;Anytown, PA 12345"
                              className="resize-none bg-white dark:bg-gray-900"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            Include street, city, state, and ZIP code
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mailingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Mailing Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="If different from home address"
                              className="resize-none bg-white dark:bg-gray-900"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            Optional - Leave blank if same as home address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Date of Birth *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white dark:bg-gray-900" />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            You must be at least 18 years old to apply
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  {currentStep < steps.length - 1 ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit">
                      Submit Application
                      <Check className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
          Your progress is automatically saved as you complete each field
        </p>
      </div>
    </div>
  );
}
