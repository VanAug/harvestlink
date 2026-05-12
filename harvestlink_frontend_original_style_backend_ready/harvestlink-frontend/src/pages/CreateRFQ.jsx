import PageShell from "../components/layout/PageShell";
import { Input, Select } from "../components/forms/Input";

export default function CreateRFQ() {
  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
        <div className="mb-8">
          <h1 className="text-5xl font-black text-harvest-green">Create Request for Quote</h1>
          <p className="mt-3 text-gray-600">Get competitive quotes from verified suppliers. Fill out your requirements and HarvestLink will match you with relevant suppliers.</p>
        </div>
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="grid gap-6 md:grid-cols-2">
            <Select label="Product Category"><option>Fruits</option><option>Grains & Cereals</option><option>Oils & Fats</option></Select>
            <Input label="Product Name" placeholder="Search or enter custom product name" />
            <Input label="Required Quantity" placeholder="Enter quantity" />
            <Select label="Unit"><option>Metric Tons</option><option>KG</option><option>Cartons</option><option>Liters</option></Select>
            <Input label="Target Price Range" placeholder="e.g. USD 750 - 900 / MT" />
            <Input label="Delivery Location" placeholder="Enter destination city, country or port" />
            <Input label="Product Specifications" textarea placeholder="Grade, variety, size, color, moisture content..." />
            <Input label="Quality Requirements" textarea placeholder="Certifications, testing, standards..." />
            <Input label="Packaging Requirements" textarea placeholder="Packaging type, size, labels..." />
            <Input label="Shipping Requirements" textarea placeholder="FOB, CIF, cold chain, air freight..." />
            <Input label="Target Delivery Date" type="date" />
            <Input label="RFQ Valid Until" type="date" />
            <Select label="Payment Terms"><option>Letter of Credit</option><option>Advance Payment</option><option>Net 30</option><option>Escrow</option></Select>
            <Input label="Additional Message" textarea placeholder="Any additional buyer requirements..." />
          </div>
          <button className="mt-8 rounded-2xl bg-harvest-green px-8 py-4 font-black text-white">Submit RFQ</button>
        </div>
      </main>
    </PageShell>
  );
}
