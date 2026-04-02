import { useState, useEffect } from "react";
import { User, Mail, Lock, Save, Loader2 } from "lucide-react";
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => { if (user) loadProfile(); }, [user]);

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
      toast.success("প্রোফাইল আপডেট হয়েছে!");
    } catch (e) { toast.error("প্রোফাইল আপডেট করতে সমস্যা হয়েছে"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) { toast.error("নতুন password দিন"); return; }
    if (newPassword.length < 6) { toast.error("Password কমপক্ষে ৬ অক্ষর হতে হবে"); return; }
    if (newPassword !== confirmPassword) { toast.error("Password মিলছে না"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password পরিবর্তন হয়েছে!");
      setNewPassword(""); setConfirmPassword("");
    } catch (e: any) { toast.error(e.message || "Password পরিবর্তন করতে সমস্যা হয়েছে"); }
    finally { setChangingPassword(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <User className="h-5 w-5 text-primary" /> Profile
      </h1>

      <Card>
        <CardHeader><CardTitle className="text-lg text-primary flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardTitle></CardHeader>
        <CardContent>
          <Input value={user?.email || ""} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground mt-1">Email পরিবর্তন করা যায় না।</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg text-primary flex items-center gap-2"><User className="h-4 w-4" /> নাম</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>আপনার নাম</Label>
            <Input placeholder="আপনার নাম লিখুন..." value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg text-primary flex items-center gap-2"><Lock className="h-4 w-4" /> Password পরিবর্তন</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>নতুন Password</Label>
            <Input type="password" placeholder="নতুন password..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password নিশ্চিত করুন</Label>
            <Input type="password" placeholder="আবার password লিখুন..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} className="gap-2">
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Password পরিবর্তন করুন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
