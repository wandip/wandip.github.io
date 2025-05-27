const themes = [
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #1a472a 33%, #2d5a3f 66%, #3d6b4f 100%)',
    link: '#3d6b4f'
  },
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #1a2b3d 33%, #2c4a6b 66%, #3d6b8f 100%)',
    link: '#3d6b8f'
  },
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #3d1a1a 33%, #5a2a2a 66%, #6a3a3a 100%)',
    link: '#6a3a3a'
  },
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #3d3d1a 33%, #5a5a2a 66%, #6a6a3a 100%)',
    link: '#6a6a3a'
  },
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #1a3d3d 33%, #2a5a5a 66%, #3a6a6a 100%)',
    link: '#3a6a6a'
  },
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #2a1a3d 33%, #3d2a5a 66%, #4d3a6a 100%)',
    link: '#4d3a6a'
  },
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #3d1a3d 33%, #5a2a5a 66%, #6a3a6a 100%)',
    link: '#6a3a6a'
  },
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #1a1a3d 33%, #2a2a5a 66%, #3a3a6a 100%)',
    link: '#3a3a6a'
  },
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #2a3d1a 33%, #3d5a2a 66%, #4d6a3a 100%)',
    link: '#4d6a3a'
  },
  {
    sidebar: 'linear-gradient(135deg, #202020 0%, #3d2a1a 33%, #5a3d2a 66%, #6a4d3a 100%)',
    link: '#6a4d3a'
  }
];

function applyTheme(theme) {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.style.background = theme.sidebar;
  }
  
  const links = document.querySelectorAll('.content a, .related-posts li a:hover');
  links.forEach(link => {
    link.style.color = theme.link;
  });

  // Apply gradient to newsletter button
  const subscribeButton = document.querySelector('.newsletter-form button');
  if (subscribeButton) {
    subscribeButton.style.background = theme.sidebar;
    subscribeButton.style.border = 'none';
    subscribeButton.style.color = '#fff';
    subscribeButton.style.textShadow = '0 1px 0 rgba(0,0,0,0.2)';
  }
}

function applyRandomTheme() {
  const theme = themes[Math.floor(Math.random() * themes.length)];
  applyTheme(theme);
  sessionStorage.removeItem('currentTheme');
}

// Apply theme immediately
applyRandomTheme();

// Also apply on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  applyRandomTheme();
}); 