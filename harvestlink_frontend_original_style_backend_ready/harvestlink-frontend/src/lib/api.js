const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export async function login(email, password) {
  const data = await apiPost('/auth/login', { email, password });
  localStorage.setItem('harvestlink_token', data.access_token);
  localStorage.setItem('harvestlink_role', data.role);
  localStorage.setItem('harvestlink_user_id', data.user_id);
  localStorage.setItem('harvestlink_email', data.email);
  localStorage.setItem('harvestlink_full_name', data.full_name);
  window.dispatchEvent(new Event('harvestlink-auth-changed'));
  return data;
}

export async function register(fullName, email, password, role) {
  const data = await apiPost('/auth/register', {
    full_name: fullName,
    email,
    password,
    role,
  });
  localStorage.setItem('harvestlink_token', data.access_token);
  localStorage.setItem('harvestlink_role', data.role);
  localStorage.setItem('harvestlink_user_id', data.user_id);
  localStorage.setItem('harvestlink_email', data.email);
  localStorage.setItem('harvestlink_full_name', data.full_name);
  window.dispatchEvent(new Event('harvestlink-auth-changed'));
  return data;
}

export function logout() {
  [
    'harvestlink_token',
    'harvestlink_role',
    'harvestlink_user_id',
    'harvestlink_email',
    'harvestlink_full_name',
  ].forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event('harvestlink-auth-changed'));
}

export function imageForProduct(product) {
  const key = (product.image_key || product.name || '').toLowerCase();
  if (key.includes('avocado')) return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=900&q=80';
  if (key.includes('coffee')) return 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80';
  if (key.includes('flower')) return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80';
  if (key.includes('herb') || key.includes('tea')) return 'https://images.unsplash.com/photo-1594648695040-bf3da6a8de69?auto=format&fit=crop&w=900&q=80';
  if (key.includes('nut') || key.includes('cashew')) return 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?auto=format&fit=crop&w=900&q=80';
  return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80';
}

export function mapProduct(apiProduct, companies = []) {
  const supplier = companies.find(c => c.id === apiProduct.company_id);
  const price = apiProduct.price_min && apiProduct.price_max
    ? `$${apiProduct.price_min} - $${apiProduct.price_max} / ${apiProduct.unit}`
    : 'Custom quote';

  return {
    id: String(apiProduct.id),
    name: apiProduct.name,
    category: apiProduct.category,
    country: apiProduct.country_of_origin,
    seller: supplier?.name || 'Verified Supplier',
    supplierId: supplier?.id,
    price,
    moq: apiProduct.minimum_order_quantity ? `${apiProduct.minimum_order_quantity} ${apiProduct.unit}` : 'Contact supplier',
    availability: apiProduct.status,
    badge: supplier?.verification_status === 'verified' ? 'Verified' : 'Export Ready',
    image: imageForProduct(apiProduct),
    raw: apiProduct,
  };
}

export function mapSupplier(company) {
  return {
    id: String(company.id),
    name: company.name,
    country: company.country,
    type: company.type === 'exporter' ? 'Exporter' : company.type,
    verified: company.verification_status === 'verified',
    years: 'Verified profile',
    markets: company.export_markets || company.preferred_destinations || 'Global markets',
    capacity: company.export_capacity || 'Capacity available on request',
    products: (company.products_offered || company.buying_interests || '').split(',').map(x => x.trim()).filter(Boolean),
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80',
    raw: company,
  };
}

export function mapRFQ(rfq) {
  return {
    id: String(rfq.id),
    product: rfq.product_name,
    status: rfq.status,
    location: rfq.destination_country,
    quantity: `${rfq.quantity} ${rfq.unit}`,
    target: rfq.target_price ? `USD ${rfq.target_price}` : 'Negotiable',
    validUntil: rfq.delivery_timeline,
    certification: 'As specified by buyer',
    incoterm: 'FOB / CIF',
    raw: rfq,
  };
}
