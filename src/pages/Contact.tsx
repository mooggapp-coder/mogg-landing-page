import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SUBJECT_OPTIONS = [
  "General Question",
  "Bug Report",
  "Account Issue",
  "Subscription Issue",
  "Report Content",
  "Other",
] as const;

type FormFields = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = ({ name, email, subject, message }: FormFields): FormErrors => {
  const errors: FormErrors = {};
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  if (!trimmedName) {
    errors.name = "Name is required.";
  }

  if (!trimmedEmail) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!subject) {
    errors.subject = "Please select a subject.";
  }

  if (!trimmedMessage) {
    errors.message = "Message is required.";
  } else if (trimmedMessage.length < 10) {
    errors.message = "Message must be at least 10 characters.";
  }

  return errors;
};

const Contact = () => {
  const [fields, setFields] = useState<FormFields>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = (key: keyof FormFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      name: fields.name.trim(),
      email: fields.email.trim().toLowerCase(),
      subject: fields.subject,
      message: fields.message.trim(),
    };

    try {
      const { error } = await supabase.from("contact_submissions").insert([payload]);
      if (error) throw error;

      const { error: emailError } = await supabase.functions.invoke("send-contact-email", {
        body: payload,
      });

      if (emailError && import.meta.env.DEV) {
        console.error("Contact email notification failed:", emailError);
      }

      setIsSubmitted(true);
    } catch (error: unknown) {
      const err = error as { message?: string; details?: string };
      const message = err?.message || err?.details || "Something went wrong. Please try again.";
      if (import.meta.env.DEV) {
        console.error("Contact form submission failed:", error);
      }
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "w-full bg-transparent border border-surface-dark-fg/20 rounded-lg px-4 py-3 text-surface-dark-fg placeholder:text-surface-dark-fg/30 focus:outline-none focus:border-primary transition font-body text-sm";

  return (
    <main className="min-h-screen bg-background text-surface-dark-fg">
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl space-y-10">
            <div className="rounded-[2rem] border border-surface-dark-fg/10 bg-surface-dark p-10 shadow-[0_25px_100px_rgba(0,0,0,0.08)] backdrop-blur-xl">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.4em] text-primary font-semibold font-body">MOGG APP</p>
                  <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight font-display">Contact Us</h1>
                  <p className="text-sm text-surface-dark-fg/60 font-body">We&apos;d love to hear from you</p>
                </div>

                {isSubmitted ? (
                  <p className="text-sm leading-7 text-surface-dark-fg/85 font-body font-semibold">
                    Thanks! We&apos;ll get back to you soon.
                  </p>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6 text-sm font-body" noValidate>
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-surface-dark-fg font-semibold">
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={fields.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className={inputClassName}
                        placeholder="Your name"
                      />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-surface-dark-fg font-semibold">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={fields.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className={inputClassName}
                        placeholder="your@email.com"
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="block text-surface-dark-fg font-semibold">
                        Subject
                      </label>
                      <select
                        id="subject"
                        value={fields.subject}
                        onChange={(e) => updateField("subject", e.target.value)}
                        className={inputClassName}
                      >
                        <option value="">Select a subject</option>
                        {SUBJECT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="block text-surface-dark-fg font-semibold">
                        Message
                      </label>
                      <textarea
                        id="message"
                        value={fields.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        rows={5}
                        className={`${inputClassName} min-h-[120px] resize-y`}
                        placeholder="How can we help?"
                      />
                      {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                    </div>

                    {submitError && <p className="text-xs text-destructive">{submitError}</p>}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 bg-foreground hover:bg-primary text-background font-semibold px-5 py-2 rounded-lg text-sm transition-all font-body disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
