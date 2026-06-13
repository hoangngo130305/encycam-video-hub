"""
REFACTORING: Video List Filter UI - Documentation

## Overview
Refactored the "Video của tôi" (My Videos) page filter interface to simplify the review process by grouping filters into logical categories.

## Changes Made

### 1. New VideoFilterBar Component
**File**: `src/components/VideoFilterBar.tsx`

#### Features:
- **Grouped Filter Design**: Organizes filters into main filters and grouped dropdowns
- **Responsive Design**: 
  - Desktop: Horizontal pill buttons with dropdown for "Kết quả review"
  - Mobile: Dropdown selector that shows all options
- **Real-time Filtering**: Updates video list instantly without page reload
- **Selected State Indication**: Shows breadcrumb for nested selections (e.g., "Kết quả review > Cần sửa")

#### Filter Structure:
```
├─ Tất cả (All) - Show all videos
├─ Chờ review (Waiting for review) - pending status
└─ Kết quả review (Review Results) ▼
   ├─ Đã duyệt (Approved) - approved status
   ├─ Cần sửa (Needs Revision) - needs_revision status
   └─ Từ chối (Rejected) - rejected status
```

#### Hidden Filters:
- Đang review (Under review/reviewing) - Still exists in database but not shown to end users
- Đã reviewed (Reviewed by first reviewer/reviewed) - Still exists in database but not shown to end users

### 2. Updated VideoListPage
**File**: `src/pages/VideoListPage.tsx`

#### Changes:
1. **New Import**: Added `VideoFilterBar` component
2. **Filter Mapping**: Created `FILTER_STATUS_MAP` to map filter IDs to video statuses
   ```typescript
   const FILTER_STATUS_MAP: Record<string, VideoStatus[]> = {
     all: ['pending', 'reviewing', 'reviewed', 'approved', 'rejected', 'needs_revision'],
     pending: ['pending'],
     approved: ['approved'],
     needs_revision: ['needs_revision'],
     rejected: ['rejected'],
   };
   ```

3. **Performance Optimization**: 
   - Used `useMemo` for filtering logic to prevent unnecessary re-renders
   - Filters only affected when: visibleVideos, statusFilter, or search changes

4. **Responsive Behavior**:
   - Detects mobile/desktop view with window resize listener
   - Passes `isMobile` prop to `VideoFilterBar` for appropriate UI rendering

5. **Default Filter**: Changed from empty string to 'all' for better UX

### 3. Filtering Logic
The filtering now works as follows:

1. **Role-based Visibility** (unchanged):
   - BTV: Only sees their own videos
   - Reviewer: Only sees videos with pending/reviewing/reviewed/needs_revision status
   - Admin/Final: Can see all videos

2. **Status Filter** (new):
   - Maps filter selection to allowed video statuses
   - Supports both single and group filters
   - Includes all statuses for 'all' filter but only shows relevant ones in UI

3. **Search** (unchanged):
   - Can search by video title or BTV name
   - Works in combination with status filter

## Color Consistency

The badge colors are consistent between filter buttons and video list status badges:
- **Chờ review**: Amber (xanh dương) - `bg-amber-50`
- **Đã duyệt**: Green (xanh lá) - `bg-green-50`
- **Cần sửa**: Orange (cam) - `bg-orange-50`
- **Từ chối**: Red (đỏ) - `bg-red-50`

## Responsive Behavior

### Desktop (md and above):
```
[Tất cả] [Chờ review] [Kết quả review ▼]
          Dropdown expands inline:
          [Đã duyệt] [Cần sửa] [Từ chối]
```

### Mobile (below md):
```
[Kết quả review ▼]
  ↓ (expanded)
├─ Tất cả
├─ Chờ review
├─ ── Kết quả review
│  ├─ Đã duyệt
│  ├─ Cần sửa
│  └─ Từ chối
```

## Benefits

1. **Simplified UX**: Reduces cognitive load from 7 tabs to 3 main filter groups
2. **Better Organization**: Groups related statuses under "Kết quả review"
3. **Responsive**: Works seamlessly on mobile and desktop
4. **Performance**: Uses memoization to avoid unnecessary filtering
5. **Maintainability**: Clear filter mapping makes adding new statuses easier
6. **Consistency**: Colors match between filter UI and badges
7. **No Breaking Changes**: Database schema and APIs remain unchanged

## Future Extensibility

To add new statuses or groups:

1. Add filter option to `FILTER_OPTIONS` in `VideoFilterBar.tsx`
2. Add mapping to `FILTER_STATUS_MAP` in `VideoListPage.tsx`
3. The color styling can reuse existing `STATUS_CONFIG` colors
4. Group visibility can be controlled via the `group` property

## Testing Checklist

- [ ] Desktop view shows horizontal pill buttons
- [ ] Desktop dropdown works correctly
- [ ] Mobile view shows dropdown selector
- [ ] Mobile dropdown displays all options with sections
- [ ] Filtering updates list in real-time
- [ ] Search works in combination with filters
- [ ] Breadcrumb shows correct nested selection on mobile
- [ ] Colors are consistent
- [ ] Role-based visibility still works (BTV, Reviewer, Admin, Final)
- [ ] "Đang review" and "Đã reviewed" are not shown in filter UI but still appear in 'all' filter
"""
