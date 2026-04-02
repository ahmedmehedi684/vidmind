import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ExternalLink, Check, KeyRound, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { getSettings, saveSettings, saveSettingsToDb, PROVIDERS, getProviderConfig, type AIProvider, type AppSettings } from "@/lib/settings";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSetup = searchParams.get("setup") === "true";
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [showKey, setShowKey] = useState(false);
  const currentProvider = getProviderConfig(settings.provider);

  const handleProviderChange = (providerId: string) => {
    const provider = getProviderConfig(providerId as AIProvider);
    const savedKeys = JSON.parse(localStorage.getItem("provider_api_keys") || "{}");
    setSettings(prev => ({ ...prev, provider: providerId as AIProvider, model: provider.models[0].id, apiKey: savedKeys[providerId] || "" }));
  };

  const handleSave = async () => {
    if (!settings.apiKey.trim()) { toast.error("API Key দিতে হবে"); return; }
    const savedKeys = JSON.parse(localStorage.getItem("provider_api_keys") || "{}");
    savedKeys[settings.provider] = settings.apiKey;
    localStorage.setItem("provider_api_keys", JSON.stringify(savedKeys));
    saveSettings(settings);
    if (user) await saveSettingsToDb(settings, user.id);
    toast.success("Settings সেভ হয়েছে!");
    if (isSetup) navigate("/", { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-primary" /> Settings
      </h1>

      {isSetup && (
        <Alert className="border-primary/50 bg-primary/5">
          <KeyRound className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            <strong>স্বাগতম! 🎉</strong> শুরু করতে একটি AI Provider select করুন এবং আপনার API Key দিন।
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg text-primary">AI Provider ও Model</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Provider নির্বাচন করুন</Label>
            <Select value={settings.provider} onValueChange={handleProviderChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROVIDERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Model নির্বাচন করুন</Label>
            <Select value={settings.model} onValueChange={(v) => setSettings(prev => ({ ...prev, model: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{currentProvider.models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{currentProvider.name} API Key</Label>
              <a href={currentProvider.apiKeyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">Key নিন <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="flex gap-2">
              <Input type={showKey ? "text" : "password"} placeholder={currentProvider.apiKeyPlaceholder} value={settings.apiKey} onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))} className="flex-1 font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)} type="button">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={handleSave} className="w-full gap-2"><Check className="h-4 w-4" /> {isSetup ? "Save করে শুরু করুন" : "Save Settings"}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
