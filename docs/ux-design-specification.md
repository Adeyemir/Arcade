# 🎨 UX Design Specification: Arcade

| **Project** | **Arcade** |
| --- | --- |
| **Theme** | **Fintech Trust (Clean, Institutional, Airy)** |
| **Status** | `Ready for Dev` |
| **Author** | Sally (UX Designer) |
| **Date** | 2025-12-23 |

---

## 1. Design Philosophy

**"Invisible Crypto"**
The interface should feel like a high-end banking platform (e.g., Stripe, Mercury, Brex), not a crypto exchange. We hide complexity. We don't say "Sign Transaction"; we say "Authorize Rental". We don't show raw hashes; we show "Verified IDs".

### Core Values

* **Clarity:** White space is a feature. Data tables are spacious.
* **Trust:** Blue implies security. Green is reserved *only* for successful transactions or active agents.
* **Speed:** Interactions should feel instant (optimistic UI), even if the blockchain is processing.

---

## 2. Visual Identity System

### 2.1 Color Palette

We are strictly adhering to the **'Arcade Blue'** system.

| Usage | Color Name | Hex Code | Tailwind Class | Context |
| --- | --- | --- | --- | --- |
| **Primary** | **Electric Blue** | `#2563EB` | `bg-blue-600` | Primary Actions (Rent, List), Active States. |
| **Secondary** | **Slate Mist** | `#F8FAFC` | `bg-slate-50` | Page Backgrounds, Secondary Buttons. |
| **Surface** | **Pure White** | `#FFFFFF` | `bg-white` | Cards, Modals, Tables. |
| **Text (Body)** | **Midnight** | `#0F172A` | `text-slate-900` | Headings, Primary Data. |
| **Text (Muted)** | **Steel** | `#64748B` | `text-slate-500` | Labels, Descriptions, Inactive States. |
| **Success** | **Emerald** | `#10B981` | `text-emerald-500` | Active Status, 'Funds Escrowed'. |
| **Error** | **Rose** | `#EF4444` | `text-red-500` | Errors, 'Rental Terminated'. |

### 2.2 Typography

* **Font Family:** **Inter** (Google Fonts) or **Geist Sans**.
* **Weights:**
* `Regular (400)` for body text.
* `Medium (500)` for button labels and table headers.
* `SemiBold (600)` for page titles and currency values.


* **Scale:** Small text should never go below `12px` (rem-based).

---

## 3. Site Map & Navigation

### 3.1 Global Navigation (Top Bar)

* **Left:** **Logo** (Arcade Wordmark in Blue-600).
* **Center:**
* `Marketplace` (Home)
* `List Agent` (Provider Flow)
* `Docs/Help`


* **Right:**
* `My Dashboard` (If logged in)
* `Connect Wallet` (Button - Outline style until connected).



### 3.2 The Dashboard ("Command Center")

Unlike a typical profile page, this is an operational cockpit.

* **Tab 1: Active Rentals** (Live agents running on Phala).
* **Tab 2: Wallet** (Arc Balance, Escrowed Funds).
* **Tab 3: History** (Past rentals, invoices).

---

## 4. Key User Flows (Wireframe Specs)

### 4.1 Flow: The "Agent Storefront" (Home)

**Goal:** User finds a bot to rent without feeling overwhelmed.

1. **Hero Section:** Minimalist. "Rent Autonomous Intelligence." Search bar centered.
2. **Filter Sidebar (Left):**
* *Category:* Trading, Social, Data.
* *Price:* Slider (ARC/hour).
* *Verification:* Toggle "Verified Developers Only".


3. **The Grid:** Cards showing:
* **Agent Avatar:** (Generated or uploaded).
* **Title:** "Arb-Bot v4".
* **Performance:** "98% Uptime" (Green badge).
* **Price:** "50 ARC / hr".
* **Action:** "Rent Now" (Ghost button).



### 4.2 Flow: The Rental Checkout

**Goal:** High-trust transaction.

1. **Modal Trigger:** User clicks "Rent Now".
2. **Step 1: Duration.** Slider or input for hours. Calculates Total Cost instantly.
3. **Step 2: Payment.** Summary: "You are sending 100 ARC to Arcade Escrow."
4. **Action:** Big Blue Button: "Authorize Rental".
5. **Loading State:** "Securing Compute on Phala..." (Progress bar, not spinner).
6. **Success:** "Agent Active. Access Key Decrypted." -> Redirect to Command Center.

### 4.3 Flow: The "Live Log" (Proof of Compute)

**Goal:** Prove the agent is working.

* **Visual:** A terminal-like window (Dark Mode `bg-slate-900`) embedded inside the White Dashboard.
* **Content:** Streaming logs from the Phala Phat Contract.
* `> System: Agent Container Started`
* `> Bot: Monitoring ETH/USDC pool...`
* `> Bot: No arbitrage opportunity found.`



---

## 5. UI Component Library (shadcn/ui overrides)

### Buttons

* **Primary:** `bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm`.
* **Secondary:** `bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg`.
* **Destructive:** `bg-white border border-red-200 text-red-600 hover:bg-red-50`.

### Cards

* **Style:** `bg-white border border-slate-200 shadow-sm rounded-xl`.
* **Interaction:** `hover:shadow-md transition-all duration-200`.

### Tables (Data)

* **Header:** `bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider`.
* **Rows:** `border-b border-slate-100 hover:bg-slate-50/50`.

---

## 6. Accessibility & Responsiveness

* **Contrast:** All text/background ratios must meet **WCAG AA** (4.5:1).
* **Mobile:** The Dashboard must stack vertically. The "Live Log" becomes a collapsible accordion on mobile.
* **Feedback:** Every blockchain action must have a **Toast Notification** (Success, Error, Pending).

---
