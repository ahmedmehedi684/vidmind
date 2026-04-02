import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-[720px] mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to Home</Link>
        </Button>
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.ico" alt="VidMind" className="h-6 w-6" />
          <span className="text-lg font-bold text-primary" style={{ fontFamily: "'DM Sans', sans-serif" }}>VidMind</span>
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: March 2025</p>

      <div className="space-y-6 text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <section>
          <h2 className="text-xl font-semibold text-primary mb-2">1. Information We Collect</h2>
          <p>VidMind collects the following information when you use our service:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Account information: name and email address when you sign up</li>
            <li>Usage data: YouTube video transcripts you submit for summarization</li>
            <li>Notes and summaries you save within the app</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-2">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide and improve the VidMind summarization service</li>
            <li>Save your notes and summaries to your account</li>
            <li>Send account-related emails (confirmation, password reset)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-2">3. Data Storage</h2>
          <p>Your data is stored securely using Supabase. We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-2">4. AI Processing</h2>
          <p>Transcripts you submit are processed by third-party AI services (Groq) to generate summaries. These transcripts are not stored by the AI provider beyond the processing request.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-2">5. Cookies</h2>
          <p>VidMind uses localStorage to save your preferences (such as webhook URL settings). We do not use tracking cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-2">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Access your personal data</li>
            <li>Delete your account and all associated data</li>
            <li>Update your profile information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-2">7. Contact</h2>
          <p>For any privacy concerns, contact us at: <a href="mailto:privacy@vidmind.app" className="text-primary hover:underline">privacy@vidmind.app</a></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-2">8. Changes to This Policy</h2>
          <p>We may update this policy from time to time. We will notify you of significant changes via email.</p>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
