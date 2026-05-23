import { useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const cuisineOptions = [
  "Italian",
  "Mexican",
  "Japanese",
  "Thai",
  "Mediterranean",
  "Indian",
  "American",
  "Vietnamese",
];

const emptyPlan = {
  workout: null,
  selected_restaurant: null,
  meal_recommendation: null,
  reservation_deep_link: "",
};

function InfoCard({ title, children }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-2 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-right text-sm font-medium text-stone-900">
        {value ?? "Not available"}
      </span>
    </div>
  );
}

function App() {
  const [form, setForm] = useState({
    athlete_id: "",
    latitude: "38.88",
    longitude: "-77.10",
    cuisine: "Italian",
  });
  const [plan, setPlan] = useState(emptyPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const canClaimTable = Boolean(plan.reservation_deep_link);

  const workoutDistance = useMemo(() => {
    if (!plan.workout?.distance_meters) return null;
    return `${(plan.workout.distance_meters / 1609.344).toFixed(2)} miles`;
  }, [plan.workout]);

  function updateField(event) {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  }

  async function generateRecoveryFeast(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/recovery-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athlete_id: Number(form.athlete_id),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          cuisine: form.cuisine,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not generate a recovery feast.");
      }

      setPlan(data);
    } catch (caughtError) {
      setPlan(emptyPlan);
      setError(caughtError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-stone-300 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              AI Recovery & Post-Workout Feast Architect
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold text-stone-950 sm:text-4xl">
              Turn your latest workout into a recovery feast plan.
            </h1>
          </div>
          <a
            className="inline-flex h-11 items-center justify-center rounded-md bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            href={`${API_BASE_URL}/auth/strava/login`}
          >
            Connect Strava
          </a>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <form
            className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            onSubmit={generateRecoveryFeast}
          >
            <h2 className="text-lg font-semibold">Recovery Inputs</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">
                  Athlete ID
                </span>
                <input
                  className="h-11 rounded-md border border-stone-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="athlete_id"
                  onChange={updateField}
                  placeholder="123456"
                  required
                  type="number"
                  value={form.athlete_id}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">
                  Latitude
                </span>
                <input
                  className="h-11 rounded-md border border-stone-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="latitude"
                  onChange={updateField}
                  required
                  step="any"
                  type="number"
                  value={form.latitude}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">
                  Longitude
                </span>
                <input
                  className="h-11 rounded-md border border-stone-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="longitude"
                  onChange={updateField}
                  required
                  step="any"
                  type="number"
                  value={form.longitude}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">
                  Cuisine
                </span>
                <select
                  className="h-11 rounded-md border border-stone-300 bg-white px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="cuisine"
                  onChange={updateField}
                  value={form.cuisine}
                >
                  {cuisineOptions.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error ? (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              className="mt-5 h-12 w-full rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Building your feast..." : "Generate Recovery Feast"}
            </button>
          </form>

          <div className="grid gap-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <InfoCard title="Workout Summary">
                {plan.workout ? (
                  <div>
                    <p className="text-xl font-semibold text-stone-950">
                      {plan.workout.name}
                    </p>
                    <div className="mt-3">
                      <DetailRow label="Sport" value={plan.workout.sport_type} />
                      <DetailRow
                        label="Moving time"
                        value={`${Math.round(
                          plan.workout.moving_time_seconds / 60,
                        )} minutes`}
                      />
                      <DetailRow label="Distance" value={workoutDistance} />
                      <DetailRow
                        label="Calories"
                        value={plan.workout.calories}
                      />
                      <DetailRow
                        label="Suffer score"
                        value={plan.workout.suffer_score}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-stone-500">
                    Your latest Strava activity will appear here.
                  </p>
                )}
              </InfoCard>

              <InfoCard title="Restaurant">
                {plan.selected_restaurant ? (
                  <div>
                    {plan.selected_restaurant.image_url ? (
                      <img
                        alt=""
                        className="mb-4 h-40 w-full rounded-md object-cover"
                        src={plan.selected_restaurant.image_url}
                      />
                    ) : null}
                    <p className="text-xl font-semibold text-stone-950">
                      {plan.selected_restaurant.name}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {(plan.selected_restaurant.categories || []).join(", ")}
                    </p>
                    <div className="mt-3">
                      <DetailRow
                        label="Rating"
                        value={plan.selected_restaurant.rating}
                      />
                      <DetailRow
                        label="Reviews"
                        value={plan.selected_restaurant.review_count}
                      />
                      <DetailRow
                        label="Price"
                        value={plan.selected_restaurant.price}
                      />
                      <DetailRow
                        label="Address"
                        value={plan.selected_restaurant.address}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-stone-500">
                    The best open restaurant match will appear here.
                  </p>
                )}
              </InfoCard>
            </div>

            <InfoCard title="AI Meal Recommendation">
              {plan.meal_recommendation ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailRow
                    label="Depletion"
                    value={plan.meal_recommendation.depletion_breakdown}
                  />
                  <DetailRow
                    label="Target calories"
                    value={plan.meal_recommendation.target_calories}
                  />
                  <DetailRow
                    label="Appetizer"
                    value={plan.meal_recommendation.appetizer}
                  />
                  <DetailRow
                    label="Main entree"
                    value={plan.meal_recommendation.main_entree}
                  />
                  <DetailRow
                    label="Recovery drink"
                    value={plan.meal_recommendation.recovery_drink}
                  />
                  <DetailRow
                    label="Why this meal"
                    value={plan.meal_recommendation.why_this_meal}
                  />
                </div>
              ) : (
                <p className="text-sm text-stone-500">
                  Your recovery meal plan will appear here after generation.
                </p>
              )}
            </InfoCard>

            <a
              className={`flex h-14 items-center justify-center rounded-md text-base font-semibold shadow-sm transition ${
                canClaimTable
                  ? "bg-stone-950 text-white hover:bg-stone-800"
                  : "pointer-events-none bg-stone-300 text-stone-500"
              }`}
              href={plan.reservation_deep_link || "#"}
              rel="noreferrer"
              target="_blank"
            >
              Claim Your Table
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
