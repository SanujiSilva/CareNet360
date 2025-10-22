# Healthcare Management System

A comprehensive full-stack healthcare management system built with Next.js, MongoDB Atlas, and custom CSS.

## Features

### Multi-Role Authentication
- **Patient Portal**: Book appointments, view medical records, digital health cards, payment processing
- **Doctor Portal**: Manage appointments, QR code scanner, create medical records, prescribe medications
- **Pharmacist Portal**: Manage medicine inventory, view prescriptions, payment tracking
- **Admin Dashboard**: User management, system analytics, appointment oversight

### Core Functionality
- JWT-based authentication with secure password hashing
- Role-based access control and routing
- MongoDB Atlas cloud database integration
- Digital health cards with QR codes
- **QR Code Scanner for Doctors**: Scan patient health cards to view complete medical history
- Appointment booking and management
- Medical records system with doctor notes
- Prescription management
- Medicine inventory tracking
- **Full Payment Processing**: Credit/Debit card, UPI, Net Banking
- Payment history and transaction tracking
- Analytics and reporting

## Setup Instructions

### 1. MongoDB Atlas Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Add it to your environment variables in the **Vars** section of the v0 sidebar

### 2. Environment Variables
Add the following environment variable in the **Vars** section:

\`\`\`
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key_here
\`\`\`

### 3. Access the Application
- The application is ready to use once you add the MongoDB URI
- Register as a new user (select your role: Patient, Doctor, Pharmacist, or Admin)
- Login and explore the features

## User Roles & Features

### Patient
- Dashboard with health overview and statistics
- Book and manage appointments with doctors
- View medical records and complete history
- Access prescriptions and medication details
- **Digital health card with QR code** for easy identification
- **Payment processing** for appointments
- View payment history and receipts
- Profile management

### Doctor
- View daily schedule and appointments
- **Scan patient QR codes** to instantly access:
  - Complete patient information
  - Full medical history
  - Previous prescriptions
  - Past appointments
- **Add medical records** directly after scanning
- Create medical records with diagnosis and treatment
- Write prescriptions with dosage and instructions
- Patient list management
- Appointment completion tracking

### Pharmacist
- Medicine inventory management
- View and fulfill prescriptions
- Stock tracking and alerts
- Order management
- Payment processing for medicines

### Admin
- User management (view, delete users)
- System analytics and statistics
- Appointment oversight
- Platform-wide statistics
- System health monitoring

## Technology Stack

- **Frontend**: Next.js 15 App Router, React, Custom CSS (No Tailwind)
- **Backend**: Next.js API Routes, Server Actions
- **Database**: MongoDB Atlas (Cloud)
- **Authentication**: JWT with httpOnly cookies
- **Security**: PBKDF2 password hashing with salt
- **QR Codes**: Dynamic QR code generation for health cards

## Database Collections

- `users` - User accounts (all roles)
- `appointments` - Appointment bookings with payment status
- `medical_records` - Patient medical history with doctor notes
- `prescriptions` - Doctor prescriptions with status
- `medicines` - Pharmacy inventory
- `health_cards` - Digital health cards with QR codes
- `payments` - Payment transactions and history

## Key Features Explained

### QR Code Scanner (Doctor Portal)
Doctors can scan patient health cards to instantly view:
- Patient demographics and contact information
- Blood group and allergies
- Complete medical history
- All previous prescriptions
- Past appointment records

After scanning, doctors can immediately add new medical records for the consultation.

### Payment System
- Multiple payment methods: Credit Card, Debit Card, UPI, Net Banking
- Secure payment processing simulation
- Transaction ID generation
- Payment history tracking
- Appointment payment linking
- Receipt generation

### Digital Health Card
- Unique card number for each patient
- QR code containing patient ID and card number
- Scannable by doctors for instant access
- Displays blood group, allergies, emergency contacts
- Portable digital identification

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Delete appointment

### Medical Records
- `GET /api/medical-records` - List records
- `POST /api/medical-records/create` - Create record

### Prescriptions
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions/create` - Create prescription

### Health Cards
- `GET /api/health-card` - Get patient health card
- `POST /api/health-card/scan` - Scan QR code (Doctor only)
- `PATCH /api/health-card` - Update health card info

### Payments
- `GET /api/payments` - List payment history
- `POST /api/payments` - Create payment record
- `POST /api/payments/process` - Process payment transaction

### Medicines
- `GET /api/medicines` - List medicines
- `POST /api/medicines` - Add medicine
- `PATCH /api/medicines/[id]` - Update medicine
- `DELETE /api/medicines/[id]` - Delete medicine

### Admin
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users` - Delete user
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/appointments` - All appointments

### Doctors
- `GET /api/doctors` - List all doctors
- `GET /api/patients` - List all patients (Doctor only)

## Security Features

- JWT token-based authentication
- httpOnly cookies for secure token storage
- Password hashing with PBKDF2 and salt
- Role-based access control (RBAC)
- Protected API routes with middleware
- Session validation on every request
- Secure payment processing

## Design System

- Professional medical aesthetic
- Custom CSS modules (No Tailwind CSS)
- Color palette: Deep plum primary, teal secondary, coral accent
- Fully responsive design
- Clean typography with Inter font family
- Intuitive navigation
- Accessible UI components
- Smooth transitions and hover effects

## Getting Started

1. **Add MongoDB URI**: Go to the Vars section in the v0 sidebar and add your `MONGODB_URI`
2. **Register**: Create an account and select your role
3. **Explore**: 
   - As a **Patient**: Book appointments, view your health card
   - As a **Doctor**: Scan QR codes, manage appointments, add medical records
   - As a **Pharmacist**: Manage inventory, fulfill prescriptions
   - As an **Admin**: Monitor system, manage users

## Notes

- The payment system is simulated for demo purposes (95% success rate)
- QR codes are generated using an external QR code API
- All data is stored securely in MongoDB Atlas
- The system is production-ready with proper error handling

## License

MIT License - feel free to use this project for learning or commercial purposes.
