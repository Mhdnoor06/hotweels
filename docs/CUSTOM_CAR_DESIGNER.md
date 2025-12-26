# Custom Car Frame Designer - Implementation Documentation

## Overview

The Custom Car Frame Designer is a feature that allows customers to create personalized Hot Wheels frame art by:
1. Selecting a car (transparent top-view image)
2. Choosing a background
3. Positioning the car on a common static frame
4. Purchasing the custom design as a framed product

This document tracks the implementation progress, technical decisions, and remaining work.

---

## Feature Flow

### Admin Flow
1. Admin uploads a **transparent car image** (PNG with transparency)
2. Admin uploads a **360° video** for car preview (optional)
3. Admin fills in car details (name, series, description, price)
4. Admin uploads **backgrounds** for each car
5. Backgrounds can be marked as **"common"** to appear for all cars
6. A **static frame** overlays all designs (common for all)

### User Flow (Planned)
1. User browses available custom cars
2. User selects a car to customize
3. User sees 360° video preview (if available)
4. User selects a background (car-specific + common backgrounds)
5. User positions/scales the car on the frame using a canvas editor
6. User previews the final design
7. User adds to cart and purchases

---

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Image/Video Storage**: Cloudinary
- **Canvas Editor**: Fabric.js (planned for user-facing designer)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion

### Why Cloudinary?
- Supabase storage has limited free tier
- 360° videos can be large files
- Cloudinary provides automatic optimization and transformations
- Better CDN delivery for media files

---

## Database Schema

### Tables

#### `custom_cars`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Car name (required) |
| series | TEXT | Car series (optional) |
| description | TEXT | Car description (optional) |
| price | DECIMAL(10,2) | Price in INR (required) |
| transparent_image | TEXT | Cloudinary URL for transparent PNG |
| video_url | TEXT | Cloudinary URL for 360° video (optional) |
| active | BOOLEAN | Whether car is available (default: true) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### `custom_backgrounds`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Background name (required) |
| image | TEXT | Cloudinary URL for background image |
| car_id | UUID | Foreign key to custom_cars (nullable) |
| is_common | BOOLEAN | If true, appears for all cars (default: false) |
| active | BOOLEAN | Whether background is available (default: true) |
| created_at | TIMESTAMPTZ | Creation timestamp |

### Relationships
- A car can have many backgrounds (`car_id` foreign key)
- Backgrounds with `is_common = true` appear for all cars regardless of `car_id`
- Deleting a car cascades to delete its backgrounds

### Migration File
Location: `supabase/migrations/002_custom_cars.sql`

---

## Implementation Status

### Completed

#### 1. Database Setup
- [x] Created migration for `custom_cars` table
- [x] Created migration for `custom_backgrounds` table
- [x] Added TypeScript types in `lib/supabase/database.types.ts`

#### 2. Cloudinary Integration
- [x] Configured Cloudinary SDK (`lib/cloudinary/config.ts`)
- [x] Server-side upload functions for images and videos
- [x] Delete functions for cleanup
- [x] Added Cloudinary domain to `next.config.mjs`

#### 3. API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/custom-cars` | GET | List all cars with backgrounds |
| `/api/admin/custom-cars` | POST | Create a new car |
| `/api/admin/custom-cars/[id]` | GET | Get single car |
| `/api/admin/custom-cars/[id]` | PUT | Update car |
| `/api/admin/custom-cars/[id]` | DELETE | Delete car and backgrounds |
| `/api/admin/custom-cars/upload-image` | POST | Upload image to Cloudinary |
| `/api/admin/custom-cars/upload-video` | POST | Upload video to Cloudinary |
| `/api/admin/custom-backgrounds` | GET | List backgrounds (with car_id filter) |
| `/api/admin/custom-backgrounds` | POST | Create background |
| `/api/admin/custom-backgrounds/[id]` | GET | Get single background |
| `/api/admin/custom-backgrounds/[id]` | PUT | Update background |
| `/api/admin/custom-backgrounds/[id]` | DELETE | Delete background |

#### 4. Admin UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| AdminCustomization | `components/admin/admin-customization.tsx` | Main admin page for managing cars/backgrounds |
| CustomCarForm | `components/admin/custom-car-form.tsx` | Modal form for creating/editing cars |

**Features:**
- [x] List all custom cars with expandable sections
- [x] Add/Edit/Delete cars
- [x] Upload transparent car images
- [x] Upload 360° videos (optional)
- [x] Manage backgrounds per car
- [x] Toggle background as "common"
- [x] Responsive design (mobile/desktop)
- [x] Mobile tap-to-reveal overlay for background actions

#### 5. Admin Navigation
- [x] Added "Customization" link in admin sidebar (`app/admin/(dashboard)/layout.tsx`)
- [x] Uses Palette icon from Lucide

---

### Not Started

#### 1. Static Frame Management
- [ ] Upload interface for the common frame PNG
- [ ] Frame storage and retrieval
- [ ] Frame positioning configuration

#### 2. User-Facing Designer (Core Feature)
- [ ] Custom car listing page for users
- [ ] Car detail page with 360° video preview
- [ ] Background selection interface
- [ ] **Fabric.js canvas editor** for positioning car on frame
  - Drag and drop car positioning
  - Scale/rotate controls
  - Live preview with frame overlay
- [ ] Save design configuration
- [ ] Design preview/confirmation

#### 3. E-commerce Integration
- [ ] Add custom design to cart
- [ ] Store design configuration with order
- [ ] Custom car product type handling
- [ ] Order fulfillment workflow for custom designs

#### 4. Additional Features (Optional)
- [ ] Design templates/presets
- [ ] Share design functionality
- [ ] Design history for returning users
- [ ] Bulk background upload
- [ ] Background categories/tags

---

## File Structure

```
hotweels/
├── app/
│   ├── admin/
│   │   └── (dashboard)/
│   │       ├── customization/
│   │       │   └── page.tsx          # Admin customization page
│   │       └── layout.tsx            # Admin layout with nav
│   └── api/
│       └── admin/
│           ├── custom-cars/
│           │   ├── route.ts          # GET, POST cars
│           │   ├── [id]/
│           │   │   └── route.ts      # GET, PUT, DELETE car
│           │   ├── upload-image/
│           │   │   └── route.ts      # Upload image to Cloudinary
│           │   └── upload-video/
│           │       └── route.ts      # Upload video to Cloudinary
│           └── custom-backgrounds/
│               ├── route.ts          # GET, POST backgrounds
│               └── [id]/
│                   └── route.ts      # GET, PUT, DELETE background
├── components/
│   └── admin/
│       ├── admin-customization.tsx   # Main admin UI
│       └── custom-car-form.tsx       # Car form modal
├── lib/
│   ├── cloudinary/
│   │   └── config.ts                 # Cloudinary SDK setup
│   └── supabase/
│       └── database.types.ts         # TypeScript types
├── supabase/
│   └── migrations/
│       └── 002_custom_cars.sql       # Database migration
└── docs/
    └── CUSTOM_CAR_DESIGNER.md        # This document
```

---

## Environment Variables

Required in `.env.local`:

```env
# Cloudinary (for image/video uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Design Decisions

### 1. Cloudinary for All Media
**Decision**: Use Cloudinary for both images and videos instead of Supabase storage.
**Rationale**:
- Saves Supabase storage quota
- Better video handling and streaming
- Automatic image optimization
- Global CDN delivery

### 2. Server-Side Uploads
**Decision**: Upload files on form submission, not immediately on selection.
**Rationale**:
- Prevents orphaned files if user cancels
- Better UX with local preview before upload
- Reduces unnecessary API calls

### 3. Common Backgrounds Flag
**Decision**: Use `is_common` boolean instead of a separate table.
**Rationale**:
- Simpler data model
- Backgrounds can be both car-specific and common
- Easy to toggle without moving records

### 4. Fabric.js for Canvas Editor
**Decision**: Use Fabric.js for the user-facing designer.
**Rationale**:
- Industry standard for product customization
- Rich feature set (drag, scale, rotate)
- Good documentation and community
- Supports hollow PNG overlay technique

---

## Next Steps (Recommended Order)

1. **Static Frame Upload** - Add ability to upload/manage the common frame
2. **User Car Listing** - Public page to browse custom cars
3. **Car Detail Page** - Show car with 360° video and "Customize" button
4. **Fabric.js Designer** - Core canvas editor for positioning
5. **Cart Integration** - Add custom designs to cart
6. **Order Processing** - Handle custom car orders

---

## References

- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

---

*Last Updated: December 2024*
