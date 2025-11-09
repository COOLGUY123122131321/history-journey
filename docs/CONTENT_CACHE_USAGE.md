# Content Cache System - Usage Guide

## Overview

The Content Cache System provides a simple API for fetching or generating AI content with automatic Firestore caching. This system ensures that identical requests reuse cached content, saving API costs and improving response times.

## Features

✅ **Automatic Caching** - Content is automatically cached in Firestore  
✅ **Cache-First Lookup** - Checks cache before generating new content  
✅ **View Tracking** - Tracks how many times content is reused  
✅ **User Attribution** - Records who first generated the content  
✅ **Multiple Content Types** - Supports explanations, videos, quizzes, images, and text  
✅ **Type-Safe** - Full TypeScript support  

## Quick Start

### Basic Usage

```typescript
import { fetchOrGenerateContent } from '../services/contentCache';
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  const [content, setContent] = useState(null);

  useEffect(() => {
    const loadContent = async () => {
      const result = await fetchOrGenerateContent(
        "Explain Napoleon's rise to power",
        "explanation",
        "Napoleon",
        user?.uid
      );

      if (result.fromCache) {
        console.log("✅ Loaded from cache");
      } else {
        console.log("✨ Generated with AI");
      }

      setContent(result);
    };

    loadContent();
  }, []);

  return (
    <div>
      {content?.fromCache && <span>✅ Loaded from cache</span>}
      {!content?.fromCache && <span>✨ Generated with AI</span>}
      <p>{content?.text}</p>
    </div>
  );
}
```

### Example: Explanation Component

```typescript
import { fetchOrGenerateContent, ContentResult } from '../services/contentCache';

async function displayExplanation(prompt: string, topic: string, userId: string) {
  const result: ContentResult = await fetchOrGenerateContent(
    prompt,
    "explanation",
    topic,
    userId
  );

  // Display the content
  console.log(result.text);
  console.log(`From cache: ${result.fromCache}`);
  console.log(`Views: ${result.views}`);
}
```

### Example: Video Generation with Caching

```typescript
async function getVideo(prompt: string, topic: string, userId: string) {
  const result = await fetchOrGenerateContent(
    prompt,
    "video",
    topic,
    userId
  );

  if (result.videoUrl) {
    // Display video
    return result.videoUrl;
  }
}
```

## API Reference

### `fetchOrGenerateContent`

Main function to fetch or generate content.

**Parameters:**
- `prompt: string` - The user's question or command
- `type: ContentType` - Type of content: 'explanation', 'video', 'quiz', 'question', 'image', 'text'
- `topic: string` - Topic category (e.g., "Napoleon", "French Revolution")
- `userId?: string` - Optional user ID for attribution

**Returns:** `Promise<ContentResult>`

**ContentResult Structure:**
```typescript
{
  prompt: string;
  topic: string;
  type: ContentType;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: Date;
  views?: number;
  createdBy?: string;
  fromCache: boolean; // true if loaded from cache
}
```

### `fetchCachedContentByTopic`

Fetch all cached content for a specific topic.

```typescript
const allContent = await fetchCachedContentByTopic("Napoleon");
// Returns array of all cached content about Napoleon

// Filter by type
const videos = await fetchCachedContentByTopic("Napoleon", "video");
```

### `getCacheStats`

Get statistics about cached content for a topic.

```typescript
const stats = await getCacheStats("Napoleon");
console.log(stats.totalItems); // Total cached items
console.log(stats.totalViews); // Total views across all items
console.log(stats.byType); // Count by type: { explanation: 5, video: 2, ... }
```

## Firestore Structure

The system uses the `content_cache` collection with the following document structure:

```typescript
{
  prompt: "Explain Napoleon's rise to power",
  topic: "Napoleon",
  type: "explanation",
  text: "Napoleon rose to power after the French Revolution...",
  imageUrl: "https://...", // optional
  videoUrl: "https://...", // optional
  createdAt: Timestamp,
  views: 42,
  createdBy: "user123"
}
```

## Content Types

- **explanation** - Educational explanations and descriptions
- **video** - AI-generated videos
- **quiz** - Quiz questions
- **question** - General questions
- **image** - AI-generated images (placeholder)
- **text** - General text content

## Integration Examples

### React Component Example

See `components/shared/ContentCacheExample.tsx` for a complete React component example that:
- Shows cache status (✅ or ✨)
- Displays view counts
- Handles loading and error states
- Renders text, images, and videos

### Integration with Existing Code

The content cache system works alongside the existing `cacheService.ts`. You can use either:
- **`fetchOrGenerateContent`** - Simple API matching your specification
- **`getOrGenerate`** - More advanced API with media upload support

## Best Practices

1. **Use descriptive prompts** - More specific prompts = better cache hits
2. **Consistent topics** - Use consistent topic names for better organization
3. **Handle errors gracefully** - Wrap calls in try-catch blocks
4. **Show cache status** - Display whether content came from cache or was generated
5. **Monitor cache stats** - Use `getCacheStats` to analyze cache performance

## Performance Benefits

- **Faster responses** - Cached content loads instantly
- **Cost savings** - Avoid regenerating identical content
- **Better UX** - Users see content immediately when cached
- **Shared knowledge** - Every user contributes to the knowledge base

## Future Enhancements

Potential improvements:
- Rating system for content quality
- Priority queue for popular content
- Analytics dashboard
- Content expiration policies
- A/B testing different prompts


