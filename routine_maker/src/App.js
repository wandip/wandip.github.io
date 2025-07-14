import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

function App() {
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState([
    { image: '', task: '', imageType: 'upload', imageUrl: '' }
  ]);
  const [layout, setLayout] = useState('horizontal');
  const [isExporting, setIsExporting] = useState(false);
  const [dragStates, setDragStates] = useState({}); // Track drag state for each task
  const previewRef = useRef();

  const handleTitleChange = (e) => setTitle(e.target.value);

  const handleTaskChange = (idx, field, value) => {
    const updated = tasks.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setTasks(updated);
  };

  const addTask = () => {
    setTasks([...tasks, { image: '', task: '', imageType: 'upload', imageUrl: '' }]);
    // Keep focus on the add task button after adding a new task
    setTimeout(() => {
      const addButton = document.querySelector('.add-task-btn-end');
      if (addButton) {
        addButton.focus();
        // Smooth scroll to keep the button in view
        addButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 0);
  };

  const removeTask = (idx) => setTasks(tasks.filter((_, i) => i !== idx));

  const clearAll = () => {
    setTitle('');
    setLayout('horizontal');
    setTasks([{ image: '', task: '', imageType: 'upload', imageUrl: '' }]);
  };

  const handleImageUpload = (idx, file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      handleTaskChange(idx, 'image', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragEnter = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStates(prev => ({ ...prev, [idx]: true }));
  };

  const handleDragLeave = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragStates(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStates(prev => ({ ...prev, [idx]: false }));
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(idx, files[0]);
    }
  };

  const handleExportPDF = async () => {
    if (previewRef.current && !isExporting) {
      try {
        setIsExporting(true);

        const isLandscape = layout === 'horizontal';
        
        // Clone the preview content to avoid modifying the original
        const previewClone = previewRef.current.cloneNode(true);
        previewClone.style.position = 'absolute';
        previewClone.style.left = '-9999px';
        previewClone.style.top = '0';
        previewClone.style.width = isLandscape ? '1000px' : '700px';
        previewClone.style.backgroundColor = '#ffffff';
        previewClone.style.padding = '40px';
        previewClone.style.margin = '0';
        previewClone.style.border = 'none';
        previewClone.style.boxShadow = 'none';
        document.body.appendChild(previewClone);

        // Configure html2canvas for high quality with optimized settings
        const canvas = await html2canvas(previewClone, {
          scale: 3, // High scale for crisp text and images
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: previewClone.offsetWidth,
          height: previewClone.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: previewClone.offsetWidth,
          windowHeight: previewClone.offsetHeight
        });

        // Create PDF with proper dimensions while preserving aspect ratio
        const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
        
        // Get PDF page dimensions
        const pageWidth = isLandscape ? 295 : 210; // A4 width in mm
        const pageHeight = isLandscape ? 210 : 295; // A4 height in mm
        
        // Calculate image dimensions to fit page while preserving aspect ratio
        const canvasAspectRatio = canvas.width / canvas.height;
        const pageAspectRatio = pageWidth / pageHeight;
        
        let imgWidth, imgHeight;
        if (canvasAspectRatio > pageAspectRatio) {
          // Canvas is wider than page - fit to width
          imgWidth = pageWidth;
          imgHeight = pageWidth / canvasAspectRatio;
        } else {
          // Canvas is taller than page - fit to height
          imgHeight = pageHeight;
          imgWidth = pageHeight * canvasAspectRatio;
        }
        
        // Center the image on the page
        const xOffset = (pageWidth - imgWidth) / 2;
        const yOffset = (pageHeight - imgHeight) / 2;
        
        // Add first page with optimized JPEG compression
        pdf.addImage(canvas, 'JPEG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'MEDIUM');
        
        // Create second page with empty text cells
        const emptyPreviewClone = previewRef.current.cloneNode(true);
        emptyPreviewClone.style.position = 'absolute';
        emptyPreviewClone.style.left = '-9999px';
        emptyPreviewClone.style.top = '0';
        emptyPreviewClone.style.width = isLandscape ? '1000px' : '700px';
        emptyPreviewClone.style.backgroundColor = '#ffffff';
        emptyPreviewClone.style.padding = '40px';
        emptyPreviewClone.style.margin = '0';
        emptyPreviewClone.style.border = 'none';
        emptyPreviewClone.style.boxShadow = 'none';
        
        // Remove text content from all text containers
        const textContainers = emptyPreviewClone.querySelectorAll('.item-text-container');
        textContainers.forEach(container => {
          container.innerHTML = '';
          container.style.backgroundColor = 'transparent';
        });
        
        // Remove images and their backgrounds from all image containers
        const imageContainers = emptyPreviewClone.querySelectorAll('.item-image-container');
        imageContainers.forEach(container => {
          container.innerHTML = '';
          container.style.backgroundColor = 'transparent';
        });
        
        // Add star image and "Done" text for horizontal layout second page
        if (layout === 'horizontal') {
          const textContainers = emptyPreviewClone.querySelectorAll('.item-text-container');
          textContainers.forEach(container => {
            container.innerHTML = `
              <div style="transform: rotate(180deg); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <span style="font-size: 4.5rem; margin-bottom: 1rem;">🌟</span>
                <span style="font-size: 2.5rem; font-weight: 700; color:rgb(20, 8, 8); font-family: 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Arial Rounded MT Bold', cursive; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Done ✅</span>
              </div>
            `;
            container.style.backgroundColor = '#c6f6d5'; // Keep the green background
          });
        }
        
        // Add star image and "Done" text with check mark for vertical layout second page
        if (layout === 'vertical') {
          const imageContainers = emptyPreviewClone.querySelectorAll('.item-image-container');
          imageContainers.forEach(container => {
            container.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <span style="font-size: 3.5rem; margin-bottom: 0.8rem;">🌟</span>
                <span style="font-size: 2rem; font-weight: 700; color:rgb(20, 8, 8); font-family: 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Arial Rounded MT Bold', cursive; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Done ✅</span>
              </div>
            `;
            container.style.backgroundColor = '#c6f6d5'; // Keep the green background
          });
        }
        
        document.body.appendChild(emptyPreviewClone);

        // Generate canvas for second page
        const emptyCanvas = await html2canvas(emptyPreviewClone, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: emptyPreviewClone.offsetWidth,
          height: emptyPreviewClone.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: emptyPreviewClone.offsetWidth,
          windowHeight: emptyPreviewClone.offsetHeight
        });

        // Add second page with empty text cells
        pdf.addPage();
        pdf.addImage(emptyCanvas, 'JPEG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'MEDIUM');
        
        // If content is taller than one page, add additional pages for both copies
        if (imgHeight > pageHeight) {
          let remainingHeight = imgHeight - pageHeight;
          let currentY = yOffset - pageHeight;
          
          while (remainingHeight > 0) {
            pdf.addPage();
            const pageImgY = currentY + (imgHeight - remainingHeight);
            
            pdf.addImage(canvas, 'JPEG', xOffset, pageImgY, imgWidth, imgHeight, undefined, 'MEDIUM');
            remainingHeight -= pageHeight;
            currentY -= pageHeight;
          }
          
          // Add the same additional pages for the second copy (with empty text)
          remainingHeight = imgHeight - pageHeight;
          currentY = yOffset - pageHeight;
          
          while (remainingHeight > 0) {
            pdf.addPage();
            const pageImgY = currentY + (imgHeight - remainingHeight);
            
            pdf.addImage(emptyCanvas, 'JPEG', xOffset, pageImgY, imgWidth, imgHeight, undefined, 'MEDIUM');
            remainingHeight -= pageHeight;
            currentY -= pageHeight;
          }
        }

        // Clean up
        document.body.removeChild(previewClone);
        document.body.removeChild(emptyPreviewClone);

        // Save the PDF
        pdf.save((title || 'routine') + '.pdf');

      } catch (error) {
        console.error('PDF generation failed:', error);
        alert('PDF generation failed. Please try again.');
      } finally {
        setIsExporting(false);
      }
    }
  };

  const getImageSrc = (item) => {
    if (item.imageType === 'upload') return item.image;
    if (item.imageType === 'link') return item.imageUrl;
    return '';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">📋</span>
            Routine Maker
          </h1>
          <div className="header-buttons">
            <button 
              onClick={handleExportPDF} 
              className="export-btn"
              disabled={!title.trim() || isExporting}
            >
              <span className="btn-icon">
                {isExporting ? '⏳' : '📄'}
              </span>
              {isExporting ? 'Generating PDF...' : 'Export PDF'}
            </button>
            <button 
              onClick={clearAll} 
              className="clear-btn"
              disabled={!title.trim() && tasks.length === 1 && tasks[0].image === '' && tasks[0].task === ''}
            >
              <span className="btn-icon">🧹</span>
              Clear All
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Form Section */}
        <section className="form-section">
          <div className="form-container">
            {/* Title Input */}
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">✏️</span>
                Routine Title
              </label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="title-input"
                placeholder="Enter your routine title..."
              />
            </div>

            {/* Layout Selection */}
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">📐</span>
                Layout Style
              </label>
              <div className="layout-options">
                <label className="layout-option">
                  <input
                    type="radio"
                    name="layout"
                    value="horizontal"
                    checked={layout === 'horizontal'}
                    onChange={() => setLayout('horizontal')}
                    className="radio-input"
                  />
                  <div className="radio-custom">
                    <div className="radio-dot"></div>
                  </div>
                  <div className="layout-preview horizontal-preview">
                    <div className="preview-item">
                      <div className="preview-image"></div>
                      <div className="preview-text"></div>
                    </div>
                    <div className="preview-item">
                      <div className="preview-image"></div>
                      <div className="preview-text"></div>
                    </div>
                  </div>
                  <span className="layout-label">Horizontal</span>
                </label>
                
                <label className="layout-option">
                  <input
                    type="radio"
                    name="layout"
                    value="vertical"
                    checked={layout === 'vertical'}
                    onChange={() => setLayout('vertical')}
                    className="radio-input"
                  />
                  <div className="radio-custom">
                    <div className="radio-dot"></div>
                  </div>
                  <div className="layout-preview vertical-preview">
                    <div className="preview-item">
                      <div className="preview-image"></div>
                      <div className="preview-text"></div>
                    </div>
                  </div>
                  <span className="layout-label">Vertical</span>
                </label>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="input-group">
              <div className="tasks-header">
                <label className="input-label">
                  <span className="label-icon">✅</span>
                  Tasks ({tasks.length})
                </label>
              </div>
              
              <div className="tasks-container">
                <div className="tasks-list">
                  {tasks.map((item, idx) => (
                    <div key={idx} className="task-card">
                      <div className="task-header">
                        <span className="task-number">#{idx + 1}</span>
                        {tasks.length > 1 && (
                          <button 
                            onClick={() => removeTask(idx)} 
                            className="remove-task-btn"
                            title="Remove task"
                          >
                            <span className="btn-icon">×</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="task-content">
                        {/* Image Type Selection */}
                        <div className="image-type-selector">
                          <label className="image-type-option">
                            <input
                              type="radio"
                              name={`imageType-${idx}`}
                              value="upload"
                              checked={item.imageType === 'upload'}
                              onChange={() => handleTaskChange(idx, 'imageType', 'upload')}
                              className="radio-input"
                            />
                            <div className="radio-custom small">
                              <div className="radio-dot"></div>
                            </div>
                            <span className="option-label">Upload Image</span>
                          </label>
                          
                          <label className="image-type-option">
                            <input
                              type="radio"
                              name={`imageType-${idx}`}
                              value="link"
                              checked={item.imageType === 'link'}
                              onChange={() => handleTaskChange(idx, 'imageType', 'link')}
                              className="radio-input"
                            />
                            <div className="radio-custom small">
                              <div className="radio-dot"></div>
                            </div>
                            <span className="option-label">Image URL</span>
                          </label>
                        </div>

                        {/* Image Input */}
                        <div className="image-input-container">
                          {item.imageType === 'upload' ? (
                            <div
                              className={`file-upload-area ${dragStates[idx] ? 'drag-over' : ''}`}
                              onDragEnter={(e) => handleDragEnter(e, idx)}
                              onDragLeave={(e) => handleDragLeave(e, idx)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, idx)}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => handleImageUpload(idx, e.target.files[0])}
                                className="file-input"
                                id={`file-${idx}`}
                              />
                              <label htmlFor={`file-${idx}`} className="file-upload-label">
                                {getImageSrc(item) ? (
                                  <div className="image-preview">
                                    <img src={getImageSrc(item)} alt="preview" />
                                  </div>
                                ) : (
                                  <div className="upload-placeholder">
                                    <span className="upload-icon">📷</span>
                                    <span className="upload-text">
                                      {dragStates[idx] ? 'Drop image here' : 'Choose Image or drag & drop'}
                                    </span>
                                  </div>
                                )}
                              </label>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={item.imageUrl}
                              onChange={e => handleTaskChange(idx, 'imageUrl', e.target.value)}
                              placeholder="Paste image URL here..."
                              className="url-input"
                            />
                          )}
                        </div>

                        {/* Task Description */}
                        <div className="task-description-container">
                          <textarea
                            value={item.task}
                            onChange={e => handleTaskChange(idx, 'task', e.target.value)}
                            placeholder="Describe this task..."
                            className="task-description"
                            rows="3"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Task Button at the end */}
                <div className="add-task-container">
                  <div className="add-task-wrapper">
                    <span className="task-counter">Tasks: {tasks.length}</span>
                    <button onClick={addTask} className="add-task-btn-end">
                      <span className="btn-icon">+</span>
                      Add Another Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="preview-section">
          <div className="preview-container">
            <div className="preview-header">
              <h3 className="preview-title">
                <span className="title-icon">👁️</span>
                Live Preview
              </h3>
            </div>
            
            <div ref={previewRef} className="preview-content">
              <div className="routine-title-display">
                <span className="title-text">
                  {title || 'Your Routine Title'}
                </span>
              </div>
              
              {layout === 'horizontal' ? (
                <div className="routine-grid horizontal">
                  {tasks.map((item, idx) => (
                    <div key={idx} className="routine-item horizontal">
                      <div className="item-image-container">
                        {getImageSrc(item) ? (
                          <img src={getImageSrc(item)} alt="task" className="item-image" />
                        ) : (
                          <div className="image-placeholder">
                            <span className="placeholder-icon">🖼️</span>
                          </div>
                        )}
                      </div>
                      <div className="item-text-container">
                        <span className="item-text">
                          {item.task || 'Task description'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="routine-grid vertical">
                  <tbody>
                    {tasks.map((item, idx) => (
                      <tr key={idx} className="routine-item vertical">
                        <td className="item-image-container">
                          {getImageSrc(item) ? (
                            <img src={getImageSrc(item)} alt="task" className="item-image" />
                          ) : (
                            <div className="image-placeholder">
                              <span className="placeholder-icon">🖼️</span>
                            </div>
                          )}
                        </td>
                        <td className="item-text-container">
                          <span className="item-text">
                            {item.task || 'Task description'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App; 