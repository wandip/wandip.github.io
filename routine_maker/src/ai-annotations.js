// AI Annotations Framework - JavaScript Version
// Simplified version for Routine Maker

const SUPPORTED_PURPOSES = [
  'purchase', 'navigation', 'form_submission', 'content_display',
  'search', 'filter', 'authentication', 'content_identification',
  'pricing_information', 'user_feedback', 'user_input', 'action_trigger',
  'data_selection', 'media_interaction', 'social_action', 'notification_action',
  'settings_control', 'help_support', 'download_action', 'upload_action'
];

const DATA_ATTRIBUTES = {
  ANNOTATION: 'data-ai-annotation',
  PURPOSE: 'data-ai-purpose',
  ID: 'data-ai-id',
  NODE_ID: 'data-ai-node-id',
  DESCRIPTION: 'data-ai-description',
  WORKFLOW: 'data-ai-workflow',
  PRIORITY: 'data-ai-priority',
  INCLUDE_EXPORT: 'data-ai-include-export',
  CONTEXT: 'data-ai-context',
  METADATA: 'data-ai-metadata'
};

// Generate unique ID
function generateAnnotationId() {
  return `ai-annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Validate annotation options
function validateAnnotationOptions(options) {
  const errors = [];
  const warnings = [];

  if (!options.purpose) {
    errors.push('Purpose is required');
  }

  if (options.purpose && !SUPPORTED_PURPOSES.includes(options.purpose)) {
    errors.push(`Invalid purpose: ${options.purpose}`);
  }

  if (!options.description) {
    warnings.push('Description is recommended for better AI agent understanding');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Serialize context/metadata
function serializeObject(obj) {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('Failed to serialize object:', error);
    return '';
  }
}

// Create annotation props
function createAnnotationProps(options) {
  const validation = validateAnnotationOptions(options);
  
  if (!validation.valid) {
    console.warn('AI Annotation validation failed:', validation.errors);
    return {};
  }

  const props = {
    [DATA_ATTRIBUTES.ANNOTATION]: 'true',
    [DATA_ATTRIBUTES.PURPOSE]: options.purpose,
    [DATA_ATTRIBUTES.ID]: generateAnnotationId(),
  };

  // Add nodeId for direct DOM interaction by AI browsers
  if (options.nodeId) {
    props[DATA_ATTRIBUTES.NODE_ID] = options.nodeId;
  }

  if (options.description) {
    props[DATA_ATTRIBUTES.DESCRIPTION] = options.description;
  }

  if (options.workflow) {
    props[DATA_ATTRIBUTES.WORKFLOW] = options.workflow;
  }

  if (options.priority !== undefined) {
    props[DATA_ATTRIBUTES.PRIORITY] = options.priority.toString();
  }

  if (options.context) {
    const contextString = serializeObject(options.context);
    if (contextString) {
      props[DATA_ATTRIBUTES.CONTEXT] = contextString;
    }
  }

  if (options.metadata) {
    const metadataString = serializeObject(options.metadata);
    if (metadataString) {
      props[DATA_ATTRIBUTES.METADATA] = metadataString;
    }
  }

  return props;
}

// React hook equivalent (for use in React components)
function useAIAnnotation(options) {
  // In a real React app, you'd use React.useMemo here
  // For simplicity, we'll just return the props directly
  return createAnnotationProps(options);
}

// Function for dynamic annotations (for use in loops/maps)
// Note: Not a React hook, just a regular function
function createDynamicAnnotation(options) {
  return createAnnotationProps(options);
}

// Annotation Engine (simplified)
class AnnotationEngine {
  constructor(config = {}) {
    this.config = {
      observeChanges: false,
      debounceDelay: 100,
      includeHidden: false,
      includeNonInteractive: true,
      annotationSelector: '[data-ai-annotation="true"]',
      maxAnnotations: 1000,
      ...config
    };
    
    this.annotations = new Map();
    this.observer = null;
    this.debounceTimer = null;
    
    this.initialize();
  }

  initialize() {
    this.scanAnnotations();
    
    if (this.config.observeChanges && typeof window !== 'undefined') {
      this.setupMutationObserver();
    }
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              if (this.hasAnnotation(element) || this.containsAnnotations(element)) {
                shouldRescan = true;
              }
            }
          });
        }
      });

      if (shouldRescan) {
        this.debouncedRescan();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: Object.values(DATA_ATTRIBUTES)
    });
  }

  debouncedRescan() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.scanAnnotations();
    }, this.config.debounceDelay);
  }

  hasAnnotation(element) {
    return element.hasAttribute(DATA_ATTRIBUTES.ANNOTATION);
  }

  containsAnnotations(element) {
    return element.querySelector(this.config.annotationSelector) !== null;
  }

  scanAnnotations() {
    const elements = document.querySelectorAll(this.config.annotationSelector);
    const newAnnotations = new Map();

    elements.forEach((element) => {
      const annotation = this.extractAnnotationFromElement(element);
      if (annotation) {
        newAnnotations.set(annotation.id, annotation);
      }
    });

    this.annotations = newAnnotations;
  }

  extractAnnotationFromElement(element) {
    try {
      const id = element.getAttribute(DATA_ATTRIBUTES.ID) || this.generateElementId(element);
      const purpose = element.getAttribute(DATA_ATTRIBUTES.PURPOSE);
      
      if (!purpose) return null;

      const annotation = {
        id,
        purpose,
        tagName: element.tagName.toLowerCase(),
        textContent: element.textContent?.trim() || '',
        timestamp: Date.now(),
        visible: this.isElementVisible(element),
        interactive: this.isElementInteractive(element)
      };

      // Add nodeId for direct DOM interaction by AI browsers
      const nodeId = element.getAttribute(DATA_ATTRIBUTES.NODE_ID);
      if (nodeId) {
        annotation.nodeId = nodeId;
      }

      const description = element.getAttribute(DATA_ATTRIBUTES.DESCRIPTION);
      if (description) annotation.description = description;

      const workflow = element.getAttribute(DATA_ATTRIBUTES.WORKFLOW);
      if (workflow) annotation.workflow = workflow;

      const contextString = element.getAttribute(DATA_ATTRIBUTES.CONTEXT);
      if (contextString) {
        try {
          annotation.context = JSON.parse(contextString);
        } catch (error) {
          console.warn('Failed to parse context:', error);
        }
      }

      const metadataString = element.getAttribute(DATA_ATTRIBUTES.METADATA);
      if (metadataString) {
        try {
          annotation.metadata = JSON.parse(metadataString);
        } catch (error) {
          console.warn('Failed to parse metadata:', error);
        }
      }

      return annotation;
    } catch (error) {
      console.error('Error extracting annotation:', error);
      return null;
    }
  }

  generateElementId(element) {
    const tagName = element.tagName.toLowerCase();
    const textContent = element.textContent?.substring(0, 20) || '';
    const className = element.className || '';
    return `${tagName}-${textContent}-${className}-${Date.now()}`.replace(/\s+/g, '-');
  }

  isElementVisible(element) {
    if (!this.config.includeHidden) {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0';
    }
    return true;
  }

  isElementInteractive(element) {
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'form'];
    const tagName = element.tagName.toLowerCase();
    
    if (interactiveTags.indexOf(tagName) !== -1) {
      return true;
    }

    const interactiveAttributes = ['onclick', 'onchange', 'onsubmit', 'tabindex'];
    return interactiveAttributes.some(attr => element.hasAttribute(attr));
  }

  getAnnotations() {
    return Array.from(this.annotations.values());
  }

  getAnnotationsByPurpose(purpose) {
    return this.getAnnotations().filter(annotation => annotation.purpose === purpose);
  }

  exportForAI() {
    const annotations = this.getAnnotations();
    const annotationsByPurpose = {};

    annotations.forEach(annotation => {
      if (!annotationsByPurpose[annotation.purpose]) {
        annotationsByPurpose[annotation.purpose] = [];
      }
      annotationsByPurpose[annotation.purpose].push(annotation);
    });

    return {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      annotations,
      annotationsByPurpose,
      pageMetadata: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        language: document.documentElement.lang || 'en'
      }
    };
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.annotations.clear();
  }
}

// Global engine instance
let globalAnnotationEngine = null;

function getAnnotationEngine(config) {
  if (!globalAnnotationEngine) {
    globalAnnotationEngine = new AnnotationEngine(config);
  }
  return globalAnnotationEngine;
}

function setupAIAnnotations(config) {
  return getAnnotationEngine(config);
}

// Export everything
export {
  useAIAnnotation,
  createDynamicAnnotation,
  createAnnotationProps,
  validateAnnotationOptions,
  AnnotationEngine,
  getAnnotationEngine,
  setupAIAnnotations,
  SUPPORTED_PURPOSES,
  DATA_ATTRIBUTES
};
