export interface AgentMetadata {
  name: string;
  description: string;
  category?: string;
  image?: string;
  capabilities?: string[];
}

/**
 * Fetches agent metadata from IPFS using the metadata hash
 * @param metadataHash - The IPFS hash (can be full ipfs:// URL or just the hash)
 * @returns Parsed metadata or null if fetch fails
 */
export async function fetchAgentMetadata(
  metadataHash: string
): Promise<AgentMetadata | null> {
  try {
    // Handle different hash formats
    let hash = metadataHash;
    if (hash.startsWith("ipfs://")) {
      hash = hash.replace("ipfs://", "");
    }

    // Try multiple IPFS gateways for reliability
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://ipfs.io/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) {
          console.warn(`Failed to fetch from ${gateway}:`, response.status);
          continue;
        }

        const metadata = await response.json();

        return {
          name: metadata.name || "Unnamed Agent",
          description: metadata.description || "No description available",
          category: metadata.category,
          image: metadata.image,
          capabilities: metadata.capabilities,
        };
      } catch (error) {
        console.warn(`Error fetching from ${gateway}:`, error);
        continue;
      }
    }

    console.error("Failed to fetch metadata from all gateways");
    return null;
  } catch (error) {
    console.error("Failed to fetch agent metadata:", error);
    return null;
  }
}

/**
 * Fetches multiple agent metadata in parallel
 * @param metadataHashes - Array of IPFS hashes
 * @returns Array of metadata (null for failed fetches)
 */
export async function fetchMultipleAgentMetadata(
  metadataHashes: string[]
): Promise<(AgentMetadata | null)[]> {
  return Promise.all(metadataHashes.map((hash) => fetchAgentMetadata(hash)));
}
