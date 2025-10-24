import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileDown, Trash2, Users, PlusCircle, Pencil } from "lucide-react"
import CreatePatient from "./create-patient"

export default function Patients() {
  const { id } = useParams()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editPatient, setEditPatient] = useState(null)

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("clinic_id", id)
      .order("created_at", { ascending: false })
    if (error) console.error(error)
    else setPatients(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPatients()
  }, [id])

  const deletePatient = async (pid) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return
    const { error } = await supabase.from("patients").delete().eq("id", pid)
    if (!error) fetchPatients()
  }

  const exportCSV = () => {
    const header = "Name,Phone,Gender\n"
    const rows = patients
      .map((p) => `${p.full_name},${p.phone},${p.gender}`)
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "patients.csv"
    a.click()
  }

  if (loading)
    return <p className="text-center text-muted-foreground mt-8">Loading patients...</p>

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Patients
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <FileDown className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Patient
          </Button>
        </div>
      </div>

      {patients.length === 0 ? (
        <p className="text-muted-foreground text-center py-6">
          No patients found for this clinic.
        </p>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell className="capitalize">{p.gender}</TableCell>
                  <TableCell className="text-right space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditPatient(p)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePatient(p.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Patient Modal */}
      <CreatePatient
        open={showAddModal || !!editPatient}
        onClose={() => {
          setShowAddModal(false)
          setEditPatient(null)
        }}
        clinicId={id}
        existingPatient={editPatient}
        onCreated={fetchPatients}
        supabase={supabase}
      />
    </div>
  )
}
