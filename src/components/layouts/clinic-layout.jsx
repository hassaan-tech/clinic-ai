import { useEffect, useState } from "react"
import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  LogOut,
  Settings,
  Calendar,
  Users,
  LayoutDashboard,
  Pill,
  Menu,
  X
} from "lucide-react"

export default function ClinicLayout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [clinics, setClinics] = useState([])
  const [selected, setSelected] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navLinkClass = (isActive) =>
    cn(
      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      isActive
        ? "bg-[hsl(var(--primary)_/_15%)] text-primary font-semibold"
        : "text-muted-foreground hover:bg-[hsl(var(--primary)_/_10%)] hover:text-primary"
    )

  useEffect(() => {
    const loadClinics = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: doctor } = await supabase
        .from("doctors")
        .select("id")
        .eq("owner_user_id", user.id)
        .single()
      if (!doctor) return

      const { data: cl, error } = await supabase
        .from("clinics")
        .select("id, name, city, accent_color")
        .eq("doctor_id", doctor.id)

      if (error) {
        console.error("Error fetching clinics:", error.message)
        return
      }

      setClinics(cl || [])
      const found = cl?.find((c) => c.id === id)
      setSelected(found || null)

      if (found?.accent_color) {
        document.documentElement.setAttribute("data-accent", found.accent_color)
        localStorage.setItem("accent-theme", found.accent_color)
      } else {
        const savedAccent = localStorage.getItem("accent-theme")
        if (savedAccent)
          document.documentElement.setAttribute("data-accent", savedAccent)
      }
    }

    loadClinics()
  }, [id])

  const handleSelect = (clinic) => {
    setSelected(clinic)
    navigate(`/clinic/${clinic.id}/dashboard`)

    if (clinic?.accent_color) {
      document.documentElement.setAttribute("data-accent", clinic.accent_color)
      localStorage.setItem("accent-theme", clinic.accent_color)
    }

    setSidebarOpen(false)
  }

  if (clinics.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading clinics...
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative">
      {/* ===== Sidebar (Collapsible) ===== */}
      <aside
        className={cn(
          "fixed md:static z-40 top-0 left-0 h-full w-64 lg:w-72 flex flex-col justify-between shadow-md border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] dark:bg-[hsl(var(--card))] transition-all duration-300 transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex justify-between items-center mb-6">
            <img
              src="/duzeltilmis-logo-svg-1.svg"
              alt="Clinic Logo"
              className="h-8 w-auto object-contain"
            />
            {/* Close Button (mobile) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-muted-foreground hover:text-primary"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Clinic Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between mb-4 text-sm truncate"
              >
                {selected ? `${selected.name}` : "Select Clinic"}
                <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="
                w-[var(--radix-dropdown-menu-trigger-width)]
                bg-[hsl(var(--popover))]
                text-[hsl(var(--popover-foreground))]
                border border-[hsl(var(--border))]
                shadow-md backdrop-blur-sm
              "
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground px-3">
                Switch Clinic
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {clinics.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={cn(
                    "cursor-pointer text-sm",
                    selected?.id === c.id
                      ? "bg-[hsl(var(--primary)_/_15%)] text-primary font-medium"
                      : "hover:bg-[hsl(var(--primary)_/_10%)]"
                  )}
                >
                  {c.name} ({c.city})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation */}
          <nav className="space-y-2 mt-4">
            <NavLink to={`/clinic/${id}/dashboard`} className={({ isActive }) => navLinkClass(isActive)}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
            <NavLink to={`/clinic/${id}/patients`} className={({ isActive }) => navLinkClass(isActive)}>
              <Users className="h-4 w-4" /> Patients
            </NavLink>
            <NavLink to={`/clinic/${id}/appointments`} className={({ isActive }) => navLinkClass(isActive)}>
              <Calendar className="h-4 w-4" /> Appointments
            </NavLink>
            <NavLink to={`/clinic/${id}/medicines`} className={({ isActive }) => navLinkClass(isActive)}>
              <Pill className="h-4 w-4" /> Medicines
            </NavLink>
            <NavLink to={`/clinic/${id}/settings`} className={({ isActive }) => navLinkClass(isActive)}>
              <Settings className="h-4 w-4" /> Settings
            </NavLink>
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-[hsl(var(--border))]">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[hsl(var(--primary))] transition"
          >
            <LogOut className="h-4 w-4" /> Logout
          </NavLink>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Bar */}
        <div
          className="
            flex items-center justify-between
            border-b border-[hsl(var(--border))]
            px-4 sm:px-6 py-3
            bg-[hsl(var(--card))]
            sticky top-0 z-30
          "
        >
          <div className="flex items-center gap-3">
            {/* Menu Toggle Button (Mobile) */}
            <button
              className="md:hidden text-muted-foreground hover:text-primary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <h2 className="text-lg font-semibold">
              {selected ? selected.name : "Clinic Dashboard"}
            </h2>
          </div>

          <ModeToggle />
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 bg-[hsl(var(--background))]">
          <Outlet />
        </div>
      </main>

      {/* Overlay (for mobile sidebar) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
