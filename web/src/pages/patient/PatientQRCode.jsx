import PatientQR from "../../components/patient/PatientQR"

const PatientQRCode = () => {
  return (
    <div className="min-h-screen bg-neutral-50 py-10">
      <div className="max-w-4xl mx-auto px-6">
        <PatientQR patientId="patient-001" />
      </div>
    </div>
  )
}

export default PatientQRCode
