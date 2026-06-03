import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Edit3, PackagePlus, RotateCcw } from "lucide-react";
import PageShell from "../layout/PageShell";
import { apiGet, apiPatch, mapProduct } from "../../lib/api";

export default function ExporterProducts() {
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    const userId = Number(localStorage.getItem("harvestlink_user_id"));
    const companies = await apiGet(`/companies/owner/${userId}`);
    const exporter = companies.find((item) => item.type === "exporter") || companies[0];
    setCompany(exporter);
    if (exporter) {
      const data = await apiGet(`/products?company_id=${exporter.id}`);
      const mapped = data.map((product) => {
        const mappedProduct = mapProduct(product, [exporter]);
        mappedProduct.moderationStatus = product.status;
        return mappedProduct;
      });
      setProducts(mapped);
    }
  }

  useEffect(() => {
    load().catch((error) => setMessage(`Products could not load. ${error.message}`));
  }, []);

  async function archiveProduct(productId) {
    await apiPatch(`/products/${productId}/archive`, {});
    await load();
  }

  async function unarchiveProduct(productId) {
    await apiPatch(`/products/${productId}/unarchive`, {});
    await load();
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="flex flex-col justify-between gap-5 rounded-[2rem]  bg-harvest-green  text-white p-8 shadow-soft md:flex-row md:items-end">
          <div>
            <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">Exporter Inventory</div>
            <h1 className="mt-4 text-4xl font-black text-white">My Product Listings</h1>
            <p className="mt-2  text-white">{company?.name || "Create your exporter profile first"}.</p>
          </div>
          <Link to="/exporter/products/new" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
            <PackagePlus size={18} />
            Add Product
          </Link>
        </div>

        {message && <div className="mt-6 rounded-2xl bg-white p-4 text-sm font-bold text-harvest-green shadow-sm">{message}</div>}

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <img src={product.image} alt={product.name} className="h-40 w-full rounded-2xl object-cover" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-black text-harvest-green">{product.name}</h2>
                  <p className="text-sm text-gray-500">{product.category} - {product.country}</p>
                </div>
                <div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    product.moderationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                    product.moderationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                    product.moderationStatus === 'active' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {product.moderationStatus === 'approved' ? 'approved' :
                     product.moderationStatus === 'active' ? 'active' :
                     product.moderationStatus || 'pending'}
                  </span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-harvest-soft p-4 text-sm text-gray-700">
                <div><b>Price:</b> {product.price}</div>
                <div><b>MOQ:</b> {product.moq}</div>
              </div>
              <div className="mt-4 flex gap-3">
                <Link to={`/exporter/products/${product.id}/edit`} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-harvest-green px-4 py-2 text-sm font-bold text-harvest-green">
                  <Edit3 size={16} />
                  Edit
                </Link>
                {product.moderationStatus === 'archived' ? (
                  <button onClick={() => unarchiveProduct(product.raw.id)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700">
                    <RotateCcw size={16} />
                    Unarchive
                  </button>
                ) : (
                  <button onClick={() => archiveProduct(product.raw.id)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700">
                    <Archive size={16} />
                    Archive
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
