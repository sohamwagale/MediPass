export const mockPatients = [
  {
    id: 'patient-001',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 555-0123',
    dateOfBirth: '1985-03-15',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    qrCode: 'PATIENT_001_QR',
    emergencyContact: 'Jane Doe - +1 555-0124'
  }
]

export const mockMedicalRecords = [
  {
    id: 'visit-001',
    date: '2026-01-10',
    doctor: 'Dr. Sarah Johnson',
    diagnosis: 'Hypertension',
    prescription: 'Amlodipine 5mg daily',
    reports: ['blood-pressure.pdf']
  },
  {
    id: 'visit-002',
    date: '2025-12-20',
    doctor: 'Dr. Michael Chen',
    diagnosis: 'Routine Checkup',
    prescription: 'Vitamin D3 2000IU daily',
    reports: ['blood-test.jpg']
  }
]

export const mockPrescriptions = [
  {
    id: 'rx-001',
    name: 'Amlodipine',
    dosage: '5mg',
    frequency: '1 tablet daily',
    duration: '30 days',
    instructions: 'Take in the morning with water',
    nextDose: '2026-01-12 08:00',
    refills: 2
  },
  {
    id: 'rx-002',
    name: 'Vitamin D3',
    dosage: '2000IU',
    frequency: '1 capsule daily',
    duration: '60 days',
    instructions: 'Take with food',
    nextDose: '2026-01-12 09:00',
    refills: 1
  }
]
