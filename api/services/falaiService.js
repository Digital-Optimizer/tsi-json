import axios from 'axios';
import logger from '../../utils/logger.js';

class FalAIService {
  constructor() {
    this.baseURL = 'https://fal.run/fal-ai/veo3';
    this.apiKey = process.env.FAL_AI_API_KEY || process.env.FALAI_API_KEY; // Support both formats
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    if (!this.apiKey) {
      logger.warn('[FalAI] API key not found. Video generation will be disabled.');
      return;
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5 minutes timeout
    });

    this.initialized = true;
    logger.info('[FalAI] Service initialized successfully');
  }

  async generateVideoFromSegment(segment, options = {}) {
    if (!this.initialized) {
      throw new Error('FalAI service not initialized. Please configure FALAI_API_KEY');
    }

    const timer = logger.startTimer('FalAI Video Generation');
    logger.info(`[FalAI] Generating video for segment ${segment.segment_info?.segment_number}`);

    try {
      const prompt = this.createVideoPrompt(segment, options);
      
      const requestData = {
        prompt: prompt,
        aspect_ratio: options.aspectRatio || '16:9',
        duration: options.duration || '8s',
        resolution: options.resolution || '720p',
        generate_audio: options.generateAudio !== false,
        ...options.falaiOptions
      };

      logger.debug('[FalAI] Request data:', requestData);

      // Always use fast endpoint for Veo3 optimization
      const endpoint = '/fast';
      
      const response = await this.axiosInstance.post(endpoint, requestData);
      
      timer.end(`FalAI video generation completed`);
      
      return {
        success: true,
        segmentNumber: segment.segment_info?.segment_number,
        videoUrl: response.data.video?.url,
        status: response.data.status || 'completed',
        duration: requestData.duration,
        cost: this.calculateCost(requestData.duration, requestData.generate_audio),
        requestId: response.data.request_id,
        metadata: {
          prompt,
          aspectRatio: requestData.aspect_ratio,
          resolution: requestData.resolution,
          generateAudio: requestData.generate_audio
        }
      };

    } catch (error) {
      timer.end(`FalAI video generation failed`);
      logger.logError(error, {
        service: 'FalAI',
        segment: segment.segment_info?.segment_number,
        prompt: this.createVideoPrompt(segment, options)
      });
      
      // Enhanced error handling for different types of API errors
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            throw new Error(`Invalid request: ${data.error || 'Bad request parameters'}`);
          case 401:
            throw new Error('Invalid API key. Please check your FALAI_API_KEY');
          case 402:
            throw new Error('Insufficient credits. Please add funds to your FalAI account');
          case 429:
            throw new Error('Rate limit exceeded. Please wait and try again');
          case 500:
            throw new Error('FalAI service error. Please try again later');
          default:
            throw new Error(`FalAI API error (${status}): ${data.error || 'Unknown error'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Video generation is taking longer than expected');
      } else if (error.request) {
        throw new Error('Network error. Please check your internet connection');
      } else {
        throw new Error(`FalAI service error: ${error.message}`);
      }
    }
  }

  createVideoPrompt(segment, options) {
    const isEnhanced = segment.segment_info?.continuity_markers ? true : false;
    
    let prompt = '';

    if (isEnhanced) {
      // Enhanced format with continuity markers
      prompt = `UGC style video: ${segment.character_description.current_state}. 
      
Dialogue: "${segment.action_timeline.dialogue}"

Actions: ${Object.entries(segment.action_timeline.synchronized_actions || {})
        .map(([time, action]) => `${time}: ${action}`)
        .join(', ')}

Camera: ${segment.scene_continuity.camera_position}
Environment: ${segment.scene_continuity.props_in_frame}

Style: Authentic user-generated content, handheld camera, natural lighting, casual and relatable, ${segment.action_timeline.micro_expressions || 'natural facial expressions'}`;
    } else {
      // Standard format
      prompt = `UGC style video: ${segment.character_description?.current_state || 'Natural presenter'}.
      
Dialogue: "${segment.action_timeline?.dialogue || ''}"

Actions: ${segment.action_timeline?.synchronized_actions || 'Natural gestures while speaking'}

Camera: ${segment.scene_continuity?.camera_position || 'Medium shot, eye level'}

Style: Authentic user-generated content, handheld camera, natural lighting, casual and relatable`;
    }

    // Ensure prompt meets FalAI requirements (clean and concise)
    return prompt.trim().replace(/\s+/g, ' ').substring(0, 1000); // Limit to 1000 chars
  }

  async generateVideosForAllSegments(segments, options = {}) {
    if (!this.initialized) {
      throw new Error('FalAI service not initialized');
    }

    logger.info(`[FalAI] Starting batch generation for ${segments.length} segments`);
    const timer = logger.startTimer('FalAI Batch Generation');

    const results = [];
    const errors = [];

    // Process segments sequentially to avoid rate limits
    for (let i = 0; i < segments.length; i++) {
      try {
        logger.info(`[FalAI] Processing segment ${i + 1}/${segments.length}`);
        const result = await this.generateVideoFromSegment(segments[i], {
          ...options,
          segmentIndex: i
        });
        results.push(result);
        
        // Add small delay between requests to be respectful
        if (i < segments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error(`[FalAI] Failed to generate video for segment ${i + 1}:`, error.message);
        errors.push({
          segmentIndex: i + 1,
          error: error.message
        });
        
        // Continue with next segment instead of failing entirely
        results.push({
          success: false,
          segmentNumber: segments[i].segment_info?.segment_number || i + 1,
          error: error.message
        });
      }
    }

    timer.end(`FalAI batch generation completed`);

    const successCount = results.filter(r => r.success).length;
    const totalCost = results
      .filter(r => r.success && r.cost)
      .reduce((sum, r) => sum + r.cost, 0);

    return {
      success: successCount > 0,
      videos: results,
      totalSegments: segments.length,
      successCount,
      failureCount: errors.length,
      totalCost: Math.round(totalCost * 100) / 100,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  calculateCost(duration, generateAudio = true) {
    // Parse duration (e.g., "8s" -> 8)
    const seconds = parseInt(duration.replace(/[^0-9]/g, '')) || 8;
    
    // FalAI pricing: $0.20-$0.40 per second depending on audio
    const baseRate = generateAudio ? 0.40 : 0.20;
    return seconds * baseRate;
  }

  async getServiceStatus() {
    if (!this.initialized) {
      return {
        available: false,
        reason: 'API key not configured'
      };
    }

    try {
      // Simple health check - just verify we can make a request
      await this.axiosInstance.get('/health', { timeout: 5000 });
      return { available: true };
    } catch (error) {
      logger.warn('[FalAI] Service health check failed:', error.message);
      return {
        available: false,
        reason: 'Service unavailable'
      };
    }
  }
}

export default new FalAIService();