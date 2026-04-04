/* ========================================
   InSurePay – AI Income Shield
   Application Logic
   ======================================== */

// ── State ──
const IS_GITHUB_PAGES = window.location.hostname.endsWith('github.io');
const API_BASE = IS_GITHUB_PAGES ? '' : 'http://localhost:5000';
let currentUser = null;
let currentPage = 'register';
let autoClaimInFlight = false;
let lastAutoClaimKey = null;
const CLAIMS_STORAGE_KEY = 'insurepay_total_claims';
const LAST_CLAIM_STORAGE_KEY = 'insurepay_last_claim';

// ── Initialization ──
document.addEventListener('DOMContentLoaded', () => {
  updateAnalytics();
  hydrateClaimHistory();
  applyHostedDemoMode();

  // Check for existing registration
  const saved = localStorage.getItem('insurepay_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    showLoggedInState();
    navigateTo('dashboard');
  }

  // Register form submission
  document.getElementById('registerForm').addEventListener('submit', handleRegister);

  // Nav link click handlers
  document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      if (page) navigateTo(page);
    });
  });

  // Handle hash-based navigation (back/forward & direct URL)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`page-${hash}`)) {
      navigateTo(hash);
    }
  });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
  });
});

function applyHostedDemoMode() {
  if (!IS_GITHUB_PAGES) return;

  const dashSubtext = document.getElementById('dashSubtext');
  if (dashSubtext) {
    dashSubtext.textContent = 'Running in interactive demo mode on GitHub Pages.';
  }

  const badgeText = document.getElementById('welcomeBadgeText');
  if (badgeText) {
    badgeText.textContent = 'Demo Mode Active';
  }

  showToast('GitHub Pages demo mode active. Backend calls are simulated.', 'info');
}

// ── Navigation ──
function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  // Show target page
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('active');
    // Re-trigger animation
    target.style.animation = 'none';
    target.offsetHeight; // force reflow
    target.style.animation = '';
  }

  // Update nav active state
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navLink = document.getElementById(`nav-${page}`);
  if (navLink) navLink.classList.add('active');

  currentPage = page;

  // Auto-fetch weather when navigating to risk page
  if (page === 'risk') {
    fetchWeather();
  }

  // Populate profile if navigating to profile
  if (page === 'profile') {
    populateProfile();
  }
}

// ── Registration ──
async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const location = document.getElementById('regLocation').value.trim();
  const platform = document.getElementById('regPlatform').value;

  if (!name || !location || !platform) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  const btn = document.getElementById('registerBtn');
  btn.classList.add('btn-loading');
  btn.innerHTML = '<div class="btn-spinner"></div> Registering...';

  if (IS_GITHUB_PAGES) {
    currentUser = { name, location, platform, premium: 29, coverage: 5000 };
    localStorage.setItem('insurepay_user', JSON.stringify(currentUser));
    updateUserPremium(currentUser.premium);
    showToast('Registered successfully! GitHub Pages demo mode enabled.', 'success');
    showLoggedInState();
    navigateTo('dashboard');
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-arrow-right"></i> Register & Get Coverage';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location, platform })
    });

    if (!response.ok) throw new Error('Registration failed');

    const data = await response.json();
    currentUser = { name, location, platform, ...data };
    localStorage.setItem('insurepay_user', JSON.stringify(currentUser));
    updateUserPremium(data.premium);
    showToast('Registration successful! Welcome to InSurePay 🎉', 'success');
    showLoggedInState();
    navigateTo('dashboard');
  } catch (err) {
    // Fallback: register locally if API is unavailable
    currentUser = { name, location, platform };
    localStorage.setItem('insurepay_user', JSON.stringify(currentUser));
    showToast('Registered successfully! (Offline mode)', 'success');
    showLoggedInState();
    navigateTo('dashboard');
  } finally {
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-arrow-right"></i> Register & Get Coverage';
  }
}

function showLoggedInState() {
  if (!currentUser) return;

  // Show nav links and user avatar
  document.getElementById('navLinks').style.display = 'flex';
  document.getElementById('navUser').style.display = 'flex';

  // Set avatar initials
  const initials = currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('userAvatar').textContent = initials;

  // Update welcome message
  const firstName = currentUser.name.split(' ')[0];
  document.getElementById('dashWelcome').textContent = `Welcome back, ${firstName}! 👋`;
}

function populateProfile() {
  if (!currentUser) return;

  const initials = currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  
  document.getElementById('profileAvatarLG').textContent = initials;
  document.getElementById('profileName').textContent = currentUser.name;
  
  const platformBadge = document.getElementById('profilePlatform');
  platformBadge.innerHTML = `<i class="fas fa-building"></i> ${currentUser.platform}`;
  
  document.getElementById('profileLocation').textContent = currentUser.location;
  
  // Format joining date if available
  const dateStr = currentUser.registered_at ? new Date(currentUser.registered_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Today';
  document.getElementById('profileJoined').textContent = dateStr;
  
  document.getElementById('profileId').textContent = currentUser.user_id ? `ISP-${currentUser.user_id.toString().padStart(5, '0')}` : 'ISP-00001';
  document.getElementById('profilePremium').textContent = currentUser.premium || '20';
  document.getElementById('profileCoverage').textContent = currentUser.coverage ? currentUser.coverage.toLocaleString() : '5,000';
}

function updateUserPremium(premium) {
  if (!currentUser || premium == null) return;

  currentUser.premium = premium;
  localStorage.setItem('insurepay_user', JSON.stringify(currentUser));

  const premiumEl = document.getElementById('profilePremium');
  if (premiumEl) {
    premiumEl.textContent = premium;
  }

  const statPremium = document.getElementById('statPremium');
  if (statPremium) {
    statPremium.textContent = `₹${premium}`;
  }
}

function updateAnalytics(claimIncrement = 0) {
  let totalClaims = Number(localStorage.getItem(CLAIMS_STORAGE_KEY));

  if (!Number.isFinite(totalClaims) || totalClaims < 0) {
    totalClaims = Math.floor(Math.random() * 6) + 3;
  }

  totalClaims += claimIncrement;
  localStorage.setItem(CLAIMS_STORAGE_KEY, String(totalClaims));

  const claimsEl = document.getElementById('statClaims');
  if (claimsEl) {
    claimsEl.textContent = totalClaims;
  }

  const earningsEl = document.getElementById('statEarnings');
  if (earningsEl) {
    earningsEl.textContent = `₹${(totalClaims * 500).toLocaleString('en-IN')}`;
  }
}

// ── Check Risk (Dashboard) ──
function hydrateClaimHistory() {
  const savedClaim = localStorage.getItem(LAST_CLAIM_STORAGE_KEY);
  if (!savedClaim) return;

  try {
    const { amount, trigger } = JSON.parse(savedClaim);
    updateClaimHistory(amount, trigger, false);
  } catch (err) {
    localStorage.removeItem(LAST_CLAIM_STORAGE_KEY);
  }
}

function formatClaimTrigger(trigger) {
  if (!trigger) return 'Rain';
  if (trigger.includes('Rain')) return 'Rain';
  if (trigger.includes('Heat')) return 'Heat';
  if (trigger.includes('AQI') || trigger.includes('Air')) return 'AQI';

  return trigger.replace(' Detected', '').trim();
}

function updateClaimHistory(amount, trigger, persist = true) {
  const lastClaimEl = document.getElementById('lastClaim');
  const formattedTrigger = formatClaimTrigger(trigger);

  if (lastClaimEl) {
    lastClaimEl.textContent = `₹${amount} - ${formattedTrigger}`;
  }

  if (persist) {
    localStorage.setItem(LAST_CLAIM_STORAGE_KEY, JSON.stringify({ amount, trigger }));
  }
}

async function checkRisk() {
  const btn = document.getElementById('checkRiskBtn');
  btn.classList.add('btn-loading');
  btn.innerHTML = '<div class="btn-spinner"></div> Checking...';

  if (IS_GITHUB_PAGES) {
    const levels = ['Low', 'Medium', 'High'];
    const randomRisk = levels[Math.floor(Math.random() * levels.length)];
    updateRiskBadge(randomRisk);
    updateTrustScore(Math.floor(Math.random() * 40 + 60), randomRisk);
    simulateFraudBanner();
    showToast(`Risk level: ${randomRisk} (demo mode)`, 'info');
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-radar"></i> Check Risk';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/risk`);
    if (!response.ok) throw new Error('Failed to fetch risk');

    const data = await response.json();
    updateRiskBadge(data.risk_level || data.risk || 'Low');
    updateUserPremium(data.premium);
    showToast(`Risk level updated: ${data.risk_level || data.risk || 'Low'}`, 'success');
    
    if (data.trust_score) {
      updateTrustScore(data.trust_score, data.fraud_risk_level);
    }
    simulateFraudBanner();
  } catch (err) {
    // Fallback: simulate risk data
    const levels = ['Low', 'Medium', 'High'];
    const randomRisk = levels[Math.floor(Math.random() * levels.length)];
    updateRiskBadge(randomRisk);
    updateTrustScore(Math.floor(Math.random() * 40 + 60), randomRisk);
    simulateFraudBanner();
    showToast(`Risk level: ${randomRisk} (simulated)`, 'warning');
  } finally {
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-radar"></i> Check Risk';
  }
}

function simulateFraudBanner() {
  const banner = document.getElementById('fraudAlertBanner');
  if (!banner) return;
  
  const title = document.getElementById('fraudAlertTitle');
  const desc = document.getElementById('fraudAlertDesc');
  
  // Randomly show for demo purposes
  if (Math.random() > 0.4) {
    banner.classList.remove('hidden');
    if (Math.random() > 0.5) {
      banner.className = 'fraud-alert-banner danger';
      title.innerHTML = 'Cluster Risk Detected';
      desc.textContent = 'Unusually high volume of claims from your current location zone. Reviews enhanced.';
    } else {
      banner.className = 'fraud-alert-banner'; // Default orange
      title.innerHTML = 'Suspicious Activity Detected';
      desc.textContent = 'Multiple rapid claims observed. Additional verification mechanisms active.';
    }
  } else {
    banner.classList.add('hidden');
  }
}

function updateTrustScore(score, riskLevel) {
  const statTrust = document.getElementById('statTrust');
  if (statTrust) statTrust.textContent = score + '/100';
  
  const levelEl = document.getElementById('trustRiskLevel');
  const iconCard = document.getElementById('trustIcon');
  if (!levelEl || !iconCard) return;

  levelEl.className = 'stat-change'; // Reset classes
  iconCard.className = 'stat-icon';
  
  if (riskLevel === 'Low') {
    levelEl.innerHTML = `<i class="fas fa-check-circle"></i> Low Risk`;
    levelEl.classList.add('up');
    iconCard.classList.add('green');
  } else if (riskLevel === 'Medium') {
    levelEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Med Risk`;
    levelEl.style.color = '#f57f17';
    levelEl.style.background = '#fff8e1';
    iconCard.classList.add('yellow');
  } else {
    levelEl.innerHTML = `<i class="fas fa-times-circle"></i> High Risk`;
    levelEl.classList.add('down');
    iconCard.classList.add('red');
  }
}

function updateRiskBadge(level) {
  const badge = document.getElementById('riskBadge');
  const normalizedLevel = level.toLowerCase();

  badge.className = `risk-badge ${normalizedLevel}`;
  badge.textContent = level;

  // Update icon card color
  const iconCard = badge.closest('.stat-card')?.querySelector('.stat-icon');
  if (iconCard) {
    iconCard.className = 'stat-icon';
    if (normalizedLevel === 'low') iconCard.classList.add('green');
    else if (normalizedLevel === 'medium') iconCard.classList.add('yellow');
    else iconCard.classList.add('red');
  }
}

function getTriggerDisplay(triggerType) {
  const triggerMap = {
    Rain: 'Rain Disruption Detected',
    Heat: 'Extreme Heat Alert',
    AQI: 'Hazardous Air Quality'
  };

  if (!triggerType) {
    return 'Current conditions are favorable for deliveries';
  }

  return triggerType
    .split(' / ')
    .map(type => triggerMap[type] || `${type} Disruption Detected`)
    .join(' and ');
}

// ── Weather / Risk Monitor ──
async function fetchWeather() {
  const btn = document.getElementById('refreshWeatherBtn');
  const button = null;
  if (btn) {
    btn.classList.add('btn-loading');
    btn.innerHTML = '<div class="btn-spinner"></div> Loading...';
  }

  if (IS_GITHUB_PAGES) {
    const simulated = {
      rain: Math.floor(Math.random() * 100),
      temperature: Math.floor(25 + Math.random() * 20),
      aqi: Math.floor(50 + Math.random() * 300),
      trigger_status: false,
      trigger_type: null
    };
    simulated.message = '\u20B9500 credited successfully';
    updateWeatherUI(simulated);
    if (btn) {
      btn.classList.remove('btn-loading');
      btn.innerHTML = '<i class="fas fa-rotate"></i> Refresh Data';
    }
    showToast('Weather data simulated for GitHub Pages demo.', 'info');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/weather`);
    if (!response.ok) throw new Error('Failed to fetch weather');

    const data = await response.json();
    updateWeatherUI(data);
    updateUserPremium(data.premium);

    if (data.trigger_status) {
      await simulateClaim(data.trigger_type, true, data.timestamp);
    } else {
      lastAutoClaimKey = null;
    }
  } catch (err) {
    // Fallback: use simulated data
    const simulated = {
      rain: Math.floor(Math.random() * 100),
      temperature: Math.floor(25 + Math.random() * 20),
      aqi: Math.floor(50 + Math.random() * 300),
      trigger_status: false,
      trigger_type: null
    };
    simulated.message = '₹500 credited successfully';
    updateWeatherUI(simulated);
  } finally {
    if (btn) {
      btn.classList.remove('btn-loading');
      btn.innerHTML = '<i class="fas fa-rotate"></i> Refresh Data';
    }
    if (button) {
      button.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i> Simulate Heavy Rain 🌧️';
    }
  }
}

function updateWeatherUI(data) {
  // Rain
  const rain = data.rain ?? data.rain_probability ?? 0;
  document.getElementById('rainValue').innerHTML = `${rain}<span>%</span>`;
  const rainBar = document.getElementById('rainBar');
  rainBar.style.width = `${rain}%`;
  rainBar.className = `progress-bar ${getBarLevel(rain, [40, 70])}`;
  const rainStatus = document.getElementById('rainStatus');
  rainStatus.textContent = rain > 70 ? 'Heavy Rain Expected' : rain > 40 ? 'Light Rain Possible' : 'Clear Skies';
  rainStatus.className = `risk-status-label ${getStatusClass(rain, [40, 70])}`;

  // Temperature
  const temp = data.temperature ?? data.temp ?? 0;
  document.getElementById('tempValue').innerHTML = `${temp}<span>°C</span>`;
  const tempPercent = Math.min(((temp - 15) / 35) * 100, 100);
  const tempBar = document.getElementById('tempBar');
  tempBar.style.width = `${Math.max(tempPercent, 5)}%`;
  tempBar.className = `progress-bar ${getBarLevel(temp, [35, 42], true)}`;
  const tempStatus = document.getElementById('tempStatus');
  tempStatus.textContent = temp > 42 ? 'Extreme Heat' : temp > 35 ? 'Hot Conditions' : 'Comfortable';
  tempStatus.className = `risk-status-label ${getStatusClass(temp, [35, 42], true)}`;

  // AQI
  const aqi = data.aqi ?? data.air_quality ?? 0;
  document.getElementById('aqiValue').innerHTML = `${aqi}<span> AQI</span>`;
  const aqiPercent = Math.min((aqi / 500) * 100, 100);
  const aqiBar = document.getElementById('aqiBar');
  aqiBar.style.width = `${Math.max(aqiPercent, 5)}%`;
  aqiBar.className = `progress-bar ${getBarLevel(aqi, [100, 200], true)}`;
  const aqiStatus = document.getElementById('aqiStatus');
  aqiStatus.textContent = aqi > 200 ? 'Hazardous Air' : aqi > 100 ? 'Moderate' : 'Good Quality';
  aqiStatus.className = `risk-status-label ${getStatusClass(aqi, [100, 200], true)}`;

  // Update banner
  const isHighRisk = Boolean(data.trigger_status ?? (rain > 70 || temp > 42 || aqi > 200));
  const triggerMessage = getTriggerDisplay(data.trigger_type);
  const banner = document.getElementById('riskBanner');
  banner.className = `risk-status-banner ${isHighRisk ? 'danger' : 'safe'}`;
  document.getElementById('riskBannerTitle').textContent = isHighRisk ? 'High Risk Today ⚠️' : 'Safe to Work ✅';
  document.getElementById('riskBannerDesc').textContent = isHighRisk
    ? 'Conditions may disrupt deliveries. Coverage is active.'
    : 'Current conditions are favorable for deliveries';

  document.getElementById('riskBannerTitle').textContent = isHighRisk ? triggerMessage : 'Safe to Work';
  document.getElementById('riskBannerDesc').textContent = isHighRisk
    ? `${triggerMessage}. Coverage is active and auto-claim monitoring is enabled.`
    : 'Current conditions are favorable for deliveries';

  // Re-trigger card animations
  document.querySelectorAll('.risk-card').forEach((card, i) => {
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = `fadeInCard 0.5s ease ${(i + 1) * 0.1}s forwards`;
  });
}

function getBarLevel(value, thresholds, isAbsolute = false) {
  if (isAbsolute) {
    return value > thresholds[1] ? 'high' : value > thresholds[0] ? 'medium' : 'low';
  }
  return value > thresholds[1] ? 'high' : value > thresholds[0] ? 'medium' : 'low';
}

function getStatusClass(value, thresholds, isAbsolute = false) {
  if (isAbsolute) {
    return value > thresholds[1] ? 'danger' : value > thresholds[0] ? 'warning' : 'safe';
  }
  return value > thresholds[1] ? 'danger' : value > thresholds[0] ? 'warning' : 'safe';
}

// ── Simulate Claim ──
async function simulateClaim() {
  const btn = document.getElementById('simulateRainBtn');
  btn.classList.add('btn-loading');
  btn.innerHTML = '<div class="btn-spinner"></div> Processing Claim...';

  // Hide any existing result
  document.getElementById('claimResult').classList.remove('show');

  if (IS_GITHUB_PAGES) {
    const simulated = {
      status: 'Approved',
      amount: 500,
      message: '\u20B9500 credited successfully',
      fraud_risk: 'Low'
    };
    await simulateVerificationSteps('Low');
    showClaimResult(simulated);
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i> Simulate Heavy Rain';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/claim`);
    if (!response.ok) throw new Error('Claim failed');

    const data = await response.json();
    
    // Show verification steps delay
    await simulateVerificationSteps(data.fraud_risk || 'Low');
    
    showClaimResult(data);
  } catch (err) {
    // Fallback: simulate claim response
    const simulated = {
      status: 'Approved',
      amount: 500,
      message: '₹500 credited successfully',
      fraud_risk: 'Low'
    };
    simulated.message = '₹500 credited successfully';
    await simulateVerificationSteps('Low');
    showClaimResult(simulated);
  } finally {
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i> Simulate Heavy Rain 🌧️';
  }
}

async function processClaim(triggerType, options = {}) {
  const { button = null, isAutomatic = false } = options;

  if (button) {
    button.classList.add('btn-loading');
    button.innerHTML = '<div class="btn-spinner"></div> Processing Claim...';
  }

  document.getElementById('claimResult').classList.remove('show');

  if (IS_GITHUB_PAGES) {
    const simulated = {
      status: 'Approved',
      amount: 500,
      message: '\u20B9500 credited successfully',
      fraud_risk: 'Low',
      trigger: triggerType
    };
    await simulateVerificationSteps('Low');
    showClaimResult(simulated);

    if (isAutomatic) {
      showToast(`Auto-claim simulated for ${triggerType}`, 'info');
    }

    if (button) {
      button.classList.remove('btn-loading');
      button.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i> Simulate Heavy Rain';
    }
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/claim?trigger_type=${encodeURIComponent(triggerType)}`);
    if (!response.ok) throw new Error('Claim failed');

    const data = await response.json();
    await simulateVerificationSteps(data.fraud_risk || 'Low');
    showClaimResult(data);

    if (isAutomatic) {
      showToast(`Auto claim triggered due to ${triggerType} ⚡`, 'info');
    }
  } catch (err) {
    const simulated = {
      status: 'Approved',
      amount: 500,
      message: 'â‚¹500 credited successfully',
      fraud_risk: 'Low',
      trigger: triggerType
    };
    await simulateVerificationSteps('Low');
    showClaimResult(simulated);

    if (isAutomatic) {
      showToast(`Auto-claim simulated for ${triggerType}`, 'warning');
    }
  } finally {
    if (button) {
      button.classList.remove('btn-loading');
      button.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i> Simulate Heavy Rain 🌧️';
      button.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i> Simulate Heavy Rain 🌧️';
      button.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i> Simulate Heavy Rain ðŸŒ§ï¸';
    }
  }
}

async function simulateClaim(triggerType = 'Heavy Rain Detected', isAutomatic = false, triggerTimestamp = null) {
  const triggerKey = `${triggerTimestamp || Date.now()}-${triggerType}`;
  if (isAutomatic) {
    if (autoClaimInFlight || lastAutoClaimKey === triggerKey) {
      return;
    }
    autoClaimInFlight = true;
    lastAutoClaimKey = triggerKey;
  }

  const btn = isAutomatic ? null : document.getElementById('simulateRainBtn');

  try {
    await processClaim(triggerType, { button: btn, isAutomatic });
    if (btn) {
      btn.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i> Simulate Heavy Rain 🌧️';
    }
  } finally {
    if (isAutomatic) {
      autoClaimInFlight = false;
    }
  }
}

/* Legacy manual claim flow kept above for compatibility during migration. */

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateVerificationSteps(fraudRisk) {
  const verifStep = document.getElementById('claimVerification');
  verifStep.classList.remove('hidden');
  
  // Reset checklist UI
  const items = ['checkLocation', 'checkActivity', 'checkDevice'];
  items.forEach(id => {
    const el = document.getElementById(id);
    const textSpan = el.querySelector('.check-text');
    const text = textSpan ? textSpan.textContent : el.textContent.trim();
    el.className = 'checklist-item pending';
    el.innerHTML = `<span class="check-icon"><i class="fas fa-spinner fa-spin"></i></span> <span class="check-text">${text}</span>`;
  });
  
  const headerTitle = document.getElementById('verifHeaderTitle');
  headerTitle.textContent = 'Verifying Claim...';
  headerTitle.style.color = '';
  
  // Define if checks fail based on fraud_risk
  const checks = [
    { id: 'checkLocation', fail: false }, // usually passes
    { id: 'checkActivity', fail: fraudRisk === 'High' }, // fails if high risk
    { id: 'checkDevice', fail: fraudRisk === 'Medium' || fraudRisk === 'High' } // fails if Med/High
  ];
  
  for (const check of checks) {
    await delay(700); // Wait 700ms between checks
    const el = document.getElementById(check.id);
    const textSpan = el.querySelector('.check-text');
    const text = textSpan ? textSpan.textContent : el.textContent.trim();
    
    if (check.fail) {
      el.className = 'checklist-item error';
      el.innerHTML = `<span class="check-icon"><i class="fas fa-times-circle"></i></span> <span class="check-text">${text} - Failed</span>`;
      headerTitle.textContent = 'Verification Flagged';
      headerTitle.style.color = 'var(--danger)';
    } else {
      el.className = 'checklist-item success';
      el.innerHTML = `<span class="check-icon"><i class="fas fa-check-circle"></i></span> <span class="check-text">${text}</span>`;
    }
  }
  
  await delay(1000); // small pause before result
  verifStep.classList.add('hidden');
}

function showClaimResult(data) {
  const trigger = data.trigger || 'Heavy Rain Detected';
  const amount = data.amount || data.claim_amount || 500;
  const status = data.status || data.claim_status || 'Approved';
  const message = data.message || `₹${amount} credited successfully`;

  updateAnalytics(1);

  document.getElementById('claimAmount').textContent = `₹${amount}`;
  
  document.getElementById('claimAmount').textContent = `₹${amount}`;

  const statusEl = document.getElementById('claimStatus');
  statusEl.textContent = status;
  statusEl.className = 'detail-value'; // Reset
  
  if (status === 'Approved') {
    statusEl.classList.add('status-approved');
  } else if (status === 'Verification Required') {
    statusEl.style.color = '#f57f17';
    statusEl.style.background = '#fff8e1';
    statusEl.style.padding = '0.2rem 0.75rem';
    statusEl.style.borderRadius = '999px';
  } else {
    statusEl.style.color = 'var(--danger)';
    statusEl.style.background = '#ffeef0';
    statusEl.style.padding = '0.2rem 0.75rem';
    statusEl.style.borderRadius = '999px';
  }

  document.getElementById('claimAmountDetail').textContent = `₹${amount}`;
  
  document.getElementById('claimAmountDetail').textContent = `₹${amount}`;

  const triggerEl = document.getElementById('claimTriggerType');
  if (triggerEl) {
    triggerEl.textContent = trigger;
  }

  const messageEl = document.getElementById('claimMessage');
  if (status === 'Approved') {
    updateClaimHistory(amount, trigger);
    messageEl.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    messageEl.style.background = 'var(--green-50)';
    messageEl.style.color = 'var(--green-700)';
    showToast('Claim approved! Amount credited to your wallet 🎉', 'success');
    fireConfetti();
  } else if (status === 'Verification Required') {
    messageEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    messageEl.style.background = '#fff8e1';
    messageEl.style.color = '#f57f17';
    showToast('Additional verification required.', 'warning');
  } else {
    messageEl.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
    messageEl.style.background = '#ffeef0';
    messageEl.style.color = 'var(--danger)';
    showToast('Claim flagged for review.', 'error');
  }

  // Show current time
  const now = new Date();
  document.getElementById('claimTime').textContent = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Show result card with animation
  const result = document.getElementById('claimResult');
  result.classList.add('show');
  result.style.animation = 'none';
  result.offsetHeight;
  result.style.animation = 'claimPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
}

// ── Demo Simulation (Dashboard) ──
async function simulateGenuineClaim() {
  const btn = document.getElementById('genuineClaimBtn');
  if(btn) {
    btn.classList.add('btn-loading');
    btn.innerHTML = '<div class="btn-spinner"></div> Processing...';
  }

  // Set Trust Score High
  updateTrustScore(98, 'Low');
  
  // Hide warning banner
  const banner = document.getElementById('fraudAlertBanner');
  if (banner) banner.classList.add('hidden');
  
  showToast('Processing Genuine Claim...', 'info');
  await delay(800);
  
  showDemoResult({ amount: 500, status: 'Approved', message: 'Income protected immediately', isFraud: false });
  
  if(btn) {
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-check-double"></i> Simulate Genuine Claim';
  }
}

async function simulateFraudAttack() {
  const btn = document.getElementById('fraudAttackBtn');
  if(btn) {
    btn.classList.add('btn-loading');
    btn.innerHTML = '<div class="btn-spinner"></div> Attacking...';
  }

  // Set Trust Score extremely low
  updateTrustScore(12, 'High');

  // Trigger Fraud Banner
  const banner = document.getElementById('fraudAlertBanner');
  const title = document.getElementById('fraudAlertTitle');
  const desc = document.getElementById('fraudAlertDesc');
  
  if (banner) {
    banner.classList.remove('hidden');
    banner.className = 'fraud-alert-banner danger';
    title.innerHTML = 'Fraud Ring Detected 🚨';
    desc.innerHTML = 'Multiple synchronized claims detected from high-risk IP addresses. Automatic payout freeze initiated.';
  }

  // Show multiple fake claims triggered toast
  showToast('Alert: 45 concurrent claims from unverified devices blocked!', 'error');

  // Simulate Blocked Payout
  await delay(1000);
  showDemoResult({ amount: '0', status: 'Blocked', message: 'High-risk user. System auto-rejected claim.', isFraud: true });

  if(btn) {
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-biohazard"></i> Simulate Fraud Attack';
  }
}

function showDemoResult(data) {
  const amount = data.amount || 500;
  
  document.getElementById('demoClaimAmount').textContent = data.isFraud ? `Payout Blocked` : `₹${amount}`;

  // Show result card with pop animation
  const result = document.getElementById('demoClaimResult');
  result.classList.remove('hidden');
  result.classList.add('show');
  
  // Force reflow
  result.style.animation = 'none';
  result.offsetHeight;
  result.style.animation = 'claimPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';

  const topBar = result.querySelector('.claim-card-top');
  const icon = result.querySelector('.claim-success-icon');
  const msgLabel = document.getElementById('demoClaimMessage');
  msgLabel.style.marginTop = '0';
  
  if (data.isFraud) {
    topBar.style.transition = 'none';
    topBar.style.background = 'linear-gradient(135deg, #b71c1c, #d50000)';
    icon.textContent = '❌';
    icon.style.animation = 'none';
    
    msgLabel.innerHTML = `<i class="fas fa-shield-virus"></i> ${data.message}`;
    msgLabel.style.color = '#d50000';
  } else {
    // Initial state (Disruption detected - Red)
    topBar.style.transition = 'none';
    topBar.style.background = 'linear-gradient(135deg, #ff1744, #d50000)';
    icon.textContent = '⚡';
    
    showToast('Disruption detected. Processing protection...', 'warning');

    // Transition to Success (Payout incoming - Green)
    setTimeout(() => {
      topBar.style.transition = 'background 0.5s ease';
      topBar.style.background = 'var(--gradient-green)';
      icon.textContent = '🚀';
      icon.style.animation = 'none';
      icon.offsetHeight; // reflow
      icon.style.animation = 'successBounce 0.8s ease';
      
      msgLabel.innerHTML = `<i class="fas fa-shield-check"></i> ${data.message}`;
      msgLabel.style.color = 'inherit';
      showToast('Disruption detected – Income protected ✅', 'success');
      fireConfetti();
    }, 1500);
  }
}

// ── Confetti Effect ──
function fireConfetti() {
  const wrapper = document.getElementById('confettiWrapper');
  wrapper.innerHTML = '';

  const colors = ['#1a73e8', '#00c853', '#ffab00', '#ff1744', '#7c4dff', '#00bcd4'];

  for (let i = 0; i < 60; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.8}s`;
    confetti.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    confetti.style.width = `${6 + Math.random() * 8}px`;
    confetti.style.height = `${6 + Math.random() * 8}px`;
    if (Math.random() > 0.5) confetti.style.borderRadius = '50%';
    wrapper.appendChild(confetti);
  }

  setTimeout(() => { wrapper.innerHTML = ''; }, 3000);
}

// ── Toast Notifications ──
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-times-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };

  toast.innerHTML = `
    <i class="${icons[type] || icons.info}" style="font-size: 1.1rem; color: var(--${type === 'success' ? 'green-500' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'blue-500'})"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s ease forwards';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ── Logout ──
function logout() {
  localStorage.removeItem('insurepay_user');
  currentUser = null;
  
  // Hide nav links and user avatar
  const navLinks = document.getElementById('navLinks');
  const navUser = document.getElementById('navUser');
  if (navLinks) navLinks.style.display = 'none';
  if (navUser) navUser.style.display = 'none';
  
  // Go back to register
  navigateTo('register');
  showToast('Logged out successfully', 'info');
}
