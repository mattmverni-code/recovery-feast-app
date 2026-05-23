import { useEffect, useMemo, useState } from "react";

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

const defaultLocation = {
  city: "Arlington",
  zipCode: "22201",
  latitude: "38.88",
  longitude: "-77.10",
  status: "Using Arlington, VA",
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
    city: defaultLocation.city,
    zipCode: defaultLocation.zipCode,
    latitude: defaultLocation.latitude,
    longitude: defaultLocation.longitude,
    cuisine: "Italian",
  });
  const [stravaUser, setStravaUser] = useState({
    athleteId: localStorage.getItem("strava_athlete_id") || "",
    firstname: localStorage.getItem("strava_firstname") || "",
  });
  const [plan, setPlan] = useState(emptyPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState(defaultLocation.status);
  const [error, setError] = useState("");

  const canClaimTable = Boolean(plan.reservation_deep_link);
  const isStravaConnected = Boolean(stravaUser.athleteId);

  const workoutDistance = useMemo(() => {
    if (!plan.workout?.distance_meters) return null;
    return `${(plan.workout.distance_meters / 1609.344).toFixed(2)} miles`;
  }, [plan.workout]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const athleteId = params.get("athlete_id");
    const firstname = params.get("firstname") || "";

    if (!athleteId) return;

    localStorage.setItem("strava_athlete_id", athleteId);
    localStorage.setItem("strava_firstname", firstname);
    setStravaUser({ athleteId, firstname });
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (name === "city") {
      setLocationStatus(value ? `Using ${value}` : defaultLocation.status);
    }

    if (name === "zipCode" && value && form.city) {
      setLocationStatus(`Using ${form.city}`);
    }
  }

  function useCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setLocationStatus(defaultLocation.status);
      setError("Current location is not available in this browser.");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((currentForm) => ({
          ...currentForm,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
        setLocationStatus("Location detected");
        setIsDetectingLocation(false);
      },
      () => {
        setLocationStatus(defaultLocation.status);
        setError("Could not detect your location. Using Arlington, VA.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function generateRecoveryFeast(event) {
    event.preventDefault();
    setError("");

    if (!stravaUser.athleteId) {
      setError("Connect Strava first");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/recovery-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athlete_id: Number(stravaUser.athleteId),
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

  function disconnectStrava() {
    localStorage.removeItem("strava_athlete_id");
    localStorage.removeItem("strava_firstname");
    setStravaUser({ athleteId: "", firstname: "" });
    setPlan(emptyPlan);
    setError("");
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
          <div className="flex flex-col gap-2 sm:items-end">
            <a
              className="inline-flex h-11 items-center justify-center rounded-md bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
              href={`${API_BASE_URL}/auth/strava/login`}
            >
              Connect Strava
            </a>
            {isStravaConnected ? (
              <button
                className="text-sm font-medium text-stone-600 underline-offset-4 hover:text-stone-950 hover:underline"
                onClick={disconnectStrava}
                type="button"
              >
                Disconnect Strava
              </button>
            ) : null}
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <form
            className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            onSubmit={generateRecoveryFeast}
          >
            <h2 className="text-lg font-semibold">Recovery Inputs</h2>
            <div className="mt-5 grid gap-4">
              <p
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isStravaConnected
                    ? "bg-orange-50 text-orange-800"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {isStravaConnected
                  ? `Strava connected as ${stravaUser.firstname || "athlete"}`
                  : "Connect Strava first"}
              </p>

              <button
                className="h-11 rounded-md border border-emerald-700 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-500"
                disabled={isDetectingLocation}
                onClick={useCurrentLocation}
                type="button"
              >
                {isDetectingLocation
                  ? "Detecting Location..."
                  : "Use My Current Location"}
              </button>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">City</span>
                <input
                  className="h-11 rounded-md border border-stone-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="city"
                  onChange={updateField}
                  placeholder="Arlington"
                  type="text"
                  value={form.city}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">
                  ZIP Code
                </span>
                <input
                  className="h-11 rounded-md border border-stone-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  inputMode="numeric"
                  name="zipCode"
                  onChange={updateField}
                  placeholder="22201"
                  type="text"
                  value={form.zipCode}
                />
              </label>

              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {locationStatus}
              </p>

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
              disabled={isLoading || !isStravaConnected}
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
