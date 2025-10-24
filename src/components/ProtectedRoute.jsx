import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) navigate('/')
      setLoading(false)
    }
    checkSession()
  }, [navigate])

  if (loading) return <p>Loading...</p>
  return children
}
