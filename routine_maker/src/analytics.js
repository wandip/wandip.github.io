// Google Analytics configuration
export const GA_TRACKING_ID = 'UA-127095421-1';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const logPageView = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const logEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track routine creation events
export const logRoutineCreation = (taskCount, layout) => {
  logEvent('routine_created', 'routine_maker', `tasks_${taskCount}_layout_${layout}`, taskCount);
};

// Track PDF export events
export const logPDFExport = (taskCount, layout) => {
  logEvent('pdf_exported', 'routine_maker', `tasks_${taskCount}_layout_${layout}`, taskCount);
};

// Track task addition events
export const logTaskAdded = (totalTasks) => {
  logEvent('task_added', 'routine_maker', `total_tasks_${totalTasks}`, totalTasks);
};

// Track task removal events
export const logTaskRemoved = (remainingTasks) => {
  logEvent('task_removed', 'routine_maker', `remaining_tasks_${remainingTasks}`, remainingTasks);
};

// Track layout change events
export const logLayoutChange = (newLayout) => {
  logEvent('layout_changed', 'routine_maker', `layout_${newLayout}`, 1);
}; 