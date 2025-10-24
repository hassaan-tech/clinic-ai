import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    department: "",
  });

  const departments = [
    "Dermatology",
    "Dentistry",
    "Cosmetology",
    "General Medicine",
    "Orthopedics",
    "Gynecology",
    "Physiotherapy",
  ];

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // === 1️⃣ Create Auth User ===
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: form.email,
  password: form.password,
});
if (signUpError) throw signUpError;

// ✅ Wait until user is confirmed in Auth table
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("Auth user not yet available, please try again");


      // === 2️⃣ Create Doctor Record ===
      const { error: doctorError } = await supabase.from("doctors").insert([
        {
          owner_user_id: user.id,
          full_name: form.full_name.trim(),
          department: form.department,
          display_name: form.full_name.trim(),
        },
      ]);

      if (doctorError) throw doctorError;

      // === 3️⃣ Assign Role ===
      const { error: roleError } = await supabase.from("user_roles").insert([
        {
          user_id: user.id,
          role: "doctor",
        },
      ]);
      if (roleError) throw roleError;

      // === 4️⃣ Success Feedback ===
      toast.success("Account created successfully! Please log in.");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error("Registration Error:", err);
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <Card className="w-full max-w-md shadow-md border border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Doctor Registration
          </CardTitle>
          <CardDescription>
            Create your account to manage your clinics and appointments
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Dr. Sarah Ahmed"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="doctor@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                required
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
              >
                <option value="">Select Department</option>
                {departments.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>

            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/" className="text-primary hover:underline font-medium">
                Login here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
