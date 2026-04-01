import { useState, type MouseEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const WaitlistSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      toast({ title: "Invalid email", description: "Enter a valid email address before joining the waitlist.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("waitlist").insert([{ email: trimmedEmail }]);
      if (error) throw error;
      toast({ title: "You're on the waitlist", description: "Your email has been saved. We’ll reach out when Mogg launches." });
      setEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        toast({ title: "Sign in failed", description: error.message || "Unable to sign in with Google.", variant: "destructive" });
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      } else {
        toast({ title: "Sign in failed", description: "Could not start Google sign-in. Please try again.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Sign in failed", description: error instanceof Error ? error.message : "Unable to sign in with Google.", variant: "destructive" });
    }
  };

  return (
    <section ref={ref} className="py-24 lg:py-32 bg-surface-dark">
      <div className="container mx-auto px-6">
        <div className={`max-w-lg ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
          <h2 className="text-4xl md:text-6xl font-black mb-4 font-display text-surface-dark-fg">
            Your Ranking <span className="text-primary">Starts Here</span>
          </h2>
          <p className="text-surface-dark-fg/60 text-lg mb-10 font-body">
            Join our waitlist
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-2 text-surface-dark-fg/50 uppercase tracking-widest font-display">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com — we don't spam, we mogg"
                className="w-full bg-transparent border border-surface-dark-fg/20 rounded-lg px-4 py-3 text-surface-dark-fg placeholder:text-surface-dark-fg/30 focus:outline-none focus:border-primary transition font-body"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-surface-dark-fg hover:bg-primary text-surface-dark hover:text-primary-foreground font-semibold px-6 py-4 rounded-lg transition-all font-body text-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? "Submitting..." : "Apply for Beta Access"}
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          {/*<button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 font-semibold px-6 py-4 rounded-lg transition-all font-body text-sm"
          >
            <span className="w-4 h-4">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.805 10.023h-9.06v3.958h5.19c-.225 1.212-.916 2.244-1.956 2.933v2.436h3.167c1.854-1.707 2.92-4.228 2.92-7.327 0-.636-.058-1.254-.26-1.998z" fill="#4285F4"/>
                <path d="M12.745 21.375c2.5 0 4.59-.82 6.12-2.22l-3.167-2.437c-.876.59-2 .94-2.953.94-2.272 0-4.19-1.53-4.87-3.59H4.626v2.25c1.53 2.97 4.68 5.06 8.12 5.06z" fill="#34A853"/>
                <path d="M7.875 13.07a5.17 5.17 0 01-.29-1.64c0-.572.102-1.126.29-1.643V7.54H4.626A8.701 8.701 0 003.5 11.43c0 1.44.34 2.8.94 4.05l2.435-2.41z" fill="#FBBC05"/>
                <path d="M12.745 6.67c1.357 0 2.58.468 3.545 1.382l2.66-2.66C17.335 3.91 15.245 3 12.745 3 9.305 3 6.155 5.09 4.626 7.96l2.435 2.41c.684-2.06 2.602-3.59 4.87-3.59z" fill="#EA4335"/>
              </svg>
            </span>
            Sign in with Google
          </button> */}

          {/* Micro-stats for friction reduction */}
          <div className="flex items-center justify-center gap-3 mt-6 text-xs text-surface-dark-fg/40 font-body">
            <span>Free to join</span>
            <span className="w-1 h-1 rounded-full bg-surface-dark-fg/20" />
            <span>No credit card</span>
            <span className="w-1 h-1 rounded-full bg-surface-dark-fg/20" />
            <span>Early access perks</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;
