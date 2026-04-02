import { useState, useEffect } from "react";
import { User, Mail, Lock, Save, Loader2, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      // Check if user signed up via Google
      const provider = user.app_metadata?.provider;
      setIsGoogleUser(provider === "google");
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase.from("profiles").select("name, email").eq("id", user!.id).single();
      if (data) setName((data as any).name || "");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ name: name.trim() } as any).eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (e) { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) { toast.error("Please enter new password"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) { toast.error(e.message || "Failed to change password"); }
    finally { setChangingPassword(false); }
  };

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      toast.success("User ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <User className="h-5 w-5 text-primary" /> Profile
      </h1>

      {/* Email */}
      <Card>
        <CardHeader><CardTitle className="text-lg text-primary flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardTitle></CardHeader>
        <CardContent>
          <Input value={user?.email || ""} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
        </CardContent>
      </Card>

      {/* User ID */}
      <Card>
        <CardHeader><CardTitle className="text-lg text-primary flex items-center gap-2"><User className="h-4 w-4" /> User ID</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={user?.id || ""} disabled className="bg-muted font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={copyUserId}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Name */}
      <Card>
        <CardHeader><CardTitle className="text-lg text-primary flex items-center gap-2"><User className="h-4 w-4" /> Name</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Your Name</Label>
            <Input placeholder="Enter your name..." value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-primary flex items-center gap-2">
            <Lock className="h-4 w-4" /> {isGoogleUser ? "Set Password" : "Change Password"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isGoogleUser && (
            <p className="text-sm text-muted-foreground">
              You signed up with Google. Set a password to also login with email & password.
            </p>
          )}
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input type={showNewPw ? "text" : "password"} placeholder="New password..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <div className="relative">
              <Input type={showConfirmPw ? "text" : "password"} placeholder="Confirm password..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} className="gap-2">
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {isGoogleUser ? "Set Password" : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
