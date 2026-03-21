import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, MessageCircle, Database, Coins, Zap, Bot } from "lucide-react";
import { getIPFSUrl } from "@/lib/ipfs";
import { ReputationBadge } from "@/components/ReputationBadge";

interface AgentCardProps {
  agentId: number;
  title: string;
  description: string;
  minPriceUsdc?: string;
  uptime?: string;
  category?: string;
  owner: string;
  isVerified?: boolean;
  imageUrl?: string;
  /** If true, show the live ERC-8004 reputation score from chain */
  showReputation?: boolean;
}

// Category-based colors and icons
const categoryConfig: Record<string, { gradient: string; bgColor: string; textColor: string; icon: any }> = {
  Trading: {
    gradient: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    icon: TrendingUp,
  },
  Social: {
    gradient: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    icon: MessageCircle,
  },
  Data: {
    gradient: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
    icon: Database,
  },
  Gaming: {
    gradient: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    icon: Zap,
  },
  Automation: {
    gradient: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    icon: Bot,
  },
  General: {
    gradient: "from-slate-500 to-slate-600",
    bgColor: "bg-slate-50",
    textColor: "text-slate-700",
    icon: Coins,
  },
};

export function AgentCard({
  agentId,
  title,
  description,
  minPriceUsdc,
  uptime = "N/A",
  category = "General",
  owner,
  isVerified = false,
  imageUrl,
  showReputation = false,
}: AgentCardProps) {
  const config = categoryConfig[category] || categoryConfig.General;
  const Icon = config.icon;


  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-200">
      {/* Card Header with gradient background */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 relative">
        {/* Verified Badge */}
        {isVerified && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
            Verified
          </span>
        )}

        {/* Circular Profile Image or Icon */}
        <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shadow-md mx-auto bg-gradient-to-br ${config.gradient}`}>
          {imageUrl ? (
            <img
              src={getIPFSUrl(imageUrl)}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                // Try fallback gateways
                if (img.src.includes('ipfs.io')) {
                  img.src = img.src.replace('ipfs.io', 'cloudflare-ipfs.com');
                } else if (img.src.includes('cloudflare-ipfs.com')) {
                  img.src = img.src.replace('cloudflare-ipfs.com', 'dweb.link');
                } else if (img.src.includes('dweb.link')) {
                  img.src = img.src.replace('dweb.link', 'gateway.pinata.cloud');
                } else {
                  console.error(`All gateways failed for agent #${agentId}:`, imageUrl);
                  // Hide image and show icon
                  img.style.display = 'none';
                }
              }}
            />
          ) : (
            <Icon className="w-8 h-8 text-white" />
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Title - centered */}
        <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
          {title}
        </h3>

        {/* Category Tag - centered */}
        <div className="flex justify-center mb-3">
          <span className={`px-3 py-1 ${config.bgColor} ${config.textColor} text-xs font-medium rounded-full`}>
            {category}
          </span>
        </div>

        {/* Description - centered */}
        <p className="text-slate-600 text-sm text-center mb-4 line-clamp-2">
          {description}
        </p>

        {/* Stats Row */}
        <div className="flex justify-between items-center py-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-slate-500">Uptime:</span>
            <span className="text-emerald-600 font-medium">{uptime}</span>
          </div>
          <div className="text-right">
            {minPriceUsdc ? (
              <>
                <span className="text-xs text-slate-500 block">from</span>
                <span className="text-xl font-bold text-slate-900">${minPriceUsdc}</span>
                <span className="text-slate-500 text-xs ml-1">USDC/task</span>
              </>
            ) : (
              <span className="text-sm text-slate-400 italic">Ask for price</span>
            )}
          </div>
        </div>

        {/* ERC-8004 Reputation */}
        {showReputation && (
          <div className="pt-1">
            <ReputationBadge agentId={BigInt(agentId)} compact />
          </div>
        )}

        {/* CTA Button */}
        <Button
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
          asChild
        >
          <Link href={`/agent/${agentId}`}>Hire Now</Link>
        </Button>
      </div>
    </div>
  );
}
