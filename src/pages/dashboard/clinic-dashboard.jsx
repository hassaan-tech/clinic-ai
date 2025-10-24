import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Calendar,
  Pill,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
} from "lucide-react"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export default function ClinicDashboard() {
  const { id } = useParams()
  const [summary, setSummary] = useState({
    patients: 0,
    appointments: 0,
    prescriptions: 0,
    revenue: 0,
    pending: 0,
    monthlyRevenue: [],
    monthlyAppointments: [],
    genderStats: [],
    topMedicines: [],
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // === PATIENTS ===
        const { count: patientsCount, data: patientsData } = await supabase
          .from("patients")
          .select("*", { count: "exact" })
          .eq("clinic_id", id)

        const genderCount = { Male: 0, Female: 0, Other: 0 }
        patientsData?.forEach((p) => {
          if (p.gender === "Male") genderCount.Male++
          else if (p.gender === "Female") genderCount.Female++
          else genderCount.Other++
        })

        const genderStats = Object.entries(genderCount).map(([gender, value]) => ({
          gender,
          value,
        }))

        // === APPOINTMENTS ===
        const { count: appointmentsCount, data: appointments } = await supabase
          .from("appointments")
          .select("*", { count: "exact" })
          .eq("clinic_id", id)

        // Monthly appointment trend
        const appointmentMap = {}
        appointments?.forEach((a) => {
          const month = new Date(a.created_at).toLocaleString("default", {
            month: "short",
            year: "2-digit",
          })
          appointmentMap[month] = (appointmentMap[month] || 0) + 1
        })
        const monthlyAppointments = Object.entries(appointmentMap).map(
          ([month, count]) => ({ month, count })
        )

        // === PRESCRIPTIONS ===
        const { count: prescriptionsCount, data: prescriptions } = await supabase
          .from("prescriptions")
          .select("medicine_id, clinic_id")
          .eq("clinic_id", id)

        // Top medicines chart
        const medCount = {}
        prescriptions?.forEach((p) => {
          medCount[p.medicine_id] = (medCount[p.medicine_id] || 0) + 1
        })

        // Fetch medicine names
        const { data: meds } = await supabase.from("medicines").select("id, brand_name")
        const topMedicines = Object.entries(medCount)
          .map(([id, count]) => ({
            name: meds?.find((m) => m.id === id)?.brand_name || "Unknown",
            count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // === PAYMENTS & REVENUE ===
        const { data: payments } = await supabase
          .from("payments")
          .select("amount, created_at, clinic_id")
          .eq("clinic_id", id)
          .order("created_at", { ascending: true })

        const totalRevenue =
          payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        const monthlyRevenueMap = {}
        payments?.forEach((p) => {
          const month = new Date(p.created_at).toLocaleString("default", {
            month: "short",
            year: "2-digit",
          })
          monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + p.amount
        })
        const monthlyRevenue = Object.entries(monthlyRevenueMap).map(
          ([month, value]) => ({ month, revenue: value })
        )

        // Pending revenue (if payment_type='pending')
        const { data: appts } = await supabase
          .from("appointments")
          .select("payment_type, advance_amount, clinic_id")
          .eq("clinic_id", id)

        const pending =
          appts?.reduce((sum, a) => {
            if (a.payment_type === "pending") return sum + (a.advance_amount || 0)
            return sum
          }, 0) || 0

        // === Set all summary data ===
        setSummary({
          patients: patientsCount || 0,
          appointments: appointmentsCount || 0,
          prescriptions: prescriptionsCount || 0,
          revenue: totalRevenue,
          pending,
          monthlyRevenue,
          monthlyAppointments,
          genderStats,
          topMedicines,
        })
      } catch (err) {
        console.error("Error loading dashboard data:", err)
      }
    }

    loadData()
  }, [id])

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-semibold tracking-tight">Clinic Analytics</h2>

      {/* === SUMMARY CARDS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard
          title="Patients"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          value={summary.patients}
          description="Total registered"
        />
        <DashboardCard
          title="Appointments"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          value={summary.appointments}
          description="Completed & pending"
        />
        <DashboardCard
          title="Prescriptions"
          icon={<Pill className="h-4 w-4 text-muted-foreground" />}
          value={summary.prescriptions}
          description="Total issued"
        />
        <DashboardCard
          title="Revenue"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          value={`$${summary.revenue.toLocaleString()}`}
          description="Total earned"
        />
        <DashboardCard
          title="Pending"
          icon={<DollarSign className="h-4 w-4 text-destructive" />}
          value={`$${summary.pending.toLocaleString()}`}
          description="Awaiting payments"
        />
      </div>

      {/* === CHARTS SECTION === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {summary.monthlyRevenue.length === 0 ? (
              <p className="text-muted-foreground text-sm">No revenue data yet.</p>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Volume */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Appointment Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyAppointments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === DEMOGRAPHICS & MEDICINES === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Gender */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Patients by Gender
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="w-full h-72 flex items-center justify-center">
              {summary.genderStats.length === 0 ? (
                <p className="text-muted-foreground text-sm">No patient data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.genderStats}
                      dataKey="value"
                      nameKey="gender"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {summary.genderStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Medicines */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Top Prescribed Medicines
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={summary.topMedicines}
                  margin={{ left: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ---------- Reusable Dashboard Card ---------- */
function DashboardCard({ title, icon, value, description }) {
  return (
    <Card className="transition hover:shadow-md glass">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
