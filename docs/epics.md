

# 🚀 MVP Epic Breakdown: Arcade

| **Project** | **Arcade** |
| --- | --- |
| **Blockchain** | **Arc Network** |
| **Status** | `In Progress` |
| **Owner** | Ade |

---

## 🏁 Epic 1: Foundation & Arc Connectivity

**Goal:** Establish the technical groundwork and prove connectivity to the Arc Blockchain.

* **Priority:** Critical (Blocker)
* **Status:** `Active`

### User Stories

* **Story 1.1:** Initialize Next.js 14 Repository with 'Fintech' Design System (shadcn/ui + Tailwind).
* **Story 1.2:** Configure `viem` and `wagmi` with **Arc Network** RPC endpoints.
* **Story 1.3:** Implement 'Connect Wallet' feature (Arc compatible).
* **Story 1.4:** Deploy `ArcadeTest.sol` to Arc Testnet to verify deployment pipeline.

---

## 📦 Epic 2: Agent Registry (Supply Side)

**Goal:** Enable developers to list their AI Agents as rentable assets on the platform.

* **Priority:** High
* **Status:** `Pending`

### User Stories

* **Story 2.1:** Develop `ArcadeRegistry.sol` Smart Contract (Struct: AgentID, Owner, Price/Hour, MetadataHash).
* **Story 2.2:** Build 'Create Listing' Frontend Form (Name, Description, Price).
* **Story 2.3:** Integrate IPFS for storing Agent Manifests (off-chain metadata).
* **Story 2.4:** Set up Supabase Indexer to listen for `AgentListed` events on Arc.

---

## 💳 Epic 3: The Rental Engine (Demand Side)

**Goal:** Enable users to browse, select, and pay to rent an agent securely.

* **Priority:** High
* **Status:** `Pending`

### User Stories

* **Story 3.1:** Implement `RentAgent` function in Smart Contract (Escrow logic).
* **Story 3.2:** Build 'Marketplace Feed' UI (Fetching data from Supabase cache).
* **Story 3.3:** Create 'Rental Dashboard' for users to see active rentals and time remaining.
* **Story 3.4:** Implement 'Withdraw Earnings' function for Agent Providers.

---

## 🧠 Epic 4: Proof of Compute (The Bridge)

**Goal:** Connect the on-chain rental payment to the off-chain agent execution via Phala.

* **Priority:** Medium (Complex)
* **Status:** `Pending`

### User Stories

* **Story 4.1:** Deploy Phala Phat Contract to listen to Arc Smart Contract events.
* **Story 4.2:** Implement Secure Key Delivery (Phat Contract decrypts API key for Renter).
* **Story 4.3:** Build 'Live Activity Log' in UI (WebSocket connection to Agent container).
* **Story 4.4:** Implement 'Kill Switch' (User can terminate rental early).

