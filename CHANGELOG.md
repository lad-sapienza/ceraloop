# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [1.0.4] - 2025-10-28

### Added
- (No user-facing features added in this patch; changes are layout/UX and stability improvements.)

### Changed
- `src/pages/Dashboard.jsx`: Implemented a responsive two-column layout for small screens where the reference panel stays visible (sticky) while the matches column scrolls independently. Adjusted grid behavior to avoid horizontal overflow on narrow viewports.
- `src/components/ImagePanel.jsx`: Constrained match thumbnails to a consistent display area (approx. 256×256), improved responsive sizing so images keep their aspect ratio, and updated component layout to avoid horizontal overflow.
- `src/components/ImagePanel.jsx`: Rotated move-arrow SVGs vertically on small (mobile) screens (base rotation -90°, reset at `sm` and above) to improve ergonomics in narrow layouts.

### Fixed
- `src/pages/Dashboard.jsx`: Reconstructed and cleaned up the file to remove duplicate JSX fragments and duplicate/default export issues introduced during earlier refactor work; this resolves related build/compile errors.

### Notes
- These edits are primarily front-end layout and UX fixes. Please run the dev server and test the Dashboard at target mobile viewport(s) to confirm sticky offsets and spacing meet expectations. If the header overlaps the sticky panel, adjust the `top-` offset values (e.g., `top-12`, `top-20`, `sm:top-24`).


## [1.0.3] - 2025-10-27

### Fixed
- About page: submitting system fields (`id`, `user_created`, etc.) caused 403 Forbidden errors. Now only user-editable fields are sent to Directus.
- DynamicForm: improved error messages for permission issues and cleaned up debug logging.
- AboutMe: fallback for collections without accountability enabled; user-friendly error handling.

### Docs
- Added comprehensive Directus setup guide (`docs/DIRECTUS_SETUP.md`).

## [1.0.2] - 2025-10-26

### Fixed
- Updated DOI references in `CITATION.cff` and `README.md`.

### Changed
- Bumped version to `1.0.2` in `package.json`.

## [1.0.1] - 2025-10-26

### Added
- GitHub Actions workflow to build on tag/release and attach the production build as a release asset (`.github/workflows/release.yml`).
- DOI and citation metadata updates in `CITATION.cff`.

### Changed
- README: Added Releases badge showing the latest tagged version.

### Docs
- Added initial `CHANGELOG.md` (v1.0.0 entry).

## [1.0.0] - 2025-10-26

### Added
- Configurable Directus collection names via environment variables (`VITE_COLLECTION_*`) with centralized mapping in `src/config/collections.js`.
- Evaluation time tracking that starts on first user interaction; `evaluation_time` included in `user_feedbacks` payload.
- Version display in UI (Login and Footer), dynamically read from `package.json`.
- Italian research article for LAD website (invitation and project overview).
- Comprehensive Data Analysis Methodology section in README.

### Changed
- Refactored login into modular components: `LoginForm`, `Register`, and `Login` container.
- Updated `Dashboard.jsx`, `Report.jsx`, `AboutMe.jsx`, and `Navbar.jsx` to use collection config constants instead of hardcoded names.
- Expanded documentation for environment configuration and multi-project deployments.

### Security
- Client-side protections for login and registration against brute force attacks:
  - 5-attempt lockout with cooldown
  - Progressive delays (exponential backoff)
  - Generic error messages
- Guidance for enabling Directus server-side rate limiting.

### Docs
- `.env.example` updated with `VITE_COLLECTION_*` variables and explanations.
- README updated with Advanced Configuration: Collection Names and analysis methodology.

[1.0.0]: https://github.com/lad-sapienza/ceraloop/releases/tag/v1.0.0
[1.0.1]: https://github.com/lad-sapienza/ceraloop/releases/tag/v1.0.1
[1.0.2]: https://github.com/lad-sapienza/ceraloop/releases/tag/v1.0.2
[1.0.3]: https://github.com/lad-sapienza/ceraloop/releases/tag/v1.0.3
[1.0.4]: https://github.com/lad-sapienza/ceraloop/releases/tag/v1.0.4

