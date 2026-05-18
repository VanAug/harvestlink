import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import { Input } from "../components/forms/Input";
import { apiGet, apiPost } from "../lib/api";

export default function DeliveryReview() {
  const { dealId } = useParams();
  const [deal, setDeal] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [company, setCompany] = useState(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    rating: 5,
    comment: "",
    review_type: "quality",
  });

  async function load() {
    try {
      const dealData = await apiGet(`/deals/${dealId}`);
      setDeal(dealData);

      const reviewsData = await apiGet(`/reviews?deal_id=${dealId}`);
      setReviews(reviewsData);

      const userId = Number(localStorage.getItem("harvestlink_user_id"));
      if (userId) {
        const companies = await apiGet(`/companies/owner/${userId}`);
        const buyer = companies.find((c) => c.type === "buyer") || companies[0];
        setCompany(buyer);

        const userReview = reviewsData.find((r) => r.reviewer_company_id === buyer?.id);
        if (userReview) {
          setSubmitted(true);
        }
      }
    } catch (error) {
      setMessage(`Failed to load. ${error.message}`);
    }
  }

  useEffect(() => {
    load();
  }, [dealId]);

  async function submitReview(e) {
    e.preventDefault();
    if (!company) {
      setMessage("Unable to submit review. Company not found.");
      return;
    }

    try {
      await apiPost(`/deals/${dealId}/reviews`, {
        deal_id: Number(dealId),
        reviewed_company_id: deal.exporter_company_id,
        rating: Number(form.rating),
        comment: form.comment,
        review_type: form.review_type,
      });
      setMessage("Review submitted successfully!");
      setSubmitted(true);
      await load();
    } catch (error) {
      setMessage(`Failed to submit review. ${error.message}`);
    }
  }

  const isBuyer = company?.type === "buyer";
  const canReview = isBuyer && !submitted;

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-harvest-green">Review & Ratings</h1>
          {deal && <p className="mt-2 text-gray-600">Deal #{deal.id} - {deal.exporter_name}</p>}
        </div>

        {message && (
          <div className={`mb-6 rounded-[2rem] p-4 ${message.includes("successfully") ? "bg-green-50 text-green-900" : "bg-blue-50 text-blue-900"}`}>
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {canReview && (
              <div className="rounded-[2rem] bg-white p-8 shadow-soft mb-8">
                <h2 className="text-2xl font-black text-harvest-green mb-6">Rate Your Experience</h2>
                <form onSubmit={submitReview} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setForm({ ...form, rating: star })}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            size={32}
                            className={star <= form.rating ? "fill-harvest-green text-harvest-green" : "text-gray-300"}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {form.rating === 5 && "Excellent"}
                      {form.rating === 4 && "Good"}
                      {form.rating === 3 && "Average"}
                      {form.rating === 2 && "Poor"}
                      {form.rating === 1 && "Very Poor"}
                    </div>
                  </div>

                  <select
                    value={form.review_type}
                    onChange={(e) => setForm({ ...form, review_type: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold"
                  >
                    <option value="quality">Quality of Products</option>
                    <option value="delivery">Delivery & Shipping</option>
                    <option value="communication">Communication</option>
                    <option value="pricing">Pricing Fairness</option>
                    <option value="overall">Overall Experience</option>
                  </select>

                  <Input
                    label="Your Review"
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    textarea
                    placeholder="Share your experience with this supplier (optional but appreciated)"
                  />

                  <button type="submit" className="w-full rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white hover:bg-green-700">
                    Submit Review
                  </button>
                </form>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="rounded-[2rem] bg-white p-8 shadow-soft">
                <h2 className="text-2xl font-black text-harvest-green mb-6">Reviews</h2>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold">{review.reviewer_name}</div>
                          <div className="text-sm text-gray-600 capitalize">{review.review_type.replace(/_/g, " ")}</div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= review.rating ? "fill-harvest-green text-harvest-green" : "text-gray-300"}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
                      <div className="mt-2 text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviews.length === 0 && !canReview && (
              <div className="rounded-[2rem] bg-harvest-soft p-8 text-center">
                <p className="text-gray-600">No reviews yet for this deal.</p>
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] bg-harvest-soft p-6 h-fit">
            <h3 className="text-lg font-black text-harvest-green mb-4">Seller Info</h3>
            {deal && (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600">Company</div>
                  <div className="font-bold">{deal.exporter_name}</div>
                </div>
                <div>
                  <div className="text-gray-600">Average Rating</div>
                  <div className="font-black text-harvest-green text-lg">
                    {reviews.length > 0
                      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                      : "No ratings"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Total Reviews</div>
                  <div className="font-bold">{reviews.length}</div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
