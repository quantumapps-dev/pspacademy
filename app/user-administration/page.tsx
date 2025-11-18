"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { Shield, UserPlus, Users, Lock, Trash2, Edit, Eye } from 'lucide-react';
import { toast } from "sonner";

// Define application modules and their sub-sections
const APPLICATION_MODULES = [
  {
    id: "new-application",
    name: "New Application",
    description: "Submit new PSP applications",
    sections: ["Personal Information", "Address Information", "Contact Information"]
  },
  {
    id: "track-application",
    name: "Track Application",
    description: "Track application status",
    sections: ["View Status", "Download Documents"]
  },
  {
    id: "user-registration",
    name: "User Registration",
    description: "Register new users",
    sections: ["Personal Information", "Contact Information", "Address Information", "Employment Information"]
  },
  {
    id: "profiles",
    name: "Profiles",
    description: "Manage user profiles",
    sections: ["View All Profiles", "View Applications", "View Registrations", "View Details"]
  },
  {
    id: "facility-booking",
    name: "Facility Booking",
    description: "Book and manage facilities",
    sections: ["Book Facility", "Manage Reservations", "Calendar View"]
  },
  {
    id: "training-records",
    name: "Training Records",
    description: "Manage training classes",
    sections: ["Create Class", "View Classes", "Schedule Class", "Manage Participants"]
  },
  {
    id: "user-administration",
    name: "User Administration",
    description: "Manage users and permissions",
    sections: ["Manage Users", "Manage Roles", "Assign Permissions"]
  }
];

const CRUD_PERMISSIONS = ["Create", "Read", "Update", "Delete"];

// Schema for user form
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name is required"),
  cellNumber: z.string().min(10, "Cell number must be at least 10 digits"),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["Active", "Inactive"])
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  cellNumber: string;
  role: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    [moduleId: string]: {
      [section: string]: string[]; // Array of CRUD permissions
    };
  };
}

export default function UserAdministration() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<Role["permissions"]>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  // Load data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("adminUsers");
      const storedRoles = localStorage.getItem("adminRoles");

      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }

      if (storedRoles) {
        setRoles(JSON.parse(storedRoles));
      } else {
        // Create default roles
        const defaultRoles: Role[] = [
          {
            id: "role-admin",
            name: "Administrator",
            description: "Full access to all modules",
            permissions: {}
          },
          {
            id: "role-instructor",
            name: "Instructor",
            description: "Access to training and facility modules",
            permissions: {}
          },
          {
            id: "role-applicant",
            name: "Applicant",
            description: "Limited access for applicants",
            permissions: {}
          }
        ];
        setRoles(defaultRoles);
        localStorage.setItem("adminRoles", JSON.stringify(defaultRoles));
      }
    }
  }, []);

  // Save users to localStorage
  const saveUsers = (updatedUsers: User[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminUsers", JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
  };

  // Save roles to localStorage
  const saveRoles = (updatedRoles: Role[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminRoles", JSON.stringify(updatedRoles));
      setRoles(updatedRoles);
    }
  };

  // Handle user form submission
  const onUserSubmit = (data: UserFormData) => {
    if (editingUser) {
      const updatedUsers = users.map((user) =>
        user.id === editingUser.id ? { ...user, ...data } : user
      );
      saveUsers(updatedUsers);
      toast.success("User updated successfully");
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      saveUsers([...users, newUser]);
      toast.success("User created successfully");
    }
    setIsUserDialogOpen(false);
    setEditingUser(null);
    reset();
  };

  // Handle role creation
  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (editingRole) {
      const updatedRoles = roles.map((role) =>
        role.id === editingRole.id
          ? { ...role, name: newRoleName, description: newRoleDescription, permissions: rolePermissions }
          : role
      );
      saveRoles(updatedRoles);
      toast.success("Role updated successfully");
    } else {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: newRoleName,
        description: newRoleDescription,
        permissions: rolePermissions
      };
      saveRoles([...roles, newRole]);
      toast.success("Role created successfully");
    }

    setIsRoleDialogOpen(false);
    setEditingRole(null);
    setNewRoleName("");
    setNewRoleDescription("");
    setRolePermissions({});
  };

  // Handle permission toggle
  const togglePermission = (moduleId: string, section: string, permission: string) => {
    setRolePermissions((prev) => {
      const updated = { ...prev };
      if (!updated[moduleId]) {
        updated[moduleId] = {};
      }
      if (!updated[moduleId][section]) {
        updated[moduleId][section] = [];
      }

      const permissions = updated[moduleId][section];
      const index = permissions.indexOf(permission);
      if (index > -1) {
        updated[moduleId][section] = permissions.filter((p) => p !== permission);
      } else {
        updated[moduleId][section] = [...permissions, permission];
      }

      return updated;
    });
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setValue("username", user.username);
    setValue("email", user.email);
    setValue("fullName", user.fullName);
    setValue("cellNumber", user.cellNumber);
    setValue("role", user.role);
    setValue("status", user.status);
    setIsUserDialogOpen(true);
  };

  // Handle edit role
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description);
    setRolePermissions(role.permissions);
    setIsRoleDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId: string) => {
    const updatedUsers = users.filter((user) => user.id !== userId);
    saveUsers(updatedUsers);
    toast.success("User deleted successfully");
  };

  // Handle delete role
  const handleDeleteRole = (roleId: string) => {
    const updatedRoles = roles.filter((role) => role.id !== roleId);
    saveRoles(updatedRoles);
    toast.success("Role deleted successfully");
  };

  // View user permissions
  const viewUserPermissions = (user: User) => {
    setSelectedUser(user);
    setIsPermissionDialogOpen(true);
  };

  // Get user role object
  const getUserRole = (user: User) => {
    return roles.find((role) => role.name === user.role);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Administration
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, roles, and access permissions across all modules
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="w-4 h-4 mr-2" />
              Manage Roles
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Lock className="w-4 h-4 mr-2" />
              Module Permissions
            </TabsTrigger>
          </TabsList>

          {/* Manage Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Create and manage user accounts</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEditingUser(null);
                    reset();
                    setIsUserDialogOpen(true);
                  }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No users found. Create your first user.</p>
                  ) : (
                    <div className="grid gap-4">
                      {users.map((user) => (
                        <Card key={user.id} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{user.fullName}</h3>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    user.status === "Active" 
                                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  }`}>
                                    {user.status}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  <p><strong>Username:</strong> {user.username}</p>
                                  <p><strong>Email:</strong> {user.email}</p>
                                  <p><strong>Cell Number (MFA):</strong> {user.cellNumber}</p>
                                  <p><strong>Role:</strong> {user.role}</p>
                                  <p className="text-xs text-gray-500">
                                    Created: {new Date(user.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => viewUserPermissions(user)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>Define roles and their permissions</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEditingRole(null);
                    setNewRoleName("");
                    setNewRoleDescription("");
                    setRolePermissions({});
                    setIsRoleDialogOpen(true);
                  }}>
                    <Shield className="w-4 h-4 mr-2" />
                    Create Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No roles found.</p>
                  ) : (
                    <div className="grid gap-4">
                      {roles.map((role) => (
                        <Card key={role.id} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-2">{role.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {role.description}
                                </p>
                                <div className="text-xs text-gray-500">
                                  {Object.keys(role.permissions).length} module(s) configured
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRole(role)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteRole(role.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Module Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Permissions Overview</CardTitle>
                <CardDescription>View all application modules and their sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {APPLICATION_MODULES.map((module) => (
                    <Card key={module.id} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Sections:
                          </p>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                            {module.sections.map((section) => (
                              <li key={section}>{section}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
