"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Briefcase, Calendar, Mail, Phone, MapPin, Building2, FileText } from 'lucide-react';
import { toast } from "sonner";

interface Profile {
  id: string;
  type: "application" | "registration";
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  homeAddress: string;
  mailingAddress?: string;
  submittedAt: string;
  // User Registration specific fields
  employerName?: string;
  employerEmail?: string;
  employerPhone?: string;
  bestContactMethod?: string;
  businessAddress?: string;
  title?: string;
  employmentStartDate?: string;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [searchQuery, profiles, activeTab]);

  const loadProfiles = () => {
    if (typeof window === "undefined") return;

    try {
      const allProfiles: Profile[] = [];

      // Load applications
      const applicationsStr = localStorage.getItem("psp_applications");
      if (applicationsStr) {
        const applications = JSON.parse(applicationsStr);
        Object.values(applications).forEach((app: any) => {
          allProfiles.push({
            id: app.applicationId,
            type: "application",
            firstName: app.firstName,
            lastName: app.lastName,
            middleName: app.middleName,
            suffix: app.suffix,
            email: app.email,
            phone: app.phone,
            dateOfBirth: app.dateOfBirth,
            homeAddress: app.homeAddress,
            mailingAddress: app.mailingAddress,
            submittedAt: app.submittedAt,
          });
        });
      }

      // Load user registrations
      const registrationsStr = localStorage.getItem("psp_user_registrations");
      if (registrationsStr) {
        const registrations = JSON.parse(registrationsStr);
        registrations.forEach((reg: any) => {
          allProfiles.push({
            id: reg.userId,
            type: "registration",
            firstName: reg.firstName,
            lastName: reg.lastName,
            middleName: reg.middleName,
            suffix: reg.suffix,
            email: reg.email,
            phone: reg.phone,
            dateOfBirth: reg.dateOfBirth,
            homeAddress: reg.homeAddress,
            mailingAddress: reg.mailingAddress,
            submittedAt: reg.registeredAt,
            employerName: reg.employerName,
            employerEmail: reg.employerEmail,
            employerPhone: reg.employerPhone,
            bestContactMethod: reg.bestContactMethod,
            businessAddress: reg.businessAddress,
            title: reg.title,
            employmentStartDate: reg.employmentStartDate,
          });
        });
      }

      // Sort by submission date (newest first)
      allProfiles.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      setProfiles(allProfiles);
      toast.success(`Loaded ${allProfiles.length} profiles`);
    } catch (error) {
      console.error("Error loading profiles:", error);
      toast.error("Failed to load profiles");
    }
  };

  const filterProfiles = () => {
    let filtered = profiles;

    // Filter by type
    if (activeTab !== "all") {
      filtered = filtered.filter((p) => p.type === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.firstName.toLowerCase().includes(query) ||
          p.lastName.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query) ||
          (p.employerName && p.employerName.toLowerCase().includes(query))
      );
    }

    setFilteredProfiles(filtered);
  };

  const viewProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFullName = (profile: Profile) => {
    return [profile.firstName, profile.middleName, profile.lastName, profile.suffix]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile Management</h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and manage all user registrations and applications
          </p>
        </div>

        <Card className="mb-6 bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Search Profiles</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Search by name, email, ID, or employer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search profiles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={loadProfiles} variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800">
            <TabsTrigger value="all">
              All Profiles ({profiles.length})
            </TabsTrigger>
            <TabsTrigger value="application">
              Applications ({profiles.filter((p) => p.type === "application").length})
            </TabsTrigger>
            <TabsTrigger value="registration">
              Registrations ({profiles.filter((p) => p.type === "registration").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredProfiles.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow">
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-2">No profiles found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Profiles will appear here once applications or registrations are submitted"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <Card
                key={profile.id}
                className="bg-white dark:bg-gray-800 border-0 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => viewProfile(profile)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 dark:text-white mb-1">
                        {getFullName(profile)}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge
                          variant={profile.type === "application" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {profile.type === "application" ? "Application" : "Registration"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                    {profile.employerName && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{profile.employerName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Calendar className="w-3 h-3" />
                      <span>Submitted: {formatDate(profile.submittedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {selectedProfile && getFullName(selectedProfile)}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                {selectedProfile && (
                  <div className="flex gap-2 mt-2">
                    <Badge
                      variant={selectedProfile.type === "application" ? "default" : "secondary"}
                    >
                      {selectedProfile.type === "application" ? "Application" : "Registration"}
                    </Badge>
                    <Badge variant="outline">ID: {selectedProfile.id}</Badge>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedProfile && (
              <div className="space-y-6 mt-4">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">First Name:</span>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.firstName}</p>
                    </div>
                    {selectedProfile.middleName && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Middle Name:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.middleName}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last Name:</span>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.lastName}</p>
                    </div>
                    {selectedProfile.suffix && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Suffix:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.suffix}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Date of Birth:</span>
                      <p className="text-gray-900 dark:text-white font-medium">{formatDate(selectedProfile.dateOfBirth)}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.phone}</p>
                    </div>
                    {selectedProfile.bestContactMethod && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Best Contact Method:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.bestContactMethod}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address Information
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Home Address:</span>
                      <p className="text-gray-900 dark:text-white font-medium whitespace-pre-line">
                        {selectedProfile.homeAddress}
                      </p>
                    </div>
                    {selectedProfile.mailingAddress && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Mailing Address:</span>
                        <p className="text-gray-900 dark:text-white font-medium whitespace-pre-line">
                          {selectedProfile.mailingAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment Information (for registrations) */}
                {selectedProfile.type === "registration" && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Employment Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Employer Name:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.employerName}</p>
                      </div>
                      {selectedProfile.title && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Title:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.title}</p>
                        </div>
                      )}
                      {selectedProfile.employmentStartDate && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Employment Start Date:</span>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {formatDate(selectedProfile.employmentStartDate)}
                          </p>
                        </div>
                      )}
                      {selectedProfile.employerEmail && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Employer Email:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.employerEmail}</p>
                        </div>
                      )}
                      {selectedProfile.employerPhone && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Employer Phone:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{selectedProfile.employerPhone}</p>
                        </div>
                      )}
                      {selectedProfile.businessAddress && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Business Address:</span>
                          <p className="text-gray-900 dark:text-white font-medium whitespace-pre-line">
                            {selectedProfile.businessAddress}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submission Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Submission Details
                  </h3>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formatDate(selectedProfile.submittedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
