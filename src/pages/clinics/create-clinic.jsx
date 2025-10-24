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

const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Hyderabad",
  "Sialkot",
  "Peshawar",
  "Quetta",
  "Gujranwala",
  "Bahawalpur",
  "Sukkur",
  "Mardan",
  "Abbottabad",
  "Okara",
  "Jhelum",
  "Sargodha",
  "Mirpur Khas",
  "Rahim Yar Khan",
];

export default function CreateClinic({ open, onClose, onCreated }) {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDoctor, setFetchingDoctor] = useState(true);
  const [form, setForm] = useState({
    name: "",
    country: "Pakistan",
    city: "",
    address: "",
    phone: "",
  });

  // ✅ Load logged-in doctor automatically
  useEffect(() => {
    const loadDoctor = async () => {
      setFetchingDoctor(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFetchingDoctor(false);
        return;
      }

      const { data: doc, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("owner_user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching doctor:", error.message);
        setDoctor(null);
      } else {
        setDoctor(doc);
      }

      setFetchingDoctor(false);
    };

    loadDoctor();
  }, []);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!doctor?.id) {
      alert(
        "Doctor profile not found. Please complete registration or log out and log back in."
      );
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clinics")
        .insert([
          {
            doctor_id: doctor.id,
            name: form.name.trim(),
            city: form.city.trim(),
            address: form.address.trim(),
            phone: form.phone.trim(),
            timezone: "Asia/Karachi",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }

      onCreated?.(data);
      setForm({
        name: "",
        country: "Pakistan",
        city: "",
        address: "",
        phone: "",
      });
      onClose();
    } catch (err) {
      console.error("Error creating clinic:", err);
      alert("Error creating clinic: " + err.message);
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

        {fetchingDoctor ? (
          <p className="text-center text-muted-foreground py-6">
            Loading your profile...
          </p>
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
              <Input
                value={form.country}
                disabled
                className="bg-muted text-foreground/70"
              />
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

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Clinic"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
