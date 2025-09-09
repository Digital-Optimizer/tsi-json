import express from 'express';
import falaiService from '../services/falaiService.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Generate videos using FalAI
router.post('/generate-videos-falai', async (req, res) => {
  const timer = logger.startTimer('FalAI Video Generation Request');
  
  try {
    const { segments, options = {} } = req.body;
    
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'segments array is required and must not be empty'
      });
    }

    logger.info(`[API] FalAI video generation requested for ${segments.length} segments`);

    // Validate segments structure
    const invalidSegments = segments.filter((segment, index) => 
      !segment.action_timeline?.dialogue && !segment.character_description
    );

    if (invalidSegments.length > 0) {
      return res.status(400).json({
        error: 'Invalid segment structure',
        message: 'Each segment must have action_timeline.dialogue or character_description'
      });
    }

    const result = await falaiService.generateVideosForAllSegments(segments, {
      aspectRatio: options.aspectRatio || '16:9',
      duration: options.duration || '8s',
      resolution: options.resolution || '720p',
      generateAudio: options.generateAudio !== false,
      useFast: true, // Always use fast endpoint for optimal performance
      ...options
    });

    timer.end(`FalAI generation completed - ${result.successCount}/${result.totalSegments} successful`);

    res.json({
      success: result.success,
      videos: result.videos,
      metadata: {
        totalSegments: result.totalSegments,
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalCost: result.totalCost,
        currency: 'USD',
        provider: 'FalAI',
        timestamp: new Date().toISOString()
      },
      errors: result.errors
    });

  } catch (error) {
    timer.end('FalAI generation failed');
    
    logger.logError(error, {
      endpoint: '/generate-videos-falai',
      segmentCount: req.body.segments?.length
    });

    // Determine appropriate status code
    let statusCode = 500;
    if (error.message.includes('API key')) {
      statusCode = 401;
    } else if (error.message.includes('credits')) {
      statusCode = 402;
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
    } else if (error.message.includes('Invalid request')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      error: 'Video generation failed',
      message: error.message,
      provider: 'FalAI',
      timestamp: new Date().toISOString()
    });
  }
});

// Get FalAI service status
router.get('/falai-status', async (req, res) => {
  try {
    const status = await falaiService.getServiceStatus();
    
    res.json({
      provider: 'FalAI',
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/falai-status' });
    
    res.status(500).json({
      provider: 'FalAI',
      available: false,
      reason: 'Status check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;