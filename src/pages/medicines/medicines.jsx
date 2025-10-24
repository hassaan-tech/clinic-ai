import { useEffect, useState } from "react"
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
import { PlusCircle, Trash2, Pill, Pencil } from "lucide-react"
import CreateMedicine from "./create-medicine"

export default function Medicines() {
  const [meds, setMeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editMed, setEditMed] = useState(null)

  const fetchMeds = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setMeds(data || [])
    } catch (err) {
      console.error("Error fetching medicines:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeds()
  }, [])

  const delMed = async (mid) => {
    if (!window.confirm("Delete this medicine?")) return
    const { error } = await supabase.from("medicines").delete().eq("id", mid)
    if (!error) fetchMeds()
  }

  if (loading)
    return <p className="text-center text-muted-foreground mt-8">Loading medicines...</p>

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Pill className="h-6 w-6 text-primary" />
          Medicines
        </h2>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add Medicine
        </Button>
      </div>

      {meds.length === 0 ? (
        <p className="text-muted-foreground text-center py-6">No medicines found.</p>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand Name</TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meds.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.brand_name}</TableCell>
                  <TableCell>{m.generic_name}</TableCell>
                  <TableCell>{m.company}</TableCell>
                  <TableCell className="text-right space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditMed(m)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => delMed(m.id)}
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

      <CreateMedicine
        open={showAddModal || !!editMed}
        onClose={() => {
          setShowAddModal(false)
          setEditMed(null)
        }}
        existingMedicine={editMed}
        onCreated={fetchMeds}
        supabase={supabase}
      />
    </div>
  )
}
