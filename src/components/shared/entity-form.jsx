import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FormDialog from "./form-dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

export default function EntityForm({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  initialValues = {},
  loading,
}) {
  const [form, setForm] = useState(initialValues)

  useEffect(() => {
    setForm(initialValues)
  }, [initialValues])

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      loading={loading}
    >
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>

            {/* === Select Dropdown === */}
            {field.type === "select" ? (
              <Select
                value={form[field.name] || ""}
                onValueChange={(v) => handleChange(field.name, v)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue
                    placeholder={field.placeholder || `Select ${field.label}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {field.options && field.options.length > 0 ? (
                    field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled>No options available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              // === Default Input Field ===
              <Input
                id={field.name}
                type={field.type || "text"}
                value={form[field.name] || ""}
                placeholder={field.placeholder}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </FormDialog>
  )
}
