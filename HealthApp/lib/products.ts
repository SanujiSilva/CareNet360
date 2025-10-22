export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  category: "consultation" | "appointment" | "medicine" | "service"
}

// Healthcare service products
export const PRODUCTS: Product[] = [
  {
    id: "general-consultation",
    name: "General Consultation",
    description: "General medical consultation with a doctor",
    priceInCents: 5000, // $50.00
    category: "consultation",
  },
  {
    id: "specialist-consultation",
    name: "Specialist Consultation",
    description: "Consultation with a specialist doctor",
    priceInCents: 10000, // $100.00
    category: "consultation",
  },
  {
    id: "emergency-appointment",
    name: "Emergency Appointment",
    description: "Urgent medical appointment",
    priceInCents: 15000, // $150.00
    category: "appointment",
  },
  {
    id: "follow-up-visit",
    name: "Follow-up Visit",
    description: "Follow-up consultation visit",
    priceInCents: 3000, // $30.00
    category: "appointment",
  },
  {
    id: "health-checkup",
    name: "Complete Health Checkup",
    description: "Comprehensive health screening package",
    priceInCents: 20000, // $200.00
    category: "service",
  },
]
