import { useState } from "react"
import EntityForm from "@/components/shared/entity-form"

export default function CreatePatient({
  open,
  onClose,
  supabase,
  clinicId,
  onCreated,
  existingPatient,
}) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!existingPatient

  const handleSubmit = async (form) => {
    setLoading(true)
    try {
      if (isEdit) {
        // === UPDATE patient ===
        const { error } = await supabase
          .from("patients")
          .update({
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            gender: form.gender,
          })
          .eq("id", existingPatient.id)
        if (error) throw error
      } else {
        // === CREATE patient ===
        const { error } = await supabase.from("patients").insert([
          {
            clinic_id: clinicId,
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            gender: form.gender,
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
      title={isEdit ? "Edit Patient" : "Add Patient"}
      fields={[
        { name: "full_name", label: "Full Name" },
        { name: "phone", label: "Phone" },
        {
          name: "gender",
          label: "Gender",
          type: "select",
          options: [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Other", value: "other" },
          ],
        },
      ]}
      initialValues={
        existingPatient || {
          full_name: "",
          phone: "",
          gender: "male",
        }
      }
    />
  )
}
