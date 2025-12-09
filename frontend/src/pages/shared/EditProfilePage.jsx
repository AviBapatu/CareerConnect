import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

import { getProfile, updateProfile } from "@/api/profileApi";
import useUserStore from "@/store/userStore";
import { profileValidationSchema } from "@/validation/profile.validation";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser } = useUserStore();

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  // Extract the actual profile data - backend returns user object directly
  const profile = profileResponse?.data || profileResponse;

  // Debug: Log the profile data to see what's being fetched
  
  
  

  const form = useForm({
    resolver: zodResolver(profileValidationSchema),
    defaultValues: {
      name: "",
      email: "",
      headline: "",
      about: "",
      location: "",
      skills: [],
      isOpenToWork: false,
      social: {
        linkedin: "",
        github: "",
        twitter: "",
        portfolio: "",
      },
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      
      

      queryClient.invalidateQueries({ queryKey: ["profile"] });

      // Backend returns: { success: true, message: "Profile updated", user: {...} }
      // Axios wraps it in: { data: { success: true, message: "Profile updated", user: {...} } }
      const userData = data.data?.user;
      

      if (userData) {
        setUser(userData);
        
        toast.success("Profile updated successfully");
        navigate("/profile");
      } else {
        console.error(
          "EditProfilePage - No user data found in response:",
          data
        );
        toast.error("Profile updated but user data missing");
      }
    },
    onError: (error) => {
      console.error("EditProfilePage - Update error:", error);
      console.error("EditProfilePage - Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  useEffect(() => {
    
    if (profile) {
      

      const formData = {
        name: profile.name || "",
        email: profile.email || "",
        headline: profile.headline || "",
        about: profile.about || "",
        location: profile.location || "",
        skills: Array.isArray(profile.skills)
          ? profile.skills
          : typeof profile.skills === "string"
          ? profile.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        isOpenToWork: profile.isOpenToWork || false,
        social: {
          linkedin: profile.social?.linkedin || "",
          github: profile.social?.github || "",
          twitter: profile.social?.twitter || "",
          portfolio: profile.social?.portfolio || "",
        },
      };

      form.reset(formData);

      // Also set values directly to ensure they're populated
      Object.keys(formData).forEach((key) => {
        if (key === "social") {
          Object.keys(formData.social).forEach((socialKey) => {
            form.setValue(`social.${socialKey}`, formData.social[socialKey]);
          });
        } else {
          form.setValue(key, formData[key]);
        }
      });

      
      
    } else {
      
    }
  }, [profile, form]);

  const onSubmit = (data) => {
    // Ensure skills is always an array
    let skillsArr = [];
    if (Array.isArray(data.skills)) {
      skillsArr = data.skills;
    } else if (typeof data.skills === "string") {
      skillsArr = data.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    updateProfileMutation.mutate({
      ...data,
      skills: skillsArr,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Profile Data
          </h2>
          <p className="text-gray-600">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="px-4 sm:px-8 md:px-16 lg:px-40 py-8">
        <div className="max-w-[960px] mx-auto">
          <Form {...form} key={profile?.id || profile?._id || "profile-form"}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information Section */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      fill="white"
                      viewBox="0 0 256 256"
                    >
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,0,1-28,28H124a8,8,0,0,1,0-16h16a12,12,0,0,0,0-24H116a8,8,0,0,1,0-16h24A28,28,0,0,1,168,148ZM96,108a8,8,0,0,1-8,8H72a8,8,0,0,1,0-16H88A8,8,0,0,1,96,108Z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h2>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="City, Country"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-6 w-6 bg-gradient-to-r from-green-500 to-green-600 rounded-md flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      fill="white"
                      viewBox="0 0 256 256"
                    >
                      <path d="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72v41.61A184,184,0,0,1,128,136a184.07,184.07,0,0,1-88-22.38V72Zm0,128H40V131.64A200.19,200.19,0,0,0,128,152a200.25,200.25,0,0,0,88-20.37V200ZM104,112a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H112A8,8,0,0,1,104,112Z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Professional Information
                  </h2>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Professional Headline
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Senior Software Engineer at Tech Corp"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="about"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          About
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell us about yourself..."
                            rows={4}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Skills
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., JavaScript, React, Node.js (comma separated)"
                            value={
                              Array.isArray(field.value)
                                ? field.value.join(", ")
                                : field.value || ""
                            }
                            onChange={(e) => {
                              // Store as array in form state
                              const arr = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              field.onChange(arr);
                            }}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isOpenToWork"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium text-gray-700">
                            Open to Work
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            Show that you're available for new opportunities
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Social Links Section */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-6 w-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-md flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      fill="white"
                      viewBox="0 0 256 256"
                    >
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Social Links
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="social.linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          LinkedIn
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://linkedin.com/in/username"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social.github"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          GitHub
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://github.com/username"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Twitter
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://twitter.com/username"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social.portfolio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Portfolio
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://yourportfolio.com"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6">
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    {updateProfileMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/profile")}
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
