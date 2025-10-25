import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import AddStaffDialog from "./add-staff-dialog";
import { PlusCircle } from "lucide-react";

export default function StaffManager({ open, onClose, doctor }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const loadStaff = async () => {
    if (!doctor?.id) return;
    setLoading(true);

    // get doctor clinics
    const { data: clinicRows, error: cErr } = await supabase
      .from("clinics")
      .select("id")
      .eq("doctor_id", doctor.id);

    if (cErr) {
      console.error(cErr);
      setRows([]);
      setLoading(false);
      return;
    }

    const clinicIds = (clinicRows || []).map((c) => c.id);
    if (!clinicIds.length) {
      setRows([]);
      setLoading(false);
      return;
    }

    // list staff links
    const { data: staffRows, error: sErr } = await supabase
      .from("clinic_staff")
      .select("id, user_id, role, created_at, clinic_id")
      .in("clinic_id", clinicIds);

    if (sErr) {
      console.error(sErr);
      setRows([]);
      setLoading(false);
      return;
    }

    // resolve names via profiles (auth.users not accessible on client)
    const userIds = [...new Set((staffRows || []).map((s) => s.user_id))];
    let nameById = {};
    if (userIds.length) {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      if (!pErr) {
        nameById = Object.fromEntries(
          (profiles || []).map((p) => [p.id, p.full_name])
        );
      }
    }

    setRows(
      (staffRows || []).map((r) => ({
        ...r,
        user_label: nameById[r.user_id] || r.user_id,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Staff</DialogTitle>
          <DialogDescription>
            Invite staff and manage which clinics they can access.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-3">
          <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Add Staff
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Linked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.user_label}</TableCell>
                    <TableCell>{s.role}</TableCell>
                    <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                    No staff added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AddStaffDialog
          open={showAdd}
          onClose={() => {
            setShowAdd(false);
            loadStaff();
          }}
          doctor={doctor}
        />
      </DialogContent>
    </Dialog>
  );
}
