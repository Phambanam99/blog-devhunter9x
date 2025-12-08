# Blog CMS API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

All admin endpoints require Bearer token authentication:

```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456..."
}
```

**Errors:**
- `409 Conflict` - Email already in use

---

### POST /auth/login
Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456..."
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials

---

### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "abc123def456..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "new_refresh_token..."
}
```

---

### POST /auth/logout
Logout and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

**Request Body (optional):**
```json
{
  "refreshToken": "abc123def456..."
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a reset link will be sent"
}
```

---

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### POST /auth/change-password
Change password (authenticated).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

### POST /auth/me
Get current user info.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "clx1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "ADMIN"
}
```

---

## Admin - Posts Endpoints

### GET /admin/posts
List all posts (paginated).

**Headers:** `Authorization: Bearer <token>` (AUTHOR+)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| status | string | Filter by status: DRAFT, REVIEW, PUBLISHED, SCHEDULED |
| search | string | Search in title/body |
| categoryId | string | Filter by category |
| tagId | string | Filter by tag |
| authorId | string | Filter by author |

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx1234567890",
      "authorId": "clx0987654321",
      "status": "PUBLISHED",
      "publishAt": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "translations": [
        {
          "id": "tr1",
          "locale": "vi",
          "title": "Tiêu đề bài viết",
          "slug": "tieu-de-bai-viet",
          "excerpt": "Mô tả ngắn...",
          "metaTitle": "SEO Title",
          "metaDescription": "SEO Description"
        },
        {
          "id": "tr2",
          "locale": "en",
          "title": "Post Title",
          "slug": "post-title",
          "excerpt": "Short description..."
        }
      ],
      "author": {
        "id": "clx0987654321",
        "name": "Author Name",
        "avatar": null
      },
      "categories": [...],
      "tags": [...]
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### GET /admin/posts/:id
Get single post by ID.

**Headers:** `Authorization: Bearer <token>` (AUTHOR+)

**Response (200):** Same as single item in list above with full body content.

---

### POST /admin/posts
Create new post.

**Headers:** `Authorization: Bearer <token>` (AUTHOR+)

**Request Body:**
```json
{
  "translations": [
    {
      "locale": "vi",
      "title": "Tiêu đề bài viết",
      "slug": "tieu-de-bai-viet",
      "excerpt": "Mô tả ngắn",
      "body": "# Nội dung Markdown\n\nĐoạn văn bản...",
      "metaTitle": "SEO Title",
      "metaDescription": "SEO Description",
      "canonical": null,
      "ogImage": "https://example.com/image.jpg",
      "schemaType": "Article",
      "schemaData": null,
      "heroImageId": "media_id_here"
    },
    {
      "locale": "en",
      "title": "Post Title",
      "slug": "post-title",
      "excerpt": "Short description",
      "body": "# Markdown Content\n\nText paragraph..."
    }
  ],
  "categoryIds": ["cat1", "cat2"],
  "tagIds": ["tag1", "tag2"],
  "status": "DRAFT",
  "publishAt": null
}
```

**Response (201):** Created post object.

---

### PATCH /admin/posts/:id
Update existing post.

**Headers:** `Authorization: Bearer <token>` (AUTHOR+)

**Request Body:** Same as create, all fields optional.

**Response (200):** Updated post object.

---

### DELETE /admin/posts/:id
Delete post.

**Headers:** `Authorization: Bearer <token>` (ADMIN only)

**Response (200):**
```json
{
  "success": true
}
```

---

### POST /admin/posts/:id/publish
Publish or schedule post.

**Headers:** `Authorization: Bearer <token>` (EDITOR+)

**Request Body:**
```json
{
  "publishAt": "2024-01-20T10:00:00Z"  // Optional, for scheduling
}
```

**Response (200):** Updated post object with status PUBLISHED or SCHEDULED.

---

### POST /admin/posts/:id/unpublish
Unpublish post (set to DRAFT).

**Headers:** `Authorization: Bearer <token>` (EDITOR+)

**Response (200):** Updated post object.

---

### GET /admin/posts/:id/revisions/:locale
Get revision history for a locale.

**Headers:** `Authorization: Bearer <token>` (EDITOR+)

**Response (200):**
```json
[
  {
    "id": "rev1",
    "postId": "post1",
    "locale": "en",
    "version": 3,
    "data": { "title": "...", "body": "...", ... },
    "createdAt": "2024-01-15T10:00:00Z",
    "createdBy": {
      "id": "user1",
      "name": "Editor Name"
    }
  }
]
```

---

### POST /admin/posts/:id/rollback/:locale/:version
Rollback to specific version.

**Headers:** `Authorization: Bearer <token>` (EDITOR+)

**Response (200):** Updated post object.

---

### POST /admin/posts/:id/preview-token
Generate preview token for unpublished post.

**Headers:** `Authorization: Bearer <token>` (AUTHOR+)

**Response (200):**
```json
{
  "token": "abc123def456...",
  "url": "http://localhost:3000/preview/abc123def456..."
}
```

---

## Admin - Users Endpoints

### GET /admin/users
List all users.

**Headers:** `Authorization: Bearer <token>` (ADMIN only)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| search | string | Search in name/email |

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null,
      "role": "EDITOR",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### POST /admin/users
Create new user.

**Headers:** `Authorization: Bearer <token>` (ADMIN only)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "AUTHOR"  // Optional: ADMIN, EDITOR, AUTHOR
}
```

---

### PATCH /admin/users/:id
Update user.

**Headers:** `Authorization: Bearer <token>` (ADMIN only)

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "EDITOR",
  "isActive": true
}
```

---

### DELETE /admin/users/:id
Deactivate user.

**Headers:** `Authorization: Bearer <token>` (ADMIN only)

---

## Admin - Media Endpoints

### POST /admin/media/upload
Upload image or video.

**Headers:** 
- `Authorization: Bearer <token>` (AUTHOR+)
- `Content-Type: multipart/form-data`

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| file | File | Image or video file (max 50MB) |
| alt | string | Alt text (optional) |
| caption | string | Caption (optional) |

**Supported Types:**
- Images: JPEG, PNG, GIF, WebP, SVG
- Videos: MP4, WebM, MOV, AVI

**Response (201):**
```json
{
  "id": "media1",
  "filename": "abc123.jpg",
  "originalName": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 1234567,
  "type": "IMAGE",
  "url": "http://localhost:3001/uploads/images/original/abc123.jpg",
  "thumbnailUrl": "http://localhost:3001/uploads/images/thumbnail/abc123.webp",
  "width": 1920,
  "height": 1080,
  "variants": {
    "sm": "http://localhost:3001/uploads/images/sm/abc123.webp",
    "md": "http://localhost:3001/uploads/images/md/abc123.webp",
    "lg": "http://localhost:3001/uploads/images/lg/abc123.webp",
    "webp": "http://localhost:3001/uploads/images/webp/abc123.webp"
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### GET /admin/media
List media files.

**Headers:** `Authorization: Bearer <token>` (AUTHOR+)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| type | string | Filter: IMAGE, VIDEO |
| search | string | Search in filename/alt |

---

### GET /admin/media/:id
Get single media item.

---

### PATCH /admin/media/:id
Update media metadata.

**Request Body:**
```json
{
  "alt": "New alt text",
  "caption": "New caption"
}
```

---

### DELETE /admin/media/:id
Delete media file.

**Headers:** `Authorization: Bearer <token>` (EDITOR+)

---

## Admin - Categories Endpoints

### GET /admin/categories
List all categories.

### POST /admin/categories
Create category.

**Request Body:**
```json
{
  "translations": [
    { "locale": "vi", "name": "Công nghệ", "slug": "cong-nghe", "description": "..." },
    { "locale": "en", "name": "Technology", "slug": "technology", "description": "..." }
  ],
  "parentId": null  // For subcategories
}
```

### PATCH /admin/categories/:id
Update category.

### DELETE /admin/categories/:id
Delete category (ADMIN only).

---

## Admin - Tags Endpoints

### GET /admin/tags
List all tags.

### POST /admin/tags
Create tag.

**Request Body:**
```json
{
  "translations": [
    { "locale": "vi", "name": "JavaScript", "slug": "javascript" },
    { "locale": "en", "name": "JavaScript", "slug": "javascript" }
  ]
}
```

### PATCH /admin/tags/:id
Update tag.

### DELETE /admin/tags/:id
Delete tag (ADMIN only).

---

## Admin - Audit Logs

### GET /admin/audit-logs
Get audit log history (ADMIN only).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| limit | number | Items per page (max 100) |
| entity | string | Filter by entity: Post, User, Media |
| entityId | string | Filter by specific entity ID |
| userId | string | Filter by user who made change |
| action | string | Filter: CREATE, UPDATE, DELETE, PUBLISH |
| startDate | string | ISO date string |
| endDate | string | ISO date string |

**Response (200):**
```json
{
  "data": [
    {
      "id": "log1",
      "userId": "user1",
      "action": "PUBLISH",
      "entity": "Post",
      "entityId": "post1",
      "oldValue": null,
      "newValue": { "status": "PUBLISHED" },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:00:00Z",
      "user": {
        "id": "user1",
        "name": "Admin",
        "email": "admin@example.com"
      }
    }
  ],
  "meta": { ... }
}
```

---

## Public API Endpoints

### GET /posts
List published posts.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10, max: 50) |
| locale | string | Filter by locale: vi, en |
| categoryId | string | Filter by category |
| tagId | string | Filter by tag |
| search | string | Full-text search |

---

### GET /posts/:locale/:slug
Get single published post by locale and slug.

**Response (200):**
```json
{
  "id": "post1",
  "status": "PUBLISHED",
  "publishAt": "2024-01-15T10:00:00Z",
  "author": { "id": "...", "name": "Author", "avatar": "..." },
  "translations": [...],
  "currentTranslation": {
    "locale": "en",
    "title": "Post Title",
    "slug": "post-title",
    "body": "...",
    "bodyHtml": "<p>...</p>",
    "metaTitle": "...",
    "metaDescription": "...",
    "heroImage": { ... }
  },
  "categories": [...],
  "tags": [...]
}
```

---

### GET /categories
List all categories (public).

### GET /categories/:locale/:slug
Get category by slug.

### GET /tags
List all tags (public).

### GET /tags/:locale/:slug
Get tag by slug.

---

### GET /preview/:token
Preview unpublished post with token.

---

### GET /sitemap.xml
Auto-generated sitemap with hreflang.

### GET /rss/:locale.xml
RSS feed for locale (vi.xml or en.xml).

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Rate Limiting

- Global: 100 requests/minute
- Auth endpoints: 5-10 requests/minute
- Forgot password: 3 requests/minute

---

## Role Permissions

| Role | Permissions |
|------|-------------|
| AUTHOR | Create/edit own posts, upload media |
| EDITOR | All AUTHOR + publish/unpublish, edit any post, manage categories/tags |
| ADMIN | All EDITOR + manage users, delete posts, view audit logs |
