import { useState, useEffect } from "react"
import EntityForm from "@/components/shared/entity-form"

export default function CreateMedicine({
  open,
  onClose,
  supabase,
  onCreated,
  existingMedicine,
}) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!existingMedicine

  const handleSubmit = async (form) => {
    setLoading(true)
    try {
      if (isEdit) {
        // UPDATE logic
        const { error } = await supabase
          .from("medicines")
          .update({
            brand_name: form.brand_name.trim(),
            generic_name: form.generic_name.trim(),
            company: form.company.trim(),
          })
          .eq("id", existingMedicine.id)

        if (error) throw error
      } else {
        // CREATE logic
        const {
          data: { user },
        } = await supabase.auth.getUser()

        const { data: doctor } = await supabase
          .from("doctors")
          .select("id")
          .eq("owner_user_id", user.id)
          .single()

        const { error } = await supabase.from("medicines").insert([
          {
            doctor_id: doctor.id,
            brand_name: form.brand_name.trim(),
            generic_name: form.generic_name.trim(),
            company: form.company.trim(),
          },
        ])
        if (error) throw error
      }

      onCreated?.()
      onClose()
    } catch (err) {
      alert("Failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <EntityForm
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      title={isEdit ? "Edit Medicine" : "Add Medicine"}
      fields={[
        { name: "brand_name", label: "Brand Name" },
        { name: "generic_name", label: "Generic Name" },
        { name: "company", label: "Company" },
      ]}
      initialValues={existingMedicine || {}}
    />
  )
}
