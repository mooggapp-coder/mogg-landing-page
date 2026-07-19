import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, ImagePlus, Loader2, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES, findCountryByCode, findCountryByName, type CountryOption } from "@/lib/countries";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type GenderValue = "male" | "female";
type HeightUnit = "cm" | "ft";
type WeightUnit = "kg" | "lbs";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type UsersRow = {
  user_id: string;
  name: string | null;
  username: string | null;
  gender: GenderValue | null;
  date_of_birth: string | null;
  age: number | null;
  country: string | null;
  country_name: string | null;
  country_code: string | null;
  city: string | null;
  height_cm: number | null;
  height_ft: number | null;
  height_in: number | null;
  weight_kg: number | null;
  weight_lbs: number | null;
  photo_urls: string[] | null;
  battle_consent: boolean | null;
  consent_given_at: string | null;
};

type UsersClient = {
  from: (table: "users") => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => PromiseLike<{ data: UsersRow | null; error: { message: string } | null }>;
        neq: (
          column: string,
          value: string,
        ) => {
          maybeSingle: () => PromiseLike<{
            data: { user_id: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (
        column: "user_id",
        value: string,
      ) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
};

const usersClient = supabase as unknown as UsersClient;

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 3;
const USERNAME_DEBOUNCE_MS = 500;

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return String(error);
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function sanitizeUsername(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  let ft = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) {
    ft += 1;
    inches = 0;
  }
  return { ft, inches };
}

function ftInToCm(ft: number, inches: number): number {
  return Math.round(ft * 30.48 + inches * 2.54);
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462);
}

function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592);
}

const Setup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [gender, setGender] = useState<GenderValue | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [city, setCity] = useState("");

  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [heightCmInput, setHeightCmInput] = useState("");
  const [heightFtInput, setHeightFtInput] = useState("");
  const [heightInInput, setHeightInInput] = useState("");

  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [weightInput, setWeightInput] = useState("");

  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [competitionConsent, setCompetitionConsent] = useState(false);
  const [existingConsentGivenAt, setExistingConsentGivenAt] = useState<string | null>(null);
  const [showConsentHint, setShowConsentHint] = useState(false);

  const previewUrls = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const { data, error } = await usersClient
          .from("users")
          .select(
            "user_id, name, username, gender, date_of_birth, age, country, country_name, country_code, city, height_cm, height_ft, height_in, weight_kg, weight_lbs, photo_urls, battle_consent, consent_given_at",
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          toast({
            title: "Could not load profile",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (!data || cancelled) return;

        setName(data.name ?? "");
        setUsername(data.username ? sanitizeUsername(data.username) : "");
        setUsernameStatus(data.username ? "available" : "idle");
        setGender(data.gender === "male" || data.gender === "female" ? data.gender : "");
        setDateOfBirth(toDateInputValue(data.date_of_birth));
        setSelectedCountry(
          findCountryByCode(data.country_code) ??
            findCountryByName(data.country_name) ??
            findCountryByName(data.country) ??
            null,
        );
        setCity(data.city ?? "");
        setHeightUnit("cm");
        setHeightCmInput(data.height_cm != null ? String(data.height_cm) : "");
        if (data.height_cm != null) {
          const { ft, inches } = cmToFtIn(Number(data.height_cm));
          setHeightFtInput(String(ft));
          setHeightInInput(String(inches));
        } else {
          setHeightFtInput(data.height_ft != null ? String(data.height_ft) : "");
          setHeightInInput(data.height_in != null ? String(data.height_in) : "");
        }
        setWeightUnit("kg");
        setWeightInput(data.weight_kg != null ? String(data.weight_kg) : "");
        setExistingPhotoUrls(Array.isArray(data.photo_urls) ? data.photo_urls : []);
        setCompetitionConsent(data.battle_consent === true);
        setExistingConsentGivenAt(
          typeof data.consent_given_at === "string" && data.consent_given_at.trim()
            ? data.consent_given_at
            : null,
        );
        setShowConsentHint(false);
      } catch (error) {
        toast({
          title: "Could not load profile",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id, toast]);

  useEffect(() => {
    if (!user?.id) return;

    const value = username.trim();
    if (!value) {
      setUsernameStatus("idle");
      return;
    }

    if (value.length < 3 || !/^[a-z0-9_]+$/.test(value)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const { data, error } = await usersClient
          .from("users")
          .select("user_id")
          .eq("username", value)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setUsernameStatus("idle");
          toast({
            title: "Username check failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data && data.user_id !== user.id) {
          setUsernameStatus("taken");
        } else {
          setUsernameStatus("available");
        }
      } catch (error) {
        if (!cancelled) {
          setUsernameStatus("idle");
          toast({
            title: "Username check failed",
            description: getErrorMessage(error),
            variant: "destructive",
          });
        }
      }
    }, USERNAME_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username, user?.id, toast]);

  const handleUsernameChange = (value: string) => {
    setUsername(sanitizeUsername(value));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      e.target.value = "";
      return;
    }

    setSelectedFiles((prev) => {
      const merged = [...prev, ...files].slice(0, MAX_PHOTOS);
      if (prev.length + files.length > MAX_PHOTOS) {
        toast({
          title: "Photo limit reached",
          description: `You can upload up to ${MAX_PHOTOS} photos.`,
          variant: "destructive",
        });
      }
      return merged;
    });

    e.target.value = "";
  };

  const usingNewPhotos = selectedFiles.length > 0;

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

    if (usingNewPhotos) {
      setSelectedFiles((prev) => {
        if (toIndex >= prev.length) return prev;
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
      return;
    }

    setExistingPhotoUrls((prev) => {
      if (toIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const setPhotoAsMain = (index: number) => {
    if (index <= 0) return;
    movePhoto(index, 0);
  };

  const removePhoto = (index: number) => {
    if (usingNewPhotos) {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: "Not signed in",
        description: "Please sign in again to continue setup.",
        variant: "destructive",
      });
      return;
    }

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedCity = city.trim();

    if (!trimmedName) {
      toast({
        title: "Name required",
        description: "Please enter your display name.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUsername.length < 3 || !/^[a-z0-9_]+$/.test(trimmedUsername)) {
      toast({
        title: "Invalid username",
        description: "Username must be at least 3 characters and use only lowercase letters, numbers, or underscores.",
        variant: "destructive",
      });
      return;
    }

    if (usernameStatus === "checking") {
      toast({
        title: "Please wait",
        description: "Still checking if this username is available.",
        variant: "destructive",
      });
      return;
    }

    if (usernameStatus === "taken") {
      toast({
        title: "Username already taken",
        description: "Choose a different username.",
        variant: "destructive",
      });
      return;
    }

    if (usernameStatus !== "available") {
      toast({
        title: "Username required",
        description: "Enter a valid available username.",
        variant: "destructive",
      });
      return;
    }

    if (gender !== "male" && gender !== "female") {
      toast({
        title: "Gender required",
        description: "Please select Male or Female.",
        variant: "destructive",
      });
      return;
    }

    if (!dateOfBirth) {
      toast({
        title: "Date of birth required",
        description: "Please enter your date of birth.",
        variant: "destructive",
      });
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      toast({
        title: "Age requirement",
        description: "You must be 18 or older to use MOGG.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCountry) {
      toast({
        title: "Country required",
        description: "Please select your country.",
        variant: "destructive",
      });
      return;
    }

    if (!competitionConsent) {
      setShowConsentHint(true);
      toast({
        title: "Consent required",
        description: "You need to agree before entering the arena.",
        variant: "destructive",
      });
      return;
    }

    const usingNewPhotos = selectedFiles.length > 0;
    const photoCount = usingNewPhotos ? selectedFiles.length : existingPhotoUrls.length;
    if (photoCount < MIN_PHOTOS) {
      toast({
        title: "More photos needed",
        description: `Add at least ${MIN_PHOTOS} photos to continue.`,
        variant: "destructive",
      });
      return;
    }

    let heightCm: number | null = null;
    let heightFt: number | null = null;
    let heightIn: number | null = null;

    if (heightUnit === "cm") {
      if (heightCmInput.trim()) {
        const parsed = Number(heightCmInput);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          toast({
            title: "Invalid height",
            description: "Enter height as a positive number in cm.",
            variant: "destructive",
          });
          return;
        }
        heightCm = Math.round(parsed);
        const imperial = cmToFtIn(heightCm);
        heightFt = imperial.ft;
        heightIn = imperial.inches;
      }
    } else if (heightFtInput.trim() || heightInInput.trim()) {
      const ft = Number(heightFtInput || "0");
      const inches = Number(heightInInput || "0");
      if (!Number.isFinite(ft) || !Number.isFinite(inches) || ft < 0 || inches < 0 || (ft === 0 && inches === 0)) {
        toast({
          title: "Invalid height",
          description: "Enter a valid height in feet and inches.",
          variant: "destructive",
        });
        return;
      }
      if (inches >= 12) {
        toast({
          title: "Invalid inches",
          description: "Inches must be between 0 and 11.",
          variant: "destructive",
        });
        return;
      }
      heightFt = Math.round(ft);
      heightIn = Math.round(inches);
      heightCm = ftInToCm(heightFt, heightIn);
    }

    let weightKg: number | null = null;
    let weightLbs: number | null = null;

    if (weightInput.trim()) {
      const parsed = Number(weightInput);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast({
          title: "Invalid weight",
          description: `Enter weight as a positive number in ${weightUnit}.`,
          variant: "destructive",
        });
        return;
      }
      if (weightUnit === "kg") {
        weightKg = Math.round(parsed);
        weightLbs = kgToLbs(weightKg);
      } else {
        weightLbs = Math.round(parsed);
        weightKg = lbsToKg(weightLbs);
      }
    }

    setIsSubmitting(true);
    try {
      let photoUrls = existingPhotoUrls;

      if (usingNewPhotos) {
        const uploadedUrls: string[] = [];

        for (let index = 0; index < selectedFiles.length; index += 1) {
          const file = selectedFiles[index];
          const path = `${user.id}/${Date.now()}_${index}.jpg`;

          const { error: uploadError } = await supabase.storage
            .from("profile-photos")
            .upload(path, file, {
              contentType: file.type || "image/jpeg",
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicUrlData } = supabase.storage
            .from("profile-photos")
            .getPublicUrl(path);

          uploadedUrls.push(publicUrlData.publicUrl);
        }

        photoUrls = uploadedUrls;
      }

      const updatePayload: Record<string, unknown> = {
        name: trimmedName,
        username: trimmedUsername,
        gender,
        date_of_birth: dateOfBirth,
        age,
        country: selectedCountry.name,
        country_name: selectedCountry.name,
        country_code: selectedCountry.code,
        city: trimmedCity || null,
        height_cm: heightCm,
        weight_kg: weightKg,
        photo_urls: photoUrls,
        photos_uploaded: true,
        battle_consent: competitionConsent,
        is_competing: competitionConsent,
        last_active: new Date().toISOString(),
      };

      if (competitionConsent && !existingConsentGivenAt) {
        updatePayload.consent_given_at = new Date().toISOString();
      }

      if (heightUnit === "ft") {
        updatePayload.height_ft = heightFt;
        updatePayload.height_in = heightIn;
      } else if (heightCm != null) {
        updatePayload.height_ft = heightFt;
        updatePayload.height_in = heightIn;
      }

      if (weightUnit === "lbs") {
        updatePayload.weight_lbs = weightLbs;
      } else if (weightKg != null) {
        updatePayload.weight_lbs = weightLbs;
      }

      const { error: updateError } = await usersClient
        .from("users")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      track("setup_completed", {
        photo_count: photoUrls.length,
        gender,
        country: selectedCountry.name,
      });

      navigate("/arena");
    } catch (error) {
      toast({
        title: "Setup failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </main>
    );
  }

  const usernameFeedback =
    usernameStatus === "checking"
      ? { text: "Checking availability...", className: "text-muted-foreground" }
      : usernameStatus === "available"
        ? { text: "Username available", className: "text-emerald-400" }
        : usernameStatus === "taken"
          ? { text: "Username already taken", className: "text-destructive" }
          : usernameStatus === "invalid"
            ? { text: "Use lowercase letters, numbers, and underscores (min 3).", className: "text-destructive" }
            : null;

  return (
    <main className="min-h-dvh overflow-x-hidden bg-background flex items-start justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="text-eyebrow mb-2">MOGG</p>
          <h1 className="text-page-title text-foreground">Create your identity</h1>
          <p className="mt-2 text-meta">Photos first. Then who you are.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* —— PHOTOS —— */}
          <section className="surface-card space-y-4 p-4 sm:p-6">
            <div>
              <h2 className="text-section text-foreground">Photos</h2>
              <p className="mt-2 text-meta">
                At least 3, up to 6. Use the arrows to reorder — your first photo is what people see first.
              </p>
            </div>

            {(() => {
              const displayUrls = usingNewPhotos ? previewUrls : existingPhotoUrls;
              const canAddMore = displayUrls.length < MAX_PHOTOS;
              const tileClass =
                "relative h-48 aspect-[3/4] w-auto shrink-0 snap-start overflow-hidden rounded-md sm:h-56";

              return (
                <>
                  <div
                    className={cn(
                      "flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1",
                      "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                    )}
                  >
                    {displayUrls.map((url, index) => {
                      const isMain = index === 0;
                      return (
                        <div
                          key={`${url}-${index}`}
                          className={cn(
                            tileClass,
                            "border bg-secondary",
                            isMain ? "border-2 border-primary shadow-primary-glow-sm" : "border-border",
                          )}
                        >
                          <img
                            src={url}
                            alt={isMain ? "Main profile photo" : `Photo ${index + 1}`}
                            className="h-full w-full object-cover object-center"
                            draggable={false}
                          />

                          {isMain ? (
                            <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                              Main
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPhotoAsMain(index)}
                              disabled={isSubmitting}
                              className="absolute left-2 top-2 rounded-full bg-background/85 p-1.5 text-foreground hover:bg-background hover:text-primary"
                              aria-label={`Set photo ${index + 1} as main`}
                              title="Set as main"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            disabled={isSubmitting}
                            className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5 text-foreground hover:bg-background hover:text-destructive"
                            aria-label={`Remove photo ${index + 1}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>

                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1.5 pt-6">
                            <button
                              type="button"
                              onClick={() => movePhoto(index, index - 1)}
                              disabled={isSubmitting || index === 0}
                              className="rounded-full bg-background/80 p-1.5 text-foreground hover:bg-background disabled:opacity-40"
                              aria-label={`Move photo ${index + 1} left`}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => movePhoto(index, index + 1)}
                              disabled={isSubmitting || index === displayUrls.length - 1}
                              className="rounded-full bg-background/80 p-1.5 text-foreground hover:bg-background disabled:opacity-40"
                              aria-label={`Move photo ${index + 1} right`}
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {canAddMore && (
                      <label
                        htmlFor="photos"
                        className={cn(
                          tileClass,
                          "flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-secondary/40 px-2 text-center transition hover:border-primary/60 hover:bg-primary/5",
                          (isSubmitting || displayUrls.length >= MAX_PHOTOS) &&
                            "pointer-events-none opacity-50",
                        )}
                      >
                        <ImagePlus className="h-8 w-8 text-primary" aria-hidden />
                        <span className="text-xs font-semibold font-body text-foreground">
                          {displayUrls.length === 0 ? "Add photos" : "Add more"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-body leading-tight">
                          JPG or PNG
                        </span>
                        <input
                          id="photos"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoChange}
                          disabled={isSubmitting || displayUrls.length >= MAX_PHOTOS}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>

                  <p className="text-meta">
                    {usingNewPhotos
                      ? `${selectedFiles.length} new photo${selectedFiles.length === 1 ? "" : "s"} selected`
                      : existingPhotoUrls.length > 0
                        ? `${existingPhotoUrls.length} saved photo${existingPhotoUrls.length === 1 ? "" : "s"} — select new files to replace them`
                        : "Select at least 3 photos"}
                  </p>
                </>
              );
            })()}
          </section>

          {/* —— IDENTITY —— */}
          <section className="surface-card space-y-4 p-4 sm:p-6">
            <div>
              <h2 className="text-section text-foreground">Identity</h2>
              <p className="mt-2 text-meta">How you appear in the arena.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="font-body">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                disabled={isSubmitting}
                required
                className="font-body"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="font-body">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="your_username"
                disabled={isSubmitting}
                required
                minLength={3}
                className="font-body"
              />
              {usernameFeedback && (
                <p className={cn("text-meta", usernameFeedback.className)}>
                  {usernameFeedback.text}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-body">Country</Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    disabled={isSubmitting}
                    className="w-full justify-between font-body font-normal"
                  >
                    {selectedCountry ? selectedCountry.name : "Select country"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search countries..." className="font-body" />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {COUNTRIES.map((country) => (
                          <CommandItem
                            key={country.code}
                            value={`${country.name} ${country.code}`}
                            onSelect={() => {
                              setSelectedCountry(country);
                              setCountryOpen(false);
                            }}
                            className="font-body"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCountry?.code === country.code ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {country.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="font-body">
                City <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="city"
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Your city"
                disabled={isSubmitting}
                className="font-body"
              />
            </div>
          </section>

          {/* —— DETAILS —— */}
          <section className="surface-card space-y-4 p-4 sm:p-6">
            <div>
              <h2 className="text-section text-foreground">Details</h2>
              <p className="mt-2 text-meta">Optional body stats help matchups feel fair.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-body">Gender</Label>
              <div
                className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted p-2"
                role="group"
                aria-label="Gender"
              >
                {(["male", "female"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setGender(value)}
                    className={cn(
                      "min-h-btn-secondary rounded-md px-4 text-sm font-semibold font-body capitalize transition",
                      gender === value
                        ? "bg-primary text-primary-foreground shadow-primary-glow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="font-body">
                Date of birth
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isSubmitting}
                required
                className="font-body"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label className="font-body">Height</Label>
                <div
                  className="inline-flex rounded-md border border-border bg-muted p-2 gap-2"
                  role="group"
                  aria-label="Height unit"
                >
                  {([
                    { id: "cm" as const, label: "cm" },
                    { id: "ft" as const, label: "ft/in" },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setHeightUnit(opt.id)}
                      className={cn(
                        "min-h-btn-secondary rounded-md px-4 text-sm font-semibold font-body transition",
                        heightUnit === opt.id
                          ? "bg-primary text-primary-foreground shadow-primary-glow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {heightUnit === "cm" ? (
                <Input
                  id="heightCm"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step="any"
                  value={heightCmInput}
                  onChange={(e) => setHeightCmInput(e.target.value)}
                  placeholder="Height in cm (optional)"
                  disabled={isSubmitting}
                  className="font-body"
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="heightFt"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={heightFtInput}
                    onChange={(e) => setHeightFtInput(e.target.value)}
                    placeholder="ft"
                    disabled={isSubmitting}
                    className="font-body"
                  />
                  <Input
                    id="heightIn"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={11}
                    step={1}
                    value={heightInInput}
                    onChange={(e) => setHeightInInput(e.target.value)}
                    placeholder="in"
                    disabled={isSubmitting}
                    className="font-body"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="weight" className="font-body">
                  Weight
                </Label>
                <div
                  className="inline-flex rounded-md border border-border bg-muted p-2 gap-2"
                  role="group"
                  aria-label="Weight unit"
                >
                  {([
                    { id: "kg" as const, label: "kg" },
                    { id: "lbs" as const, label: "lbs" },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setWeightUnit(opt.id)}
                      className={cn(
                        "min-h-btn-secondary rounded-md px-4 text-sm font-semibold font-body transition",
                        weightUnit === opt.id
                          ? "bg-primary text-primary-foreground shadow-primary-glow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={`Weight in ${weightUnit} (optional)`}
                disabled={isSubmitting}
                className="font-body"
              />
            </div>
          </section>

          {/* —— COMPETITION CONSENT —— */}
          <section className="surface-card space-y-4 border-primary/40 p-4 shadow-primary-glow-sm sm:p-6">
            <div>
              <h2 className="text-section text-foreground">Enter the competition</h2>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="competition-consent"
                checked={competitionConsent}
                disabled={isSubmitting}
                onCheckedChange={(checked) => {
                  const next = checked === true;
                  setCompetitionConsent(next);
                  if (next) setShowConsentHint(false);
                }}
                className="mt-1"
              />
              <Label
                htmlFor="competition-consent"
                className="font-body text-sm leading-relaxed text-foreground cursor-pointer"
              >
                I agree to appear in{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/90"
                  onClick={(e) => e.stopPropagation()}
                >
                  head-to-head competitions
                </a>{" "}
                and be rated by the community. I confirm these are photos of me and that I&apos;m 18
                or older.
              </Label>
            </div>

            <p className="text-meta">You can stop competing at any time from your profile.</p>

            {showConsentHint && !competitionConsent && (
              <p className="text-xs font-body text-destructive">
                You need to agree before entering the arena.
              </p>
            )}
          </section>

          <div
            onClick={() => {
              if (!competitionConsent) setShowConsentHint(true);
            }}
          >
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !competitionConsent ||
                usernameStatus === "checking" ||
                usernameStatus === "taken" ||
                usernameStatus === "invalid"
              }
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  Saving...
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Save and continue"
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Setup;
