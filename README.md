# 🍔 Campus Crave (V2)

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20TS-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.11-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![YOLOv8](https://img.shields.io/badge/AI%20Vision-Ultralytics%20YOLOv8-FF6F00?logo=python&logoColor=white)](https://ultralytics.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay%20Checkout-0C2340?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Google OAuth](https://img.shields.io/badge/Auth-Google%20Identity%20Services-4285F4?logo=google&logoColor=white)](https://developers.google.com/identity)

**Campus Crave** is an intelligent, full-stack campus food ordering and queue management system designed to eliminate long canteen waiting lines. It combines modern web ordering, multi-outlet cart isolation, secure digital payments, and real-time computer vision crowd monitoring (YOLOv8) into a unified campus dining platform.

---

## 📸 Key Features & Highlights

### 1. 🏬 Separate Multi-Outlet Carts & Per-Account Isolation
- **Isolated Outlet Carts**: Order dishes from multiple outlets (*Dice n Sip, Georgia, Basil, CCD, Subway, Food Court, etc.*) simultaneously without cart collision.
- **Outlet Cart Switcher**: The Checkout page (`/cart`) features a **Separate Outlet Carts Switcher**, enabling students to switch between active outlet carts with 1 click, view itemized bills, and generate outlet-specific pickup tokens.
- **100% Account Scoped**: Each student's cart is stored strictly under their verified account key:
  ```ts
  localStorage.setItem(`campus_crave_cart_${user.email.toLowerCase().trim()}`, JSON.stringify(cart));
  ```
  Switching accounts or signing out completely clears the active cart in memory, ensuring zero data leakage between different students.
- **Authentication Protected Cart & Payment**: Unauthenticated visitors cannot see added items in the cart or proceed to pay. Navigating to `/cart` while signed out presents a secure **"Sign In to View Your Cart"** gate with a 1-click login action.

### 2. 🔐 Native Google OAuth 2.0 & Student Authentication
- **Official Google Identity Services (GSI)**: Directly opens Google's native account chooser browser popup (`accounts.google.com`) listing all signed-in browser accounts (*Anurag Aryan Mehta, etc.*).
- **Live Profile Sync**: Fetches real Google profile details (`name`, `email`, `picture`, `sub`) via `https://www.googleapis.com/oauth2/v3/userinfo` and registers them with the FastAPI backend (`POST /api/auth/google`).
- **Theme-Adaptive Google Button**:
  - **Dark Mode**: Solid black background (`dark:bg-black`), crisp white font, and subtle dark border.
  - **Light Mode**: Clean white background (`bg-white`), solid black font, and gray border.
- **Clean Logout Persistence**: When a student clicks "Sign Out", the session is wiped (`user = null`) and remains logged out on page refresh with no hardcoded fallbacks.

### 3. 💳 Multi-Channel Payments & Razorpay Gateway
- **Official Razorpay Gateway Integration**: Real-time server-side order generation (`POST /api/razorpay/create-order`) and HMAC-SHA256 signature verification (`POST /api/razorpay/verify`).
- Instant UPI QR, Net Banking, and Cards with automated sandbox simulation fallback ensuring uninterrupted demo evaluation.
- Student discount coupons (`CAMPUS50`, `FIRSTBITE`) with live balance recalculation.

### 4. 👤 Dedicated Student Account & Profile
- **Device Photo Upload**: Students can upload their profile picture directly from their phone/laptop (with client-side canvas compression, no avatars).
- **Campus Delivery Addresses (`/addresses`)**: Save hostel rooms (*Hostel Block 1, Room 402*), library study desks, and academic halls with custom delivery instructions.
- **Support & Grievances (`/support`, `/faqs`)**: Direct ticketing interface to report food quality or token issues.
- **Role-Based Privacy**: Normal students access student-only actions (Orders, Profile, Addresses, Tickets, FAQs); Admin Analytics and Kitchen KDS are securely restricted to admin roles.

### 5. 🍱 Bento Grid Menus & Food Visuals
- High-resolution dish photography across all 10 campus outlets.
- Official FSSAI-style **Veg (green dot) / Non-Veg (red triangle)** badges.
- Dynamic search and filter across cuisines, price points, and ratings.

### 6. 👁️ Real-Time YOLOv8 Crowd Vision & Queue Monitor
- **Stomach-to-Face Priority Multi-Anchor ROI**:
  To overcome the real-world limitation where canteen counters and dining tables occlude students' feet and legs, Campus Crave checks three anatomical anchors for every detected person:
  - **Head / Face** ($Y_1 + 0.25H$)
  - **Upper Chest** ($Y_1 + 0.45H$)
  - **Stomach** ($Y_1 + 0.65H$)
  This guarantees accurate crowd counts even if a student is seated behind a table or ordering at a counter.
- **Focused Counter Polygon ROI**:
  A centered ordering zone (`0.12` to `0.88` horizontally, `0.16` to `0.92` vertically) with corner anchor handles and a live `ROI ZONE: X In / Y Detected` status badge.
- **Real-Time HUD Overlay (88px)**:
  - Header: `CAMPUS CRAVE | <OUTLET NAME>`
  - Density Tier Range Badge: `Occupancy (ROI): X [LOW (1-5)]` (amber for `[MEDIUM (6-10)]`, red for `[HIGH (>10)]`)
  - Live red recording dot with real-time FPS + avg FPS, latency ms + avg latency, and hardware spec (`HW: MPS | 640px | IoU: 0.45`).
- **Live Stream Endpoint (`/api/stream`)**:
  Streams live processed MJPEG video at `http://localhost:8000/api/stream`. If the camera detector is idle, it automatically displays an animated standby HUD with server clock rather than hanging.

### 7. 📹 Hardware Camera Finder
- **Diagnostic Tool (`face_detection/camera_finder.py`)**: Probes, names, and tests macOS AVFoundation cameras (e.g. built-in *FaceTime HD Camera Index 0*).
- **Camera Finder REST API (`GET /api/cameras`)**: Exposes detected hardware cameras and launch commands as JSON.

---

## 📂 Project Architecture

```
Campus-Crave-V2-main/
├── frontend/                     # React 18 + Vite + TypeScript Web Application
│   ├── src/
│   │   ├── components/           # BentoGrid, LoginModal, UserNavProfile, SwiggyFloatingCart, etc.
│   │   ├── context/              # CartContext (isolated per account), AuthContext, OrderContext
│   │   ├── lib/                  # api.ts, googleAuth.ts, razorpay.ts, outletMapping.ts
│   │   ├── pages/                # App, Cart, Profile, Addresses, Support, Admin, Faqs
│   │   └── router.tsx            # Full React Router route configurations
│   ├── .env                      # Frontend environment config (VITE_GOOGLE_CLIENT_ID, etc.)
│   └── package.json
│
├── backend/                      # FastAPI Python REST API & Real-Time Engine
│   ├── main.py                   # FastAPI application & REST endpoints
│   ├── database.py               # SQLAlchemy SQLite engine & session management
│   ├── models.py                 # User, Order, Outlet, Coupon, Ticket schemas
│   ├── schemas.py                # Pydantic request/response validation
│   ├── state.py                  # Thread-safe global frame buffer & metrics
│   ├── razorpay_module.py        # Razorpay order generation & HMAC-SHA256 verification
│   ├── templates/                # Standalone Kitchen Display System (KDS) & Admin HTML
│   └── requirements.txt
│
├── face_detection/               # YOLOv8 Crowd & Headcount Vision Engine
│   ├── detector.py               # Real-time inference, Stomach-to-Face ROI, HUD overlay, stream upload
│   ├── camera_finder.py          # Camera index discovery & hardware diagnostic tool
│   ├── yolov8_crowd_monitor.py   # Standalone benchmark evaluation runner
│   └── yolov8n.pt                # YOLOv8 neural network weights
│
├── package.json                  # Root workspace orchestration
├── requirements.txt              # Root Python dependencies
└── start.sh                      # Universal service launcher
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher with Conda or virtualenv)
- **Git**

---

### 2. Running Frontend
```bash
cd frontend
npm install
npm run dev
```
> Web App available at: **http://localhost:5173**  
> Cart / Checkout: **http://localhost:5173/cart**  
> Admin Analytics: **http://localhost:5173/admin**  

---

### 3. Running Backend (FastAPI)
```bash
cd backend
source /opt/anaconda3/bin/activate    # or: source venv/bin/activate
pip install -r requirements.txt
python main.py
```
> REST API: **http://localhost:8000**  
> Swagger Documentation: **http://localhost:8000/docs**  
> Kitchen Display Queue: **http://localhost:8000/kitchen**  
> Live Vision Stream: **http://localhost:8000/api/stream**  
> Camera Finder API: **http://localhost:8000/api/cameras**  

---

### 4. Running YOLOv8 Camera Crowd Detector
In a separate terminal:
```bash
cd face_detection
source /opt/anaconda3/bin/activate    # or: source venv/bin/activate

# Launch detector on camera index 0 with Apple Silicon MPS acceleration:
python detector.py --source 0 --device mps --api-url http://localhost:8000
```
> Streams processed frames directly into **http://localhost:8000/api/stream**.

---

### 5. Running Camera Finder (Hardware Diagnostic)
To inspect and test all connected cameras:
```bash
cd face_detection
source /opt/anaconda3/bin/activate
python camera_finder.py
```

---

### 6. Unified 1-Click Launcher
Launch all services simultaneously:
```bash
chmod +x start.sh
./start.sh all
```

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=110868741475-1qqm4qtgbunggg7he7na34av3ijs5lmk.apps.googleusercontent.com
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

### Backend (`backend/.env`)
```ini
DATABASE_URL=sqlite:///./campus_crave.db
GOOGLE_CLIENT_ID=110868741475-1qqm4qtgbunggg7he7na34av3ijs5lmk.apps.googleusercontent.com
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## 🧭 Page Routes Summary

| Route | Description |
| :--- | :--- |
| `/` | **Home Page**: Cafe cards, Bento dish grids, Veg filters, real-time wait times |
| `/outlet/:outletId` | **Outlet Menu**: In-depth cafe view with menu sections and add-to-cart |
| `/cart` | **Cart & Checkout**: Multi-outlet switcher, coupon discounts, address, and Razorpay |
| `/my-orders` | **Order Tracking**: Live pickup tokens, token status, and past meal receipts |
| `/profile` | **Student Profile**: Upload device profile picture, set department & dietary preferences |
| `/addresses` | **Delivery Points**: Hostel rooms, library study desks, academic blocks |
| `/support` | **Raise a Ticket**: Report canteen, food, or payment issues |
| `/faqs` | **FAQs & Help**: Common student questions on token pickup and refund policies |
| `/admin` | **Admin Dashboard**: Revenue charts, outlet sales, rush distributions, live stream |
| `http://localhost:8000/kitchen` | **Kitchen Display (KDS)**: Live token preparation board for canteen chefs |
| `http://localhost:8000/api/stream` | **AI Vision MJPEG Stream**: Live bounding boxes, ROI polygon, and HUD stats |
| `http://localhost:8000/api/cameras` | **Camera Finder API**: JSON list of connected hardware cameras |

---

## 🎓 Evaluation Demo Script

1. **Browse Outlets**: Explore canteen outlets on `/`, note the Veg/Non-Veg badges and food photography.
2. **Per-Account Cart**: Click **"+ Add"** on a dish. Note that authentication is requested to ensure items save to your student account.
3. **Multi-Outlet Switching**: Add an item from *Dice n Sip*, then add an item from *Georgia*. Visit `/cart` and switch between the two independent carts.
4. **Checkout & Token**: Apply promo code `CAMPUS50`, select delivery/pickup point, and complete checkout. Observe token generation (`#TK-XXX`).
5. **Student Navigation**: Open the user profile dropdown to view **Edit Profile** (device picture upload) and **Campus Addresses**.
6. **Live Vision Stream**: Open `http://localhost:8000/api/stream` to view the live YOLOv8 crowd monitoring with the Stomach-to-Face ROI and HUD metrics.
7. **Kitchen Sync**: Open `http://localhost:8000/kitchen` to see the placed order token appear on the chef's board in real time.

---

## 📄 License
This project is developed for educational and campus dining evaluation purposes.
