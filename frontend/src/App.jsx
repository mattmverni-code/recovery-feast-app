import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const cuisineOptions = [
  "Italian",
  "Sushi",
  "Steakhouse",
  "Mexican",
  "Mediterranean",
  "Thai",
  "American",
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

const logoSrc = "/assets/recovery-feast-logo.png";

function AppMark({ size = "md" }) {
  const dimensions = size === "lg" ? "h-20 w-20" : "h-11 w-11";

  return (
    <div
      className={`${dimensions} grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-lg shadow-orange-900/15 ring-2 ring-white`}
      aria-label="Recovery Feast logo"
    >
      <img
        alt="Recovery Feast"
        className="h-full w-full rounded-full object-cover"
        src={logoSrc}
      />
    </div>
  );
}

function StatusPill({ connected, firstname }) {
  return (
    <div
      className={`rounded-full px-3 py-1 text-sm font-semibold ${
        connected
          ? "bg-emerald-100 text-emerald-800"
          : "bg-stone-200 text-stone-600"
      }`}
    >
      {connected
        ? `Strava connected as ${firstname || "athlete"}`
        : "Connect Strava first"}
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

function NavLink({ children, targetId }) {
  function scrollToSection(event) {
    event.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <a
      className="rounded-full px-3 py-2 text-sm font-bold text-stone-600 transition hover:bg-stone-100 hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-400"
      href={`#${targetId}`}
      onClick={scrollToSection}
    >
      {children}
    </a>
  );
}

function Stepper({ steps }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, index) => (
        <a
          className={`group rounded-2xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${
            step.done
              ? "border-emerald-200 bg-emerald-50"
              : step.active
                ? "border-orange-200 bg-orange-50"
                : "border-white/70 bg-white/75"
          }`}
          href={`#${step.id}`}
          key={step.id}
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black transition group-hover:scale-105 ${
                step.done
                  ? "bg-emerald-600 text-white"
                  : step.active
                    ? "bg-orange-600 text-white"
                    : "bg-stone-200 text-stone-600"
              }`}
            >
              {step.done ? "✓" : index + 1}
            </span>
            <div>
              <p className="text-sm font-black text-stone-950">{step.title}</p>
              <p className="text-xs font-semibold text-stone-500">{step.detail}</p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function FitnessOrbit() {
  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-xl shadow-stone-900/10 backdrop-blur animate-float-soft">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.28),transparent_32%),radial-gradient(circle_at_78%_64%,rgba(16,185,129,0.22),transparent_30%)]" />
      <div className="relative flex h-full min-h-[270px] items-center justify-center">
        <div className="absolute h-56 w-56 rounded-full border border-dashed border-orange-300/80 animate-spin-slow" />
        <div className="absolute h-72 w-72 rounded-full border border-dashed border-emerald-300/80 animate-reverse-spin" />
        <div className="grid h-36 w-36 place-items-center rounded-full bg-stone-950 text-center text-white shadow-2xl shadow-stone-900/25">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
              Post-workout
            </p>
            <p className="mt-1 text-2xl font-black">Feast</p>
          </div>
        </div>

        <div className="absolute left-4 top-8 rounded-2xl bg-white px-4 py-3 text-sm font-black shadow-lg">
          Run
        </div>
        <div className="absolute right-5 top-12 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg">
          Bike
        </div>
        <div className="absolute bottom-7 left-8 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-lg">
          Swim
        </div>
        <div className="absolute bottom-8 right-7 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg">
          Pizza
        </div>
      </div>
    </div>
  );
}

function SectionShell({ children, id, label, title }) {
  return (
    <section
      className="scroll-mt-28 rounded-[2rem] border border-white/75 bg-white/85 p-5 shadow-lg shadow-stone-900/5 backdrop-blur animate-rise sm:p-6"
      id={id}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
        {label}
      </p>
      <h2 className="mt-1 text-2xl font-black text-stone-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoCard({ title, eyebrow, children, className = "", delay = "" }) {
  return (
    <section
      className={`rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-lg shadow-stone-900/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl ${className} ${delay}`}
    >
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-xl font-bold text-stone-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-2.5 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-semibold text-stone-900">
        {value ?? "Not available"}
      </span>
    </div>
  );
}

function RecoveryScore({ workout }) {
  if (!workout) {
    return (
      <div className="grid h-28 w-28 place-items-center rounded-full border-8 border-stone-200 bg-white text-center">
        <span className="px-4 text-sm font-bold text-stone-400">Ready</span>
      </div>
    );
  }

  const minutes = (workout.moving_time_seconds || 0) / 60;
  const calories = workout.calories || 0;
  const sufferScore = workout.suffer_score || 0;
  const score = Math.min(
    100,
    Math.round(minutes * 0.7 + calories * 0.04 + sufferScore * 0.45),
  );

  return (
    <div
      className="grid h-28 w-28 place-items-center rounded-full shadow-inner animate-pulse-soft"
      style={{
        background: `conic-gradient(#f97316 ${score}%, #e7e5e4 ${score}% 100%)`,
      }}
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
        <div>
          <p className="text-2xl font-black text-stone-950">{score}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
            Recovery
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyResults() {
  return (
    <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center animate-rise">
      <div className="mx-auto mb-4 grid place-items-center">
        <AppMark size="lg" />
      </div>
      <h2 className="text-2xl font-black text-stone-950">Ready when you are</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600">
        Connect Strava, choose your food mood, and Recovery Feast will turn your
        latest workout into a simple restaurant game plan.
      </p>
    </section>
  );
}

function App() {
  const resultsRef = useRef(null);
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

  const isStravaConnected = Boolean(stravaUser.athleteId);
  const isLocationReady = Boolean(form.latitude && form.longitude);
  const canGenerate = isStravaConnected && isLocationReady && !isLoading;
  const hasPlan = Boolean(plan.workout && plan.selected_restaurant);
  const canClaimTable = Boolean(plan.reservation_deep_link);

  const workoutDistance = useMemo(() => {
    if (!plan.workout?.distance_meters) return null;
    return `${(plan.workout.distance_meters / 1609.344).toFixed(2)} miles`;
  }, [plan.workout]);

  const steps = [
    {
      id: "connect",
      title: "Connect Strava",
      detail: isStravaConnected ? "Workout ready" : "Start with Strava",
      done: isStravaConnected,
    },
    {
      id: "location",
      title: "Choose Location",
      detail: isLocationReady ? locationStatus : "Pick your area",
      done: isLocationReady,
    },
    {
      id: "cuisine",
      title: "Pick Cuisine",
      detail: form.cuisine,
      done: Boolean(form.cuisine),
    },
    {
      id: "feast",
      title: "Generate Feast",
      detail: hasPlan ? "Plan complete" : "Final step",
      done: hasPlan,
    },
  ].map((step, index, allSteps) => ({
    ...step,
    active: !step.done && allSteps.slice(0, index).every((item) => item.done),
  }));

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

  useEffect(() => {
    if (!hasPlan) return;

    resultsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [hasPlan]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (name === "city") {
      setLocationStatus(value ? `Using ${value}` : defaultLocation.status);
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
        setError("We could not detect your location, so we kept your saved city.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function generateRecoveryFeast(event) {
    event.preventDefault();
    setError("");

    if (!isStravaConnected) {
      setError("Connect Strava first.");
      return;
    }

    if (!isLocationReady) {
      setError("Choose a location before generating your feast.");
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
        console.error("Recovery plan request failed", data);
        throw new Error(
          "We could not build your feast just yet. Check your connected accounts and try again.",
        );
      }

      setPlan(data);
    } catch (caughtError) {
      console.error(caughtError);
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
    <main className="relative min-h-screen overflow-hidden bg-[#f7f3ea] text-stone-950">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_12%_14%,rgba(251,146,60,0.22),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(16,185,129,0.18),transparent_26%),linear-gradient(180deg,#fff9ed_0%,#f7f3ea_44%,#edf7ef_100%)]" />

      <header className="sticky top-0 z-30 border-b border-white/70 bg-[#f7f3ea]/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <AppMark />
            <div>
              <p className="text-lg font-black leading-tight">Recovery Feast</p>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Train hard. Eat smart.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NavLink targetId="connect">Connect</NavLink>
            <NavLink targetId="location">Location</NavLink>
            <NavLink targetId="cuisine">Cuisine</NavLink>
            <NavLink targetId="feast">Feast</NavLink>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusPill
              connected={isStravaConnected}
              firstname={stravaUser.firstname}
            />
            {isStravaConnected ? (
              <button
                className="rounded-full px-3 py-2 text-sm font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-400"
                onClick={disconnectStrava}
                type="button"
              >
                Disconnect Strava
              </button>
            ) : (
              <a
                className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-900/15 transition hover:-translate-y-0.5 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                href={`${API_BASE_URL}/auth/strava/login`}
              >
                Connect Strava
              </a>
            )}
          </div>
        </nav>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 py-4 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="animate-rise">
            <div className="mb-6 flex items-center gap-4">
              <AppMark size="lg" />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-600">
                  Recovery Feast
                </p>
                <p className="text-sm font-semibold text-stone-500">
                  Your post-workout food concierge
                </p>
              </div>
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] text-stone-950 sm:text-6xl">
              Turn your latest workout into tonight's best recovery meal.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Connect Strava, pick a cuisine, and get a nearby restaurant plus a
              smart order built around your effort.
            </p>

            <div className="mt-8">
              <Stepper steps={steps} />
            </div>
          </div>

          <FitnessOrbit />
        </section>

        <form className="mt-8 grid gap-5" onSubmit={generateRecoveryFeast}>
          <SectionShell
            id="connect"
            label="Step 1"
            title="Connect Strava"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <StatusPill
                  connected={isStravaConnected}
                  firstname={stravaUser.firstname}
                />
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  Recovery Feast uses your latest Strava effort to shape the meal
                  recommendation.
                </p>
              </div>

              {!isStravaConnected ? (
                <a
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-900/15 transition hover:-translate-y-0.5 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                  href={`${API_BASE_URL}/auth/strava/login`}
                >
                  Connect Strava
                </a>
              ) : (
                <button
                  className="inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  onClick={disconnectStrava}
                  type="button"
                >
                  Disconnect Strava
                </button>
              )}
            </div>
          </SectionShell>

          <SectionShell
            id="location"
            label="Step 2"
            title="Choose Location"
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-start">
              <div className="rounded-3xl bg-stone-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold">Where should we search?</h3>
                    <p className="mt-1 text-sm font-medium text-emerald-700">
                      {locationStatus}
                    </p>
                  </div>
                  <button
                    className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-400"
                    disabled={isDetectingLocation}
                    onClick={useCurrentLocation}
                    type="button"
                  >
                    {isDetectingLocation
                      ? "Detecting..."
                      : "Use My Current Location"}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-stone-700">
                      City
                    </span>
                    <input
                      className="h-12 rounded-xl border border-stone-200 bg-white px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      name="city"
                      onChange={updateField}
                      placeholder="Arlington"
                      type="text"
                      value={form.city}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-stone-700">
                      ZIP Code
                    </span>
                    <input
                      className="h-12 rounded-xl border border-stone-200 bg-white px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      inputMode="numeric"
                      name="zipCode"
                      onChange={updateField}
                      placeholder="22201"
                      type="text"
                      value={form.zipCode}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl bg-emerald-50 p-5">
                <p className="text-sm font-black text-emerald-800">
                  Recovery radius
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                  We keep the search local and show only friendly location status
                  in the dashboard.
                </p>
              </div>
            </div>
          </SectionShell>

          <SectionShell id="cuisine" label="Step 3" title="Pick Cuisine">
            <div className="grid gap-5 lg:grid-cols-[1fr_260px] lg:items-center">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-stone-800">
                  Food mood
                </span>
                <select
                  className="h-14 rounded-2xl border border-stone-200 bg-white px-4 text-base font-bold outline-none transition hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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

              <div className="grid grid-cols-2 gap-2">
                {["Protein", "Carbs", "Hydration", "Joy"].map((badge) => (
                  <span
                    className="rounded-2xl bg-orange-50 px-3 py-2 text-center text-xs font-black text-orange-700"
                    key={badge}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </SectionShell>

          <SectionShell id="feast" label="Step 4" title="Generate Feast">
            {error ? (
              <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}

            <button
              className="group flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-stone-950 px-5 text-base font-black text-white shadow-2xl shadow-stone-900/25 transition hover:-translate-y-1 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
              disabled={!canGenerate}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Building your recovery feast...
                </>
              ) : (
                <>
                  Generate Recovery Feast
                  <span className="transition group-hover:translate-x-1">→</span>
                </>
              )}
            </button>
          </SectionShell>
        </form>

        <div className="scroll-mt-28 pt-8" ref={resultsRef}>
          {hasPlan ? (
            <section className="grid gap-6 pb-10 lg:grid-cols-[1fr_1fr]">
              <InfoCard
                title="Workout Summary"
                eyebrow="Latest effort"
                className="animate-rise"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <RecoveryScore workout={plan.workout} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-black text-stone-950">
                      {plan.workout.name}
                    </h3>
                    <div className="mt-3">
                      <DetailRow label="Sport" value={plan.workout.sport_type} />
                      <DetailRow
                        label="Moving time"
                        value={`${Math.round(
                          plan.workout.moving_time_seconds / 60,
                        )} minutes`}
                      />
                      <DetailRow label="Distance" value={workoutDistance} />
                      <DetailRow label="Calories" value={plan.workout.calories} />
                      <DetailRow
                        label="Suffer score"
                        value={plan.workout.suffer_score}
                      />
                    </div>
                  </div>
                </div>
              </InfoCard>

              <InfoCard
                title="Restaurant Recommendation"
                eyebrow="Best open match"
                className="animate-rise animation-delay-100"
              >
                {plan.selected_restaurant.image_url ? (
                  <img
                    alt=""
                    className="mb-4 h-56 w-full rounded-3xl object-cover"
                    src={plan.selected_restaurant.image_url}
                  />
                ) : null}
                <h3 className="text-2xl font-black text-stone-950">
                  {plan.selected_restaurant.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-stone-500">
                  {(plan.selected_restaurant.categories || []).join(", ")}
                </p>
                <div className="mt-4">
                  <DetailRow label="Rating" value={plan.selected_restaurant.rating} />
                  <DetailRow
                    label="Reviews"
                    value={plan.selected_restaurant.review_count}
                  />
                  <DetailRow label="Price" value={plan.selected_restaurant.price} />
                  <DetailRow
                    label="Address"
                    value={plan.selected_restaurant.address}
                  />
                </div>
              </InfoCard>

              <InfoCard
                title="AI Meal Recommendation"
                eyebrow="Recovery order"
                className="lg:col-span-2 animate-rise animation-delay-200"
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl bg-orange-50 p-4 transition hover:-translate-y-1">
                    <p className="text-sm font-bold text-orange-700">Appetizer</p>
                    <p className="mt-2 text-lg font-black text-stone-950">
                      {plan.meal_recommendation.appetizer}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-emerald-50 p-4 transition hover:-translate-y-1">
                    <p className="text-sm font-bold text-emerald-700">
                      Main Entree
                    </p>
                    <p className="mt-2 text-lg font-black text-stone-950">
                      {plan.meal_recommendation.main_entree}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-stone-100 p-4 transition hover:-translate-y-1">
                    <p className="text-sm font-bold text-stone-600">
                      Recovery Drink
                    </p>
                    <p className="mt-2 text-lg font-black text-stone-950">
                      {plan.meal_recommendation.recovery_drink}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div className="rounded-3xl border border-stone-200 p-4">
                    <p className="text-sm font-bold text-stone-500">
                      Target Calories
                    </p>
                    <p className="mt-2 text-3xl font-black text-stone-950">
                      {plan.meal_recommendation.target_calories}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-stone-200 p-4">
                    <p className="text-sm font-bold text-stone-500">
                      Why This Meal
                    </p>
                    <p className="mt-2 leading-7 text-stone-700">
                      {plan.meal_recommendation.why_this_meal}
                    </p>
                  </div>
                </div>

                <a
                  className={`mt-6 flex h-16 items-center justify-center rounded-3xl text-lg font-black shadow-2xl transition ${
                    canClaimTable
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-orange-900/25 hover:-translate-y-1 hover:shadow-orange-900/35 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                      : "pointer-events-none bg-stone-300 text-stone-500 shadow-none"
                  }`}
                  href={plan.reservation_deep_link || "#"}
                  rel="noreferrer"
                  target="_blank"
                >
                  Claim Your Table
                </a>
              </InfoCard>
            </section>
          ) : (
            <div className="pb-10">
              <EmptyResults />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
