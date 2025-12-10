Cankaya Hospital – Frontend (MVP)

This project is the React.js frontend of the Cankaya Hospital Appointment System, developed as part of SENG 429 – Enterprise Application Development.
The system includes three main user roles (Patient, Doctor, Admin) and demonstrates the core flows of a MERN-based hospital management platform.

This delivery represents the Minimum Viable Product (MVP) version, focusing on required navigation, CRUD operations, routing, and basic API integration.

Tech Stack

React + Vite

React Router

Axios / Fetch

CSS (Custom Layout Styling)

JavaScript ES6

Backend base URL:
http://localhost:5000/api

Project Structure

client/
├─ package.json
├─ .env.example
├─ README.md
├─ src/
│ ├─ index.js (or main.jsx)
│ ├─ App.js
│ ├─ pages/
│ │ ├─ LoginPage.jsx
│ │ ├─ PatientPage.jsx
│ │ ├─ DoctorPage.jsx
│ │ └─ AdminPage.jsx
│ ├─ api/
│ │ └─ api.js
│ ├─ components/
│ └─ styles/
│ └─ layout.css
└─ screenshots/
├─ home.png
├─ admin.png
└─ form.png

Installation

cd client
npm install

Running the Application

npm run dev

The application runs at:
http://localhost:5173

Environment Variables

.env.example file contains:

REACT_APP_API_URL=http://localhost:5000/api

Before running the project, create a .env file and copy the variable above.

MVP Scope Explanation

This frontend implements all required MVP-level features for SENG 429.

Main Listing Page

Patients can view their appointments.

Doctors can view today’s appointments.

Admin can view doctor and patient listings.

Admin / Management View
Admin can:

Add a doctor

Edit a doctor

Delete a doctor

Search doctors or patients

View clinic lists and report summaries

Create / Edit Form Pages
Implemented forms include:

Appointment creation form (patient)

Doctor add/edit form (admin)
Both forms include validation and display error messages when necessary.

Routing (React Router)
/ → Login
/patient → Patient panel
/doctor → Doctor panel
/admin → Admin panel

Stateful Components

Appointment lists

Patient profile editing

Doctor appointment detail view

Admin CRUD tables and search functionality

Stateless Components

Sidebar

Profile section

Layout and UI elements

API Integration
The frontend communicates with the backend using Axios/Fetch for:

Fetching appointment lists

Creating new appointments

Updating and deleting items (admin)

Runtime API base URL is provided via environment variables.

Screenshots Folder

patient.png - patient information
doctor.png – doctor listing
admin.png – admin dashboard
login.png – appointment form with validation messages
