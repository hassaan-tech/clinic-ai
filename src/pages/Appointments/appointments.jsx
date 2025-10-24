import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import dayjs from "dayjs"
import { supabase } from "../../lib/supabaseClient"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, PlusCircle } from "lucide-react"
import CreateAppointment from "./create-appointment"

export default function Appointments() {
  const { id } = useParams()
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editAppointment, setEditAppointment] = useState(null)

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, patients(full_name)")
      .eq("clinic_id", id)
      .order("start_at", { ascending: true })
    if (error) console.error(error)
    else setAppointments(data)
  }

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name")
      .eq("clinic_id", id)
    if (error) console.error(error)
    else setPatients(data)
  }

  useEffect(() => {
    Promise.all([fetchAppointments(), fetchPatients()]).then(() => setLoading(false))
  }, [id])

  const deleteAppointment = async (aid) => {
    if (!window.confirm("Delete this appointment?")) return
    const { error } = await supabase.from("appointments").delete().eq("id", aid)
    if (!error) fetchAppointments()
  }

  if (loading)
    return <p className="text-center text-muted-foreground mt-8">Loading appointments...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">Appointments</h2>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Create Appointment
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Treatment</TableHead>
              <TableHead>Date / Time</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length > 0 ? (
              appointments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.patients?.full_name || "—"}</TableCell>
                  <TableCell>{a.treatment_type || "-"}</TableCell>
                  <TableCell>{dayjs(a.start_at).format("DD MMM YYYY, hh:mm A")}</TableCell>
                  <TableCell>
                    {a.payment_type === "advance"
                      ? `Advance: ${a.advance_amount || 0}`
                      : "On Visit"}
                  </TableCell>
                  <TableCell className="capitalize">{a.status}</TableCell>
                  <TableCell className="text-right space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditAppointment(a)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAppointment(a.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateAppointment
        open={showAddModal || !!editAppointment}
        onClose={() => {
          setShowAddModal(false)
          setEditAppointment(null)
        }}
        clinicId={id}
        patients={patients}
        existingAppointment={editAppointment}
        onCreated={fetchAppointments}
        supabase={supabase}
      />
    </div>
  )
}
