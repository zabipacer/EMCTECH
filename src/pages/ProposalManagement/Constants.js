export const statusConfig = {
  draft: { color: "bg-yellow-100 text-yellow-800", icon: "FaClock" },
  sent: { color: "bg-blue-100 text-blue-800", icon: "FaPaperPlane" },
  accepted: { color: "bg-green-100 text-green-800", icon: "FaCheck" },
  expired: { color: "bg-red-100 text-red-800", icon: "FaExclamationTriangle" }
};

export const mockProposals = [
  {
    id: 1,
    client: "Client A",
    company: "ABC Corporation",
    total: 30000,
    status: "draft",
    created: "2024-01-15",
    expires: "2024-02-15",
    items: 5,
    lastUpdated: "2 hours ago",
    number: "PROP-2024-001"
  },
  {
    id: 2,
    client: "Client B",
    company: "XYZ Industries",
    total: 50000,
    status: "sent",
    created: "2024-01-10",
    expires: "2024-02-10",
    items: 8,
    lastUpdated: "1 day ago",
    number: "PROP-2024-002"
  },
  {
    id: 3,
    client: "Client C",
    company: "Global Solutions Ltd",
    total: 75000,
    status: "accepted",
    created: "2024-01-05",
    expires: "2024-02-05",
    items: 12,
    lastUpdated: "3 days ago",
    number: "PROP-2024-003"
  },
  {
    id: 4,
    client: "Client D",
    company: "Tech Innovators Inc",
    total: 42000,
    status: "expired",
    created: "2023-12-20",
    expires: "2024-01-20",
    items: 6,
    lastUpdated: "1 week ago",
    number: "PROP-2024-004"
  },
  {
    id: 5,
    client: "Client E",
    company: "Alpha Trading",
    total: 22000,
    status: "draft",
    created: "2024-02-01",
    expires: "2024-03-01",
    items: 3,
    lastUpdated: "5 hours ago",
    number: "PROP-2024-005"
  }
];

export const defaultClients = [
  { id: "c1", name: "Client A", email: "a@client.com" },
  { id: "c2", name: "Client B", email: "b@client.com" },
  { id: "c3", name: "Client C", email: "c@client.com" }
];

// Add these to your existing constants file

export const sampleProducts = [
  { id: 1, name: "Ceramic Tile X", price: 12000, category: "Tiles", description: "High-quality ceramic tiles for interior use" },
  { id: 2, name: "Wooden Table", price: 15000, category: "Furniture", description: "Solid wood dining table" },
  { id: 3, name: "Marble Countertop", price: 25000, category: "Kitchen", description: "Premium marble countertop" },
  { id: 4, name: "Modern LED Lamp", price: 8500, category: "Lighting", description: "Energy-efficient LED lighting" },
  { id: 5, name: "Bathroom Vanity", price: 18000, category: "Bathroom", description: "Modern bathroom vanity unit" },
  { id: 6, name: "Outdoor Pavers", price: 9500, category: "Outdoor", description: "Durable outdoor paving stones" },
  { id: 7, name: "Glass Shower Door", price: 22000, category: "Bathroom", description: "Frameless glass shower enclosure" },
  { id: 8, name: "Kitchen Cabinetry", price: 35000, category: "Kitchen", description: "Custom kitchen cabinetry" }
];

export const sampleTemplates = [
  { id: 1, name: "Standard Proposal", terms: "Payment due within 30 days. 50% deposit required." },
  { id: 2, name: "Contractor Agreement", terms: "Milestone-based payments. Materials included." },
  { id: 3, name: "Quick Quote", terms: "Valid for 15 days. Simple terms and conditions." }
];