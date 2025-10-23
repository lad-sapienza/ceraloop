# CeraLoop

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ceraloop.lad-sapienza.it/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Directus](https://img.shields.io/badge/Directus-Backend-6644FF?logo=directus)](https://directus.io/)

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

### Dashboard
The main evaluation interface where users can:
- View reference pottery images
- Drag and drop to reorder matched images
- Enable/disable images from consideration
- Save evaluations with automatic weighted scoring

### Report
Progress visualization showing:
- Pie chart of completion percentage
- Total items, evaluated, and remaining counts
- Personalized messages based on progress
- User profile with avatar

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS with custom utilities
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
- `user_created` (UUID, auto-populated)

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

## Project Structure

```
src/
├── components/
│   ├── AuthImage.jsx       # Authenticated image loader with UUID handling
│   ├── ImagePanel.jsx      # Draggable image container with enable/disable
│   └── Navbar.jsx          # Fixed navigation with theme toggle
├── context/
│   └── ThemeContext.jsx    # Dark/light mode context provider
├── pages/
│   ├── Dashboard.jsx       # Main evaluation interface
│   ├── Login.jsx           # Authentication page
│   └── Report.jsx          # Progress visualization page
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

### For Administrators

1. **Add Items**: Upload pottery images to `model_output` collection in Directus
2. **Manage Users**: Create user accounts with appropriate roles
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

## Deployment

This project is deployed via GitHub Actions to GitHub Pages and a custom domain.

- GitHub Actions workflow: `.github/workflows/deploy.yml` builds and publishes `dist/`
- Custom domain: create `public/CNAME` with your domain (e.g. `ceraloop.lad-sapienza.it`)
- Vite base URL: configured to `/` for custom domains in `vite.config.js`

After setting the custom domain in the repo settings (Pages), wait for certificate provisioning and then enable “Enforce HTTPS”.

### Routing on static hosts (deep links)

This is a Single Page App. Direct links like `/login` would 404 on static hosting. We ship a `public/404.html` that redirects back to `/` and the app restores the intended route.

## Citation

If you use this software, please cite it. A `CITATION.cff` file is provided with both individual and organizational authorship (LAD Sapienza).

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_DIRECTUS_URL` | Your Directus backend URL (with trailing slash) | `https://db.example.com/` |

## Troubleshooting

- CORS errors to Directus: enable CORS in Directus and add your app origin(s), e.g.
   - `CORS_ENABLED=true`
   - `CORS_ORIGIN=https://ceraloop.lad-sapienza.it,http://localhost:5173`
- `/users/me` returns only `id`: ensure your role has read access to `directus_users` fields (`id, first_name, last_name, email, avatar`).
- HTTPS not working on custom domain: wait for GitHub Pages to provision the certificate, then enable “Enforce HTTPS”.
- Deep links 404 on Pages: make sure `public/404.html` is deployed.

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