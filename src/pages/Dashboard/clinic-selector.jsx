import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, PlusCircle, User, LogOut, ChevronDown } from "lucide-react";
import ThemeToggleButton from "@/components/theme-toggle-button";
import CreateClinic from "../clinics/create-clinic";

export default function ClinicSelector() {
  const [clinics, setClinics] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  // === Load Doctor + Clinics ===
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: doc } = await supabase
        .from("doctors")
        .select("*")
        .eq("owner_user_id", user.id)
        .single();

      setDoctor(doc);

      const { data: cl } = await supabase
        .from("clinics")
        .select("*")
        .eq("doctor_id", doc.id);

      setClinics(cl || []);
    };
    load();
  }, []);

  const handleClinicCreated = (newClinic) => {
    setClinics((prev) => [...prev, newClinic]);
    navigate(`/clinic/${newClinic.id}/dashboard`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 relative">
      {/* Theme Toggle */}
      <ThemeToggleButton />

      {/* Profile Dropdown - Top Right */}
      <div className="absolute top-4 right-6">
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

      {/* === Main Container === */}
      <Card className="w-[80%] max-w-6xl shadow-md border-border glass">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-semibold text-primary flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Welcome {doctor?.display_name || "Doctor"}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Select a clinic to manage your dashboard and appointments.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {clinics.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No clinics found for this account.
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 max-h-[70vh] overflow-y-auto p-2 scrollbar-none">
              {clinics.map((c) => (
                <Card
                  key={c.id}
                  onClick={() => navigate(`/clinic/${c.id}/dashboard`)}
                  className="cursor-pointer w-full sm:w-[45%] lg:w-[30%] hover:bg-accent/10 hover:shadow-md transition-transform duration-200 hover:scale-[1.02] border p-5"
                >
                  <div>
                    <h3 className="font-semibold text-lg text-primary mb-1">
                      {c.name}
                    </h3>
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

          {/* === Create Clinic Button === */}
          <div className="flex justify-center mt-10">
            <Button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Create Clinic
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* === Create Clinic Dialog === */}
      <CreateClinic
        open={showCreate}
        onClose={() => setShowCreate(false)}
        doctor={doctor}
        onCreated={handleClinicCreated}
      />
    </div>
  );
}
