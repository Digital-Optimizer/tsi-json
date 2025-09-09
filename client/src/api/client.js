export async function generateSegments(data) {
  console.log('[API Client] Calling /api/generate with:', data);
  
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  console.log('[API Client] Response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('[API Client] Error response:', error);
    throw new Error(error.message || 'Failed to generate segments');
  }
  
  const result = await response.json();
  console.log('[API Client] Success response:', result);
  return result;
}

export async function downloadSegments(segments) {
  console.log('[API Client] Downloading segments:', segments.length);
  
  const response = await fetch('/api/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ segments }),
  });
  
  if (!response.ok) {
    console.error('[API Client] Download failed:', response.status);
    throw new Error('Failed to download segments');
  }
  
  console.log('[API Client] Download successful');
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'veo3-segments.zip';
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function generateVideos(segments) {
  console.log('[API Client] Generating videos for segments:', segments.length);
  
  const response = await fetch('/api/generate-videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ segments }),
  });
  
  console.log('[API Client] Video generation response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('[API Client] Video generation error:', error);
    throw new Error(error.message || 'Failed to generate videos');
  }
  
  const result = await response.json();
  console.log('[API Client] Video generation success:', result);
  return result;
}

export async function generateContinuation(data) {
  console.log('[API Client] Calling /api/generate-continuation with:', data);
  
  const response = await fetch('/api/generate-continuation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  console.log('[API Client] Response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('[API Client] Error response:', error);
    throw new Error(error.message || 'Failed to generate continuation');
  }
  
  const result = await response.json();
  console.log('[API Client] Success response:', result);
  return result;
}

export async function generateVideosFalAI(segments, options = {}) {
  console.log('[API Client] Generating videos via FalAI for segments:', segments.length);
  
  const response = await fetch('/api/generate-videos-falai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ segments, options }),
  });
  
  console.log('[API Client] FalAI video generation response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('[API Client] FalAI video generation error:', error);
    throw new Error(error.message || 'Failed to generate videos via FalAI');
  }
  
  const result = await response.json();
  console.log('[API Client] FalAI video generation success:', result);
  return result;
}

export async function checkFalAIStatus() {
  console.log('[API Client] Checking FalAI service status');
  
  try {
    const response = await fetch('/api/falai-status');
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[API Client] FalAI status:', result);
    return result;
  } catch (error) {
    console.error('[API Client] FalAI status check failed:', error);
    return { available: false, reason: error.message };
  }
}

