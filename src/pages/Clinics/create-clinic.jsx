import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const PAKISTAN_CITIES = [
  "Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Hyderabad",
  "Sialkot","Peshawar","Quetta","Gujranwala","Bahawalpur","Sukkur","Mardan",
  "Abbottabad","Okara","Jhelum","Sargodha","Mirpur Khas","Rahim Yar Khan",
];

export default function CreateClinic({ open, onClose, onCreated }) {
  const [doctor, setDoctor] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: "",
    country: "Pakistan",
    city: "",
    address: "",
    phone: "",
  });

  // ---------- helpers (no profiles dependency) ----------
  const ensureDoctor = async (userId, email) => {
    try {
      const { data: doc, error } = await supabase
        .from("doctors")
        .select("id, owner_user_id, display_name")
        .eq("owner_user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("doctors select error:", error);
      }
      if (doc) return doc;

      const display_name = email?.split("@")[0] || "Doctor";
      const { data: created, error: insErr } = await supabase
        .from("doctors")
        .insert({
          owner_user_id: userId,
          display_name,
          full_name: display_name,
        })
        .select()
        .single();

      if (insErr) {
        console.error("doctors insert error:", insErr);
        throw insErr;
      }
      return created;
    } catch (e) {
      console.error("ensureDoctor fatal:", e);
      throw e;
    }
  };

  const ensureOrg = async (owner_user_id, doctorDisplayName) => {
    try {
      const { data: existing, error } = await supabase
        .from("orgs")
        .select("id, name")
        .eq("owner_user_id", owner_user_id)
        .maybeSingle();
      if (error) console.error("orgs select error:", error);
      if (existing) return existing;

      const name = `${doctorDisplayName || "Clinic"}'s Organization`;
      const { data: created, error: insErr } = await supabase
        .from("orgs")
        .insert({ owner_user_id, name })
        .select()
        .single();
      if (insErr) {
        console.error("orgs insert error:", insErr);
        throw insErr;
      }
      return created;
    } catch (e) {
      console.error("ensureOrg fatal:", e);
      throw e;
    }
  };

  // ---------- bootstrap on open ----------
  useEffect(() => {
    const bootstrap = async () => {
      try {
        setFetching(true);
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
          setFetching(false);
          return;
        }

        const doc = await ensureDoctor(user.id, user.email);
        setDoctor(doc);

        const theOrg = await ensureOrg(doc.owner_user_id, doc.display_name);
        setOrg(theOrg);
      } catch (err) {
        console.error("Bootstrap error (doctor/org):", err);
        toast.error("Unable to read or create your doctor profile. Please contact support.");
      } finally {
        setFetching(false);
      }
    };

    if (open) bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctor?.id) {
      toast.error("Doctor profile not found. Please log out and back in.");
      return;
    }

    // basic validation
    const name = form.name.trim();
    if (!name) {
      toast.error("Please enter a clinic name.");
      return;
    }
    const city = form.city.trim();

    setLoading(true);
    try {
      // optional: prevent duplicate clinic name within the same org/doctor
      const { data: dup } = await supabase
        .from("clinics")
        .select("id")
        .or(
          // show dup if same name within this org OR (legacy) same doctor_id
          `and(name.eq.${name},org_id.eq.${org?.id || "00000000-0000-0000-0000-000000000000"}),and(name.eq.${name},doctor_id.eq.${doctor.id})`
        )
        .limit(1);

      if (dup && dup.length) {
        toast.error("A clinic with this name already exists.");
        setLoading(false);
        return;
      }

      const payload = {
        doctor_id: doctor.id,
        org_id: org?.id || null, // link to org for new data
        name,
        city,
        address: form.address.trim(),
        phone: form.phone.trim(),
        timezone: "Asia/Karachi",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("clinics")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("clinics insert error:", error);
        throw error;
      }

      toast.success("Clinic created successfully!");
      onCreated?.(data);

      // reset + close
      setForm({ name: "", country: "Pakistan", city: "", address: "", phone: "" });
      onClose();
    } catch (err) {
      console.error("Error creating clinic:", err);
      toast.error(err.message || "Error creating clinic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Clinic</DialogTitle>
        </DialogHeader>

        {fetching ? (
          <p className="text-center text-muted-foreground py-6">Preparing your profile…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Clinic Name</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. DermaCare Clinic"
                required
              />
            </div>

            <div>
              <Label>Country</Label>
              <Input value={form.country} disabled className="bg-muted text-foreground/70" />
            </div>

            <div>
              <Label>City</Label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                required
              >
                <option value="">Select City</option>
                {PAKISTAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Clinic full address"
              />
            </div>

            <div>
              <Label>Contact Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+92XXXXXXXXXX"
              />
            </div>

            {org && (
              <p className="text-xs text-muted-foreground">
                This clinic will be created under org: <b>{org.name}</b>
              </p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Clinic"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
