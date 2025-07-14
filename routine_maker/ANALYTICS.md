# Google Analytics Implementation

This React app includes Google Analytics tracking to monitor user interactions and app usage.

## Configuration

- **Tracking ID**: `UA-127095421-1` (same as main website)
- **Library**: Google Analytics 4 (gtag)
- **Implementation**: Client-side tracking with custom events

## Tracked Events

### Page Views
- Initial page load
- Route changes (if applicable)

### User Interactions
- **Routine Creation**: When user adds title and tasks
- **PDF Export**: When user exports routine as PDF
- **Task Addition**: When user adds new tasks
- **Task Removal**: When user removes tasks
- **Layout Changes**: When user switches between horizontal/vertical layouts
- **Routine Reset**: When user clears all content

### Event Categories
- `routine_maker`: All app-specific events
- `page_view`: Standard page view tracking

## Files Modified

1. **`public/index.html`**: Added Google Analytics script tags
2. **`src/analytics.js`**: Created analytics configuration and helper functions
3. **`src/App.js`**: Integrated analytics tracking into user interactions

## Privacy

- No personal data is collected
- Only anonymous usage statistics are tracked
- Users can opt-out via browser settings or ad blockers

## Testing

To verify analytics are working:
1. Open browser developer tools
2. Check Network tab for requests to `google-analytics.com`
3. Check Console for any analytics-related errors
4. Verify events appear in Google Analytics dashboard

## Deployment

The analytics will work automatically when the app is deployed to GitHub Pages or any other hosting platform. 