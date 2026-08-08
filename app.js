// App State
let state = {
    screen: 'splash',
    fdAmount: 5000,
    cibil: 750, // Starting high for Gen Z hook
    phone: '',
    pan: ''
};

// Screen history stack for back button
let screenHistory = ['splash'];
let isPopNavigation = false;

// Navigation
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        if(s.classList.contains('active')) {
            s.classList.add('exit-left');
            setTimeout(() => {
                s.classList.remove('active', 'exit-left');
            }, 400);
        }
    });
    
    setTimeout(() => {
        const nextScreen = document.getElementById(`screen-${screenId}`);
        if(nextScreen) {
            nextScreen.classList.add('active');
            state.screen = screenId;
            
            // Push browser history so mobile back button works within the app
            if (!isPopNavigation) {
                screenHistory.push(screenId);
                history.pushState({ screen: screenId }, '', '#' + screenId);
            }
            isPopNavigation = false;
            
            // Show/hide bottom nav
            const nav = document.getElementById('bottom-nav');
            if (['splash', 'onboard'].includes(screenId)) {
                nav.style.display = 'none';
            } else {
                nav.style.display = 'flex';
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                const activeTab = document.querySelector(`.nav-tab[data-screen="${screenId}"]`);
                if(activeTab) activeTab.classList.add('active');
            }

            // Screen specific triggers
            if(screenId === 'cibil') initCibilChart();
            if(screenId === 'settle') setTimeout(runSettleAnimation, 500);
            if(screenId === 'dashboard') {
                const scroll = document.getElementById('dash-scroll');
                const skel = document.getElementById('dash-skeleton');
                if (skel && scroll) {
                    skel.style.display = 'flex';
                    scroll.style.opacity = '0';
                    setTimeout(() => {
                        skel.style.display = 'none';
                        scroll.style.opacity = '1';
                        scroll.style.transition = 'opacity 0.3s';
                        updateDashboardData();
                    }, 800);
                } else {
                    updateDashboardData();
                }
            }
        }
    }, 400);
}

// Handle browser back button (Android back / swipe back)
window.addEventListener('popstate', (e) => {
    // If the scanner overlay is open, close it instead of navigating
    const scanner = document.getElementById('scanner-overlay');
    if (scanner && scanner.classList.contains('open')) {
        scanner.classList.remove('open');
        // Re-push the current state so back button still works for screens
        history.pushState({ screen: state.screen }, '', '#' + state.screen);
        return;
    }
    
    // If the notification dropdown is open, close it
    const notifDropdown = document.getElementById('notif-dropdown');
    if (notifDropdown && notifDropdown.classList.contains('open')) {
        notifDropdown.classList.remove('open');
        history.pushState({ screen: state.screen }, '', '#' + state.screen);
        return;
    }
    
    // Navigate to previous screen
    if (screenHistory.length > 1) {
        screenHistory.pop(); // Remove current
        const prevScreen = screenHistory[screenHistory.length - 1];
        isPopNavigation = true;
        navigateTo(prevScreen);
    } else {
        // Already at the first screen (splash), push state to prevent leaving
        history.pushState({ screen: 'splash' }, '', '#splash');
    }
});

// Set initial history state
history.replaceState({ screen: 'splash' }, '', '#splash');

// Bottom Nav Binding
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => navigateTo(tab.dataset.screen));
});
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
});
document.querySelectorAll('[data-nav]').forEach(btn => {
    if(!btn.classList.contains('nav-tab') && !btn.classList.contains('back-btn')) {
        btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
    }
});

// Toast
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateProgressBar(percent) {
    document.getElementById('ob-progress').style.width = percent + '%';
}

// Hook Screen
document.getElementById('btn-get-started').addEventListener('click', () => {
    navigateTo('onboard');
    updateProgressBar(25);
});

// Skip to Demo (View Demo button)
document.getElementById('btn-view-demo').addEventListener('click', () => {
    navigateTo('dashboard');
});

// Onboarding Flow
document.getElementById('btn-send-otp').addEventListener('click', () => {
    const phone = document.getElementById('inp-phone').value;
    if(phone.length === 10) {
        state.phone = phone;
        document.getElementById('otp-phone-display').textContent = phone;
        document.getElementById('ob-step-1').classList.remove('active');
        document.getElementById('ob-step-1b').classList.add('active');
        updateProgressBar(50);
        document.querySelector('.otp-box[data-idx="0"]').focus();
        
        // Smart OTP simulation
        setTimeout(() => {
            const status = document.getElementById('smart-otp-status');
            if (status) status.classList.add('active');
            
            setTimeout(() => {
                const boxes = document.querySelectorAll('.otp-box');
                const otp = [4, 9, 2, 1]; // Sample OTP
                boxes.forEach((b, i) => {
                    setTimeout(() => {
                        b.value = otp[i];
                        // Haptic feedback
                        if (navigator.vibrate) navigator.vibrate(20);
                    }, i * 150);
                });
                
                setTimeout(() => {
                    if (status) status.classList.remove('active');
                    document.getElementById('ob-step-1b').classList.remove('active');
                    document.getElementById('ob-step-2').classList.add('active');
                    updateProgressBar(75);
                }, 1000);
            }, 1200); // Wait 1.2s "reading messages"
        }, 300);
    } else {
        showToast('Enter a valid 10-digit number');
    }
});

document.getElementById('btn-verify-pan').addEventListener('click', () => {
    const pan = document.getElementById('inp-pan').value;
    if(pan.length === 10) {
        const btn = document.getElementById('btn-verify-pan');
        btn.textContent = 'Verifying...';
        btn.disabled = true;
        
        setTimeout(() => {
            document.getElementById('pan-status').innerHTML = '✅ PAN Verified • Arjun Mehta';
            setTimeout(() => {
                document.getElementById('ob-step-2').classList.remove('active');
                document.getElementById('ob-step-3').classList.add('active');
                updateProgressBar(90);
            }, 1000);
        }, 1500);
    } else {
        showToast('Enter valid 10-char PAN');
    }
});

// FD Slider
const fdSlider = document.getElementById('fd-slider');
fdSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.fdAmount = val;
    document.getElementById('fd-amount-val').textContent = val.toLocaleString();
    document.getElementById('fd-monthly').textContent = '₹' + Math.round(val * 0.082 / 12);
    document.getElementById('fd-annual').textContent = '₹' + Math.round(val * 0.082);
    document.getElementById('fd-limit').textContent = '₹' + val.toLocaleString();
});

document.getElementById('btn-create-fd').addEventListener('click', () => {
    const btn = document.getElementById('btn-create-fd');
    btn.textContent = 'Processing via UPI...';
    btn.disabled = true;
    
    setTimeout(() => {
        document.getElementById('ob-step-3').classList.remove('active');
        document.getElementById('ob-step-success').classList.add('active');
        updateProgressBar(100);
        
        // Fire confetti
        if (typeof confetti === 'function') {
            const duration = 3000;
            const end = Date.now() + duration;
            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#10b981', '#06b6d4', '#ec4899', '#f59e0b']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#10b981', '#06b6d4', '#ec4899', '#f59e0b']
                });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        }
    }, 2000);
});

document.getElementById('btn-go-dashboard').addEventListener('click', () => {
    navigateTo('dashboard');
});

// Number animation (Odometer effect)
function animateNumber(elementId, target, duration = 1500) {
    const obj = document.getElementById(elementId);
    if (!obj) return;
    const start = parseInt(obj.textContent.replace(/,/g, '')) || 0;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);
        obj.innerHTML = Math.floor(ease * (target - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = target.toLocaleString();
        }
    };
    window.requestAnimationFrame(step);
}

// Dynamic Greeting based on time of day
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning, Arjun ☀️';
    if (h < 17) return 'Good afternoon, Arjun 👋';
    if (h < 21) return 'Good evening, Arjun 🌇';
    return 'Burning the midnight oil, Arjun 🌙';
}

function updateDashboardData() {
    document.getElementById('dash-greeting').textContent = getGreeting();
    document.getElementById('stat-fd').textContent = '₹' + state.fdAmount.toLocaleString();
    
    const limitVal = document.getElementById('dash-limit-val');
    const totalLimit = document.getElementById('dash-total-limit');
    const limitFill = document.querySelector('.dl-fill');
    if (limitVal && totalLimit && limitFill) {
        limitVal.textContent = '₹' + state.fdAmount.toLocaleString();
        totalLimit.textContent = '₹' + state.fdAmount.toLocaleString();
        limitFill.style.width = '0%';
        setTimeout(() => { limitFill.style.width = '100%'; }, 50);
    }

    animateNumber('dash-cibil-score', state.cibil, 2000);
    
    const ring = document.getElementById('dash-cibil-ring');
    if(ring) {
        const pct = Math.max(0, Math.min(100, ((state.cibil - 300) / 600) * 100));
        ring.setAttribute('stroke-dasharray', `${pct}, 100`);
    }
}

// Auto Input Formatting
document.getElementById('inp-phone').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
});
const otpBoxes = document.querySelectorAll('.otp-box');
otpBoxes.forEach((box, i) => {
    box.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if(this.value && i < otpBoxes.length - 1) {
            otpBoxes[i+1].focus();
        }
    });
    box.addEventListener('keydown', function(e) {
        if(e.key === 'Backspace' && !this.value && i > 0) {
            otpBoxes[i-1].focus();
        }
    });
});

// Card Flip & Actions
document.getElementById('btn-flip-card').addEventListener('click', () => {
    document.getElementById('card-3d-inner').classList.toggle('flipped');
});
document.getElementById('btn-copy-number').addEventListener('click', () => {
    navigator.clipboard.writeText('6521003488912247');
    showToast('Card number copied');
});
document.getElementById('btn-reveal-cvv').addEventListener('click', (e) => {
    const cvv = document.getElementById('cb-cvv');
    if(cvv.textContent === '•••') {
        cvv.textContent = '492';
        e.target.textContent = '👁️ Hide CVV';
    } else {
        cvv.textContent = '•••';
        e.target.textContent = '👁️ Reveal CVV';
    }
});

// Scanner Overlay
const scanner = document.getElementById('scanner-overlay');
document.getElementById('btn-open-scanner').addEventListener('click', () => {
    scanner.classList.add('open');
    showScanPhase(1);
    
    // Simulate detecting a QR code after 2s
    setTimeout(() => {
        if (scanner.classList.contains('open') && document.getElementById('scan-phase-1').classList.contains('active')) {
            document.getElementById('fake-qr').classList.add('scanned');
            // Haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(50);
            
            setTimeout(() => {
                showScanPhase(2);
                document.getElementById('fake-qr').classList.remove('scanned');
            }, 600);
        }
    }, 2500);
});

function showScanPhase(phase) {
    document.querySelectorAll('.scanner-phase').forEach(p => p.classList.remove('active'));
    document.getElementById(`scan-phase-${phase}`).classList.add('active');
    
    if (phase === 2) {
        // Animate the round-up engine details entering
        document.getElementById('roundup-engine-box').classList.remove('visible');
        document.getElementById('roundup-total-section').classList.remove('visible');
        
        setTimeout(() => {
            document.getElementById('roundup-engine-box').classList.add('visible');
        }, 100);
        setTimeout(() => {
            document.getElementById('roundup-total-section').classList.add('visible');
        }, 600);
    }
}

document.querySelectorAll('.scanner-close').forEach(btn => {
    btn.addEventListener('click', () => scanner.classList.remove('open'));
});

document.getElementById('btn-pay-roundup').addEventListener('click', () => {
    const btn = document.getElementById('btn-pay-roundup');
    btn.textContent = 'Processing...';
    btn.disabled = true;
    
    setTimeout(() => {
        showScanPhase(3);
        state.fdAmount += 10;
        document.getElementById('new-fd-bal').textContent = '₹' + state.fdAmount.toLocaleString();
        btn.textContent = 'Pay ₹200 via UPI';
        btn.disabled = false;
        
        // Add to txn history
        txns.unshift({ name: 'QuickMart Store', cat: 'Shopping', amount: '200', cb: '+₹10 to FD', date: 'Just now', icon: '🛒' });
        renderTxns();
    }, 1500);
});

document.getElementById('btn-done-scanner').addEventListener('click', () => {
    scanner.classList.remove('open');
    updateDashboardData();
});

// Relative timestamps (makes the app feel alive)
function getRelativeTime(hoursAgo) {
    if (hoursAgo < 1) return 'Just now';
    if (hoursAgo < 2) return '1 hour ago';
    if (hoursAgo < 24) return Math.floor(hoursAgo) + ' hours ago';
    if (hoursAgo < 48) return 'Yesterday';
    return Math.floor(hoursAgo / 24) + ' days ago';
}

// Transactions Data (with relative timestamps)
const txns = [
    { name: 'Swiggy', cat: 'Food & Drink', amount: '350', cb: '+₹15', date: getRelativeTime(2), icon: '🍔' },
    { name: 'Uber Trips', cat: 'Travel', amount: '290', cb: '+₹10', date: getRelativeTime(6), icon: '🚗' },
    { name: 'Netflix', cat: 'Entertainment', amount: '649', cb: '+₹51', date: getRelativeTime(28), icon: '🎬' },
    { name: 'Starbucks', cat: 'Food & Drink', amount: '410', cb: '+₹40', date: getRelativeTime(72), icon: '☕' },
    { name: 'Jio Prepaid', cat: 'Utilities', amount: '299', cb: '+₹1', date: getRelativeTime(120), icon: '📱' },
    { name: 'Amazon India', cat: 'Shopping', amount: '1,290', cb: '+₹10', date: getRelativeTime(192), icon: '📦' }
];

function renderTxns() {
    const html = txns.map(t => `
        <div class="txn-item">
            <div class="txn-icon">${t.icon}</div>
            <div class="txn-info">
                <div class="txn-name">${t.name}</div>
                <div class="txn-cat">${t.cat}</div>
            </div>
            <div class="txn-right">
                <div class="txn-amount">₹${t.amount}</div>
                ${t.cb ? `<div class="txn-cashback">${t.cb}</div>` : ''}
                <div class="txn-date">${t.date}</div>
            </div>
        </div>
    `).join('');
    
    const dashList = document.getElementById('dash-txn-list');
    const fullList = document.getElementById('txn-full-list');
    
    if(dashList) dashList.innerHTML = txns.slice(0,3).map(t => `
        <div class="txn-item">
            <div class="txn-icon">${t.icon}</div>
            <div class="txn-info">
                <div class="txn-name">${t.name}</div>
                <div class="txn-cat">${t.date}</div>
            </div>
            <div class="txn-right">
                <div class="txn-amount">₹${t.amount}</div>
                ${t.cb ? `<div class="txn-cashback">${t.cb}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    if(fullList) fullList.innerHTML = html;
}

// Generate Month Tabs
const months = ['November', 'October', 'September', 'August'];
const tabsHtml = months.map((m, i) => `<button class="month-tab ${i===0?'active':''}">${m}</button>`).join('');
const mt = document.getElementById('month-tabs');
if(mt) mt.innerHTML = tabsHtml;

const sumHtml = `
    <div class="txn-sum-card"><span class="tsc-val highlight-gradient">₹3,288</span><span class="tsc-label">Total Spent</span></div>
    <div class="txn-sum-card"><span class="tsc-val highlight-gradient" style="background: linear-gradient(90deg, #ec4899, #8b5cf6); -webkit-background-clip: text;">₹127</span><span class="tsc-label">Round-Ups</span></div>
`;
const ts = document.getElementById('txn-summary');
if(ts) ts.innerHTML = sumHtml;

// Auto-Settle Flow
function runSettleAnimation() {
    const steps = document.querySelectorAll('.sf-step');
    const lines = document.querySelectorAll('.sf-line');
    
    steps.forEach(s => s.classList.remove('active', 'done'));
    lines.forEach(l => l.classList.remove('active'));
    
    document.getElementById('sf-step3-icon').textContent = '⏳';
    document.getElementById('sf-step3-text').innerHTML = '<strong>Debit Savings</strong><br>Processing...';
    
    // Step 1
    setTimeout(() => { steps[0].classList.add('active'); }, 500);
    
    // Line 1 + Step 2
    setTimeout(() => { 
        steps[0].classList.replace('active', 'done');
        lines[0].classList.add('active');
        steps[1].classList.add('active');
    }, 1500);
    
    // Line 2 + Step 3
    setTimeout(() => { 
        steps[1].classList.replace('active', 'done');
        lines[1].classList.add('active');
        steps[2].classList.add('active');
    }, 2500);
    
    // Step 3 Success
    setTimeout(() => { 
        document.getElementById('sf-step3-icon').textContent = '✅';
        document.getElementById('sf-step3-text').innerHTML = '<strong>Debit Savings</strong><br>₹1,550 debited';
        steps[2].classList.add('done');
    }, 3500);
    
    // Line 3 + Step 4
    setTimeout(() => { 
        lines[2].classList.add('active');
        steps[3].classList.add('active');
    }, 4000);
}

document.getElementById('btn-replay-settle').addEventListener('click', runSettleAnimation);

const shHtml = `
    <div class="sh-item"><span class="sh-check">✓</span><div class="sh-info"><strong>Oct Bill Settled</strong><div class="sh-date">Oct 5 • Auto-debited ₹1,550 from Savings</div></div></div>
    <div class="sh-item"><span class="sh-check">✓</span><div class="sh-info"><strong>Sep Bill Settled</strong><div class="sh-date">Sep 5 • Auto-debited ₹2,100 from Savings</div></div></div>
    <div class="sh-item"><span class="sh-check" style="color:var(--amber)">!</span><div class="sh-info"><strong>Aug Bill Settled (FD)</strong><div class="sh-date">Aug 5 • Adjusted ₹850 from FD (Low Savings)</div></div></div>
`;
const sh = document.getElementById('sh-timeline');
if(sh) sh.innerHTML = shHtml;

// Settle Toggle
document.getElementById('stg-savings').addEventListener('click', (e) => {
    e.target.classList.add('active');
    document.getElementById('stg-fallback').classList.remove('active');
});
document.getElementById('stg-fallback').addEventListener('click', (e) => {
    e.target.classList.add('active');
    document.getElementById('stg-savings').classList.remove('active');
});

// CIBIL Chart
function initCibilChart() {
    animateNumber('cibil-score-num', state.cibil, 2000);
    
    const canvas = document.getElementById('cibil-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Fix blurriness
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const w = rect.width;
    const h = rect.height;
    
    ctx.clearRect(0,0,w,h);
    
    const data = [705, 712, 725, 725, 738, 750];
    const labels = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    
    const min = 680;
    const max = 780;
    
    const padX = 30;
    const padY = 40;
    
    const stepX = (w - padX * 2) / (data.length - 1);
    
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<4; i++) {
        const y = padY + (i * (h - padY*2)/3);
        ctx.moveTo(padX, y);
        ctx.lineTo(w - padX, y);
    }
    ctx.stroke();
    
    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4'; // Cyan
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const points = [];
    
    data.forEach((val, i) => {
        const x = padX + (i * stepX);
        const y = h - padY - ((val - min) / (max - min) * (h - padY*2));
        points.push({x, y});
        
        if(i === 0) ctx.moveTo(x, y);
        else {
            // smooth curve
            const cp1x = points[i-1].x + stepX/2;
            const cp1y = points[i-1].y;
            const cp2x = x - stepX/2;
            const cp2y = y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
        }
    });
    ctx.stroke();
    
    // Gradient fill
    const grad = ctx.createLinearGradient(0, padY, 0, h - padY);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    
    ctx.lineTo(points[points.length-1].x, h - padY);
    ctx.lineTo(points[0].x, h - padY);
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Points
    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0a0a0f';
        ctx.stroke();
        
        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], p.x, h - 15);
        
        if(i === points.length - 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(data[i], p.x, p.y - 15);
        }
    });
}

const cmHtml = `
    <div class="cm-item"><div class="cm-dot" style="color:var(--green)"></div><div class="cm-text"><strong>+12 Points</strong><span>On-time September settlement</span></div></div>
    <div class="cm-item"><div class="cm-dot" style="color:var(--green)"></div><div class="cm-text"><strong>+13 Points</strong><span>Credit utilization < 30%</span></div></div>
    <div class="cm-item"><div class="cm-dot" style="color:var(--cyan)"></div><div class="cm-text"><strong>Account Aging</strong><span>FD backed card active for 6m</span></div></div>
`;
const cm = document.getElementById('cibil-milestones');
if(cm) cm.innerHTML = cmHtml;

// Notification Dropdown Toggle
const notifDropdown = document.getElementById('notif-dropdown');
document.getElementById('btn-notif').addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('open');
    // Remove the pink dot after opening
    const dot = document.querySelector('.notif-dot');
    if (dot) setTimeout(() => dot.style.display = 'none', 500);
});
// Close dropdown when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('#notif-dropdown') && !e.target.closest('#btn-notif')) {
        notifDropdown.classList.remove('open');
    }
});

// Pull-to-Refresh (Dashboard scroll)
(function() {
    const scroll = document.getElementById('dash-scroll');
    const indicator = document.getElementById('pull-indicator');
    if (!scroll || !indicator) return;
    
    let startY = 0;
    let pulling = false;
    
    scroll.addEventListener('touchstart', (e) => {
        if (scroll.scrollTop === 0) {
            startY = e.touches[0].clientY;
            pulling = true;
        }
    });
    scroll.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const dy = e.touches[0].clientY - startY;
        if (dy > 60 && scroll.scrollTop === 0) {
            indicator.classList.add('visible');
        }
    });
    scroll.addEventListener('touchend', () => {
        if (indicator.classList.contains('visible')) {
            // Fake refresh
            setTimeout(() => {
                indicator.classList.remove('visible');
                updateDashboardData();
                showToast('Dashboard updated ✓');
            }, 1200);
        }
        pulling = false;
    });
    
    // Also support mouse for desktop demo
    scroll.addEventListener('mousedown', (e) => {
        if (scroll.scrollTop === 0) {
            startY = e.clientY;
            pulling = true;
        }
    });
    scroll.addEventListener('mousemove', (e) => {
        if (!pulling) return;
        const dy = e.clientY - startY;
        if (dy > 60 && scroll.scrollTop === 0) {
            indicator.classList.add('visible');
        }
    });
    scroll.addEventListener('mouseup', () => {
        if (indicator.classList.contains('visible')) {
            setTimeout(() => {
                indicator.classList.remove('visible');
                updateDashboardData();
                showToast('Dashboard updated ✓');
            }, 1200);
        }
        pulling = false;
    });
})();

// Dark Mode Toggle
const darkModeToggle = document.getElementById('tog-darkmode');
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e) => {
        if (!e.target.checked) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    });
}

// Initialize
renderTxns();
