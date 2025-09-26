import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

function injectStructuredData() {
  try {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Routine Maker",
      url: "http://dipakwani.com/routine/",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
      inLanguage: "en",
      description:
        "Create routine charts with images and descriptions. Export as PDF for printing.",
      image: "http://dipakwani.com/routine/logo.svg",
      author: { "@type": "Person", name: "Dipak Wani" },
      publisher: { "@type": "Organization", name: "Dipak Wani" }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  } catch (e) {
    // ignore
  }
}

injectStructuredData();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
