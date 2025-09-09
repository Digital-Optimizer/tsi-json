import React, { useState, useEffect } from 'react';

function APISelector({ selectedAPI, onAPIChange, disabled = false }) {
  const [serviceStatus, setServiceStatus] = useState({});
  const [loading, setLoading] = useState(false);

  // API options with their details
  const apiOptions = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Video descriptions only',
      cost: 'Free (descriptions)',
      features: ['Video descriptions', 'Fast generation']
    },
    {
      id: 'falai',
      name: 'FalAI Veo3 Fast',
      description: 'Actual video generation (fast mode)',
      cost: '$0.20-$0.40 per second',
      features: ['Actual video files', '⚡ Fast generation', '5-8 second videos', 'HD quality']
    },
    {
      id: 'kieai',
      name: 'Kie.ai',
      description: 'Alternative video generation',
      cost: '$0.40 per video',
      features: ['Actual video files', 'Flat rate pricing', 'Good quality']
    }
  ];

  // Check service availability on component mount
  useEffect(() => {
    checkServiceAvailability();
  }, []);

  const checkServiceAvailability = async () => {
    setLoading(true);
    const status = {};

    try {
      // Check FalAI status
      try {
        const falaiResponse = await fetch('/api/falai-status');
        const falaiData = await falaiResponse.json();
        status.falai = falaiData.available;
      } catch {
        status.falai = false;
      }

      // For other services, we'll assume they're available if the component is rendered
      // (since the server already validates environment variables)
      status.gemini = true;
      status.kieai = true;

      setServiceStatus(status);
    } catch (error) {
      console.error('Error checking service availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAPISelect = (apiId) => {
    if (!disabled) {
      onAPIChange(apiId);
    }
  };

  const getStatusIcon = (apiId) => {
    if (loading) return '⏳';
    if (serviceStatus[apiId] === true) return '✅';
    if (serviceStatus[apiId] === false) return '❌';
    return '❓';
  };


  return (
    <div className="api-selector">
      <h4>Video Generation API</h4>
      <div className="api-options">
        {apiOptions.map(option => (
          <div 
            key={option.id}
            className={`api-option ${selectedAPI === option.id ? 'selected' : ''} ${
              disabled ? 'disabled' : ''
            } ${serviceStatus[option.id] === false ? 'unavailable' : ''}`}
            onClick={() => handleAPISelect(option.id)}
          >
            <div className="api-option-header">
              <div className="api-name">
                {getStatusIcon(option.id)} {option.name}
              </div>
              <div className="api-cost">{option.cost}</div>
            </div>
            <div className="api-description">{option.description}</div>
            <div className="api-features">
              {option.features.map((feature, index) => (
                <span key={index} className="api-feature-tag">
                  {feature}
                </span>
              ))}
            </div>
            {serviceStatus[option.id] === false && (
              <div className="api-error">
                Service unavailable - check API key configuration
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedAPI && (
        <div className="api-selection-summary">
          <strong>Selected:</strong> {apiOptions.find(opt => opt.id === selectedAPI)?.name}
          <button 
            className="refresh-status-btn"
            onClick={checkServiceAvailability}
            disabled={loading}
            title="Refresh service status"
          >
            🔄
          </button>
        </div>
      )}

      <style jsx>{`
        .api-selector {
          margin: 20px 0;
        }

        .api-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 10px 0;
        }

        .api-option {
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .api-option:hover {
          border-color: #007cba;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .api-option.selected {
          border-color: #007cba;
          background: #f0f8ff;
        }

        .api-option.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .api-option.unavailable {
          border-color: #ff6b6b;
          background: #fff5f5;
        }

        .api-option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .api-name {
          font-weight: bold;
          font-size: 16px;
        }

        .api-cost {
          color: #666;
          font-size: 14px;
        }

        .api-description {
          color: #666;
          margin-bottom: 10px;
        }

        .api-features {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .api-feature-tag {
          background: #e3f2fd;
          color: #1565c0;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }

        .api-error {
          color: #d32f2f;
          font-size: 12px;
          margin-top: 5px;
          font-style: italic;
        }

        .api-selection-summary {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
          margin-top: 10px;
        }

        .refresh-status-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 2px;
          border-radius: 2px;
        }

        .refresh-status-btn:hover {
          background: #ddd;
        }

        .refresh-status-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default APISelector;