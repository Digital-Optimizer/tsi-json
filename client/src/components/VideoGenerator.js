import React, { useState } from 'react';
import { generateVideos, generateVideosFalAI } from '../api/client';
import APISelector from './APISelector';

function VideoGenerator({ segments }) {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState('gemini');
  const [videoOptions, setVideoOptions] = useState({
    aspectRatio: '16:9',
    duration: '8s',
    resolution: '720p',
    generateAudio: true,
    useFast: true // Always use fast generation for optimal performance
  });

  const handleGenerateVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (selectedAPI === 'falai') {
        result = await generateVideosFalAI(segments, videoOptions);
      } else {
        result = await generateVideos(segments);
      }
      
      setVideos(result.videos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCostDisplay = () => {
    switch (selectedAPI) {
      case 'gemini':
        return 'Free (descriptions only)';
      case 'falai':
        const seconds = parseInt(videoOptions.duration.replace(/[^0-9]/g, '')) || 8;
        const rate = videoOptions.generateAudio ? 0.40 : 0.20;
        return `$${(segments.length * seconds * rate).toFixed(2)} (${seconds}s × $${rate}/s × ${segments.length} segments)`;
      case 'kieai':
        return `$${(segments.length * 0.40).toFixed(2)} ($0.40 × ${segments.length} segments)`;
      default:
        return 'Unknown';
    }
  };

  const handleAPIChange = (apiId) => {
    setSelectedAPI(apiId);
    setVideos(null); // Clear previous results
    setError(null);
  };

  const handleVideoOptionsChange = (key, value) => {
    setVideoOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="video-generator">
      <h3>Video Generation</h3>
      
      <APISelector 
        selectedAPI={selectedAPI}
        onAPIChange={handleAPIChange}
        disabled={loading}
      />

      {selectedAPI === 'falai' && (
        <div className="video-options">
          <h4>Video Options</h4>
          <div className="options-grid">
            <div className="option-group">
              <label>Aspect Ratio:</label>
              <select 
                value={videoOptions.aspectRatio}
                onChange={(e) => handleVideoOptionsChange('aspectRatio', e.target.value)}
                disabled={loading}
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
              </select>
            </div>
            
            <div className="option-group">
              <label>Duration:</label>
              <select 
                value={videoOptions.duration}
                onChange={(e) => handleVideoOptionsChange('duration', e.target.value)}
                disabled={loading}
              >
                <option value="5s">5 seconds</option>
                <option value="6s">6 seconds</option>
                <option value="7s">7 seconds</option>
                <option value="8s">8 seconds</option>
              </select>
            </div>
            
            <div className="option-group">
              <label>Resolution:</label>
              <select 
                value={videoOptions.resolution}
                onChange={(e) => handleVideoOptionsChange('resolution', e.target.value)}
                disabled={loading}
              >
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
              </select>
            </div>
            
            <div className="option-group">
              <label>
                <input 
                  type="checkbox"
                  checked={videoOptions.generateAudio}
                  onChange={(e) => handleVideoOptionsChange('generateAudio', e.target.checked)}
                  disabled={loading}
                />
                Generate Audio
              </label>
            </div>
            
            <div className="option-group fast-generation-note">
              <small>⚡ Fast generation is automatically enabled for optimal performance</small>
            </div>
          </div>
        </div>
      )}
      
      <div className="video-info">
        <p><strong>Ready to generate {segments.length} video segments</strong></p>
        <p className="video-cost">Estimated cost: {getCostDisplay()}</p>
      </div>

      <button 
        className="generate-videos-button"
        onClick={handleGenerateVideos}
        disabled={loading}
      >
        {loading ? 'Processing...' : 
          selectedAPI === 'falai' ? 'Generate Videos' :
          selectedAPI === 'kieai' ? 'Generate Videos' :
          'Generate Video Descriptions'}
      </button>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {videos && (
        <div className="videos-results">
          <h4>
            {selectedAPI === 'falai' ? 'Video Generation Results' :
             selectedAPI === 'kieai' ? 'Video Generation Results' :
             'Video Description Results'}
          </h4>
          
          <p className="video-status">
            {selectedAPI === 'falai' || selectedAPI === 'kieai' 
              ? `✅ Generated videos for ${videos.filter(v => v.success).length}/${videos.length} segments`
              : `✅ Generated descriptions for all ${videos.length} segments`}
          </p>
          
          {selectedAPI === 'falai' && (
            <div className="video-grid">
              {videos.map((video, index) => (
                <div key={index} className={`video-result ${video.success ? 'success' : 'error'}`}>
                  <h5>Segment {video.segmentNumber}</h5>
                  {video.success ? (
                    <>
                      {video.videoUrl && (
                        <div className="video-player">
                          <video 
                            controls 
                            width="100%" 
                            height="200"
                            poster=""
                          >
                            <source src={video.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          <div className="video-actions">
                            <a 
                              href={video.videoUrl} 
                              download={`segment-${video.segmentNumber}.mp4`}
                              className="download-link"
                            >
                              Download Video
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="video-metadata">
                        <p><strong>Duration:</strong> {video.duration}</p>
                        <p><strong>Status:</strong> {video.status}</p>
                        {video.cost && <p><strong>Cost:</strong> ${video.cost}</p>}
                      </div>
                    </>
                  ) : (
                    <div className="video-error">
                      <p><strong>Generation Failed:</strong> {video.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <button 
            className="toggle-details-button"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </button>

          {showDetails && (
            <div className="video-details">
              {videos.map((video, index) => (
                <div key={index} className="video-segment">
                  <h5>Segment {video.segmentNumber}</h5>
                  <div className="video-prompt">
                    <strong>Prompt:</strong>
                    <pre>{video.prompt || video.metadata?.prompt}</pre>
                  </div>
                  {video.videoDescription && (
                    <div className="video-description">
                      <strong>Video Description:</strong>
                      <pre>{video.videoDescription}</pre>
                    </div>
                  )}
                  {video.metadata && (
                    <div className="video-metadata-detail">
                      <strong>Technical Details:</strong>
                      <pre>{JSON.stringify(video.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="api-note">
            {selectedAPI === 'falai' && (
              <>
                <p><strong>FalAI Integration:</strong> Generating actual video files using Google's Veo3 model.</p>
                <p>Videos are generated with realistic UGC quality and can be downloaded individually.</p>
              </>
            )}
            {selectedAPI === 'gemini' && (
              <>
                <p><strong>Note:</strong> This generates detailed video descriptions that can be used with Google's Veo 3 API once available.</p>
                <p>The descriptions include camera angles, character states, dialogue timing, and scene continuity for seamless video generation.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoGenerator;