# Healthcare Management System - Complete Setup Guide

## Overview
This is a comprehensive healthcare management system supporting multiple hospitals with role-based access for patients, doctors, pharmacists, and administrators.

## System Architecture

### Multi-Hospital Support
- Admins can register multiple hospitals
- Each hospital has its own staff (doctors, pharmacists)
- Patients can book appointments across different hospitals
- Centralized admin dashboard for system-wide management

### User Roles
1. **Admin** - System administrator who manages hospitals and staff
2. **Doctor** - Medical professionals who treat patients
3. **Pharmacist** - Pharmacy staff managing medicines
4. **Patient** - End users booking appointments and accessing health records

## Quick Start

### Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account (if you don't have one)
3. Create a new cluster:
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

4. Create a database user:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (save these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

5. Whitelist your IP:
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

6. Get your connection string:
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `healthcare`

Example connection string:
\`\`\`
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/healthcare?retryWrites=true&w=majority
\`\`\`

### Step 2: Environment Variables

In the v0 interface, go to the **Vars** section in the sidebar and add:

\`\`\`
MONGODB_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
\`\`\`

**Important**: 
- Replace the entire `MONGODB_URI` value with your actual MongoDB Atlas connection string
- For `JWT_SECRET`, use a long random string (at least 32 characters)

### Step 3: Seed Admin Data

The system needs an initial admin user to manage hospitals and staff. You have two options:

#### Option A: Use the Seed Script (Recommended)

The seed script will create:
- A default hospital: "Central Healthcare Hospital"
- An admin user with credentials below

**Admin Credentials:**
- Email: `admin@healthcare.com`
- Password: `Admin@123456`

The script runs automatically when you first access the application, or you can run it manually from the scripts folder.

#### Option B: Manual Admin Registration

1. Go to the registration page
2. Select "Admin" as the role
3. Fill in your details
4. Register

### Step 4: System Setup Flow

Once you have an admin account:

1. **Login as Admin**
   - Email: `admin@healthcare.com`
   - Password: `Admin@123456`

2. **Add Hospitals** (if needed)
   - Go to "Hospitals" in the admin sidebar
   - Click "+ Add Hospital"
   - Fill in hospital details:
     - Name, address, phone, email
     - Registration number
     - Type (Government/Private/Clinic)
     - Departments (comma-separated)
     - Facilities (comma-separated)
   - Click "Create Hospital"

3. **Register Staff Members**
   - Go to "Staff" in the admin sidebar
   - Click "+ Add Staff Member"
   - Fill in staff details:
     - Name, email, password
     - Role (Doctor or Pharmacist)
     - Phone, date of birth, gender
     - Select hospital
     - For doctors: Add specialization, license number, department
   - Click "Register Staff Member"

4. **Seed Medicine Database** (Optional)
   - The system includes a medicine seeding script
   - This will populate the pharmacy with common medicines
   - Run from the scripts section if needed

## User Workflows

### Admin Workflow
1. Login to admin dashboard
2. Manage hospitals (add, view, update)
3. Register doctors and pharmacists
4. Monitor system-wide statistics
5. View all appointments and users
6. Access analytics and reports

### Doctor Workflow
1. Login to doctor portal
2. View daily appointment schedule
3. **Scan patient QR codes** to access:
   - Complete patient information
   - Full medical history
   - Previous prescriptions
4. Add medical records after consultation
5. Write prescriptions
6. Mark appointments as completed

### Pharmacist Workflow
1. Login to pharmacist portal
2. View prescription requests
3. Manage medicine inventory
4. Update stock levels
5. Process medicine orders
6. Track payments

### Patient Workflow
1. Register as a patient
2. Complete profile information
3. Book appointments with doctors
4. View digital health card (with QR code)
5. Access medical records
6. View prescriptions
7. Make payments for appointments
8. Track payment history

## Key Features Explained

### 1. Multi-Hospital System
- Admins can register unlimited hospitals
- Each hospital operates independently
- Staff members are assigned to specific hospitals
- Patients can access services across all hospitals

### 2. Admin-Controlled Staff Registration
- Only admins can register doctors and pharmacists
- Prevents unauthorized staff accounts
- Ensures proper credential verification
- Maintains system security and integrity

### 3. QR Code Health Cards
- Every patient gets a unique digital health card
- QR code contains encrypted patient ID
- Doctors scan QR codes for instant patient access
- Displays critical information: blood group, allergies, emergency contacts

### 4. Doctor QR Scanner
- Scan patient health cards using device camera
- Instantly view complete patient profile
- Access full medical history
- View all previous prescriptions
- Add new medical records on the spot

### 5. Payment System
- Multiple payment methods supported
- Secure transaction processing
- Payment history tracking
- Receipt generation
- Appointment payment linking

## Database Collections

The system uses the following MongoDB collections:

- **hospitals** - Hospital information and details
- **users** - All user accounts (patients, doctors, pharmacists, admins)
- **appointments** - Appointment bookings
- **medical_records** - Patient medical history
- **prescriptions** - Doctor prescriptions
- **medicines** - Pharmacy inventory
- **health_cards** - Digital health cards with QR codes
- **payments** - Payment transactions

## Security Features

- JWT-based authentication with httpOnly cookies
- PBKDF2 password hashing with salt
- Role-based access control (RBAC)
- Protected API routes
- Session validation
- Secure payment processing
- Admin-only staff registration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Patient registration only
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Hospitals (Admin Only)
- `GET /api/hospitals` - List all hospitals
- `POST /api/hospitals` - Create new hospital

### Staff Management (Admin Only)
- `GET /api/admin/staff` - List all staff members
- `POST /api/admin/staff` - Register doctor or pharmacist

### Health Cards
- `GET /api/health-card` - Get patient health card
- `POST /api/health-card/scan` - Scan QR code (Doctor only)

### Payments
- `GET /api/payments` - Payment history
- `POST /api/payments/process` - Process payment

## Troubleshooting

### Cannot Connect to Database
- Verify your MongoDB URI is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure the database user has proper permissions

### Admin Cannot Register Staff
- Verify you're logged in as an admin
- Check that hospitals exist in the system
- Ensure all required fields are filled

### QR Code Scanner Not Working
- Allow camera permissions in your browser
- Ensure you're accessing via HTTPS (required for camera)
- Try a different browser if issues persist

### Payment Processing Fails
- This is a simulated payment system (95% success rate)
- Failed payments can be retried
- Check payment history for transaction status

## Production Deployment

Before deploying to production:

1. **Update Environment Variables**
   - Use a production MongoDB cluster
   - Generate a strong JWT secret (64+ characters)
   - Set proper CORS origins

2. **Security Checklist**
   - Enable MongoDB IP whitelist restrictions
   - Use strong passwords for all accounts
   - Enable SSL/TLS for database connections
   - Implement rate limiting on API routes
   - Add proper error logging

3. **Database Backup**
   - Set up automated backups in MongoDB Atlas
   - Test restore procedures
   - Monitor database performance

## Support

For issues or questions:
- Check the README.md for feature documentation
- Review API endpoint documentation
- Verify environment variables are set correctly

## License

MIT License - Free to use for personal and commercial projects.
