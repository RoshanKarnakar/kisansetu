# KisanSetu (किसानसेतु) - Farmer Crop Procurement & Queue Management Portal

**KisanSetu** ("Farmer's Bridge") is a full-stack digital platform designed to eliminate long waiting times, congestion, and uncertainty for farmers arriving at agricultural crop procurement centres (APMC Mandis).

## Key Features

1. **Exact Visual Fidelity to Reference Design**:
   - **Green Top Header**: Logo 🌾 KisanSetu, navigation links, quick search bar, notification bell with unread SMS badge, and farmer profile dropdown.
   - **Warm Cream Banner**: Warm greeting for *Rakesh Singh*, tagline, and illustration of a farmer holding a digital tablet beside grain sacks.
   - **Book Your Procurement Slot Card**: APMC Centre selector dropdown, interactive month calendar widget with highlighted dates (Oct 8, 15, 27), timing slots with live remaining capacities, and prominent confirmation button.
   - **Current Booking Card**: Golden ticket badge showing slot date/time, centre name, and crop type.
   - **Live Queue Status Card**: Real-time token caller displaying Token #24, Current Token #19, Estimated Wait Time (15 mins), 5 waiting farmers, and a circular progress ring visual.
   - **My Status Tracker Card**: 4-stage lifecycle tracker: *Registered (Oct 24)* → *Slot Booked (Oct 27)* → *At Centre (Waiting)* → *Payment Processed*.

2. **Complete Lifecycle & User Roles**:
   - **Farmer Portal**: Book slots, view live queue movement, generate digital gate pass QR codes, and view DBT payment advice.
   - **Mandi Staff Admin Console**: Call next token, mark farmer as arrived at Gate 2, record weighbridge measurements, and trigger direct bank DBT settlements.
   - **Bilingual Support (English / हिंदी)**: Instant language toggle designed for low digital literacy users.
   - **Simulated SMS Gateway**: Real-time SMS push notifications (`DM-KISANS` / `PFMS-GOV`) when booking is confirmed, when token is 3 away, and upon payment credit.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React icons, Motion animations.
- **Backend**: Node.js & Express with REST APIs integrated seamlessly with Vite middleware.
- **Data Persistence**: Structured in-memory store pre-seeded with 3 procurement centres, time slots, 3 realistic farmer profiles, and pre-seeded bookings.

## API Endpoints

- `GET /api/centres`: List procurement centres
- `GET /api/centres/:id`: Get centre details and queue state
- `GET /api/slots?centreId={id}&date={date}`: Query available time slots and remaining capacities
- `POST /api/bookings`: Book a slot, assign sequential token number, prevent double booking
- `GET /api/bookings`: List bookings (filterable by farmer, centre, date)
- `GET /api/bookings/:id`: Get single booking status with live queue position
- `PATCH /api/bookings/:id/status`: Update booking stage (`at_centre`, `served`, `payment_processed`)
- `POST /api/bookings/:id/cancel`: Cancel an active booking and restore slot capacity
- `GET /api/queue/:centreId`: Get live queue state and estimated wait time
- `POST /api/queue/advance`: Mandi staff advances next token and sends alerts
- `POST /api/queue/reset`: Reset queue to initial demo state
- `POST /api/auth/otp/send` & `POST /api/auth/otp/verify`: Mobile phone OTP authentication (Demo OTP: `1234`)
- `POST /api/farmers/register`: Register new farmer profile
- `GET /api/notifications`: Retrieve simulated SMS logs and app alerts

## Running the Application

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## Demo Credentials

- **Farmer Profile**: Rakesh Singh (+91 9876543210, Village: Taraori, Karnal, Token #24)
- **Second Farmer Profile**: Gurpreet Kaur (+91 9876500001, Village: Nilokheri, Karnal)
- **Mandi Staff Profile**: Karnal APMC Yard Officer (Switch via top navbar button "Mandi Staff")
- **OTP for all demo logins**: `1234`
