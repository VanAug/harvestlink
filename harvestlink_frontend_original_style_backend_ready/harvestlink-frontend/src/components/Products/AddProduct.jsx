import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, PackagePlus, Sprout, X } from "lucide-react";
import PageShell from "../layout/PageShell";
import { Input } from "../forms/Input";
import { apiGet, apiPatch, apiPost, apiPostMultipart, imageForProduct } from "../../lib/api";
import { categories } from "../../data/mockData";

const initialForm = {
  name: "",
  category: "Fruits and Vegetables",
  variety: "",
  grade: "Export Grade",
  country_of_origin: "Kenya",
  available_quantity: "",
  unit: "tons/week",
  price_min: "",
  price_max: "",
  minimum_order_quantity: "",
  description: "",
  status: "active",
};

export default function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const userId = Number(localStorage.getItem("harvestlink_user_id"));
        const ownerCompanies = await apiGet(`/companies/owner/${userId}`);
        const ownedExporters = ownerCompanies.filter((company) => company.type === "exporter");
        setCompanies(ownedExporters);
        const selected = ownedExporters[0] || null;
        setCompanyId(String(selected?.id || ""));

        if (isEditing) {
          const product = await apiGet(`/products/${id}`);
          const ownedProductCompany = ownedExporters.find((company) => company.id === product.company_id);
          if (!ownedProductCompany) {
            setMessage("You can only edit products for your own exporter company.");
            return;
          }
          setForm({
            ...initialForm,
            ...product,
            available_quantity: String(product.available_quantity ?? ""),
            price_min: product.price_min == null ? "" : String(product.price_min),
            price_max: product.price_max == null ? "" : String(product.price_max),
            minimum_order_quantity:
              product.minimum_order_quantity == null ? "" : String(product.minimum_order_quantity),
          });
          setCompanyId(String(ownedProductCompany.id));
          // Show existing image if product has one
          if (product.image_url) {
            setExistingImageUrl(product.image_url);
          }
        }
      } catch (error) {
        setMessage(`Exporter company lookup failed. ${error.message}`);
      }
    }
    loadCompanies();
  }, [id, isEditing]);

  useEffect(() => {
    async function loadCountries() {
      try {
        const data = await apiGet("/countries");
        setCountries(data);
      } catch (err) {
        // ignore
      }
    }
    loadCountries();
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((company) => String(company.id) === String(companyId)),
    [companies, companyId]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toNumber(value) {
    return value === "" ? null : Number(value);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      if (!selectedCompany) {
        throw new Error("Select an exporter company before publishing.");
      }

      const payload = {
        ...form,
        company_id: selectedCompany.id,
        supplier_name: selectedCompany.name,
        available_quantity: Number(form.available_quantity),
        price_min: toNumber(form.price_min),
        price_max: toNumber(form.price_max),
        minimum_order_quantity: toNumber(form.minimum_order_quantity),
      };

      let savedProduct;
      if (isEditing) {
        savedProduct = await apiPatch(`/products/${id}`, payload);
      } else {
        savedProduct = await apiPost("/products", payload);
      }

      // Upload image if one was selected
      if (imageFile && savedProduct?.id) {
        try {
          const formData = new FormData();
          formData.append("file", imageFile);
          await apiPostMultipart(`/products/${savedProduct.id}/image`, formData);
        } catch (imgErr) {
          // Image upload failed — product is still saved, just without custom image
          setMessage(`Product saved, but image upload failed: ${imgErr.message}`);
          setTimeout(() => navigate("/exporter/products"), 2500);
          return;
        }
      }

      navigate("/exporter/products");
    } catch (error) {
      setMessage(`Product could not be saved. ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const displayImage = imagePreview || existingImageUrl;

  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <Link
          to="/exporter-dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-harvest-green hover:text-harvest-leaf"
        >
          <ArrowLeft size={16} />
          Exporter Dashboard
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
          <section className="rounded-3xl bg-harvest-green p-8 text-white shadow-soft">
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
              Exporter Product Setup
            </div>
            <h1 className="mt-4 text-4xl font-black">{isEditing ? "Edit Product" : "Add Product"}</h1>
            <p className="mt-3 text-white/80">
              Publish an export-ready listing with quantity, pricing, and order terms buyers can act on.
            </p>

            <div className="mt-8 rounded-3xl bg-white/10 p-5">
              <Sprout className="text-harvest-orange" />
              <div className="mt-4 text-sm font-bold text-white/70">Seller</div>
              <div className="mt-1 text-xl font-black">
                {selectedCompany?.name || "Choose exporter company"}
              </div>
              <div className="mt-1 text-sm text-white/70">
                {selectedCompany?.country || "Country appears after selection"}
              </div>
            </div>

            {/* Image preview in sidebar */}
            {displayImage && (
              <div className="mt-5 overflow-hidden rounded-3xl">
                <img
                  src={displayImage}
                  alt="Product preview"
                  className="h-40 w-full object-cover"
                />
              </div>
            )}
          </section>

          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-harvest-soft text-harvest-green">
                <PackagePlus size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-harvest-green">Product Details</h2>
                <p className="text-sm text-gray-500">
                  Fields marked by the form are used directly in marketplace listings.
                </p>
              </div>
            </div>

            {message && (
              <div className="mt-5 rounded-2xl bg-harvest-soft p-3 text-sm text-gray-700">{message}</div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-gray-800">Exporter Company</span>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-harvest-leaf"
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Product image upload */}
              <div className="md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-gray-800">Product Image</span>
                <div className="flex items-start gap-4">
                  {displayImage ? (
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200">
                      <img src={displayImage} alt="preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-gray-600 shadow hover:text-red-600"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
                      <ImagePlus size={28} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="rounded-2xl border border-harvest-green px-4 py-2 text-sm font-bold text-harvest-green hover:bg-harvest-soft"
                    >
                      {displayImage ? "Change image" : "Upload image"}
                    </button>
                    <p className="mt-2 text-xs text-gray-400">
                      JPG, PNG or WebP — shown in marketplace listings. Max 5 MB.
                    </p>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </div>
                </div>
              </div>

              <Input
                required
                label="Product Name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Hass Avocados"
              />
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-800">Category</span>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-harvest-leaf"
                >
                  {categories.map((category) => (
                    <option key={category.name}>{category.name}</option>
                  ))}
                </select>
              </label>
              <Input
                label="Variety"
                value={form.variety}
                onChange={(e) => updateField("variety", e.target.value)}
                placeholder="Hass, Arabica, Roses"
              />
              <Input
                label="Grade"
                value={form.grade}
                onChange={(e) => updateField("grade", e.target.value)}
                placeholder="Export Grade"
              />
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-800">Country of Origin</span>
                <select
                  value={form.country_of_origin}
                  onChange={(e) => updateField("country_of_origin", e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-harvest-leaf"
                >
                  {countries.length === 0 ? (
                    <option>Kenya</option>
                  ) : (
                    countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <Input
                required
                label="Available Quantity"
                type="number"
                min="0"
                step="0.01"
                value={form.available_quantity}
                onChange={(e) => updateField("available_quantity", e.target.value)}
                placeholder="20"
              />
              <Input
                required
                label="Unit"
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                placeholder="tons/week"
              />
              <Input
                label="Minimum Order Quantity"
                type="number"
                min="0"
                step="0.01"
                value={form.minimum_order_quantity}
                onChange={(e) => updateField("minimum_order_quantity", e.target.value)}
                placeholder="5"
              />
              <Input
                label="Price Min (USD)"
                type="number"
                min="0"
                step="0.01"
                value={form.price_min}
                onChange={(e) => updateField("price_min", e.target.value)}
                placeholder="1.40"
              />
              <Input
                label="Price Max (USD)"
                type="number"
                min="0"
                step="0.01"
                value={form.price_max}
                onChange={(e) => updateField("price_max", e.target.value)}
                placeholder="1.80"
              />
              <Input
                label="Description"
                textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe packing, availability, certifications, and buyer notes."
              />
            </div>

            <button
              disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-harvest-green px-5 py-3 font-black text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {submitting ? "Saving..." : isEditing ? "Save Product" : "Publish Product"}
            </button>
          </form>
        </div>
      </main>
    </PageShell>
  );
}
