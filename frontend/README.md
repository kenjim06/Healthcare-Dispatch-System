# Healthcare Dispatch System

This is the React frontend for the Healthcare Dispatch System, a role-based emergency coordination dashboard for dispatchers, field paramedics, and hospital administrators.

## Quick start

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, typically:

```text
http://localhost:5173
```

## How to use the app

### Sign in

The app opens to a secure access portal. Use either:
- a custom email and password
- one of the built-in demo accounts

Available demo profiles:
- Dispatcher: Officer Sarah Jenkins
- Lead Paramedic: Capt. Marcus Vance
- Hospital Admin: Dr. Elena Rostova

### Dashboard

After signing in, the dashboard shows:
- active emergencies
- units still available
- patients waiting for a vehicle
- open hospital beds
- the emergency queue

### Patients

The Patients screen displays patient records and applies role-based filtering:
- Dispatcher sees limited patient details
- Lead Paramedic sees relevant patient data
- Hospital Admin sees a broader read-only view

### Emergencies

This page includes the emergency queue, assignment information, and prototype controls for creating or managing emergency entries.

### Vehicles

The Vehicles page tracks unit status, location, crew count, and service details.

### Hospitals

Hospital data is displayed with bed counts, wait times, and service area information. Lead Paramedic users see hospitals in their service area.

## Notes

- The app currently uses demo/mock data stored in `src/data.js`.
- Authentication is client-side and stored in browser local storage.
- Several forms and action buttons are placeholders intended to demonstrate the workflow, not a live backend implementation.

## Build and preview

```bash
npm run build
npm run preview
```
