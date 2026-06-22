import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import MapView from '../components/MapView'
import './MapPage.css'

export default function MapPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="map-page">
      <header className="map-header">
        <span className="map-header-title">Middle Earth Made Easy</span>
        <div className="map-header-right">
          <span className="map-header-email">{user?.email}</span>
          <button className="map-header-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <MapView />
    </div>
  )
}
