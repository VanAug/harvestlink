export const categories = [
  { name: "Fruits", emoji: "🥑", count: 128 },
  { name: "Vegetables", emoji: "🥬", count: 96 },
  { name: "Grains & Cereals", emoji: "🌾", count: 84 },
  { name: "Nuts & Seeds", emoji: "🥜", count: 72 },
  { name: "Herbs & Spices", emoji: "🌿", count: 69 },
  { name: "Oils & Fats", emoji: "🫒", count: 44 },
  { name: "Coffee, Tea & Cocoa", emoji: "☕", count: 51 },
  { name: "Processed Foods", emoji: "🥫", count: 88 },
];

export const products = [
  {
    id: "hass-avocado",
    name: "Hass Avocado",
    category: "Fruits",
    country: "Kenya",
    seller: "Green Valley Exports",
    price: "$1.20 - $1.80 / kg",
    moq: "1,000 kg",
    availability: "In Season",
    badge: "Export Ready",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "arabica-coffee",
    name: "Arabica Coffee Beans",
    category: "Coffee, Tea & Cocoa",
    country: "Ethiopia",
    seller: "Highland Coffee Cooperative",
    price: "$4.50 - $6.20 / kg",
    moq: "500 kg",
    availability: "Available",
    badge: "Premium",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "raw-cashews",
    name: "Raw Cashew Nuts",
    category: "Nuts & Seeds",
    country: "Tanzania",
    seller: "Coastal Nut Traders",
    price: "$2.80 - $3.50 / kg",
    moq: "1,000 kg",
    availability: "Available",
    badge: "Organic",
    image: "https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "fresh-ginger",
    name: "Fresh Ginger",
    category: "Herbs & Spices",
    country: "Nigeria",
    seller: "Naija Roots Ltd",
    price: "$1.10 - $1.70 / kg",
    moq: "500 kg",
    availability: "Available",
    badge: "Verified",
    image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "basmati-rice",
    name: "Basmati Rice",
    category: "Grains & Cereals",
    country: "India",
    seller: "Golden Grain Exporters",
    price: "$1.00 - $1.35 / kg",
    moq: "2,000 kg",
    availability: "Available",
    badge: "Export Ready",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "sunflower-oil",
    name: "Refined Sunflower Oil",
    category: "Oils & Fats",
    country: "Ukraine",
    seller: "Black Sea Oils",
    price: "$1.30 - $1.65 / L",
    moq: "1,000 L",
    availability: "Available",
    badge: "Premium",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80"
  }
];

export const suppliers = [
  {
    id: "green-valley-exports",
    name: "Green Valley Exports",
    country: "Kenya",
    type: "Exporter",
    verified: true,
    years: "8 years",
    markets: "UAE, Germany, Netherlands",
    capacity: "500 tons monthly",
    products: ["Hass Avocado", "French Beans", "Mangoes"],
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "highland-coffee-cooperative",
    name: "Highland Coffee Cooperative",
    country: "Ethiopia",
    type: "Cooperative",
    verified: true,
    years: "12 years",
    markets: "USA, Japan, Italy",
    capacity: "300 tons monthly",
    products: ["Arabica Coffee", "Roasted Coffee"],
    image: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "coastal-nut-traders",
    name: "Coastal Nut Traders",
    country: "Tanzania",
    type: "Processor",
    verified: true,
    years: "6 years",
    markets: "India, UAE, Turkey",
    capacity: "700 tons monthly",
    products: ["Raw Cashews", "Sesame Seeds"],
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80"
  }
];

export const rfqs = [
  {
    id: "rfq-001",
    product: "Refined Sunflower Oil",
    status: "Open",
    location: "Chittagong, Bangladesh",
    quantity: "200 Metric Tons",
    target: "USD 750 - 900 / MT",
    validUntil: "May 7, 2026",
    certification: "ISO, HACCP",
    incoterm: "CIF"
  },
  {
    id: "rfq-002",
    product: "White Refined Sugar",
    status: "Open",
    location: "Afghanistan",
    quantity: "1,000 Metric Tons",
    target: "Not specified",
    validUntil: "April 22, 2026",
    certification: "Food Grade",
    incoterm: "CIF"
  },
  {
    id: "rfq-003",
    product: "Cavendish Banana",
    status: "Open",
    location: "Algiers, Algeria",
    quantity: "2,000 Metric Tons",
    target: "Negotiable",
    validUntil: "December 31, 2026",
    certification: "Global GAP",
    incoterm: "FOB/CIF"
  }
];

export const stats = [
  { label: "Verified Buyers", value: "10,000+" },
  { label: "Active Suppliers", value: "25,000+" },
  { label: "Products Listed", value: "5,000+" },
  { label: "Countries Connected", value: "100+" }
];
