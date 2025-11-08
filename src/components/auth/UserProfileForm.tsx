import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";
import { User, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/lib/database.types";
import { logger } from "@/lib/logger";

interface UserProfileFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  onSuccess,
  className = "",
}) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Fetch user profile data when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile(user.id);
    }
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        logger.error("Error fetching user profile:", error);
        setError("Failed to load profile data");
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setUsername(data.username || "");
      }
    } catch (err) {
      logger.error("Exception fetching user profile:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Basic validation
      if (username && username.length < 3) {
        setError("Username must be at least 3 characters long");
        setLoading(false);
        return;
      }

      // Check if username is already taken (if changed)
      if (username && username !== profile?.username) {
        const { data: existingUser, error: usernameCheckError } = await supabase
          .from("user_profiles")
          .select("user_id")
          .eq("username", username)
          .neq("user_id", user.id)
          .maybeSingle();

        if (usernameCheckError) {
          logger.error(
            "Error checking username availability:",
            usernameCheckError,
          );
          setError("Failed to verify username availability");
          setLoading(false);
          return;
        }

        if (existingUser) {
          setError("Username is already taken");
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          username: username.trim() || null,
        })
        .eq("user_id", user.id);

      if (updateError) {
        logger.error("Error updating user profile:", updateError);
        setError("Failed to update profile");
        return;
      }

      logger.info("Profile updated successfully", {
        userId: user.id,
        username,
      });
      setSuccess(true);
      if (onSuccess) onSuccess();

      // Refresh profile data
      await fetchUserProfile(user.id);
    } catch (err) {
      logger.error("Exception updating user profile:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-4">Profile Settings</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Profile updated successfully
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            aria-label="First Name"
            className="pl-10"
          />
        </div>

        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
            aria-label="Last Name"
            className="pl-10"
          />
        </div>

        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            aria-label="Username"
            className="pl-10"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <LoadingSpinner size={16} className="mr-2" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </form>
    </Card>
  );
};

export default UserProfileForm;