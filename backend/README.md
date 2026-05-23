# AI Recovery & Post-Workout Feast Architect Backend

This is the backend foundation for **AI Recovery & Post-Workout Feast Architect**.

Right now it is intentionally small. It gives you:

- A FastAPI app
- A SQLite database setup
- SQLAlchemy for database models
- Strava OAuth login routes
- Yelp Fusion restaurant search
- OpenAI meal recommendation endpoint
- A beginner-friendly place to keep building recovery and meal-planning features

The React + Tailwind frontend is not included yet.

## What Is In This Folder?

```text
backend/
  app/
    main.py        # Starts the FastAPI app and defines basic routes
    config.py      # Reads settings from environment variables
    database.py    # Connects the app to SQLite with SQLAlchemy
    models.py      # Defines database tables
    auth/
      strava_auth.py # Strava login and callback routes
    routers/
      activities.py # API route for loading Strava activities
      debug.py      # Local debug route for saved Strava users
      recommendations.py # API route for OpenAI meal recommendations
      recovery_plan.py # Combines Strava, Yelp, and OpenAI into one flow
      restaurants.py # API route for Yelp restaurant search
    services/
      openai_meal_service.py # Builds structured recovery meal recommendations
      token_service.py # Saves and refreshes Strava tokens
      strava_service.py # Calls Strava and cleans activity data
      yelp_service.py # Calls Yelp and cleans restaurant data
  .env.example     # Example environment settings
  .gitignore       # Keeps local secrets and database files out of git
  requirements.txt # Python packages this backend needs
  README.md        # You are here
```

## Requirements

You need Python 3.10 or newer installed on your computer.

To check, run:

```bash
python3 --version
```

If you see Python 3.10 or newer, you are ready.

## Run The Backend Locally

Go into the backend folder:

```bash
cd "/Users/matthewverni/Documents/Recovery Feast/backend"
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Turn on the virtual environment:

```bash
source .venv/bin/activate
```

Install the backend packages:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Create your local environment file:

```bash
cp .env.example .env
```

Open `.env` and fill in your Strava settings.

Start the API server:

```bash
python -m uvicorn app.main:app --reload
```

You should see the server running at:

```text
http://127.0.0.1:8000
```

## Check That It Works

Open this in your browser:

```text
http://127.0.0.1:8000
```

You should see:

```json
{
  "message": "AI Recovery & Post-Workout Feast Architect API is running."
}
```

You can also check the health endpoint:

```text
http://127.0.0.1:8000/health
```

You should see:

```json
{
  "status": "healthy",
  "app_name": "AI Recovery & Post-Workout Feast Architect",
  "database_configured": true,
  "strava_configured": true,
  "yelp_configured": true,
  "openai_configured": true
}
```

FastAPI also gives you automatic API docs here:

```text
http://127.0.0.1:8000/docs
```

## Local Debug Routes

These routes are here to make local development easier.

### Health Check

Use this route to confirm the backend is running:

```text
http://127.0.0.1:8000/health
```

Or use the terminal:

```bash
curl "http://127.0.0.1:8000/health"
```

It returns the backend status and whether the database, Strava, Yelp, and OpenAI settings are configured.

### Saved Strava Users

After you connect Strava, use this route to see which Strava users are saved locally:

```text
http://127.0.0.1:8000/debug/users
```

Or use the terminal:

```bash
curl "http://127.0.0.1:8000/debug/users"
```

The response includes safe fields like:

```json
[
  {
    "athlete_id": 123456,
    "firstname": "Alex",
    "lastname": "Runner",
    "expires_at": 1770000000,
    "created_at": "2026-05-22T20:00:00",
    "updated_at": "2026-05-22T20:00:00"
  }
]
```

This route never returns `access_token` or `refresh_token`.

## Set Up Strava Login

This backend can connect a Strava athlete account using OAuth 2.0.

OAuth sounds fancy, but the idea is simple:

1. Your app sends the user to Strava.
2. The user approves access.
3. Strava sends the user back to your backend with a temporary code.
4. Your backend exchanges that code for access tokens.
5. The tokens are saved in SQLite.

### 1. Create A Strava API Application

Go to:

```text
https://www.strava.com/settings/api
```

Create an API application.

For local development, use these values:

```text
Application Name: AI Recovery & Post-Workout Feast Architect
Category: Wellness
Website: http://127.0.0.1:8000
Authorization Callback Domain: 127.0.0.1
```

Strava will show you a **Client ID** and **Client Secret**.

### 2. Fill In Your `.env` File

Make sure you already created `.env`:

```bash
cp .env.example .env
```

Open `.env` and update these values:

```text
STRAVA_CLIENT_ID="your_strava_client_id_here"
STRAVA_CLIENT_SECRET="your_strava_client_secret_here"
STRAVA_REDIRECT_URI="http://127.0.0.1:8000/auth/strava/callback"
APP_BASE_URL="http://127.0.0.1:8000"
```

Keep the quotes.

### 3. Start The Backend

From the `backend` folder:

```bash
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

### 4. Start Strava Login

Open this URL in your browser:

```text
http://127.0.0.1:8000/auth/strava/login
```

You will be sent to Strava.

Approve the app.

Strava will send you back to:

```text
http://127.0.0.1:8000/auth/strava/callback
```

If everything worked, you will see a success message with your Strava athlete ID.

### 5. What Gets Saved?

After a successful Strava login, the backend saves this information in SQLite:

- `athlete_id`
- `firstname`
- `lastname`
- `access_token`
- `refresh_token`
- `expires_at`

The database table is named:

```text
strava_tokens
```

### 6. Token Refreshing

Strava access tokens expire.

The backend includes a helper named `get_valid_access_token`.

When future Strava API features call this helper, it checks whether the stored token is expired or about to expire. If needed, it automatically asks Strava for a fresh access token and saves the new token in SQLite.

## Test Pulling Strava Activities

Before testing activities, you must complete the Strava login flow above.

After login succeeds, the callback page shows your `athlete_id`.

Keep the backend server running:

```bash
python -m uvicorn app.main:app --reload
```

In a new terminal, go to the backend folder:

```bash
cd "/Users/matthewverni/Documents/Recovery Feast/backend"
```

Turn on the virtual environment:

```bash
source .venv/bin/activate
```

Replace `YOUR_ATHLETE_ID_HERE` with the athlete ID from the Strava callback.

Then run:

```bash
curl "http://127.0.0.1:8000/activities/YOUR_ATHLETE_ID_HERE"
```

You should get a JSON list of activities. Each activity is cleaned down to:

```json
{
  "name": "Morning Run",
  "sport_type": "Run",
  "moving_time_seconds": 1800,
  "calories": 320.5,
  "suffer_score": 45,
  "distance_meters": 5000.0,
  "start_date": "2026-05-22T12:00:00Z"
}
```

You can also control how many activities come back:

```bash
curl "http://127.0.0.1:8000/activities/YOUR_ATHLETE_ID_HERE?page=1&per_page=10"
```

You can test from the browser too:

```text
http://127.0.0.1:8000/activities/YOUR_ATHLETE_ID_HERE
```

If your access token has expired, the backend will refresh it automatically before calling Strava.

## Set Up Yelp Restaurant Search

This backend can search nearby restaurants using the Yelp Fusion API.

This route only discovers restaurant options. Meal recommendations are handled separately by `/recommendations/meal`.

### 1. Create A Yelp Fusion API Key

Go to:

```text
https://www.yelp.com/developers
```

Create or open your Yelp developer app.

Copy the API key.

### 2. Add The Key To `.env`

Open your local `.env` file and update this line:

```text
YELP_API_KEY="your_yelp_api_key_here"
```

Keep the quotes.

Restart the backend after changing `.env`:

```bash
python -m uvicorn app.main:app --reload
```

### 3. Test Restaurant Search

Use this route:

```text
http://127.0.0.1:8000/restaurants/search?latitude=40.7128&longitude=-74.0060&cuisine=pizza
```

Or use the terminal:

```bash
curl "http://127.0.0.1:8000/restaurants/search?latitude=40.7128&longitude=-74.0060&cuisine=pizza"
```

The response is a cleaned list of restaurants:

```json
[
  {
    "name": "Example Pizza",
    "rating": 4.5,
    "review_count": 1200,
    "price": "$$",
    "categories": ["Pizza", "Italian"],
    "address": "123 Main St, New York, NY 10001",
    "phone": "(212) 555-0100",
    "url": "https://www.yelp.com/biz/example",
    "image_url": "https://s3-media.yelpcdn.com/example.jpg",
    "is_closed": false
  }
]
```

Change `cuisine` to search for something else:

```bash
curl "http://127.0.0.1:8000/restaurants/search?latitude=40.7128&longitude=-74.0060&cuisine=sushi"
```

## Set Up OpenAI Meal Recommendations

This backend can ask OpenAI for a structured post-workout meal recommendation.

Important: this feature does **not** look up a restaurant's real menu. It recommends generally plausible order types based on the restaurant cuisine/category and the workout details.

### 1. Add Your OpenAI API Key

Open your local `.env` file and update this line:

```text
OPENAI_API_KEY="your_openai_api_key_here"
```

You can leave the default model as-is:

```text
OPENAI_MODEL="gpt-4o-mini"
```

Restart the backend after changing `.env`:

```bash
python -m uvicorn app.main:app --reload
```

### 2. Test Meal Recommendations

Use this route:

```text
POST http://127.0.0.1:8000/recommendations/meal
```

From a terminal, run:

```bash
curl -X POST "http://127.0.0.1:8000/recommendations/meal" \
  -H "Content-Type: application/json" \
  -d '{
    "workout": {
      "sport_type": "Run",
      "moving_time_seconds": 3600,
      "calories": 800,
      "suffer_score": 75
    },
    "restaurant": {
      "name": "Example Italian Kitchen",
      "categories": ["Italian"],
      "rating": 4.6,
      "price": "$$"
    }
  }'
```

The response will be strict JSON:

```json
{
  "depletion_breakdown": "A one-hour hard run likely depleted glycogen and increased fluid and sodium needs.",
  "target_calories": 900,
  "appetizer": "A broth-based soup or simple salad with bread",
  "main_entree": "A pasta dish with lean protein and tomato-based sauce",
  "recovery_drink": "Water plus an electrolyte drink",
  "why_this_meal": "This balances carbohydrates for glycogen, protein for muscle repair, and fluids for rehydration."
}
```

## Test The Full Recovery Flow

The full recovery flow combines the pieces:

1. Loads the athlete's most recent Strava activity.
2. Searches Yelp for nearby restaurants using your cuisine.
3. Picks the best open restaurant from the Yelp results.
4. Sends the workout and restaurant to the OpenAI meal architect.
5. Returns one combined recovery plan.

Before using this route, make sure:

- Strava login has succeeded.
- `YELP_API_KEY` is set in `.env`.
- `OPENAI_API_KEY` is set in `.env`.
- The backend server has been restarted after editing `.env`.

Use this route:

```text
POST http://127.0.0.1:8000/recovery-plan
```

From a terminal, replace `123` with your real Strava athlete ID and run:

```bash
curl -X POST "http://127.0.0.1:8000/recovery-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "athlete_id": 123,
    "latitude": 38.88,
    "longitude": -77.10,
    "cuisine": "Italian"
  }'
```

The response includes:

```json
{
  "workout": {
    "name": "Morning Run",
    "sport_type": "Run",
    "moving_time_seconds": 3600,
    "calories": 800,
    "suffer_score": 75,
    "distance_meters": 10000.0,
    "start_date": "2026-05-22T12:00:00Z"
  },
  "selected_restaurant": {
    "name": "Example Italian Kitchen",
    "rating": 4.6,
    "review_count": 900,
    "price": "$$",
    "categories": ["Italian"],
    "address": "123 Main St, Arlington, VA 22201",
    "phone": "(703) 555-0100",
    "url": "https://www.yelp.com/biz/example",
    "image_url": "https://s3-media.yelpcdn.com/example.jpg",
    "is_closed": false
  },
  "meal_recommendation": {
    "depletion_breakdown": "A hard run likely depleted glycogen and increased hydration needs.",
    "target_calories": 900,
    "appetizer": "Minestrone soup or a simple salad with bread",
    "main_entree": "Pasta with lean protein and tomato-based sauce",
    "recovery_drink": "Water plus an electrolyte drink",
    "why_this_meal": "This supports carbohydrate replenishment, muscle repair, and rehydration."
  },
  "reservation_deep_link": "https://www.yelp.com/biz/example"
}
```

For now, `reservation_deep_link` uses the Yelp business URL.

## Keep Secrets Safe

Your `.env` file contains private keys. Do not share it and do not commit it to GitHub.

The backend includes a `.gitignore` file that ignores:

- `.env`
- `.venv/`
- Python cache files
- local SQLite database files

If you accidentally paste a real secret into `.env.example`, remove it before committing.

## Stop The Server

In the terminal where the server is running, press:

```bash
Control + C
```

## About The Database

This backend uses SQLite for now.

When the app starts, it creates a local database file named:

```text
recovery_feast.db
```

The first example table is `workouts`. Later, this can grow to store:

- Strava workout data
- Strava OAuth tokens
- Yelp restaurant options
- Recovery recommendations
- Restaurant or meal options from Yelp Fusion
- AI-generated feast plans from OpenAI

## Next Good Backend Steps

Good next steps would be:

- Add workout create and list endpoints
- Add Pydantic request and response schemas
- Add a service layer for recovery recommendations
