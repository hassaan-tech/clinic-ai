import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Settings as SettingsIcon, Trash2 } from "lucide-react"
import { useAccentTheme } from "@/hooks/useAccentTheme"

const ACCENTS = [
  { name: "Green", value: "green", color: "bg-green-500" },
  { name: "Blue", value: "blue", color: "bg-blue-500" },
  { name: "Red", value: "red", color: "bg-red-500" },
  { name: "Violet", value: "violet", color: "bg-violet-500" },
  { name: "Orange", value: "orange", color: "bg-orange-500" },
  { name: "Teal", value: "teal", color: "bg-teal-500" },
]

export default function Settings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [clinic, setClinic] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Accent theme hook (manages local + HTML + memory)
  const { accent, setAccent } = useAccentTheme()

  // === Load Clinic Data ===
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setClinic(data)

      // ✅ Load and apply accent color from DB
      if (data?.accent_color) {
        setAccent(data.accent_color)
        document.documentElement.setAttribute("data-accent", data.accent_color)
        localStorage.setItem("accent-theme", data.accent_color)
      }
    }

    load()
  }, [id, setAccent])

  // === Save Settings ===
  const save = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from("clinics")
      .update({
        name: clinic.name,
        city: clinic.city,
        address: clinic.address,
        reminder_days_before: clinic.reminder_days_before,
        reminder_send_time: clinic.reminder_send_time,
        accent_color: accent, // ✅ Save accent color
      })
      .eq("id", id)

    if (error) {
      alert(error.message)
    } else {
      alert("✅ Settings saved successfully!")
    }
  }

  // === Delete Clinic ===
  const deleteClinic = async () => {
    try {
      setDeleting(true)

      const { error } = await supabase.from("clinics").delete().eq("id", id)
      if (error) throw error

      setShowDeleteDialog(false)
      alert("🗑️ Clinic deleted successfully.")
      navigate("/")
    } catch (err) {
      console.error("Error deleting clinic:", err.message)
      alert("❌ Failed to delete clinic: " + err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (!clinic) {
    return (
      <p className="text-center text-muted-foreground mt-8">
        Loading clinic settings...
      </p>
    )
  }

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* === Header === */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          Clinic Settings
        </h2>
        <div className="invisible">
          <Button>Placeholder</Button>
        </div>
      </div>

      {/* === Settings Form === */}
      <Card className="max-w-2xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Update Clinic Information</CardTitle>
        </CardHeader>

        <form onSubmit={save}>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="name">Clinic Name</Label>
              <Input
                id="name"
                value={clinic.name || ""}
                onChange={(e) =>
                  setClinic({ ...clinic, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={clinic.city || ""}
                onChange={(e) =>
                  setClinic({ ...clinic, city: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={clinic.address || ""}
                onChange={(e) =>
                  setClinic({ ...clinic, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reminder_days_before">
                  Reminder Days Before
                </Label>
                <Input
                  id="reminder_days_before"
                  type="number"
                  value={clinic.reminder_days_before || ""}
                  onChange={(e) =>
                    setClinic({
                      ...clinic,
                      reminder_days_before: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="reminder_send_time">
                  Reminder Send Time
                </Label>
                <Input
                  id="reminder_send_time"
                  type="time"
                  value={clinic.reminder_send_time || ""}
                  onChange={(e) =>
                    setClinic({
                      ...clinic,
                      reminder_send_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* === Accent Color Section === */}
            <div className="pt-4 border-t mt-6">
              <Label className="block mb-2 text-sm font-medium text-muted-foreground">
                Accent Color
              </Label>
              <div className="flex flex-wrap gap-3">
                {ACCENTS.map(({ name, value, color }) => (
                  <button
                    key={value}
                    onClick={(e) => {
                      e.preventDefault()
                      setAccent(value)
                      document.documentElement.setAttribute("data-accent", value)
                      localStorage.setItem("accent-theme", value)
                    }}
                    className={`
                      w-10 h-10 rounded-full border-2 transition-all
                      ${color}
                      ${
                        accent === value
                          ? "ring-2 ring-offset-2 ring-[hsl(var(--primary))]"
                          : "opacity-80 hover:opacity-100"
                      }
                    `}
                    title={name}
                  />
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Clinic
            </Button>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>

      {/* === Delete Confirmation Dialog === */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Clinic</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This action is <strong>permanent</strong> and cannot be undone.  
              All data associated with this clinic — including appointments,  
              patients, and records — will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteClinic}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Yes, Delete Clinic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
