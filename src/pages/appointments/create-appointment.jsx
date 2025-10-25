import { useState, useEffect } from "react";
import dayjs from "dayjs";
import EntityForm from "@/components/shared/entity-form";

export default function CreateAppointment({
  open,
  onClose,
  supabase,
  clinicId,
  onCreated,
  existingAppointment,
}) {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const isEdit = !!existingAppointment;

  // === Load Patients (dropdown) ===
  useEffect(() => {
    const loadPatients = async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name")
        .eq("clinic_id", clinicId)
        .order("full_name", { ascending: true });

      if (error) console.error("Error loading patients:", error);
      else setPatients(data || []);
    };

    if (open && clinicId) loadPatients();
  }, [open, clinicId, supabase]);

  // === Load Doctor & Treatments ===
  useEffect(() => {
    const loadDoctorAndTreatments = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Use limit(1) instead of single() (avoids 406 if historical dup exists)
      const { data: doctorRows, error: doctorError } = await supabase
        .from("doctors")
        .select("id, department")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (doctorError) {
        console.error("Error fetching doctor:", doctorError);
        return;
      }

      const doctorData = Array.isArray(doctorRows) && doctorRows.length ? doctorRows[0] : null;
      setDoctor(doctorData);

      if (doctorData?.department && doctorData?.id) {
        const { data: treatmentData, error: treatmentError } = await supabase
          .from("treatments")
          .select("id, name")
          .eq("department", doctorData.department)
          .eq("doctor_id", doctorData.id)
          .order("name", { ascending: true });

        if (treatmentError) console.error("Error fetching treatments:", treatmentError);
        else setTreatments(treatmentData || []);
      } else {
        setTreatments([]);
      }
    };

    if (open) loadDoctorAndTreatments();
  }, [open, supabase]);

  // === Submit Handler ===
  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      // normalize values
      const start_at = dayjs(form.start_at).toDate().toISOString(); // ISO with tz
      const treatment_id = form.treatment_id ? String(form.treatment_id) : null;
      const payment_type =
        form.payment_type === "advance" || form.payment_type === "on_visit"
          ? form.payment_type
          : "on_visit";
      const advance_amount =
        form.advance_amount === "" || form.advance_amount == null
          ? null
          : Number(form.advance_amount);

      if (isEdit) {
        const { error } = await supabase
          .from("appointments")
          .update({
            patient_id: String(form.patient_id),
            treatment_id,
            start_at,
            payment_type,
            advance_amount,
            // ⚠️ omit status unless you're 100% sure it matches DB enum
          })
          .eq("id", existingAppointment.id);

        if (error) throw error;
      } else {
        const row = {
          clinic_id: String(clinicId),
          patient_id: String(form.patient_id),
          treatment_id,
          start_at,
          payment_type,
          advance_amount,
          // ⚠️ omit status to let DB default apply (appt_status default 'pending')
        };

        const { error } = await supabase.from("appointments").insert([row]);
        if (error) throw error;
      }

      onCreated?.();
      onClose();
    } catch (err) {
      console.error("appointments insert/update error:", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
      });
      alert("❌ Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === Build field options ===
  const patientOptions = patients.map((p) => ({
    label: p.full_name,
    value: p.id,
  }));

  const treatmentOptions = treatments.map((t) => ({
    label: t.name,
    value: t.id,
  }));

  // === Initial Values (for edit or new) ===
  const initialValues = existingAppointment
    ? {
        patient_id: existingAppointment.patient_id || "",
        treatment_id: existingAppointment.treatment_id || "",
        start_at: existingAppointment.start_at
          ? dayjs(existingAppointment.start_at).format("YYYY-MM-DDTHH:mm")
          : dayjs().format("YYYY-MM-DDTHH:mm"),
        payment_type: existingAppointment.payment_type || "on_visit",
        advance_amount:
          existingAppointment.advance_amount == null
            ? ""
            : String(existingAppointment.advance_amount),
        // keep status OUT of DB writes for now
        status: existingAppointment.status || "",
      }
    : {
        patient_id: "",
        treatment_id: "",
        start_at: dayjs().format("YYYY-MM-DDTHH:mm"),
        payment_type: "on_visit",
        advance_amount: "",
        status: "", // UI-only for now
      };

  return (
    <EntityForm
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      title={isEdit ? "Edit Appointment" : "Add Appointment"}
      fields={[
        {
          name: "patient_id",
          label: "Patient",
          type: "select",
          options: patientOptions,
          placeholder: "Select patient",
        },
        {
          name: "treatment_id",
          label: "Treatment Type",
          type: "select",
          options: treatmentOptions,
          placeholder: "Select treatment (optional)",
        },
        {
          name: "start_at",
          label: "Date / Time",
          type: "datetime-local",
        },
        {
          name: "payment_type",
          label: "Payment Type",
          type: "select",
          options: [
            { label: "On Visit", value: "on_visit" },
            { label: "Advance", value: "advance" },
          ],
        },
        { name: "advance_amount", label: "Advance Amount", type: "number" },
        // You can hide Status in UI until you align with DB enum:
        // { name: "status", label: "Status", type: "select", options: [...] },
      ]}
      initialValues={initialValues}
    />
  );
}
