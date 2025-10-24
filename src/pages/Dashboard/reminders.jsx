import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from "../../lib/supabaseClient"
import dayjs from 'dayjs'


export default function Reminders() {
  const { id } = useParams() // clinic id
  const navigate = useNavigate()
  const [reminders, setReminders] = useState([])

  const fetchReminders = async () => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, patients(full_name)')
      .eq('clinic_id', id)
      .order('scheduled_for', { ascending: false })
    if (!error) setReminders(data)
  }

  useEffect(() => { fetchReminders() }, [id])

  return (
    <div className="main-page">
      <button onClick={() => navigate(`/clinic/${id}/appointments`)}>← Back to Appointments</button>
      <h2>Reminders</h2>

      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Scheduled</th>
            <th>Status</th>
            <th>Reply</th>
          </tr>
        </thead>
        <tbody>
          {reminders.map(r => (
            <tr key={r.id}>
              <td>{r.patients?.full_name}</td>
              <td>{dayjs(r.scheduled_for).format('YYYY-MM-DD HH:mm')}</td>
              <td>{r.status}</td>
              <td>{r.reply_class}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
