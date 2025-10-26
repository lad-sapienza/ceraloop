# CeraLoop

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/github/v/release/lad-sapienza/ceraloop?display_name=tag&sort=semver)](https://github.com/lad-sapienza/ceraloop/releases)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ceraloop.lad-sapienza.it/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Directus](https://img.shields.io/badge/Directus-Backend-6644FF?logo=directus)](https://directus.io/)
[![DOI](https://zenodo.org/badge/1081266607.svg)](https://doi.org/10.5281/zenodo.17449886)



A web application for evaluating and ranking AI-generated pottery image matches. Built with React, Vite, and Directus as a headless CMS backend.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with automatic token refresh
- 🖼️ **Image Evaluation**: Drag-and-drop interface for ranking matched pottery images
- 📊 **Progress Tracking**: Real-time statistics and pie charts showing evaluation progress
- 🎨 **Modern UI**: Dark mode support with Tailwind CSS and frosted glass effects
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile devices
- 🔄 **Smart Loading**: Automatically fetches only unreviewed items per user
- 💾 **Auto-save**: Evaluations are saved with weighted scores (1.0 to 0.1)
- 👆 **Touch-friendly controls**: Move items with left/right buttons (no drag required)
- 📝 **Recent submissions**: See your last 5 evaluations and delete with confirmation
- 👤 **User menu with avatar**: Dropdown menu with avatar; color ring shows profile status (red: missing, yellow: incomplete, green: complete)
- 🙋 **About me profile**: Provide background info used to weight feedback (education, archaeology experience, pottery documentation experience, notes)
- 🧾 **Help content (Markdown)**: Dedicated Help page and a login modal rendering the same `help.md` content, with dark-mode friendly typography
- 🧭 **Footer**: Simple footer across all pages with MIT license and credits
- 🧑‍💻 **Self-registration**: Users can create an account (email entered twice), optional avatar upload; admin activates accounts
- ⏱️ **Evaluation time tracking**: Automatically tracks time from first interaction to save (in seconds)

### Dashboard
The main evaluation interface where users can:
- View reference pottery images
- Drag and drop to reorder matched images
- Enable/disable images from consideration
- Save evaluations with automatic weighted scoring
- Time tracking starts on first interaction (drag, discard, or move)

### Report
Progress visualization showing:
- Pie chart of completion percentage
- Total items, evaluated, and remaining counts
- Personalized messages based on progress
- User profile with avatar

### About me
Give us short background info to help interpret and weight your feedback:
- Educational qualification (checkboxes)
- Experience in archaeology (none/0, up to 5 years/5, up to 10 years/10, more than 10 years/10+)
- Experience with documentation and study of pottery (same values as above)
- More about me (free text)

Defaults: if empty, we use safe defaults (e.g., education = ["None"], experience = "0"). You can edit these anytime.

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS with custom utilities + Typography plugin for Markdown
- **Routing**: React Router v6
- **API Client**: Axios with interceptors
- **Backend**: Directus (Headless CMS)
- **Authentication**: JWT access + refresh tokens

## Prerequisites

- Node.js 16+ and npm
- A Directus instance with the following collections:
  - `model_output`: Contains reference items and matched images
  - `user_feedbacks`: Stores user evaluations

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lad-sapienza/ceraloop.git
   cd ceraloop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   This project also uses Tailwind Typography and react-markdown (already listed in package.json).

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update with your Directus URL:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   VITE_DIRECTUS_URL="https://your-directus-instance.com/"
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Directus Setup

### Collections

#### `model_output`
- `id` (integer, primary key)
- `item` (string, unique identifier)
- `image` (file, reference pottery image)
- `match_1` through `match_10` (string, filenames of matched images)

#### `user_feedbacks`
- `id` (auto-increment, primary key)
- `item` (string, references model_output.item)
- `match_1` through `match_10` (string, ordered filenames)
- `score_1` through `score_10` (float, weights from 1.0 to 0.1)
- `evaluation_time` (integer, optional - time in seconds from first interaction to save)
- `user_created` (UUID, auto-populated)
- `date_created` (timestamp, auto-populated)

### Permissions

Users need the following permissions:

1. **Directus Users** (for user profile):
   - Read: `id`, `first_name`, `last_name`, `email`, `avatar`

2. **Directus Files**:
   - Read: All fields (for image access)

3. **model_output**:
   - Read: All fields

4. **user_feedbacks**:
   - Create: All fields
   - Read: Filter by `user_created` = `$CURRENT_USER`

## Security Configuration

### Server-Side Rate Limiting (Directus)

To protect against brute force attacks on the login endpoint, enable rate limiting in your Directus instance. Add these environment variables to your Directus `.env` file:

```env
# Enable rate limiting
RATE_LIMITER_ENABLED=true

# Allow 25 requests per IP address
RATE_LIMITER_POINTS=25

# Within a 60-second window
RATE_LIMITER_DURATION=60

# Store rate limit data in memory (or use Redis for distributed setups)
RATE_LIMITER_STORE=memory
```

**Recommended values:**
- Development: `RATE_LIMITER_POINTS=100` (more permissive for testing)
- Production: `RATE_LIMITER_POINTS=25` (stricter limits)

For high-traffic environments, consider using Redis as the store:
```env
RATE_LIMITER_STORE=redis
RATE_LIMITER_REDIS_HOST=localhost
RATE_LIMITER_REDIS_PORT=6379
```

**Alternative: Web Server Rate Limiting**

If you're using Nginx or Apache as a reverse proxy, you can also implement rate limiting at that level:

**Nginx example:**
```nginx
http {
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
    
    server {
        location /auth/login {
            limit_req zone=login_limit burst=3 nodelay;
            proxy_pass http://directus:8055;
        }
    }
}
```

This limits login attempts to 5 per minute per IP address, with a burst allowance of 3 additional requests.

### Client-Side Protection

The login form also implements client-side protection against brute force attacks:

1. **Account Lockout**: After 5 failed login attempts, the account is locked for 5 minutes
2. **Progressive Delays**: Each failed attempt introduces exponential backoff (1s → 2s → 4s → 8s → 16s max)
3. **Generic Error Messages**: All login errors show "Invalid email or password" to avoid information disclosure
4. **Automatic Reset**: Successful login resets all counters and delays

These client-side measures complement server-side rate limiting and provide immediate feedback to legitimate users while slowing down attackers.

**Note**: Client-side protection can be bypassed by sophisticated attackers, so server-side rate limiting (solution 1) is essential for production deployments.

## Project Structure

```
src/
├── components/
│   ├── AuthImage.jsx       # Authenticated image loader with UUID handling
│   ├── ImagePanel.jsx      # Draggable image container with enable/disable
│   └── Navbar.jsx          # Fixed navigation with theme toggle + user menu
├── context/
│   └── ThemeContext.jsx    # Dark/light mode context provider
├── pages/
│   ├── Dashboard.jsx       # Main evaluation interface
│   ├── Login.jsx           # Authentication page
│   ├── Report.jsx          # Progress visualization page
│   ├── Help.jsx            # Markdown help page (renders src/pages/help.md)
│   └── AboutMe.jsx         # CRU page for user_information
│
│   ├── help.md             # Markdown source for Help page and login modal
├── services/
│   ├── api.js              # Axios instance with auth interceptors
│   └── auth.js             # Authentication utilities
├── App.jsx                 # Router configuration
├── main.jsx                # App entry point
└── styles.css              # Global styles and utilities
```

## Usage

### For Evaluators

1. **Login**: Use your Directus credentials
2. **Evaluate Images**: 
   - Review the reference pottery image on the left
   - Drag and drop matched images to reorder them (best match at top)
   - Click the eye icon to disable images from consideration
   - Click "Save Selection" to submit your evaluation
3. **Track Progress**: Visit the Report page to see your completion status
   4. **About me**: Fill in your background once (you can update later) to help weight your feedback. The avatar ring shows status: red (missing), yellow (incomplete), green (complete).

### For Administrators

1. **Add Items**: Upload pottery images to `model_output` collection in Directus
2. **Manage Users**: Create user accounts with appropriate roles
   - Optional: enable self-registration by allowing Public/Guest to POST `/users` and (optionally) `/files` for avatar uploads
   - Ensure `user_information` permissions allow users to create/read/update their own record (filter by `user_created`)
3. **View Results**: Query `user_feedbacks` collection for evaluation data
4. **Export Data**: Use Directus API or export features for analysis

## Development

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

### Key Features Implementation

- **Authentication Flow**: Uses refresh tokens to maintain long sessions without re-login
- **Image Loading**: UUID-based file access through Directus `/files` and `/assets` endpoints
- **Drag & Drop**: HTML5 native drag events with visual placeholders
- **Smart Filtering**: Uses `_nin` (not in) operator to exclude already-evaluated items
- **Weighted Scoring**: Auto-generates scores from 1.0 (rank 1) to 0.1 (rank 10), 0 for disabled
- **Touch Controls**: Up/Down (Left/Right) buttons to reorder without drag & drop
- **Recent Records**: Fetch last 5 `user_feedbacks` by user, with delete confirmation modal
- **User Menu**: Avatar fetched from Directus Files/Assets. Ring color from `user_information` completeness.
- **About Me (CRU)**: Reads the current user's `user_information`. Creates if missing; updates otherwise. Fields include education (checkboxes), experiences (selects), notes.
- **Help Modal**: Login page renders `help.md` in a scrollable modal via `react-markdown`.
- **Footer**: Consistent credits and MIT license across pages.
- **Evaluation Time Tracking**: Measures time from first user interaction (drag, discard, or move) to save. Timer resets for each new item. Stored as `evaluation_time` in seconds. This helps analyze:
  - Average evaluation time per user
  - Differences between expert and novice evaluators
  - Correlation between time spent and evaluation quality
  - Detection of potentially rushed evaluations

## Deployment

This project is deployed via GitHub Actions to GitHub Pages and a custom domain.

- GitHub Actions workflow: `.github/workflows/deploy.yml` builds and publishes `dist/`
- Custom domain: create `public/CNAME` with your domain (e.g. `ceraloop.lad-sapienza.it`)
- Vite base URL: configured to `/` for custom domains in `vite.config.js`

After setting the custom domain in the repo settings (Pages), wait for certificate provisioning and then enable “Enforce HTTPS”.

### CI variables (GitHub Actions)

The build reads environment variables from repository Variables:

- `VITE_DIRECTUS_URL`
- `VITE_DIRECTUS_DEFAULT_ROLE` (optional; leave unset if you enforce role via Directus Presets)

Set them in: GitHub → Repository → Settings → Secrets and variables → Actions → Variables → New variable.

The workflow references them as `${{ vars.VITE_DIRECTUS_URL }}` and `${{ vars.VITE_DIRECTUS_DEFAULT_ROLE }}`.

### Routing on static hosts (deep links)

This is a Single Page App. Direct links like `/login` would 404 on static hosting. We ship a `public/404.html` that redirects back to `/` and the app restores the intended route.

### Routes
- `/` Dashboard
- `/report` Report
- `/help` Help (Markdown)
- `/about` About me (user profile info)

## Citation

If you use this software, please cite it. A `CITATION.cff` file is provided with both individual and organizational authorship (LAD Sapienza).

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_DIRECTUS_URL` | Your Directus backend URL (with trailing slash) | `https://db.example.com/` |
| `VITE_DIRECTUS_DEFAULT_ROLE` | UUID of the default Directus role assigned to newly registered users (client-side fallback). Prefer setting this on the server using a Directus Preset on the `users` collection. | `19239f45-2433-471b-bfbf-4817559adf22` |

Security tip: The role UUID is not sensitive. However, the recommended approach is to configure a Preset in Directus that enforces the `role` (and `status`) for created users, and to remove `role` from the client payload entirely. The env var here serves as a convenience fallback.

### Advanced Configuration: Collection Names

CeraLoop supports customizing Directus collection names through environment variables. This enables:

- **Multi-project deployments**: Run separate CeraLoop instances for different artifact types (pottery, coins, inscriptions) within the same Directus instance
- **A/B testing**: Test different data models or UI versions with different collection sets
- **Development/staging separation**: Use separate collections for testing without affecting production data
- **Institution-specific naming**: Adapt to existing database schemas without modifying code

**Available collection name overrides:**

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_COLLECTION_MODEL_OUTPUT` | `model_output` | Main collection with evaluation items and model predictions |
| `VITE_COLLECTION_USER_FEEDBACKS` | `user_feedbacks` | User evaluations and rankings |
| `VITE_COLLECTION_USER_INFORMATION` | `user_information` | Extended user profile data |
| `VITE_COLLECTION_USERS` | `directus_users` | Directus system users collection |
| `VITE_COLLECTION_FILES` | `directus_files` | Directus system files collection |

**Example: Multi-project setup**

Deploy separate CeraLoop instances for pottery and coins analysis:

```bash
# Pottery project (.env)
VITE_DIRECTUS_URL="https://db.lad-sapienza.it/"
VITE_COLLECTION_MODEL_OUTPUT="pottery_model_output"
VITE_COLLECTION_USER_FEEDBACKS="pottery_user_feedbacks"
VITE_COLLECTION_USER_INFORMATION="pottery_user_information"

# Coins project (.env)
VITE_DIRECTUS_URL="https://db.lad-sapienza.it/"
VITE_COLLECTION_MODEL_OUTPUT="coins_model_output"
VITE_COLLECTION_USER_FEEDBACKS="coins_user_feedbacks"
VITE_COLLECTION_USER_INFORMATION="coins_user_information"
```

Both instances use the same Directus backend but maintain separate data collections, allowing independent analysis and user assignments.

## Troubleshooting

- CORS errors to Directus: enable CORS in Directus and add your app origin(s), e.g.
   - `CORS_ENABLED=true`
   - `CORS_ORIGIN=https://ceraloop.lad-sapienza.it,http://localhost:5173`
- `/users/me` returns only `id`: ensure your role has read access to `directus_users` fields (`id, first_name, last_name, email, avatar`).
- HTTPS not working on custom domain: wait for GitHub Pages to provision the certificate, then enable “Enforce HTTPS”.
- Deep links 404 on Pages: make sure `public/404.html` is deployed.
- Help markdown not styled: verify Tailwind Typography plugin is installed and enabled in `tailwind.config.cjs` and that `help.md` is imported with `?raw`.
- Self-registration fails: ensure your Directus role permits POST `/users` (and `/files` for avatar). Alternatively handle registration via a secure backend.

## Data Analysis Methodology

### Overview

CeraLoop collects rich evaluation data that can be analyzed to:
1. Validate and improve the statistical model's similarity predictions
2. Understand how humans assess ceramic similarity
3. Compare expert vs. novice evaluation patterns
4. Measure inter-rater agreement and consistency

### Data Structure

**Available data points per evaluation:**
- `item`: Reference pottery ID
- `match_1` to `match_10`: Ordered similar items (user-ranked)
- `score_1` to `score_10`: Weights (1.0 → 0.1 for enabled, 0 for disabled)
- `evaluation_time`: Time spent in seconds
- `user_created`: User ID (linked to `user_information`)
- `date_created`: Timestamp

**User context data:**
- Educational qualification
- Archaeology experience level (0, 5, 10, 10+)
- Pottery documentation experience (0, 5, 10, 10+)

### Suggested Analysis Methods

#### 1. **Model Validation: Rank Correlation Analysis**

Compare the statistical model's original ordering with human rankings:

```python
# For each evaluated item:
# - model_order: Original match_1...match_10 sequence from model_output
# - human_order: User's reordered sequence from user_feedbacks

# Calculate Spearman's rank correlation
from scipy.stats import spearmanr
correlation, p_value = spearmanr(model_order, human_order)

# Aggregate across all evaluations:
# - Mean correlation per user
# - Mean correlation per item
# - Correlation vs. user experience level
```

**Key metrics:**
- **Spearman's ρ**: Measures rank agreement (-1 to +1)
- **Kendall's τ**: Alternative rank correlation, more robust to ties
- **Top-k precision**: How often model's top-3 matches human's top-3

#### 2. **Discard Analysis**

Identify patterns in which matches users reject (score = 0):

```python
# For each match position (1-10):
discard_rate = (matches_with_score_0 / total_evaluations) * 100

# Questions to explore:
# - Do later positions (match_8, match_9, match_10) get discarded more?
# - Which specific items are frequently discarded across users?
# - Correlation between discard rate and model confidence scores?
```

**Visualization:**
- Heatmap: Item × Position showing discard rates
- Distribution plot: Discard frequency by match position

#### 3. **Inter-Rater Reliability**

For the 200 common items evaluated by all users:

```python
from sklearn.metrics import cohen_kappa_score
import krippendorff

# Pairwise Cohen's Kappa between users
# Or Krippendorff's Alpha for multi-rater scenarios

# Create matrix: users × items × rankings
# Calculate agreement scores
```

**Key metrics:**
- **Cohen's Kappa**: Agreement between pairs (κ > 0.6 = substantial)
- **Krippendorff's Alpha**: Multi-rater agreement (α > 0.8 = reliable)
- **Intraclass Correlation (ICC)**: Consistency across raters

#### 4. **Expert vs. Novice Comparison**

Segment users by experience and compare:

```python
# Define experience groups from user_information:
expert = (archaeology_exp >= 10) & (pottery_exp >= 10)
intermediate = (archaeology_exp >= 5) | (pottery_exp >= 5)
novice = (archaeology_exp == 0) & (pottery_exp == 0)

# Compare groups on:
# - Correlation with model
# - Evaluation time
# - Discard rate
# - Inter-group agreement
# - Consistency (variance in repeated patterns)
```

**Statistical tests:**
- **ANOVA**: Compare mean correlation scores across groups
- **Mann-Whitney U**: Non-parametric comparison (2 groups)
- **Kruskal-Wallis**: Non-parametric comparison (3+ groups)

#### 5. **Time Analysis**

Explore relationship between evaluation time and quality:

```python
# Correlate evaluation_time with:
# - Agreement with consensus ranking
# - Number of discards
# - Consistency with user's own previous evaluations

# Identify outliers:
# - Too fast (<10s): Possibly rushed/random
# - Too slow (>300s): Possibly uncertain/difficult cases
```

**Visualizations:**
- Scatter: Time vs. correlation with model
- Box plot: Time distribution by experience level
- Time series: User's average time trend over evaluations

#### 6. **Item Difficulty Index**

Identify "hard" items where users disagree or struggle:

```python
# For each item:
difficulty_score = {
    'variance': variance_of_rankings_across_users,
    'mean_time': average_evaluation_time,
    'discard_rate': percentage_of_matches_discarded,
    'consensus': 1 - (inter_rater_reliability)
}

# Flag items with high difficulty for manual review
```

#### 7. **Clustering and Pattern Discovery**

Group similar evaluation behaviors:

```python
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

# Feature vector per user:
features = [
    mean_correlation_with_model,
    mean_discard_rate,
    mean_evaluation_time,
    experience_level,
    consistency_score
]

# Apply k-means or hierarchical clustering
# Visualize with PCA or t-SNE
```

### Recommended Workflow

1. **Data Export** from Directus:
   ```sql
   SELECT 
     uf.*,
     ui.educational_qualification,
     ui.experience_archaeology,
     ui.experience_pottery
   FROM user_feedbacks uf
   LEFT JOIN user_information ui ON uf.user_created = ui.user_created
   ```

2. **Preprocessing**:
   - Handle missing/null scores (discarded items)
   - Normalize rankings (1-10 or 0-1 scale)
   - Parse educational_qualification JSON arrays

3. **Analysis Pipeline**:
   - Calculate metrics per item, per user, and aggregate
   - Generate visualizations (matplotlib, seaborn, plotly)
   - Statistical testing for significance

4. **Reporting**:
   - Summary statistics table
   - Correlation heatmaps
   - Experience group comparisons
   - Difficult items list with examples

### Tools and Libraries

**Python ecosystem:**
```bash
pip install pandas numpy scipy scikit-learn
pip install matplotlib seaborn plotly
pip install krippendorff statsmodels
```

**R ecosystem:**
```r
install.packages(c("irr", "psych", "ggplot2", "dplyr"))
```

**Directus API for data export:**
```javascript
// Fetch all feedbacks with user context
const response = await api.get('/items/user_feedbacks', {
  params: {
    'fields': '*,user_created.experience_archaeology,user_created.experience_pottery',
    'limit': -1
  }
});
```

### Expected Outcomes

- **Model improvement**: Identify systematic biases in statistical similarity
- **Methodology validation**: Confirm that human judgment provides meaningful signal
- **Experience effect**: Quantify how expertise influences evaluation
- **Dataset quality**: Flag problematic items for review/exclusion
- **Theoretical insight**: Understand the concept of "archaeological similarity"

### Publication and Sharing

Anonymized aggregate data can be shared as:
- CSV/JSON exports of metrics
- Jupyter notebooks with analysis code
- Interactive dashboards (Streamlit, Dash)
- Academic papers with statistical findings

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for the [LAD: LAboratorio di Archeologia Digitale alla Sapienza](https://lad.saras.uniroma1.it) research project
- Powered by [Directus](https://directus.io/)

## Support

For issues or questions, please open an issue on GitHub.

**Live Demo**: https://ceraloop.lad-sapienza.it/

---

**Note**: This application requires a properly configured Directus backend. Ensure your Directus instance has the correct collections, fields, and permissions set up before deploying.