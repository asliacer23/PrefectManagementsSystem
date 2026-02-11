# Profile Feature

The Profile feature handles user profile management including viewing and editing personal information.

## Directory Structure

```
profile/
├── components/
│   ├── EditProfileForm.tsx    # Main component for editing user profile
│   └── index.ts               # Component exports
├── pages/
│   ├── ProfilePage.tsx        # Main profile page
│   └── index.ts               # Page exports
├── services/
│   ├── profileService.ts      # Profile API services
│   └── index.ts               # Service exports
├── index.ts                   # Main feature exports
└── README.md                  # This file
```

## Features

- **View Profile**: Display current user information
- **Edit Profile**: Update name, phone, department, year level, and section
- **Form Validation**: Client-side validation for profile data

## Services

### profileService.ts

Provides the following functions:

- `getProfile(userId)` - Fetch user profile
- `updateProfile(userId, updates)` - Update user profile

## Usage

### In Components

```tsx
import { ProfilePage } from "@/features/profile";

function App() {
  return <ProfilePage />;
}
```

### Using Profile Services

```tsx
import { getProfile, updateProfile } from "@/features/profile";

const profile = await getProfile(userId);
await updateProfile(userId, { first_name: "John" });
```

## Database Schema

The profile feature uses the `profiles` table with the following fields:

- `id` (UUID) - User ID (refs auth.users.id)
- `student_id` (string, optional) - Unique student identifier
- `first_name` (string) - User's first name (required)
- `last_name` (string) - User's last name (required)
- `email` (string) - User's email (required, read-only)
- `phone` (string, optional) - Phone number
- `department` (string, optional) - Department/Faculty
- `year_level` (integer, optional) - Academic year level
- `section` (string, optional) - Section/Class
- `avatar_url` (string, optional) - URL to profile avatar
- `created_at` (timestamp) - Account creation time
- `updated_at` (timestamp) - Last update time

## File Storage

No file storage is required for this feature.

### Editable Fields
- First Name
- Last Name
- Phone
- Department
- Year Level
- Section

### Read-only Fields
- Email
- Student ID
