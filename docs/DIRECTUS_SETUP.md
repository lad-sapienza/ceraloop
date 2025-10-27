# Directus Setup Guide for CeraLoop

This document describes the required Directus configuration for CeraLoop to function correctly.

## Collections Required

### 1. `model_output` (or custom name via `VITE_COLLECTION_MODEL_OUTPUT`)
Main collection containing reference items and matched images.

**Required fields:**
- `id` (Primary Key, UUID)
- `status` (Status field, default: published)
- `sort` (Integer, optional)
- `reference_image` (File/Image relation)
- `match_1` through `match_10` (File/Image relations)
- `score_1` through `score_10` (Float/Decimal)

**Permissions:**
- Authenticated role: Read access

### 2. `user_feedbacks` (or custom name via `VITE_COLLECTION_USER_FEEDBACKS`)
Stores user evaluations and rankings.

**Required fields:**
- `id` (Primary Key, UUID)
- `user_created` (User Created system field - see Accountability below)
- `date_created` (Date Created system field)
- `model_output_id` (Many-to-One relation to model_output)
- `selected_matches` (JSON field)
- `evaluation_time` (Integer, optional - time in seconds)

**Accountability:** MUST be enabled (see below)

**Permissions:**
- Authenticated role: Create, Read (own), Update (own), Delete (own)
- Use item permissions with filter: `user_created = $CURRENT_USER`

### 3. `user_information` (or custom name via `VITE_COLLECTION_USER_INFORMATION`)
Extended user profile data for weighting feedback.

**Required fields:**
- `id` (Primary Key, UUID)
- `user_created` (User Created system field - see Accountability below)
- `educational_qualification` (Array/Tags or JSON)
- `experience_in_archaeology` (Integer or String)
- `experience_with_documentation_and_study_of_pottery` (Integer or String)
- `more_about_me` (Text/Long Text)

**Accountability:** MUST be enabled (see below)

**Permissions:**
- Authenticated role: Create, Read (own), Update (own)
- Use item permissions with filter: `user_created = $CURRENT_USER`

## Enabling Accountability/Tracking

For collections that need `user_created`, `user_updated`, `date_created`, `date_updated` fields:

1. In Directus admin, go to **Settings → Data Model**
2. Select your collection (e.g., `user_information`)
3. Click the **cog icon** (⚙️) in the top-right → **Optional System Fields**
4. Enable these toggles:
   - ☑️ User Created
   - ☑️ User Updated
   - ☑️ Date Created
   - ☑️ Date Updated
5. Save changes

This adds special system fields that Directus automatically populates on create/update.

**Why this is required:**
- Without `user_created`, filtering by `filter[user_created][_eq]` returns HTTP 403 (invalid field)
- CeraLoop uses `user_created` to ensure users only see/edit their own records

## Role Permissions

### Authenticated Role (default for logged-in users)

**Collections access:**

| Collection | Create | Read | Update | Delete | Explain |
|------------|--------|------|--------|--------|---------|
| `model_output` | ❌ | ✅ All | ❌ | ❌ | Read-only access to evaluation items |
| `user_feedbacks` | ✅ | ✅ Own | ✅ Own | ✅ Own | Full CRUD on own feedback |
| `user_information` | ✅ | ✅ Own | ✅ Own | ❌ | Create/update own profile |
| `directus_users` | ❌ | ✅ Own | ✅ Own | ❌ | Read/update own user account |
| `directus_files` | ✅ | ✅ All | ❌ | ❌ | Upload avatar, read images |

**"Own" permissions filter:**
- Use: `user_created = $CURRENT_USER` for custom collections
- Use: `id = $CURRENT_USER` for `directus_users`

**Field-level permissions:**
On each collection, ensure the role can read/write the fields the app uses.
- For `directus_users`: at minimum allow read on `id`, `first_name`, `last_name`, `email`, `avatar`
- For custom collections: allow all fields unless you want to hide specific ones

### Admin Role
Full access to all collections and fields (default Directus admin).

## Troubleshooting

### "You don't have permission to access this" or HTTP 403

**Symptom:** AboutMe page or other features show permission errors even for admin.

**Causes:**
1. **Accountability not enabled** → Enable "User Created" system field on the collection
2. **Role lacks Read permission** → Grant Read access to the collection in Settings → Roles & Permissions
3. **Field-level restriction** → Ensure the role can read the specific fields CeraLoop queries
4. **Invalid filter field** → If using `filter[user_created]`, ensure accountability is enabled

**Quick test:**
```bash
# Replace TOKEN and URL with your values
TOKEN="your_access_token"
URL="https://db.lad-sapienza.it/ceraloop"

# Test collection read access
curl -H "Authorization: Bearer $TOKEN" "$URL/items/user_information"

# Test fields metadata (used by DynamicForm)
curl -H "Authorization: Bearer $TOKEN" "$URL/fields/user_information"
```

### Filter by user_created returns 403

**Solution:** Enable accountability on the collection (see "Enabling Accountability/Tracking" above).

### Form fields don't show up in AboutMe

**Cause:** Role cannot access `/fields/{collection}` endpoint.

**Solution:**
- Ensure the role has Read permission on the collection
- In Directus 10+, field metadata is generally accessible if the collection is readable

**Workaround (if needed):**
CeraLoop can use a fallback static schema if `/fields` is blocked. Contact support or check `src/components/DynamicForm.jsx` for the fallback option.

## Self-Registration Setup

If using the self-registration feature:

1. **Enable public registration** in Directus:
   - Settings → Project Settings → Public Registration: **Enabled**
   
2. **Default role for new users:**
   - Set via Directus Preset on `directus_users` collection (recommended)
   - Or use `VITE_DIRECTUS_DEFAULT_ROLE` in the app's `.env` (fallback)

3. **Require email verification** (optional but recommended):
   - Settings → Project Settings → Email Verification: **Enabled**

4. **File uploads for avatars:**
   - Ensure the default role has Create permission on `directus_files`
   - Set a reasonable file size limit and allowed MIME types (image/jpeg, image/png, etc.)

## Security Best Practices

1. **Use server-side rate limiting** (brute force protection):
   ```env
   # In Directus .env
   RATE_LIMITER_ENABLED=true
   RATE_LIMITER_POINTS=10
   RATE_LIMITER_DURATION=10
   ```

2. **Enforce HTTPS** in production (set CORS and PUBLIC_URL accordingly)

3. **Use item-level permissions** (filter by `$CURRENT_USER`) to prevent users from seeing each other's data

4. **Validate user roles** before granting access to admin-only features

5. **Review logs regularly** (Settings → Activity Log) for suspicious activity

## Environment Variables (CeraLoop)

Customize collection names if using multiple projects or different schemas:

```bash
# .env (CeraLoop app)
VITE_DIRECTUS_URL=https://db.example.com/
VITE_DIRECTUS_DEFAULT_ROLE=<role-uuid>

# Optional: Override collection names
VITE_COLLECTION_MODEL_OUTPUT=pottery_model_output
VITE_COLLECTION_USER_FEEDBACKS=pottery_feedbacks
VITE_COLLECTION_USER_INFORMATION=pottery_user_info
# VITE_COLLECTION_USERS defaults to directus_users
# VITE_COLLECTION_FILES defaults to directus_files
```

## Further Reading

- [Directus Roles & Permissions](https://docs.directus.io/user-guide/user-management/permissions.html)
- [Directus System Fields](https://docs.directus.io/getting-started/glossary.html#system-fields)
- [Directus API Filtering](https://docs.directus.io/reference/filter-rules.html)
