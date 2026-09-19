/**
 * SILCONLAB Official Website Interaction Script
 * - Dynamic Hero Background Crossfade Controller
 * - Header Scroll Effect
 * - Mobile Navigation Menu Toggle
 * - Case Studies Category Filtering
 * - Asynchronous In-Page Consultation Form Handler (No Mailto Popup!)
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();
  initHeaderScroll();
  initMobileMenu();
  initCaseFilters();
  initConsultationForm();
});

/* ==========================================================================
   1. Dynamic Hero Background Crossfade Controller
   ========================================================================== */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('#heroIndicators .indicator');
  if (!slides.length) return;

  let currentIndex = 0;
  const slideInterval = 6000; // 6 seconds per slide
  let timer = null;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    indicators.forEach((indicator, i) => {
      if (i === index) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });

    currentIndex = index;
  }

  function nextSlide() {
    const nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(nextSlide, slideInterval);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
  }

  // Indicator click events
  indicators.forEach(indicator => {
    indicator.addEventListener('click', (e) => {
      const targetIndex = parseInt(e.target.dataset.slide, 10);
      showSlide(targetIndex);
      startTimer();
    });
  });

  // Start rotation
  startTimer();

  // Pause when page is inactive
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimer();
    } else {
      startTimer();
    }
  });
}

/* ==========================================================================
   2. Header Scroll Effect
   ========================================================================== */
function initHeaderScroll() {
  const header = document.getElementById('navbar');
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ==========================================================================
   3. Mobile Navigation Menu Toggle
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isActive = navMenu.classList.toggle('active');
    toggleBtn.setAttribute('aria-expanded', isActive);
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ==========================================================================
   4. Case Studies Category Filtering
   ========================================================================== */
function initCaseFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const caseCards = document.querySelectorAll('.case-card');

  if (!filterBtns.length || !caseCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.dataset.filter;

      caseCards.forEach(card => {
        if (filterValue === 'all' || card.dataset.category === filterValue) {
          card.style.display = 'block';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '1';
          }, 20);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   5. Consultation Form & Dynamic Service Selection System (v11)
   - Dynamic plan pre-selection from Pricing / Hero buttons
   - Robust Korean phone/name/email validation with live formatting
   - Single unified consultation inquiry model (no duplicate inputs)
   - 100% pre-filled edit mode
   - Non-blocking Google Sheets webhook integration
   ========================================================================== */

const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby5p7YVK0WlNue_pH6M6yrnCHUf_4Y_9fGSDEHOzayWlAZNegzj34SMorg_RRh6yFVR/exec"; 

async function sendToGoogleSheets(payload) {
  if (!GOOGLE_SHEET_WEBAPP_URL) return;
  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Google Sheets Webhook Error:', err);
  }
}

// Global Inquiry State (Single Source of Truth)
const inquiryState = {
  primary: null
};

let isPrimaryEditMode = false;

function initConsultationForm() {
  const primaryForm = document.getElementById('consultationForm');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  // Load existing state from localStorage if available
  try {
    const saved = localStorage.getItem('silconlab_active_inquiry');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.primary) {
        inquiryState.primary = parsed.primary;
      }
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }

  // Setup plan selection buttons from pricing section & hero
  setupPlanSelection();

  // Setup input formatting & real-time validation
  setupFieldValidation();

  // Primary Form Submission
  if (primaryForm) {
    primaryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validatePrimaryForm()) {
        return;
      }

      const submitBtn = document.getElementById('btnSubmitPrimary');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 접수 처리 중...';

      const nowStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
      const wasEdit = isPrimaryEditMode;

      inquiryState.primary = {
        company: document.getElementById('companyName').value.trim(),
        name: document.getElementById('contactPerson').value.trim(),
        employees: document.getElementById('employeeCount').value,
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        service: document.getElementById('serviceInterest').value,
        message: document.getElementById('message').value.trim(),
        submittedAt: wasEdit && inquiryState.primary ? inquiryState.primary.submittedAt : nowStr,
        updatedAt: wasEdit ? nowStr : null
      };

      try {
        persistInquiryState();
        sendToGoogleSheets({
          type: wasEdit ? '수정반영' : '신규접수',
          isUpdate: wasEdit,
          ...inquiryState.primary
        }).catch(err => console.warn(err));
      } catch (err) {
        console.warn('Persistence error:', err);
      }

      await new Promise(res => setTimeout(res, 400));

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      isPrimaryEditMode = false;

      // Render single confirmation card
      renderSuccessState();
    });
  }

  // Cancel Edit Handler
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      isPrimaryEditMode = false;
      if (inquiryState.primary) {
        renderSuccessState();
      }
    });
  }
}

/* --------------------------------------------------------------------------
   Dynamic Plan Selection Integration
   -------------------------------------------------------------------------- */
function setupPlanSelection() {
  const planButtons = document.querySelectorAll('.btn-plan-select');
  const serviceSelect = document.getElementById('serviceInterest');

  planButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plan = btn.dataset.plan;
      const title = btn.dataset.title;
      const btnText = btn.dataset.btn;
      const placeholder = btn.dataset.placeholder;

      applyPlanSelection(plan, title, btnText, placeholder);
    });
  });

  if (serviceSelect) {
    serviceSelect.addEventListener('change', () => {
      const val = serviceSelect.value;
      const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
      if (val === '전체 상담') {
        resetPlanSelection();
      } else {
        showPlanBanner(selectedOption.text);
      }
    });
  }
}

function applyPlanSelection(planValue, customTitle, customBtnText, customPlaceholder) {
  const serviceSelect = document.getElementById('serviceInterest');
  const formTitle = document.getElementById('formTitle');
  const submitBtnText = document.getElementById('submitBtnText');
  const messageArea = document.getElementById('message');

  if (serviceSelect && planValue) {
    serviceSelect.value = planValue;
  }

  if (formTitle && customTitle) {
    formTitle.textContent = customTitle;
  }

  if (submitBtnText && customBtnText) {
    submitBtnText.textContent = customBtnText;
  }

  if (messageArea && customPlaceholder) {
    messageArea.placeholder = customPlaceholder;
  }

  const optText = serviceSelect ? serviceSelect.options[serviceSelect.selectedIndex].text : planValue;
  showPlanBanner(optText);
}

function showPlanBanner(planText) {
  const bannerWrap = document.getElementById('planBannerWrap');
  const nameEl = document.getElementById('selectedPlanName');
  if (bannerWrap && nameEl) {
    nameEl.textContent = planText;
    bannerWrap.style.display = 'block';
  }
}

window.resetPlanSelection = function() {
  const bannerWrap = document.getElementById('planBannerWrap');
  const serviceSelect = document.getElementById('serviceInterest');
  const formTitle = document.getElementById('formTitle');
  const submitBtnText = document.getElementById('submitBtnText');
  const messageArea = document.getElementById('message');

  if (bannerWrap) bannerWrap.style.display = 'none';
  if (serviceSelect) serviceSelect.value = '전체 상담';
  if (formTitle) formTitle.textContent = '15분 무료 사전 미팅 / 견적 신청';
  if (submitBtnText) submitBtnText.textContent = '상담 신청서 제출하기';
  if (messageArea) messageArea.placeholder = '현재 겪고 계신 인사/조직 상의 문제나 문의 내용을 자유롭게 적어주세요.';
};

/* --------------------------------------------------------------------------
   Live Validation & Auto-hyphenation setup
   -------------------------------------------------------------------------- */
function setupFieldValidation() {
  const phoneInput = document.getElementById('phone');
  const nameInput = document.getElementById('contactPerson');
  const compInput = document.getElementById('companyName');
  const emailInput = document.getElementById('email');
  const empInput = document.getElementById('employeeCount');

  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      const formatted = formatKoreanPhoneNumber(e.target.value);
      e.target.value = formatted;
      if (formatted.length >= 10) validateField('phone');
    });
    phoneInput.addEventListener('blur', () => validateField('phone'));
  }

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim().length >= 2) validateField('name');
    });
    nameInput.addEventListener('blur', () => validateField('name'));
  }

  if (compInput) {
    compInput.addEventListener('input', () => {
      if (compInput.value.trim().length >= 2) validateField('company');
    });
    compInput.addEventListener('blur', () => validateField('company'));
  }

  if (emailInput) {
    emailInput.addEventListener('blur', () => validateField('email'));
    emailInput.addEventListener('input', () => {
      if (emailInput.value.includes('@') && emailInput.value.includes('.')) validateField('email');
    });
  }

  if (empInput) {
    empInput.addEventListener('change', () => validateField('employees'));
  }
}

function formatKoreanPhoneNumber(value) {
  const raw = value.replace(/[^0-9]/g, '');
  if (!raw) return '';
  
  if (raw.startsWith('02')) {
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return raw.replace(/(\d{2})(\d+)/, '$1-$2');
    if (raw.length <= 9) return raw.replace(/(\d{2})(\d{3,4})(\d+)/, '$1-$2-$3');
    return raw.slice(0, 10).replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (/^(15|16|18)/.test(raw)) {
    if (raw.length <= 4) return raw;
    return raw.slice(0, 8).replace(/(\d{4})(\d+)/, '$1-$2');
  } else {
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return raw.replace(/(\d{3})(\d+)/, '$1-$2');
    if (raw.length <= 10) return raw.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
    return raw.slice(0, 11).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
}

function validateField(type) {
  if (type === 'company') {
    const comp = document.getElementById('companyName');
    const group = document.getElementById('groupCompanyName');
    const err = document.getElementById('errorCompanyName');
    const val = comp.value.trim();
    if (val.length < 2) {
      if (group) group.classList.add('has-error');
      if (err) err.textContent = '회사명 또는 상호(2자 이상)를 입력해 주세요.';
      return false;
    }
    if (group) group.classList.remove('has-error');
    if (err) err.textContent = '';
    return true;
  }

  if (type === 'name') {
    const name = document.getElementById('contactPerson');
    const group = document.getElementById('groupContactPerson');
    const err = document.getElementById('errorContactPerson');
    const val = name.value.trim();
    const hasLetters = /[가-힣a-zA-Z]/.test(val);
    const isPureDigits = /^\d+$/.test(val);
    if (val.length < 2 || isPureDigits || !hasLetters) {
      if (group) group.classList.add('has-error');
      if (err) err.textContent = '담당자 성함(한글 또는 영문 2자 이상)을 정확히 입력해 주세요. (숫자만 입력 불가)';
      return false;
    }
    if (group) group.classList.remove('has-error');
    if (err) err.textContent = '';
    return true;
  }

  if (type === 'employees') {
    const emp = document.getElementById('employeeCount');
    const group = document.getElementById('groupEmployeeCount');
    const err = document.getElementById('errorEmployeeCount');
    if (!emp.value) {
      if (group) group.classList.add('has-error');
      if (err) err.textContent = '임직원 규모를 선택해 주세요.';
      return false;
    }
    if (group) group.classList.remove('has-error');
    if (err) err.textContent = '';
    return true;
  }

  if (type === 'phone') {
    const phone = document.getElementById('phone');
    const group = document.getElementById('groupPhone');
    const err = document.getElementById('errorPhone');
    const val = phone.value.trim();
    const digits = val.replace(/[^0-9]/g, '');
    
    if (/^1[5-8]\d{2}/.test(digits)) {
      if (digits.length === 8) {
        if (group) group.classList.remove('has-error');
        if (err) err.textContent = '';
        return true;
      }
      if (group) group.classList.add('has-error');
      if (err) err.textContent = '대표번호 8자리(예: 1588-0000)를 정확히 입력해 주세요.';
      return false;
    }

    const validPrefix = /^(01[016789]|02|0[3-6][1-5]|070)/.test(digits);
    if (digits.length >= 9 && digits.length <= 11 && validPrefix) {
      if (group) group.classList.remove('has-error');
      if (err) err.textContent = '';
      return true;
    }

    if (group) group.classList.add('has-error');
    if (err) err.textContent = '올바른 연락처 번호(예: 010-1234-5678 또는 지역번호)를 정확히 입력해 주세요.';
    return false;
  }

  if (type === 'email') {
    const email = document.getElementById('email');
    const group = document.getElementById('groupEmail');
    const err = document.getElementById('errorEmail');
    const val = email.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!val || !emailRegex.test(val)) {
      if (group) group.classList.add('has-error');
      if (err) err.textContent = '유효한 이메일 주소(예: name@company.com)를 입력해 주세요.';
      return false;
    }
    if (group) group.classList.remove('has-error');
    if (err) err.textContent = '';
    return true;
  }

  return true;
}

function validatePrimaryForm() {
  const c = validateField('company');
  const n = validateField('name');
  const e = validateField('employees');
  const p = validateField('phone');
  const m = validateField('email');

  if (!c) { document.getElementById('companyName').focus(); return false; }
  if (!n) { document.getElementById('contactPerson').focus(); return false; }
  if (!e) { document.getElementById('employeeCount').focus(); return false; }
  if (!p) { document.getElementById('phone').focus(); return false; }
  if (!m) { document.getElementById('email').focus(); return false; }

  return true;
}

function persistInquiryState() {
  try {
    localStorage.setItem('silconlab_active_inquiry', JSON.stringify(inquiryState));
    const leads = JSON.parse(localStorage.getItem('silconlab_leads') || '[]');
    leads.push({
      ...inquiryState.primary,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('silconlab_leads', JSON.stringify(leads));
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}

/* --------------------------------------------------------------------------
   State View Switching & Pre-filling Functions (Single-Card Model)
   -------------------------------------------------------------------------- */
window.showPrimaryForm = function(isEdit = false) {
  isPrimaryEditMode = isEdit;
  const primaryForm = document.getElementById('consultationForm');
  const successWrap = document.getElementById('successStateWrap');

  if (!primaryForm) return;

  primaryForm.style.display = 'block';
  if (successWrap) successWrap.style.display = 'none';

  const formTitle = document.getElementById('formTitle');
  const formModeBadge = document.getElementById('formModeBadge');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitIcon = document.getElementById('submitIcon');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  if (isEdit && inquiryState.primary) {
    // 100% Pre-fill all previous values
    document.getElementById('companyName').value = inquiryState.primary.company || '';
    document.getElementById('contactPerson').value = inquiryState.primary.name || '';
    document.getElementById('employeeCount').value = inquiryState.primary.employees || '';
    document.getElementById('phone').value = inquiryState.primary.phone || '';
    document.getElementById('email').value = inquiryState.primary.email || '';
    document.getElementById('serviceInterest').value = inquiryState.primary.service || '전체 상담';
    document.getElementById('message').value = inquiryState.primary.message || '';

    if (formTitle) formTitle.textContent = '상담 신청 내용 수정';
    if (formModeBadge) {
      formModeBadge.style.display = 'inline-flex';
      formModeBadge.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 기존 신청 내용 수정 모드입니다. 변경하실 항목을 수정한 후 저장해 주세요.';
    }
    if (submitBtnText) submitBtnText.textContent = '✓ 수정 내용 저장 및 반영하기';
    if (submitIcon) submitIcon.className = 'fa-solid fa-check';
    if (btnCancelEdit) btnCancelEdit.style.display = 'inline-flex';
  } else {
    // Normal initial mode
    if (formModeBadge) formModeBadge.style.display = 'none';
    if (btnCancelEdit) btnCancelEdit.style.display = 'none';
    if (submitIcon) submitIcon.className = 'fa-solid fa-paper-plane';
  }

  document.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
  document.querySelectorAll('.field-error-msg').forEach(e => e.textContent = '');

  document.getElementById('contactFormContainer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// Render Single Confirmation Card
window.renderSuccessState = function() {
  const primaryForm = document.getElementById('consultationForm');
  const successWrap = document.getElementById('successStateWrap');
  const bannerWrap = document.getElementById('planBannerWrap');

  if (!successWrap || !inquiryState.primary) return;

  if (primaryForm) primaryForm.style.display = 'none';
  if (bannerWrap) bannerWrap.style.display = 'none';
  successWrap.style.display = 'block';

  const primary = inquiryState.primary;

  successWrap.innerHTML = `
    <div class="form-success-card">
      <div class="success-icon">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <h3>상담 신청이 성공적으로 접수되었습니다</h3>
      <p class="success-lead">
        <strong>${escapeHtml(primary.company)} (${escapeHtml(primary.name)}님)</strong>의 사전 미팅 신청 내역이 정상 등록되었습니다.
      </p>

      <!-- 단일 신청 내역 요약 카드 -->
      <div class="submission-card primary-submission">
        <div class="card-header-bar">
          <div class="card-title-tag">
            <i class="fa-solid fa-file-lines"></i>
            <span>상담 신청 내역 요약</span>
          </div>
          <button type="button" class="btn-card-action" onclick="showPrimaryForm(true)" title="신청 내용 수정">
            <i class="fa-solid fa-pen-to-square"></i> 내용 수정
          </button>
        </div>
        <div class="card-body-details">
          <div class="detail-row"><span>회사명:</span> <strong>${escapeHtml(primary.company)}</strong></div>
          <div class="detail-row"><span>담당자:</span> <strong>${escapeHtml(primary.name)}</strong></div>
          <div class="detail-row"><span>임직원 규모:</span> <strong>${escapeHtml(primary.employees)}</strong></div>
          <div class="detail-row"><span>신청 서비스:</span> <strong>${escapeHtml(primary.service)}</strong></div>
          <div class="detail-row"><span>회신 연락처:</span> <strong>${escapeHtml(primary.phone)}</strong></div>
          <div class="detail-row"><span>이메일 주소:</span> <strong>${escapeHtml(primary.email)}</strong></div>
          ${primary.message ? `
          <div class="detail-row message-row">
            <span>주요 고민 및 요청 사항:</span>
            <p>${escapeHtml(primary.message)}</p>
          </div>` : ''}
          <div class="detail-row timestamp-row">
            <span>접수 일시:</span>
            <small>${escapeHtml(primary.submittedAt)}${primary.updatedAt ? ` (최근 수정: ${escapeHtml(primary.updatedAt)})` : ''}</small>
          </div>
        </div>
      </div>

      <!-- 접수 후 안내 (단일 문장 박스 - 줄바꿈 깨짐 완전 방지) -->
      <div class="success-notice-box">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <span>접수 후 <strong>24시간 이내</strong>에 대표 컨설턴트가 기재해 주신 연락처로 일정 조율 안내를 드립니다.</span>
      </div>

      <!-- 액션 버튼 (수정 & 카카오톡 실시간 상담) -->
      <div class="action-box-single">
        <button type="button" class="action-box-btn box-edit-primary" onclick="showPrimaryForm(true)">
          <div class="box-icon-wrap">
            <i class="fa-solid fa-pen-to-square"></i>
          </div>
          <div class="box-text-wrap">
            <strong class="box-title">신청 내용 수정하기</strong>
            <span class="box-desc">오타가 있거나 상담 내용을 변경·보완하고 싶으신 경우</span>
          </div>
        </button>

        <a href="https://open.kakao.com/o/gtwjWiai" target="_blank" rel="noopener noreferrer" class="btn-kakao-action-box">
          <i class="fa-solid fa-comment"></i>
          <span>카카오톡에서 실시간 1:1 상담하기</span>
        </a>
      </div>
    </div>
  `;

  document.getElementById('contactFormContainer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
