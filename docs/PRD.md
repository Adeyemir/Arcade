
# 📄 Product Requirements Document: Arcade

|**Project Name**|**Arcade**|
|---|---|
|**Version**|1.0 (MVP)|
|**Status**|`APPROVED`|
|**Date**|2025-12-23|
|**Author**|John (Product Manager)|
|**Owner**|Ade|

---

## 1. Executive Summary

**Arcade** is a decentralized marketplace running on the **Arc Blockchain** that allows users to rent autonomous AI Agents for specific tasks. Unlike static NFT marketplaces, Arcade deals in _compute and service_. It leverages **Phala Network** for trustless off-chain execution and **Arc** for secure settlement, ensuring a 'fair playing ground' where users get exactly the compute power they pay for without front-running or manipulation.

## 2. Problem Statement

- **The Trust Gap:** Users want to pay for AI tasks (e.g., 'Monitor this discord', 'Trade this token') but don't trust centralized black boxes with their keys.
    
- **The "Cheating" Problem:** In existing on-chain markets, bots and manipulators front-run transactions.
    
- **Complexity:** Running decentralized AI agents requires technical command-line skills, excluding normal users.
    

## 3. Solution Vision

A 'Fintech-grade' platform where renting an AI agent is as simple and secure as a bank transfer.

- **Trustless:** The agent's code is verified.
    
- **Fair:** Sealed execution via Phala prevents front-running.
    
- **Accessible:** A clean, modern UI (White/Blue) that abstracts the crypto complexity.
    

## 4. Target Audience

- **Providers:** Developers who write Python/JS agents and want to monetize them without managing billing infrastructure.
    
- **Renters (Primary):** Crypto-native users who need automated tasks done (trading, monitoring, data scraping) but can't code.
    

## 5. Technical Architecture (The Stack)

- **Frontend:** Next.js 14 (App Router)
    
- **Design System:** shadcn/ui + Tailwind (Fintech Theme: White #FFFFFF / Electric Blue #2563EB)
    
- **Settlement Layer:** **Arc Blockchain** (Smart Contracts for Escrow & Identity)
    
- **Compute Layer:** **Phala Network** (Phat Contracts for off-chain execution)
    
- **Data Indexing:** Supabase (PostgreSQL)
    
- **Storage:** IPFS (Agent Manifests)
    

## 6. Functional Requirements (MVP)

### 6.1 User Authentication & Profile

- **FR-01:** User must be able to connect via Arc-compatible wallet.
    
- **FR-02:** System must display user's Arc balance in a clean 'Banking Dashboard' format.
    

### 6.2 Agent Registry (Supply)

- **FR-03:** Providers can upload an 'Agent Manifest' (Name, Description, Docker Image Hash, Price per Hour).
    
- **FR-04:** System mints a 'Service NFT' on Arc representing the agent's availability.
    

### 6.3 Rental Mechanism (Demand)

- **FR-05:** Users can browse agents with filters (Category, Price, Reputation).
    
- **FR-06:** Users can execute a `RentAgent` transaction on Arc, locking funds in escrow.
    
- **FR-07:** System must provide a 'Sealed Access Key' to the user upon confirmed payment.
    

### 6.4 Execution & Monitoring

- **FR-08:** Users can view a live 'Activity Log' of their rented agent (streamed from Phala).
    
- **FR-09:** Users can terminate the rental early to retrieve remaining escrowed funds.
    

## 7. UX/UI Design Specifications

- **Theme:** "Trust & Clarity" (Fintech).
    
- **Palette:**
    
    - Background: White (`#FFFFFF`) & Slate-50 (`#F8FAFC`).
        
    - Primary Action: Electric Blue (`#2563EB`).
        
    - Text: Slate-900 (High contrast).
        
- **Typography:** Inter or Geist Sans.
    
- **Components:** Clean cards, tabular data for rentals, status badges (Green = Active, Gray = Idle).
    

## 8. MVP Roadmap (Phases)

### Phase 1: Foundation (Weeks 1-2)

- Repo setup (Next.js + shadcn).
    
- **Arc Network** connection tests (Wallet Connect).
    
- Deploy `ArcadeRegistry.sol` to Arc Testnet.
    

### Phase 2: The Loop (Weeks 3-4)

- Listing creation flow (IPFS upload).
    
- Rental transaction flow (Escrow contract).
    
- Basic 'My Rentals' dashboard.
    

### Phase 3: The Brain (Weeks 5-6)

- Phala Phat Contract integration.
    
- End-to-End test: Rent Agent -> Agent prints 'Hello World' -> User sees log.
    

---

