import { sound } from '../main';
import { LANDING_SITES } from './places.js';

export function buildLandingUI(onEnter: () => void) {
  const container = document.createElement('div');
  container.id = 'landing-ui';
  container.style.position = 'absolute';
  container.style.inset = '0';
  container.style.zIndex = '1000';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'center';
  container.style.padding = '0 5vw';
  container.style.pointerEvents = 'none'; // Let clicks pass to the canvas unless on a button
  container.style.fontFamily = "'Rajdhani', sans-serif";
  container.style.color = '#f3e9df';
  container.style.overflow = 'hidden';
  
  // Left content box
  const content = document.createElement('div');
  content.style.width = '100%';
  content.style.maxWidth = '600px';
  content.style.pointerEvents = 'auto';
  content.style.zIndex = '1001';

  // Title
  const title = document.createElement('h1');
  title.textContent = 'RED ROAD';
  title.style.fontFamily = "'Orbitron', sans-serif";
  title.style.fontSize = '80px';
  title.style.fontWeight = '800';
  title.style.margin = '0 0 10px 0';
  title.style.letterSpacing = '0.05em';
  title.style.color = '#f3e9df';
  title.style.textShadow = '0 0 15px rgba(255, 154, 60, 0.3)';

  // Subtitle
  const subtitle = document.createElement('h2');
  subtitle.innerHTML = '<span style="color:#ffc98f; font-weight:700;">ORBITAL NAVIGATION & LOGISTICS</span> | Explore the Jezero Crater terrain with advanced route planning, critical survival algorithms, and real-time Martian environmental analysis for safe passage.';
  subtitle.style.fontSize = '18px';
  subtitle.style.fontWeight = '500';
  subtitle.style.lineHeight = '1.5';
  subtitle.style.margin = '0 0 40px 0';
  subtitle.style.color = '#c7b8aa';

  // CTA Button
  const ctaBtn = document.createElement('button');
  ctaBtn.textContent = 'ENTER JEZERO';
  ctaBtn.style.background = 'linear-gradient(90deg, #d03b3b 0%, #ff9a3c 100%)';
  ctaBtn.style.color = '#fff';
  ctaBtn.style.border = 'none';
  ctaBtn.style.padding = '18px 40px';
  ctaBtn.style.fontSize = '24px';
  ctaBtn.style.fontFamily = "'Orbitron', sans-serif";
  ctaBtn.style.fontWeight = '700';
  ctaBtn.style.letterSpacing = '0.1em';
  ctaBtn.style.borderRadius = '10px';
  ctaBtn.style.cursor = 'pointer';
  ctaBtn.style.boxShadow = '0 0 20px rgba(255, 154, 60, 0.4)';
  ctaBtn.style.transition = 'all 0.3s ease';
  ctaBtn.style.marginBottom = '40px';

  ctaBtn.onmouseover = () => {
    ctaBtn.style.transform = 'scale(1.02)';
    ctaBtn.style.boxShadow = '0 0 30px rgba(255, 154, 60, 0.6)';
  };
  ctaBtn.onmouseout = () => {
    ctaBtn.style.transform = 'scale(1)';
    ctaBtn.style.boxShadow = '0 0 20px rgba(255, 154, 60, 0.4)';
  };
  ctaBtn.onclick = () => {
    onEnter();
  };

  // Badges container
  const badgesContainer = document.createElement('div');
  badgesContainer.style.display = 'flex';
  badgesContainer.style.gap = '15px';
  badgesContainer.style.flexWrap = 'wrap';

  const badges = [
    { title: 'TARGET: JEZERO CRATER', v1: 'Lat: 18.38°N', v2: 'Long: 77.58°E' },
    { title: 'ENVIRONMENTAL DATA', v1: 'Pressure: ~6.1 mbar', v2: 'Temp: -63°C Avg' },
    { title: 'SURVIVAL READINESS', v1: 'Resources: H2O Mapping', v2: 'Life Support Tech' },
    { title: 'MISSION PLANNING', v1: 'Route Optimization', v2: 'Topography Mapping' }
  ];

  badges.forEach(b => {
    const badge = document.createElement('div');
    badge.style.background = 'rgba(14, 10, 8, 0.86)';
    badge.style.border = '1px solid rgba(255, 154, 60, 0.28)';
    badge.style.borderRadius = '8px';
    badge.style.padding = '15px';
    badge.style.width = 'calc(50% - 15px)';
    badge.style.minWidth = '180px';
    
    const bTitle = document.createElement('div');
    bTitle.textContent = b.title;
    bTitle.style.color = '#ff9a3c';
    bTitle.style.fontSize = '12px';
    bTitle.style.fontWeight = '700';
    bTitle.style.letterSpacing = '0.05em';
    bTitle.style.marginBottom = '8px';

    const bV1 = document.createElement('div');
    bV1.textContent = b.v1;
    bV1.style.fontSize = '14px';
    bV1.style.color = '#f3e9df';

    const bV2 = document.createElement('div');
    bV2.textContent = b.v2;
    bV2.style.fontSize = '14px';
    bV2.style.color = '#f3e9df';

    badge.appendChild(bTitle);
    badge.appendChild(bV1);
    badge.appendChild(bV2);
    badgesContainer.appendChild(badge);
  });

  content.appendChild(title);
  content.appendChild(subtitle);
  content.appendChild(ctaBtn);
  content.appendChild(badgesContainer);
  
  container.appendChild(content);

  // Drawer container
  const drawer = document.createElement('div');
  drawer.style.position = 'absolute';
  drawer.style.right = '0';
  drawer.style.top = '120px';
  drawer.style.bottom = '120px'; // fill vertical space but leave padding
  drawer.style.display = 'flex';
  drawer.style.alignItems = 'center'; // Center vertically
  drawer.style.transform = 'translateX(280px)'; // Hide the panel off-screen initially
  drawer.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
  drawer.style.pointerEvents = 'none';

  // Toggle tab
  const drawerTab = document.createElement('button');
  drawerTab.innerHTML = '&gt;'; // > icon
  drawerTab.style.pointerEvents = 'auto';
  drawerTab.style.backgroundColor = 'rgba(14, 10, 8, 0.86)';
  drawerTab.style.border = '1px solid rgba(255, 154, 60, 0.28)';
  drawerTab.style.borderRight = 'none'; // Attach seamlessly
  drawerTab.style.color = '#ff9a3c';
  drawerTab.style.padding = '15px 10px';
  drawerTab.style.cursor = 'pointer';
  drawerTab.style.borderTopLeftRadius = '5px';
  drawerTab.style.borderBottomLeftRadius = '5px';
  drawerTab.style.fontFamily = "'Orbitron', sans-serif";
  drawerTab.style.fontSize = '14px';
  
  let drawerOpen = false;
  drawerTab.onclick = () => {
    drawerOpen = !drawerOpen;
    drawer.style.transform = drawerOpen ? 'translateX(0)' : 'translateX(280px)';
    drawerTab.innerHTML = drawerOpen ? '&lt;' : '&gt;';
  };

  // Region Selector (Right side panel container)
  const regionSelector = document.createElement('div');
  regionSelector.style.position = 'relative';
  regionSelector.style.backgroundColor = 'rgba(28, 20, 16, 0.9)'; // Lighter brown/black to contrast with grid
  regionSelector.style.border = '1px solid rgba(255, 154, 60, 0.28)';
  regionSelector.style.borderRight = 'none'; // touch edge
  regionSelector.style.borderTopLeftRadius = '10px';
  regionSelector.style.borderBottomLeftRadius = '10px';
  regionSelector.style.width = '280px';
  regionSelector.style.height = '100%';
  regionSelector.style.pointerEvents = 'auto';
  regionSelector.style.overflow = 'hidden';
  
  // Dedicated static grid layer
  const gridLayer = document.createElement('div');
  gridLayer.style.position = 'absolute';
  gridLayer.style.inset = '0';
  gridLayer.style.zIndex = '0';
  gridLayer.style.pointerEvents = 'none';
  gridLayer.style.backgroundImage = 'linear-gradient(to right, rgba(0, 0, 0, 0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 1px, transparent 1px)';
  gridLayer.style.backgroundSize = '24px 24px';
  regionSelector.appendChild(gridLayer);

  // Content container (sits above grid)
  const drawerContent = document.createElement('div');
  drawerContent.style.position = 'relative';
  drawerContent.style.zIndex = '1';
  drawerContent.style.width = '100%';
  drawerContent.style.height = '100%';
  drawerContent.style.display = 'flex';
  drawerContent.style.flexDirection = 'column';
  
  drawer.appendChild(drawerTab);
  drawer.appendChild(regionSelector);

  const regHeader = document.createElement('div');
  regHeader.textContent = 'LANDING SITES';
  regHeader.style.padding = '15px';
  regHeader.style.borderBottom = '1px solid rgba(255, 154, 60, 0.14)';
  regHeader.style.color = '#ff9a3c';
  regHeader.style.fontSize = '12px';
  regHeader.style.fontWeight = '700';
  regHeader.style.letterSpacing = '0.15em';
  // Header and list are now appended to drawerContent at the end

  const regList = document.createElement('div');
  regList.style.display = 'flex';
  regList.style.flexDirection = 'column';
  regList.style.flex = '1';
  regList.style.overflowY = 'auto';
  regList.style.minHeight = '0'; // important for flex scroll

  // Map regions using LANDING_SITES
  LANDING_SITES.forEach(r => {
    const isJezero = r.id === 'jezero';
    const statusText = isJezero ? 'OPEN' : 'LOCKED - MVP REGION';
    const statusColor = isJezero ? '#0ca30c' : '#8c7f74';
    
    const row = document.createElement('div');
    row.style.padding = '12px 15px';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.borderBottom = '1px solid transparent';
    
    if (isJezero) {
      row.style.cursor = 'pointer';
      row.onmouseover = () => { row.style.background = 'rgba(255, 154, 60, 0.14)'; };
      row.onmouseout = () => { row.style.background = 'transparent'; };
      row.onclick = () => onEnter();
    } else {
      row.style.cursor = 'not-allowed';
      row.style.opacity = '0.6';
    }

    const info = document.createElement('div');
    const rName = document.createElement('div');
    rName.textContent = r.name;
    rName.style.fontSize = '15px';
    rName.style.fontWeight = '600';
    
    const rDesc = document.createElement('div');
    rDesc.textContent = r.mission;
    rDesc.style.fontSize = '12px';
    rDesc.style.color = '#8c7f74';

    info.appendChild(rName);
    info.appendChild(rDesc);

    const stat = document.createElement('div');
    stat.textContent = statusText;
    stat.style.color = statusColor;
    stat.style.fontSize = '11px';
    stat.style.fontFamily = "'JetBrains Mono', monospace";
    
    row.appendChild(info);
    row.appendChild(stat);
    regList.appendChild(row);
  });

  drawerContent.appendChild(regHeader);
  drawerContent.appendChild(regList);
  regionSelector.appendChild(drawerContent);
  container.appendChild(drawer);

  // Audio Toggle
  const audioBtn = document.createElement('button');
  audioBtn.textContent = '♪ SOUND';
  audioBtn.style.position = 'absolute';
  audioBtn.style.right = '40px';
  audioBtn.style.top = '40px';
  audioBtn.style.background = 'rgba(14, 10, 8, 0.86)';
  audioBtn.style.border = '1px solid rgba(255, 154, 60, 0.28)';
  audioBtn.style.color = '#ff9a3c';
  audioBtn.style.padding = '8px 15px';
  audioBtn.style.fontSize = '12px';
  audioBtn.style.fontWeight = '700';
  audioBtn.style.letterSpacing = '0.1em';
  audioBtn.style.borderRadius = '5px';
  audioBtn.style.cursor = 'pointer';
  audioBtn.style.pointerEvents = 'auto';
  
  audioBtn.onclick = () => {
    const isCurrentlyOn = audioBtn.style.color === 'rgb(255, 154, 60)';
    const nextState = !isCurrentlyOn;
    
    // Actually toggle the audio graph and tracks
    sound.toggle(nextState);

    if (!nextState) {
        audioBtn.style.color = '#8c7f74';
        audioBtn.style.borderColor = 'transparent';
    } else {
        audioBtn.style.color = '#ff9a3c';
        audioBtn.style.borderColor = 'rgba(255, 154, 60, 0.28)';
    }
  };

  container.appendChild(audioBtn);

  return container;
}
