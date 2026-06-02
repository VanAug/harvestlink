const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

function authHeaders() {
  const token = localStorage.getItem('harvestlink_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiErrorMessage(res, path) {
  try {
    const data = await res.json();
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(', ')
      : data.detail || data.message;
    return detail ? `${detail} (${res.status} on ${path})` : `API error ${res.status} on ${path}`;
  } catch {
    return `API error ${res.status} on ${path}`;
  }
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await apiErrorMessage(res, path));
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await apiErrorMessage(res, path));
  return res.json();
}

export async function apiPostMultipart(path, formData) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error(await apiErrorMessage(res, path));
  return res.json();
}

export async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await apiErrorMessage(res, path));
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await apiErrorMessage(res, path));
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

export function isLoggedIn() {
  return Boolean(localStorage.getItem('harvestlink_token'));
}

export function getRole() {
  return localStorage.getItem('harvestlink_role');
}

export function imageForProduct(product) {
  // Prefer a real uploaded image_url from the backend
  if (product.image_url) return product.image_url;
  // Fall back to keyword matching on image_key or product name
  const key = (product.image_key || product.name || '').toLowerCase();
  if (key.includes('avocado')) return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=900&q=80';
  if (key.includes('coffee')) return 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80';
  if (key.includes('flower') || key.includes('rose')) return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80';
  if (key.includes('herb') || key.includes('tea')) return 'https://images.unsplash.com/photo-1594648695040-bf3da6a8de69?auto=format&fit=crop&w=900&q=80';
  if (key.includes('nut') || key.includes('cashew') || key.includes('macadamia')) return 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?auto=format&fit=crop&w=900&q=80';
  if (key.includes('grain') || key.includes('maize') || key.includes('wheat')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80';
  if (key.includes('mango') || key.includes('fruit')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=80';
  if (key.includes('spice') || key.includes('pepper') || key.includes('chili')) return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=80';
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
  // Deterministic image based on supplier name hash
  const supplierImages = [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f8?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1583508915901-b5f84c1dcde1?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1521714161819-155f54f2e5be?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1516912481808-3406840bd25c?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80',
  ];
  const imageIndex = Math.abs(company.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % supplierImages.length;
  return {
    id: String(company.id),
    name: company.name,
    country: company.country,
    address: company.address,
    description: company.description,
    website: company.website,
    type: company.type === 'exporter' ? 'Exporter' : company.type,
    verified: company.verification_status === 'verified',
    years: 'Verified profile',
    markets: company.export_markets || company.preferred_destinations || 'Global markets',
    capacity: company.export_capacity || 'Capacity available on request',
    products: (company.products_offered || company.buying_interests || '').split(',').map(x => x.trim()).filter(Boolean),
    image: supplierImages[imageIndex],
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
    buyer_company_name: rfq.buyer_company_name || rfq.buyer_name || 'Unknown Buyer',
    buyer_company_id: rfq.buyer_company_id,
    raw: rfq,
  };
}
