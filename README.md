# Healthcare Dispatch System

Healthcare Dispatch System is a React, FastAPI, and MySQL application for coordinating emergency response operations across dispatchers, field paramedics, and hospital administrators. Each account sees the records and actions allowed for its role.

This project is intended as a functional demonstration. Do not use it with real patient information or expose it to untrusted networks.

## Features

- MySQL-backed accounts with hashed passwords and signed, expiring sessions
- Server-enforced role permissions for API requests
- Sidebar indicator for API/MySQL connectivity
- Dispatcher dashboard for emergency queue coordination
- Lead Paramedic view filtered to assigned calls and vehicles
- Hospital Admin read-only overview of activity and bed availability
- Patient records with role-specific visibility
- Emergency creation, dispatch assignment, and status updates persisted to MySQL
- Dispatch conflict checks to prevent assigning an unavailable unit
- Vehicle status tracking and hospital capacity summary
- Collapsible OpenStreetMap previews centered on selected emergencies and resources

## Roles in the system

### Dispatcher
The Dispatcher is responsible for managing the overall emergency queue and coordinating available vehicles.

Typical responsibilities:
- monitor active emergencies
- assign vehicles or paramedics
- review patient conditions
- manage emergency status updates

### Lead Paramedic
The Lead Paramedic sees only the emergencies and vehicles assigned to their unit.

Typical responsibilities:
- review assigned emergencies
- view area hospitals relevant to their service area
- track their unit status
- respond to assigned patient records

### Hospital Admin
The Hospital Admin gets a read-only operational overview for hospital planning and emergency coordination.

Typical responsibilities:
- review active incidents
- monitor hospital bed availability
- inspect vehicle and service-area information
- assess emergency demand patterns

## Project structure

- `frontend/` - React application and UI
- `frontend/src/pages/` - screen-level views for login, dashboard, patients, emergencies, vehicles, and hospitals
- `frontend/src/context/` - authentication session logic
- `frontend/src/roleAccess.js` - role-based route permissions
- `backend/` - FastAPI API backed by the configured MySQL database
- `backend/schemas.py` - request validation models
- `backend/db_connection.py` - MySQL configuration and connection pool
- `backend/auth.py` - account storage, password verification, and session authorization
- `backend/manage_users.py` - interactive account provisioning command
- `backend/database.py` - EMS schema reflection and domain database operations
- `database/` - database-related files and schema planning

## Prerequisites

Before running the app, make sure the following are installed:

- Node.js 18 or newer
- npm (included with Node.js)
- Python 3.10 or newer
- MySQL with the existing EMS schema

## Getting started

1. Open a terminal in the repository root.
2. Change into the frontend directory:

```bash
cd frontend
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

### Start the API

Copy `backend/.env.example` to `backend/.env`, then set the MySQL connection settings and a private random `AUTH_SECRET` of at least 32 characters. Keep `.env` out of source control. The database must already contain the EMS schema tables (`patient`, `patient_encounter`, `emergency_incident`, `dispatch`, `ems_unit`, `hospital`, `hospital_resource`, and `resource`).

In a second terminal, start the FastAPI service from the repository root:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

If you do not have the backend virtual environment yet, create it and install the API dependencies first:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

On startup, the API creates its additive metadata and account tables. Create a user account in a separate terminal from `backend/`:

```powershell
python manage_users.py
```

The command prompts for a name, email, badge, role, and password. Passwords must be at least 12 characters. Accounts are not seeded with shared demo credentials.

The API is available at `http://127.0.0.1:8000`; its interactive endpoint tester is at `http://127.0.0.1:8000/docs`. The Vite development server proxies `/api` requests to this service. Start both services and sign in with a provisioned account to use live database data.

## Using the program

### 1. Sign in

When the app loads, you are redirected to the login page.

Sign in with the email and password of an account provisioned by the system administrator. The server looks up the account and assigns its role; users cannot select or change their role on the login screen. Sessions expire after eight hours. Uncheck “Remember session” to keep the token only for the current browser session.

There are no seeded test accounts. Provision an account with `python manage_users.py` from `backend/`.

### 2. Dashboard

After sign in, the dashboard appears as the default landing page.

The dashboard shows:
- active emergency count
- number of patients still waiting for a vehicle
- available units
- total open hospital beds
- emergency queue list

This page is designed to help the user quickly understand the current operational state.

### 3. Patients

The Patients screen displays patient records.

Access is role-aware:
- Dispatcher: sees limited patient details
- Lead Paramedic: sees assigned or relevant patient information
- Hospital Admin: sees the full record set, including medical history

Patient data is served by the FastAPI service for demo purposes.

### 4. Emergencies

The Emergencies page contains the emergency queue and assignment workflow.

What you will see:
- emergency priority and address information
- patient assignment details
- vehicle status
- assignment messages
- forms for emergency creation and dispatch updates, saved through the API
- manual incident pin placement and adjustment on the map

Role behavior:
- Dispatcher can manage the queue, assign available vehicles, and cancel emergencies
- Lead Paramedic sees and can update assigned emergencies and can create a call using their assigned available vehicle
- Hospital Admin has read-only access to the operational records

When creating an emergency, enter its address, then click the map to place the incident pin. Drag the pin to fine-tune its location; the coordinates are saved with the emergency and used for its map marker. Editing an emergency lets you update its pin the same way. The address itself is not sent to a geocoding service. To place a pin outside the map's initial view, pan and zoom the map to the location first.

Dispatchers and assigned Lead Paramedics can use **Complete dispatch** on an active emergency to close it. The call leaves the active queue, its dispatch and incident records remain in MySQL, and its vehicle is released when it has no other active assignment. Completed calls are available in the Emergencies page's **Archive** view.

Hospital Admins can open the profile for a linked patient by selecting the patient's name in emergency details. The profile displays available patient medical fields and linked active/completed emergency history. This prototype does not yet model hospital-to-patient affiliation, so access is currently role-based and limited to patient-linked emergencies.

### 5. Vehicles

The Vehicles page shows vehicle status, location, crew size, and assignment metadata.

Dispatchers can edit a vehicle and choose an active Lead Paramedic account from **Assigned paramedic account**. The account is matched by its badge, so the paramedic's badge does not need to be re-entered. Each Lead Paramedic account can be assigned to only one vehicle; clearing the selection unassigns it.

The app distinguishes between:
- Available
- En route
- On scene
- Out of service

Role behavior:
- Dispatcher manages vehicle data and assignment information
- Lead Paramedic sees only their linked unit
- Hospital Admin sees read-only records

### 6. Hospitals

The Hospitals screen displays open bed counts and wait times for each hospital.

For a Lead Paramedic, the hospital list is filtered to the service area for their assigned vehicle. The Dispatcher and Hospital Admin see the full hospital list.

## Role-based navigation

The frontend route list in `frontend/src/roleAccess.js` controls navigation visibility. The API independently validates the signed session and role on every protected request; frontend route checks are not treated as authorization.

## Demo data and prototype status

The frontend reads and updates records through FastAPI and MySQL. At startup, the API creates additive metadata tables (`api_patient_profile`, `api_incident_profile`, `api_unit_profile`, and `app_user`) for application data not represented by the existing schema, and adds an age-override column to its patient metadata table when needed. It does not seed or alter the existing EMS tables. The API currently serves:
- patients
- emergencies
- vehicles
- hospitals

Emergency creation, dispatch updates, patient edits, and vehicle updates write to MySQL. Assignments are recorded in the existing `dispatch` table; unavailable units are rejected, and unit/emergency status changes are committed together. Existing patient records can be linked to an emergency. New patient records require `dateOfBirth` because it is required by the existing patient schema; age updates are stored separately and do not rewrite the recorded birth date. The emergency queue excludes completed and cancelled calls; `GET /api/emergencies?include_closed=true` also returns completed calls to authorized users. Deleting an emergency marks it cancelled so existing encounter and dispatch history remains intact.

`POST /api/auth/login` issues a signed eight-hour session token. `GET /api/health` is public for the sidebar connectivity indicator; operational endpoints require a valid bearer token. Role permissions are checked on the server. Passwords are stored as salted PBKDF2 hashes.

Run the backend authentication and role-guard tests from `backend/`:

```powershell
python -m unittest discover -s tests
```

These unit tests do not require a live MySQL connection.

## Production build

To generate a production build:

```bash
cd frontend
npm run build
```

Then preview the production bundle:

```bash
npm run preview
```

## Public demonstration deployment (Firebase Hosting + local MySQL)

The Firebase project selected in `frontend/.firebaserc` is `hne-database-website-111226`; its public Hosting URL is `https://hne-database-website-111226.web.app`. The Hosting configuration in `frontend/firebase.json` serves the Vite build from `frontend/dist` and rewrites client-side routes to `index.html`. Run the build and deploy commands from the `frontend` directory.

The backend already verifies signed bearer tokens and enforces roles; it does not simulate browser-only authentication. Firebase Hosting serves only the frontend. The FastAPI API and MySQL remain on the host computer, so the computer and both services must stay online during a demonstration. Do not expose MySQL port 3306 or use real patient information.

Before deploying the frontend, create `frontend/.env.production` from `frontend/.env.production.example` and set `VITE_API_BASE_URL` to the current HTTPS Cloudflare Tunnel URL. Vite embeds this value at build time; rebuild and redeploy after the tunnel URL changes.

For the API, set `CORS_ORIGINS` in `backend/.env` to a comma-separated allowlist containing the local Vite origins and the exact Firebase Hosting origin. Do not use a wildcard origin. Start MySQL and FastAPI, verify `http://127.0.0.1:8000/api/health`, then start a Quick Tunnel with `cloudflared tunnel --url http://localhost:8000`. Configure the frontend API URL with that tunnel's HTTPS URL, build, and deploy Hosting:

```powershell
npm run dev
npm run build
firebase deploy --only hosting --project hne-database-website-111226
```

Quick Tunnel URLs change and are intended for temporary testing. Never publish or commit `.env` files, API credentials, or tunnel tokens. Use fictional demonstration records only. Review Firebase Hosting's current deployed site before deploying because a Hosting deploy replaces the site's current public content.

The API uses a local MySQL login configured in `backend/.env`. Before opening a public tunnel, use a dedicated least-privilege MySQL application account rather than `root`; grant only the permissions required by the API, including its additive metadata-table setup. Keep port 3306 private. The account setup and privileges should be confirmed against the local schema before proceeding.

## Troubleshooting

### App does not start
- Confirm that Node.js is installed and available in PATH.
- Reinstall dependencies with `npm install`.

### Login loop or missing access
- Check that the account exists, is active, and has the intended role.
- Confirm `AUTH_SECRET` is set and is at least 32 characters long.
- Clear the app's local or session storage to remove a saved token.
- Log out via the sidebar and sign in again.

### Empty or unexpected data
- Confirm that both the Vite frontend and FastAPI backend are running.
- Check that `backend/.env` has valid local MySQL settings and that the configured database has the required EMS tables.
- To try the API directly, visit `http://127.0.0.1:8000/docs`.

## Future enhancements

This prototype is a strong base for future expansion, including:
- Firebase-backed live EMS vehicle GPS tracking (planned; not yet implemented)
- notification system for emergency updates
- hospital encounter and transport workflow
- automated API tests for MySQL-backed operations

## Summary

Healthcare Dispatch System is a role-based emergency response dashboard designed to help coordination teams manage patient flow, vehicle assignments, hospital readiness, and dispatch operations in a single interface. It demonstrates a React frontend, FastAPI service, and persistent MySQL data store; it is not a production or clinical system.
