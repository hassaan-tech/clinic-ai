import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  PlusCircle,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import ThemeToggleButton from "@/components/theme-toggle-button";
import CreateClinic from "../clinics/create-clinic";
import StaffManager from "@/components/staff/staff-manager";

export default function ClinicSelector() {
  const [clinics, setClinics] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const navigate = useNavigate();

  // ------------ helpers ------------
  const ensureDoctor = async (userId, email) => {
    try {
      const { data: doc, error } = await supabase
        .from("doctors")
        .select("id, owner_user_id, display_name")
        .eq("owner_user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("doctors select error:", { code: error.code, message: error.message, details: error.details });
        // continue; maybe doc is null and we can insert
      }
      if (doc) return doc;

      // Create minimal doctor row (RLS: insert allowed when owner_user_id = auth.uid())
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
        console.error("doctors insert error:", { code: insErr.code, message: insErr.message, details: insErr.details });
        return null;
      }
      return created;
    } catch (e) {
      console.error("ensureDoctor fatal:", e);
      return null;
    }
  };

  const ensureOrg = async (owner_user_id, doctorDisplayName) => {
    try {
      const { data: existing, error } = await supabase
        .from("orgs")
        .select("id, name")
        .eq("owner_user_id", owner_user_id)
        .maybeSingle();
      if (error) {
        console.error("orgs select error:", { code: error.code, message: error.message, details: error.details });
      }
      if (existing) return existing;

      const name = `${doctorDisplayName || "Clinic"}'s Organization`;
      const { data: created, error: insErr } = await supabase
        .from("orgs")
        .insert({ owner_user_id, name })
        .select()
        .single();
      if (insErr) {
        console.error("orgs insert error:", { code: insErr.code, message: insErr.message, details: insErr.details });
        return null;
      }
      return created;
    } catch (e) {
      console.error("ensureOrg fatal:", e);
      return null;
    }
  };

  // ------------ main loader ------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // auth
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
          setLoading(false);
          return;
        }

        // make sure doctor & org exist
        const doc = await ensureDoctor(user.id, user.email);
        setDoctor(doc);
        let orgRow = null;
        if (doc?.owner_user_id) {
          orgRow = await ensureOrg(doc.owner_user_id, doc.display_name);
          setOrg(orgRow);
        }

        // --- fetch owned clinics (org-aware + legacy doctor_id)
        const ownedOrgId = orgRow?.id || "00000000-0000-0000-0000-000000000000";
        const ownedDocId = doc?.id || "00000000-0000-0000-0000-000000000000";

        const { data: owned, error: ownedErr } = await supabase
          .from("clinics")
          .select("*")
          .or(`org_id.eq.${ownedOrgId},doctor_id.eq.${ownedDocId}`)
          .order("created_at", { ascending: false });

        if (ownedErr) {
          console.error("owned clinics error:", { code: ownedErr.code, message: ownedErr.message, details: ownedErr.details });
        }

        // --- fetch clinics via staff access
        const { data: staffLinks, error: staffErr } = await supabase
          .from("clinic_staff")
          .select("clinic_id")
          .eq("user_id", user.id);

        if (staffErr) {
          console.error("clinic_staff error:", { code: staffErr.code, message: staffErr.message, details: staffErr.details });
        }

        let staffClinics = [];
        const staffClinicIds = [...new Set((staffLinks || []).map((r) => r.clinic_id))];
        if (staffClinicIds.length) {
          const { data: sc, error: scErr } = await supabase
            .from("clinics")
            .select("*")
            .in("id", staffClinicIds);
          if (scErr) {
            console.error("staff clinics error:", { code: scErr.code, message: scErr.message, details: scErr.details });
          }
          staffClinics = sc || [];
        }

        // merge + dedupe
        const map = new Map([...(owned || []), ...staffClinics].map((c) => [c.id, c]));
        setClinics([...map.values()]);
      } catch (err) {
        console.error("load fatal:", err);
        setClinics([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleClinicCreated = (newClinic) => {
    setClinics((prev) => [newClinic, ...prev.filter((c) => c.id !== newClinic.id)]);
    navigate(`/clinic/${newClinic.id}/dashboard`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 sm:px-6 md:px-8 py-6 relative">
      {/* Theme Toggle */}
      <ThemeToggleButton />

      {/* Profile Dropdown */}
      <div className="absolute top-4 right-4 sm:right-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {doctor?.display_name || "Profile"}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/edit-profile")}>
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main */}
      <Card className="w-full max-w-5xl shadow-md border-border mx-auto">
        <CardHeader className="text-center pb-4 px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-semibold text-primary flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Welcome {doctor?.display_name || "Doctor"}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Select a clinic to manage your dashboard and appointments.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-3 sm:px-5 pb-6">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              Loading clinics…
            </p>
          ) : clinics.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No clinics found for this account.
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 max-h-[70vh] overflow-y-auto p-1">
              {clinics.map((c) => (
                <Card
                  key={c.id}
                  onClick={() => navigate(`/clinic/${c.id}/dashboard`)}
                  className="cursor-pointer w-full xs:w-[90%] sm:w-[45%] lg:w-[30%] hover:bg-accent/10 hover:shadow-md transition-transform duration-200 hover:scale-[1.02] border p-4 sm:p-5"
                >
                  <div>
                    <h3 className="font-semibold text-lg text-primary mb-1">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{c.city}</p>
                    {c.address && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {c.address}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 text-right">
                    <Button size="sm">Open</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-8">
            <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm">
              <PlusCircle className="h-4 w-4" />
              Create Clinic
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowStaff(true)}
              className="flex items-center gap-2 text-sm"
            >
              <User className="h-4 w-4" />
              Manage Staff
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateClinic
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleClinicCreated}
      />
      <StaffManager
        open={showStaff}
        onClose={() => setShowStaff(false)}
        doctor={doctor}
      />
    </div>
  );
}
