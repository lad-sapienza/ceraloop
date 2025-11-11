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

**System Collections (for Dynamic Forms):**

| Collection | Read | Explain |
|------------|------|---------|
| `directus_fields` | ✅ Filtered | Field metadata for dynamic forms (filter by collection) |
| `directus_relations` | ✅ Filtered | (Optional) Relationship metadata for forms |

**"Own" permissions filter:**
- Use: `user_created = $CURRENT_USER` for custom collections
- Use: `id = $CURRENT_USER` for `directus_users`

**Field-level permissions:**
On each collection, ensure the role can read/write the fields the app uses.
- For `directus_users`: at minimum allow read on `id`, `first_name`, `last_name`, `email`, `avatar`
- For custom collections: allow all fields unless you want to hide specific ones

### Admin Role
Full access to all collections and fields (default Directus admin).

## Detailed Permissions Configuration

### System Collections for Dynamic Forms

The About Me form uses the `DynamicForm` component, which fetches field metadata from the Directus `/fields/:collection` endpoint. This requires specific permissions on system collections.

#### `directus_fields`
- **Action**: Read
- **Fields**: All fields (or at minimum: `field`, `type`, `meta`, `schema`, `collection`)
- **Permissions**: Custom
- **Filter Rule**: 
  ```json
  {
    "collection": {
      "_eq": "user_information"
    }
  }
  ```
  
  **Why this filter?** It restricts users to only view field metadata for the `user_information` collection, preventing access to schema information for other collections.

#### `directus_relations` (Optional, but recommended)
- **Action**: Read
- **Fields**: All fields
- **Permissions**: Custom
- **Filter Rule**:
  ```json
  {
    "_or": [
      {
        "many_collection": {
          "_eq": "user_information"
        }
      },
      {
        "one_collection": {
          "_eq": "user_information"
        }
      }
    ]
  }
  ```
  
  This allows users to see relationship metadata for `user_information` fields.

### Step-by-Step: Configuring Permissions in Directus

#### Step 1: Access Role Settings
1. Log in to Directus as an administrator
2. Navigate to **Settings** → **Access Control** → **Roles**
3. Select the role you want to configure (e.g., "User", "Evaluator", etc.)

#### Step 2: Configure System Fields Permission
1. In the **Permissions** tab, scroll to **System Collections**
2. Find `directus_fields` in the list
3. Click the **Read** icon (eye symbol)
4. Set the following:
   - **Fields**: Select all or at minimum: `field`, `type`, `meta`, `schema`, `collection`
   - **Field Permissions**: All
   - **Item Permissions**: Custom
   - Click **"Use Custom"**
   - In the filter builder, add:
     - Field: `collection`
     - Operator: `equals`
     - Value: `user_information`
   - Click **Save**

#### Step 3: Configure directus_relations Permission (Optional)
1. Find `directus_relations` in the System Collections list
2. Click the **Read** icon
3. Set the following:
   - **Fields**: All
   - **Item Permissions**: Custom
   - In the filter builder:
     - Click **Add Filter**
     - Select **"Add Filter Group"**
     - Set the group logic to **OR**
     - Add two conditions:
       1. Field: `many_collection`, Operator: `equals`, Value: `user_information`
       2. Field: `one_collection`, Operator: `equals`, Value: `user_information`
   - Click **Save**

#### Step 4: Configure user_information Collection
1. Scroll to **Collections** in the permissions list
2. Find `user_information`
3. Configure **Create** permission:
   - Click the **Create** icon
   - **Fields**: Select all user-editable fields
   - Click **Save**
4. Configure **Read** permission:
   - Click the **Read** icon
   - **Fields**: All
   - **Item Permissions**: Custom
   - Filter: `user_created` `equals` `$CURRENT_USER`
   - Click **Save**
5. Configure **Update** permission:
   - Click the **Update** icon
   - **Fields**: All (excluding read-only system fields)
   - **Item Permissions**: Custom
   - Filter: `user_created` `equals` `$CURRENT_USER`
   - Click **Save**

#### Step 5: Configure model_output Collection
1. Find `model_output` in the Collections list
2. Configure **Read** permission:
   - Click the **Read** icon
   - **Fields**: All
   - **Item Permissions**: All Access
   - Click **Save**

#### Step 6: Configure user_feedbacks Collection
1. Find `user_feedbacks`
2. Configure **Create** permission:
   - Click the **Create** icon
   - **Fields**: All
   - Click **Save**
3. Configure **Read** permission:
   - Click the **Read** icon
   - **Fields**: All
   - **Item Permissions**: Custom
   - Filter: `user_created` `equals` `$CURRENT_USER`
   - Click **Save**
4. Configure **Update** permission:
   - Click the **Update** icon
   - **Fields**: All (excluding read-only system fields)
   - **Item Permissions**: Custom
   - Filter: `user_created` `equals` `$CURRENT_USER`
   - Click **Save**
5. Configure **Delete** permission:
   - Click the **Delete** icon
   - **Item Permissions**: Custom
   - Filter: `user_created` `equals` `$CURRENT_USER`
   - Click **Save**

#### Step 7: Configure directus_users Collection
1. Find `directus_users` in System Collections
2. Configure **Read** permission:
   - Click the **Read** icon
   - **Fields**: Select `id`, `first_name`, `last_name`, `email`, `avatar`
   - **Item Permissions**: Custom
   - Filter: `id` `equals` `$CURRENT_USER`
   - Click **Save**
3. Configure **Update** permission (for profile editing):
   - Click the **Update** icon
   - **Fields**: Select `first_name`, `last_name`, `email`, `avatar`, `password` (if allowing password change)
   - **Item Permissions**: Custom
   - Filter: `id` `equals` `$CURRENT_USER`
   - Click **Save**

#### Step 8: Configure directus_files Collection
1. Find `directus_files` in System Collections
2. Configure **Create** permission (for avatar uploads):
   - Click the **Create** icon
   - **Fields**: All
   - Click **Save**
3. Configure **Read** permission:
   - Click the **Read** icon
   - **Fields**: All
   - **Item Permissions**: All Access (or Custom with filters if you want to restrict)
   - Click **Save**

#### Step 9: Verify Permissions
1. Log out of the admin account
2. Log in with a regular user account
3. Navigate to the About Me page
4. The form should load dynamically with all field definitions
5. Test creating/updating your profile
6. Navigate to the Dashboard and verify you can see evaluation items
7. Test saving feedback

### Security Considerations

#### Why Filter by Collection?
The filter on `directus_fields` (`collection` equals `user_information`) ensures users can ONLY retrieve field metadata for the `user_information` collection. They cannot access field definitions for other collections (like `model_output`, `user_feedbacks`, or other sensitive collections).

#### Field-Level Security
Even though users can see field metadata (structure), they cannot:
- Modify field definitions
- Access data in other collections
- Read or modify other users' `user_information` records

The filter rules (`user_created` equals `$CURRENT_USER`) ensure data isolation between users.

#### Alternative: Public Role Configuration
If you want to allow unauthenticated users to view the registration form structure, you can apply similar permissions to the **Public** role. However, this is generally NOT recommended for security reasons.

### Advanced: Supporting Multiple Collections

If you plan to use `DynamicForm` with other collections (beyond `user_information`), update the `directus_fields` filter to include multiple collections:

```json
{
  "collection": {
    "_in": ["user_information", "another_collection", "yet_another"]
  }
}
```

This allows the dynamic form to work across multiple collections while still restricting access to only the specified collections.

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

### Error: 403 Forbidden on `/fields/user_information`
**Cause**: User role doesn't have read permission on `directus_fields` collection.

**Solution**: 
- Verify Step 2 in the permissions configuration was completed correctly
- Check that the filter rule is set to `collection` equals `user_information`
- Ensure all required fields (`field`, `type`, `meta`, `schema`, `collection`) are selected in the permission

### Error: 404 Not Found on `/fields/user_information`
**Cause**: The `user_information` collection doesn't exist or the collection name is incorrect.

**Solution**:
- Verify the collection exists in Directus
- Check the `VITE_COLLECTION_USER_INFORMATION` environment variable matches the actual collection name
- Review the `src/config/collections.js` file

### Filter by user_created returns 403

**Solution:** Enable accountability on the collection (see "Enabling Accountability/Tracking" above).

### Form Shows "Failed to load form fields"
**Cause**: Field metadata request is failing or returning empty data.

**Solution**:
- Open browser DevTools → Network tab
- Reload the About Me page
- Check the request to `/fields/user_information` for errors
- Verify the response contains field definitions
- Check the browser console for error messages
- Ensure `directus_fields` read permission is properly configured with the collection filter

### Fields Are Not Rendering Correctly
**Cause**: Field metadata might be incomplete or misconfigured.

**Solution**:
- In Directus, navigate to **Settings** → **Data Model** → `user_information`
- Verify each field has:
  - A valid **Interface** (e.g., "Input", "Select Dropdown", "Checkboxes")
  - Proper **Field Options** configured (especially for dropdowns and checkboxes)
  - Correct **Field Type** (String, Integer, JSON, Text, etc.)

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
- [Directus Permissions Documentation](https://docs.directus.io/configuration/security.html)
- [Directus Access Control Guide](https://docs.directus.io/app/user-management.html#permissions)
- [Directus System Collections](https://docs.directus.io/app/data-model.html#system-collections)
