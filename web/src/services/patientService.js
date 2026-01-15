import api from './api'

export const getPatientDashboard = async () => {
  const res = await api.get('/patient/dashboard')  // adjust endpoint to your backend
  return res.data
}
