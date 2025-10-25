import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - doctor?: { id: string, owner_user_id: string }
 */
export default function AddStaffDialog({ open, onClose, doctor }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456"); // temporary default
  const [org, setOrg] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const isValidEmail = useMemo(() => /\S+@\S+\.\S+/.test(email || ""), [email]);

  // Load org & clinics when dialog opens
  useEffect(() => {
    if (!open) return;

    const bootstrap = async () => {
      try {
        // ensure logged-in user
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
          toast.error("You must be logged in.");
          return;
        }

        // get the doctor row (legacy safe)
        let docRow = doctor || null;
        if (!docRow) {
          const { data: docs, error: docErr } = await supabase
            .from("doctors")
            .select("id, owner_user_id")
            .eq("owner_user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(1);
          if (docErr) console.error("doctors select error:", docErr);
          docRow = Array.isArray(docs) && docs.length ? docs[0] : null;
        }

        // org by owner (new structure)
        let orgRow = null;
        if (docRow?.owner_user_id) {
          const { data: o, error: orgErr } = await supabase
            .from("orgs")
            .select("id, name")
            .eq("owner_user_id", docRow.owner_user_id)
            .maybeSingle();
          if (orgErr) console.error("org select error:", orgErr);
          orgRow = o || null;
        }
        setOrg(orgRow);

        // clinics: prefer org_id, but also support legacy doctor_id
        const orgId = orgRow?.id || "00000000-0000-0000-0000-000000000000";
        const docId = docRow?.id || "00000000-0000-0000-0000-000000000000";
        const { data: cl, error: clErr } = await supabase
          .from("clinics")
          .select("id, name, org_id, doctor_id")
          .or(`org_id.eq.${orgId},doctor_id.eq.${docId}`)
          .order("created_at", { ascending: false });
        if (clErr) console.error("clinics select error:", clErr);
        setClinics(cl || []);
      } catch (e) {
        console.error("AddStaffDialog bootstrap error:", e);
        setOrg(null);
        setClinics([]);
      } finally {
        setEmail("");
        setPassword("123456");
        setSelected([]);
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleClinic = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (!isValidEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!org?.id) {
      toast.error("Organization not found for your account.");
      return;
    }
    if (selected.length === 0) {
      toast.error("Select at least one clinic to grant access.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-staff", {
        body: {
          email,
          password,
          org_id: org.id,        // 👈 REQUIRED by the Edge Function
          clinic_ids: selected,  // 👈 array of clinic ids
          role: "staff",
        },
      });

      if (error) {
        // Print server’s error body so we know exactly what's wrong
        let msg = error.message;
        try {
          const text = await error.context.text();
          try {
            const parsed = JSON.parse(text);
            if (parsed?.error) msg = parsed.error;
          } catch {
            if (text) msg = text;
          }
        } catch {}
        console.error("create-staff error:", error, msg);
        toast.error(msg || "Create staff failed");
        return;
      }

      toast.success("Staff created and assigned!");
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error creating staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* aria-describedby="" silences Radix warning if description is optional */}
      <DialogContent aria-describedby="">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Create a staff account and grant access to one or more clinics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>Temporary Password</Label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. 123456"
            />
            <p className="text-xs text-muted-foreground mt-1">
              They can change it after first login.
            </p>
          </div>

          <div>
            <Label>Assign Clinics</Label>
            <div className="flex flex-col gap-2 mt-2">
              {clinics.map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.includes(c.id)}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        setSelected((prev) =>
                          prev.includes(c.id) ? prev : [...prev, c.id]
                        );
                      } else if (checked === false) {
                        setSelected((prev) => prev.filter((x) => x !== c.id));
                      }
                    }}
                    aria-label={`Toggle access to ${c.name}`}
                  />
                  <span>{c.name}</span>
                </label>
              ))}
              {!clinics.length && (
                <p className="text-sm text-muted-foreground">No clinics found.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleAdd} disabled={loading}>
              {loading ? "Creating..." : "Add Staff"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
