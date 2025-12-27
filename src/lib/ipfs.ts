/**
 * IPFS Gateway Helper
 * Handles IPFS URL conversion and provides multiple gateway fallbacks
 */

// List of reliable IPFS gateways (in order of preference)
export const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
] as const;

/**
 * Extract IPFS hash from various URL formats
 */
export function extractIPFSHash(ipfsUrl: string): string {
  if (!ipfsUrl) return '';

  // Already just a hash
  if (!ipfsUrl.includes('/') && !ipfsUrl.includes(':')) {
    return ipfsUrl;
  }

  // Format: https://gateway.com/ipfs/QmXXX...
  if (ipfsUrl.includes('/ipfs/')) {
    return ipfsUrl.split('/ipfs/')[1].split('?')[0]; // Remove query params if any
  }

  // Format: ipfs://QmXXX...
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', '');
  }

  // If it's already a full URL, try to extract the hash
  const match = ipfsUrl.match(/Qm[1-9A-HJ-NP-Za-km-z]{44,}/);
  if (match) {
    return match[0];
  }

  return ipfsUrl;
}

/**
 * Get IPFS URL using the primary gateway
 */
export function getIPFSUrl(ipfsUrl: string, gatewayIndex: number = 0): string {
  if (!ipfsUrl) return '';

  const hash = extractIPFSHash(ipfsUrl);
  if (!hash) return ipfsUrl; // Return original if we can't extract hash

  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return `${gateway}${hash}`;
}

/**
 * Get all possible IPFS URLs with different gateways
 */
export function getAllIPFSUrls(ipfsUrl: string): string[] {
  if (!ipfsUrl) return [];

  const hash = extractIPFSHash(ipfsUrl);
  if (!hash) return [ipfsUrl];

  return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
}

/**
 * Try to load an image from IPFS with automatic gateway fallback
 */
export function createIPFSImageLoader(
  ipfsUrl: string,
  onLoad?: () => void,
  onError?: () => void
): { src: string; onError: (e: React.SyntheticEvent<HTMLImageElement>) => void } {
  let currentGatewayIndex = 0;
  const allUrls = getAllIPFSUrls(ipfsUrl);

  return {
    src: allUrls[0] || ipfsUrl,
    onError: (e) => {
      currentGatewayIndex++;

      if (currentGatewayIndex < allUrls.length) {
        // Try next gateway
        e.currentTarget.src = allUrls[currentGatewayIndex];
      } else {
        // All gateways failed
        console.error('IPFS: All gateways failed for:', ipfsUrl);
        if (onError) onError();
      }
    },
  };
}
