"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Plus, Search, Calendar, BookOpen, Building2, UserPlus } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to PSP Academy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Pennsylvania State Police Training and Application Management System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Plus className="w-5 h-5 text-blue-600" />
                New Application
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Submit a new application to join the Pennsylvania State Police
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/new-application">
                <Button className="w-full" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Application
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <UserPlus className="w-5 h-5 text-purple-600" />
                User Registration
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Register with employment details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/user-registration">
                <Button variant="outline" className="w-full" size="lg">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Search className="w-5 h-5 text-green-600" />
                Track Application
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Check the status of your submitted applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/track-application">
                <Button variant="outline" className="w-full" size="lg">
                  <Search className="w-4 h-4 mr-2" />
                  Track Status
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Academy Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/facility-booking">
              <Card className="bg-white dark:bg-gray-800 border-0 shadow hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <Building2 className="w-8 h-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg text-gray-900 dark:text-white">Facility Booking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Reserve dorm rooms, classrooms, and training facilities
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/training-records">
              <Card className="bg-white dark:bg-gray-800 border-0 shadow hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg text-gray-900 dark:text-white">Training Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Access class materials and track your training history
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow">
              <CardHeader>
                <Calendar className="w-8 h-8 text-orange-600 mb-2" />
                <CardTitle className="text-lg text-gray-900 dark:text-white">Exam Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sign up for exams and receive automated notifications
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
