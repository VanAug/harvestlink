import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-harvest-cream text-harvest-ink">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
