import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Generic entity form.
 * props:
 * - open, onClose, onSubmit(formValues), loading, title
 * - fields: [{ name, label, type: 'text'|'number'|'select'|'datetime-local', options?, placeholder? }]
 * - initialValues: object
 */
export default function EntityForm({
  open,
  onClose,
  onSubmit,
  loading = false,
  title = "Create",
  fields = [],
  initialValues = {},
  className,
}) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    setForm(initialValues || {});
  }, [initialValues, open]);

  const handleChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit?.(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-lg", className)} aria-describedby="">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => {
            const { name, label, type, options = [], placeholder } = field;
            const value = form[name] ?? "";

            if (type === "select") {
              return (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>{label}</Label>
                  <Select
                    value={value || ""}
                    onValueChange={(v) => handleChange(name, v)}
                  >
                    <SelectTrigger id={name}>
                      <SelectValue placeholder={placeholder || `Select ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem
                          key={String(opt.value)}         // ✅ unique key
                          value={String(opt.value)}       // ✅ stable value
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            if (type === "datetime-local") {
              return (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    type="datetime-local"
                    value={value}
                    onChange={(e) => handleChange(name, e.target.value)}
                  />
                </div>
              );
            }

            if (type === "number") {
              return (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => handleChange(name, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              );
            }

            // default text
            return (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  value={value}
                  onChange={(e) => handleChange(name, e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            );
          })}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
