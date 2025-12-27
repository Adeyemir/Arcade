"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useListAgent } from "@/lib/blockchain/hooks/useArcadeRegistry";

export default function ListAgentPage() {
  const { address, isConnected } = useAccount();
  const { listAgent, isPending, isConfirming, isSuccess, error: contractError, hash } = useListAgent();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    pricePerHour: "",
    dockerImage: "",
    apiEndpoint: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {

      // Invalidate all queries to refresh marketplace data
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });

      // Reset form on success
      setFormData({
        name: "",
        description: "",
        category: "",
        pricePerHour: "",
        dockerImage: "",
        apiEndpoint: "",
      });
      setImageFile(null);
      setImagePreview("");
      setShowCustomCategory(false);

      // Redirect to marketplace after brief delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  }, [isSuccess, hash, queryClient, router]);

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      setError(contractError.message);
    }
  }, [contractError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);


    if (!isConnected) {
      setError("Please connect your wallet to list an agent");
      console.error("❌ Wallet not connected");
      return;
    }

    // Validation
    if (!formData.name || !formData.description || !formData.category || !formData.pricePerHour) {
      setError("Please fill in all required fields");
      console.error("❌ Missing required fields");
      return;
    }

    if (parseFloat(formData.pricePerHour) <= 0) {
      setError("Price must be greater than 0");
      console.error("❌ Invalid price");
      return;
    }

    if (formData.description.length < 50) {
      setError("Description must be at least 50 characters");
      console.error("❌ Description too short:", formData.description.length, "chars");
      return;
    }

    if (formData.category.trim() === '') {
      setError("Please select or enter a category");
      console.error("❌ Category is empty");
      return;
    }

    try {
      let imageUrl = '';

      // Upload image to IPFS if selected
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await uploadToIPFS(imageFile);
        setUploadingImage(false);
      }

      // Optional: Create extended metadata for IPFS (future feature)
      // For now, we store name, description, and category directly on-chain
      const extendedMetadata = formData.dockerImage || formData.apiEndpoint
        ? JSON.stringify({
            dockerImage: formData.dockerImage,
            apiEndpoint: formData.apiEndpoint,
            timestamp: Date.now(),
          })
        : "";



      // Call the contract with on-chain metadata
      await listAgent(
        formData.name,
        formData.description,
        formData.category,
        formData.pricePerHour,
        extendedMetadata, // Optional IPFS hash or additional metadata
        imageUrl // IPFS image URL
      );


    } catch (err: any) {
      console.error("❌ Failed to list agent");
      console.error("Error:", err);
      console.error("Error message:", err?.message || "Unknown");
      setError(err instanceof Error ? err.message : "Failed to list agent");
      setUploadingImage(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, or GIF)');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  // Upload image to IPFS via Pinata
  const uploadToIPFS = async (file: File): Promise<string> => {

    const formData = new FormData();
    formData.append('file', file);


    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: formData,
    });


    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Pinata upload failed:', errorData);
      throw new Error('Failed to upload image to IPFS');
    }

    const data = await response.json();

    // Use ipfs.io gateway instead of Pinata for better reliability
    const ipfsUrl = `https://ipfs.io/ipfs/${data.IpfsHash}`;

    return ipfsUrl;
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="container max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-slate-900 mb-2">
            List Your AI Agent
          </h1>
          <p className="text-lg text-slate-600">
            Monetize your AI agent by making it available for rent on the Arcade
            marketplace
          </p>
        </div>

        {/* Wallet Connection Warning */}
        {!isConnected && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              Please connect your wallet to list an agent
            </p>
          </div>
        )}

        {/* Transaction Pending */}
        {isPending && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-medium">
              Waiting for wallet confirmation...
            </p>
          </div>
        )}

        {/* Transaction Confirming */}
        {isConfirming && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900"></div>
              <p className="text-sm text-blue-900 font-medium">
                Transaction confirming on Arc Blockchain...
              </p>
            </div>
            {hash && (
              <p className="text-xs text-blue-700 mt-2">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-900 font-medium">
              ✅ Agent listed successfully! Redirecting to marketplace...
            </p>
            {hash && (
              <p className="text-xs text-emerald-700 mt-2">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="space-y-6">
              {/* Agent Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-900 mb-2"
                >
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Trading Bot Pro"
                  className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-900 mb-2"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what your agent does, its features, and use cases..."
                  rows={4}
                  className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Minimum 50 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-900 mb-2"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category-select"
                  value={showCustomCategory ? 'custom' : formData.category}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setShowCustomCategory(true);
                      setFormData({ ...formData, category: '' });
                    } else {
                      setShowCustomCategory(false);
                      setFormData({ ...formData, category: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={!showCustomCategory}
                >
                  <option value="" className="text-slate-900">Select category</option>
                  <option value="Trading" className="text-slate-900">Trading</option>
                  <option value="Social" className="text-slate-900">Social</option>
                  <option value="Data" className="text-slate-900">Data</option>
                  <option value="Gaming" className="text-slate-900">Gaming</option>
                  <option value="DeFi" className="text-slate-900">DeFi</option>
                  <option value="NFT" className="text-slate-900">NFT</option>
                  <option value="Analytics" className="text-slate-900">Analytics</option>
                  <option value="Automation" className="text-slate-900">Automation</option>
                  <option value="custom" className="text-slate-900">Other (specify)</option>
                </select>

                {showCustomCategory && (
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Enter custom category (e.g., Healthcare, Education)"
                    className="w-full mt-2 px-4 py-3 text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                )}
              </div>

              {/* Bot Profile Image */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Bot Profile Image <span className="text-slate-400">(optional)</span>
                </label>

                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setImagePreview("")}
                      />
                    ) : (
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  {/* File Input */}
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <div className="px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-slate-600">
                            {imageFile ? imageFile.name : 'Choose image file'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, or GIF (max 5MB)</p>
                  </div>

                  {/* Remove button */}
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remove image"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Price Per Hour */}
              <div>
                <label
                  htmlFor="pricePerHour"
                  className="block text-sm font-medium text-slate-900 mb-2"
                >
                  Price Per Hour (ARC) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="pricePerHour"
                    name="pricePerHour"
                    value={formData.pricePerHour}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                    ARC
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Set a competitive price for your agent's services
                </p>
              </div>

              {/* Docker Image */}
              <div>
                <label
                  htmlFor="dockerImage"
                  className="block text-sm font-medium text-slate-900 mb-2"
                >
                  Docker Image URL
                </label>
                <input
                  type="text"
                  id="dockerImage"
                  name="dockerImage"
                  value={formData.dockerImage}
                  onChange={handleInputChange}
                  placeholder="docker.io/username/agent:latest"
                  className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Docker image containing your agent (optional for now)
                </p>
              </div>

              {/* API Endpoint */}
              <div>
                <label
                  htmlFor="apiEndpoint"
                  className="block text-sm font-medium text-slate-900 mb-2"
                >
                  API Endpoint
                </label>
                <input
                  type="url"
                  id="apiEndpoint"
                  name="apiEndpoint"
                  value={formData.apiEndpoint}
                  onChange={handleInputChange}
                  placeholder="https://api.example.com/agent"
                  className="w-full px-4 py-3 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-slate-500">
                  API endpoint for agent communication (optional)
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-slate-200"></div>

            {/* Info Box */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Your agent metadata will be stored on IPFS</li>
                <li>• A transaction will be submitted to Arc Blockchain</li>
                <li>• Your agent will appear on the marketplace once confirmed</li>
                <li>• You can update pricing or unlist anytime from your dashboard</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={!isConnected || isPending || isConfirming || uploadingImage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage
                  ? "Uploading image to IPFS..."
                  : isPending
                  ? "Awaiting Confirmation..."
                  : isConfirming
                  ? "Confirming Transaction..."
                  : "List Agent on Marketplace"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setFormData({
                    name: "",
                    description: "",
                    category: "Trading",
                    pricePerHour: "",
                    dockerImage: "",
                    apiEndpoint: "",
                  })
                }
                className="px-6 py-6"
              >
                Clear
              </Button>
            </div>

            {/* Connected Wallet Info */}
            {isConnected && (
              <div className="mt-4 text-sm text-slate-500">
                Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            )}
          </div>
        </form>

        {/* Additional Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Verified Agents</h3>
            <p className="text-sm text-slate-600">
              Complete verification to increase trust and rental rates
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Earn Passive Income</h3>
            <p className="text-sm text-slate-600">
              Your agent works 24/7 while you earn ARC tokens
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Trustless Execution</h3>
            <p className="text-sm text-slate-600">
              Secure off-chain execution keeps your code safe
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
