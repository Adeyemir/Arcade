
# 🏗️ System Architecture: Arcade

|**Project**|**Arcade**|
|---|---|
|**Network**|**Arc Blockchain**|
|**Architecture Style**|**Hybrid Decentralized (On-chain Settlement / Off-chain Compute)**|
|**Status**|`Frozen`|
|**Author**|Winston (Architect)|

---

## 1. High-Level Overview

Arcade operates on a hybrid model to solve the scalability and privacy limitations of pure on-chain systems.

- **The Trust Layer (L1/L2):** **Arc Blockchain** handles identity, payments, and rental agreements (Smart Contracts).
    
- **The Compute Layer:** **Phala Network** (Phat Contracts) acts as the trustless bridge, executing the agent code and managing API keys without revealing them to the node operators.
    
- **The Application Layer:** A **Next.js** web application serves as the interface, reading indexed data from **Supabase** for performance.
    

---

## 2. Technology Stack

### 2.1 The Application (Frontend)

- **Framework:** **Next.js 14** (App Router)
    
    - _Rationale:_ Server-Side Rendering (SSR) for SEO and fast initial loads.
        
- **UI Library:** **shadcn/ui** + **Tailwind CSS**
    
    - _Theme:_ 'Fintech' (White/Slate-900/Electric Blue).
        
- **State Management:** **TanStack Query** (React Query)
    
    - _Rationale:_ Efficient caching of blockchain state and API responses.
        
- **Wallet Connection:** **RainbowKit** + **Wagmi** + **Viem**
    
    - _Rationale:_ Best-in-class support for custom EVM chains like Arc.
        

### 2.2 The Settlement Layer (Blockchain)

- **Network:** **Arc Blockchain**
    
- **Language:** **Solidity (v0.8.20+)**
    
- **Core Contracts:**
    
    - `ArcadeRegistry.sol`: Stores Agent metadata hashes and owner mapping.
        
    - `ArcadeEscrow.sol`: Holds rental funds; releases them based on time or milestones.
        
    - `ArcadeToken.sol`: (Optional) Platform utility token if needed later.
        

### 2.3 The Compute Layer (Off-Chain)

- **Engine:** **Phala Network (Phat Contracts)**
    
    - _Role:_ Listens to Arc events, decrypts secrets, and triggers Agent containers.
        
- **Agent Runtime:** **Docker**
    
    - _Role:_ Agents are packaged as Docker images hosted on decentralized storage or private registries.
        

### 2.4 Data & Storage

- **Metadata Storage:** **IPFS** (via Pinata)
    
    - _Content:_ Agent Name, Description, Docker Hash, Logo.
        
- **Indexer / Cache:** **Supabase (PostgreSQL)**
    
    - _Role:_ Listens to `AgentRegistered` and `RentalStarted` events on Arc. The Frontend queries Supabase for the marketplace feed instead of hammering the Arc RPC.
        

---

## 3. Core Data Flows

### 3.1 Listing an Agent (Supply Side)

1. **Provider** fills form in Next.js UI.
    
2. Metadata (Name, Description) is uploaded to **IPFS** → Returns `CID`.
    
3. **Provider** signs transaction on **Arc Blockchain**: `registerAgent(CID, pricePerHour)`.
    
4. **Supabase** detects event → Indexes agent in `agents` table.
    

### 3.2 Renting an Agent (Demand Side)

1. **Renter** selects agent and clicks "Rent".
    
2. **Renter** signs transaction on **Arc**: `rentAgent(agentId)` with attached **ARC** tokens.
    
3. **Smart Contract** locks funds in Escrow.
    
4. **Phala Phat Contract** detects `RentalStarted` event.
    
5. **Phat Contract** generates/decrypts a temporary API Key.
    
6. **Phat Contract** encrypts the key with the **Renter's Public Key** and posts it to the chain (or sends via secure channel).
    

---

## 4. Security Considerations

- **Trusted Execution:** We rely on Phala's TEE (Trusted Execution Environment) to ensure that the Agent code running is exactly what was promised.
    
- **Escrow Safety:** `ArcadeEscrow.sol` must follow the **Pull over Push** pattern to prevent re-entrancy attacks during fund withdrawal.
    
- **Metadata Immutability:** IPFS CIDs are immutable; providers cannot "bait and switch" agent descriptions after listing without creating a new listing.
    

---

### 📝 Architect's Note

**Ade**, this architecture balances **decentralization** with **usability**. By using Supabase for reads and Arc for writes, we ensure the UI is snappy (Web2 speed) while the assets remain secure (Web3 trust).

**The blueprint is ready. Shall we hand this to Amelia to start coding the Smart Contract?**"