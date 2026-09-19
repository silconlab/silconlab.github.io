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
   5. Asynchronous In-Page Form Handler (데이터 백그라운드 자동 수집 & 완료 화면)
   ========================================================================== */
// Google Apps Script Web App URL (배포 후 아래 따옴표 안에 웹앱 URL을 입력하시면 실시간 시트 적재됩니다)
const GOOGLE_SHEET_WEBAPP_URL = ""; 

async function sendToGoogleSheets(payload) {
  if (!GOOGLE_SHEET_WEBAPP_URL) {
    return;
  }
  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Google Sheets Webhook Error:', err);
  }
}

function initConsultationForm() {
  const primaryForm = document.getElementById('consultationForm');
  const followupForm = document.getElementById('followupForm');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const btnCancelFollowup = document.getElementById('btnCancelFollowup');

  // Load any existing state from localStorage if available
  try {
    const saved = localStorage.getItem('silconlab_active_inquiry');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.primary) {
        inquiryState.primary = parsed.primary;
        inquiryState.followup = parsed.followup || null;
      }
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }

  // Setup Input formatting and live validation
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
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 처리 중...';

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
        if (typeof sendToGoogleSheets === 'function') {
          sendToGoogleSheets({
            type: wasEdit ? '수정반영' : '1차신청',
            isUpdate: wasEdit,
            company: inquiryState.primary.company,
            name: inquiryState.primary.name,
            employees: inquiryState.primary.employees,
            phone: inquiryState.primary.phone,
            email: inquiryState.primary.email,
            service: inquiryState.primary.service,
            message: inquiryState.primary.message,
            submittedAt: inquiryState.primary.submittedAt
          }).catch(e => console.warn(e));
        }
      } catch (err) {
        console.warn('Persistence error:', err);
      }

      await new Promise(res => setTimeout(res, 400));

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      isPrimaryEditMode = false;

      // Guaranteed render success state
      if (typeof renderSuccessState === 'function') {
        renderSuccessState();
      } else if (typeof window.renderSuccessState === 'function') {
        window.renderSuccessState();
      }
    });
  }

  // Followup Form Submission
  if (followupForm) {
    followupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateFollowupForm()) {
        return;
      }

      const submitBtn = document.getElementById('btnSubmitFollowup');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 전달 중...';

      const nowStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
      const wasEdit = isFollowupEditMode;

      inquiryState.followup = {
        category: document.getElementById('followupCategory').value,
        message: document.getElementById('followupMessage').value.trim(),
        submittedAt: wasEdit && inquiryState.followup ? inquiryState.followup.submittedAt : nowStr,
        updatedAt: wasEdit ? nowStr : null
      };

      try {
        persistInquiryState();
        if (typeof sendToGoogleSheets === 'function') {
          sendToGoogleSheets({
            type: '추가문의',
            isUpdate: wasEdit,
            company: inquiryState.primary ? inquiryState.primary.company : '',
            name: inquiryState.primary ? inquiryState.primary.name : '',
            employees: inquiryState.primary ? inquiryState.primary.employees : '',
            phone: inquiryState.primary ? inquiryState.primary.phone : '',
            email: inquiryState.primary ? inquiryState.primary.email : '',
            service: inquiryState.primary ? inquiryState.primary.service : '',
            message: inquiryState.primary ? inquiryState.primary.message : '',
            followupCategory: inquiryState.followup.category,
            followupMessage: inquiryState.followup.message,
            submittedAt: inquiryState.followup.submittedAt
          }).catch(e => console.warn(e));
        }
      } catch (err) {
        console.warn('Followup persistence error:', err);
      }

      await new Promise(res => setTimeout(res, 400));

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      isFollowupEditMode = false;

      if (typeof renderSuccessState === 'function') {
        renderSuccessState();
      } else if (typeof window.renderSuccessState === 'function') {
        window.renderSuccessState();
      }
    });
  }

  // Cancel Edit Handlers
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      isPrimaryEditMode = false;
      if (inquiryState.primary) {
        renderSuccessState();
      }
    });
  }

  if (btnCancelFollowup) {
    btnCancelFollowup.addEventListener('click', () => {
      isFollowupEditMode = false;
      if (inquiryState.primary) {
        renderSuccessState();
      }
    });
  }
}

// Global State
const inquiryState = {
  primary: null,   // { company, name, employees, phone, email, service, message, submittedAt, updatedAt }
  followup: null   // { category, message, submittedAt, updatedAt }
};

let isPrimaryEditMode = false;
let isFollowupEditMode = false;

// Live Validation & Auto-hyphenation setup
function setupFieldValidation() {
  const phoneInput = document.getElementById('phone');
  const nameInput = document.getElementById('contactPerson');
  const compInput = document.getElementById('companyName');
  const emailInput = document.getElementById('email');
  const empInput = document.getElementById('employeeCount');
  const followupMsgInput = document.getElementById('followupMessage');

  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      const formatted = formatKoreanPhoneNumber(e.target.value);
      e.target.value = formatted;
      if (formatted.length >= 10) {
        validateField('phone');
      }
    });
    phoneInput.addEventListener('blur', () => validateField('phone'));
  }

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim().length >= 2) {
        validateField('name');
      }
    });
    nameInput.addEventListener('blur', () => validateField('name'));
  }

  if (compInput) {
    compInput.addEventListener('input', () => {
      if (compInput.value.trim().length >= 2) {
        validateField('company');
      }
    });
    compInput.addEventListener('blur', () => validateField('company'));
  }

  if (emailInput) {
    emailInput.addEventListener('blur', () => validateField('email'));
    emailInput.addEventListener('input', () => {
      if (emailInput.value.includes('@') && emailInput.value.includes('.')) {
        validateField('email');
      }
    });
  }

  if (empInput) {
    empInput.addEventListener('change', () => validateField('employees'));
  }

  if (followupMsgInput) {
    followupMsgInput.addEventListener('input', () => {
      if (followupMsgInput.value.trim().length >= 5) {
        const group = document.getElementById('groupFollowupMessage');
        const errEl = document.getElementById('errorFollowupMessage');
        if (group) group.classList.remove('has-error');
        if (errEl) errEl.textContent = '';
      }
    });
  }
}

function formatKoreanPhoneNumber(value) {
  const raw = value.replace(/[^0-9]/g, '');
  if (!raw) return '';
  
  if (raw.startsWith('02')) {
    // Seoul landline (02)
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return raw.replace(/(\d{2})(\d+)/, '$1-$2');
    if (raw.length <= 9) return raw.replace(/(\d{2})(\d{3,4})(\d+)/, '$1-$2-$3');
    return raw.slice(0, 10).replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (/^(15|16|18)/.test(raw)) {
    // Representative 4-digit prefix
    if (raw.length <= 4) return raw;
    return raw.slice(0, 8).replace(/(\d{4})(\d+)/, '$1-$2');
  } else {
    // Mobile (010, 011, etc.) or regional landline (031, 051, 070, etc.)
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
    
    // Representative number (1588, 1544, etc. - 8 digits)
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

    // Standard Korean mobile or regional landline
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

function validateFollowupForm() {
  const msgEl = document.getElementById('followupMessage');
  const group = document.getElementById('groupFollowupMessage');
  const err = document.getElementById('errorFollowupMessage');
  const val = msgEl.value.trim();

  if (val.length < 5) {
    if (group) group.classList.add('has-error');
    if (err) err.textContent = '추가 문의/전달 사항을 5자 이상 구체적으로 적어주세요.';
    msgEl.focus();
    return false;
  }
  if (group) group.classList.remove('has-error');
  if (err) err.textContent = '';
  return true;
}

function persistInquiryState() {
  try {
    localStorage.setItem('silconlab_active_inquiry', JSON.stringify(inquiryState));
    const leads = JSON.parse(localStorage.getItem('silconlab_leads') || '[]');
    leads.push({
      ...inquiryState,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('silconlab_leads', JSON.stringify(leads));
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}

/* ==========================================================================
   State View Switching & Pre-filling Functions
   ========================================================================== */

// 1. Show Primary Form (Supports Normal Mode and 1차 수정 모드 with 100% Pre-filled data!)
window.showPrimaryForm = function(isEdit = false) {
  isPrimaryEditMode = isEdit;
  const primaryForm = document.getElementById('consultationForm');
  const followupWrap = document.getElementById('followupFormWrap');
  const successWrap = document.getElementById('successStateWrap');

  if (!primaryForm) return;

  primaryForm.style.display = 'block';
  if (followupWrap) followupWrap.style.display = 'none';
  if (successWrap) successWrap.style.display = 'none';

  const formTitle = document.getElementById('formTitle');
  const formModeBadge = document.getElementById('formModeBadge');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitIcon = document.getElementById('submitIcon');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  if (isEdit && inquiryState.primary) {
    // PRE-FILL ALL EXISTING VALUES
    document.getElementById('companyName').value = inquiryState.primary.company || '';
    document.getElementById('contactPerson').value = inquiryState.primary.name || '';
    document.getElementById('employeeCount').value = inquiryState.primary.employees || '';
    document.getElementById('phone').value = inquiryState.primary.phone || '';
    document.getElementById('email').value = inquiryState.primary.email || '';
    document.getElementById('serviceInterest').value = inquiryState.primary.service || '전체 상담';
    document.getElementById('message').value = inquiryState.primary.message || '';

    if (formTitle) formTitle.textContent = '상담 신청 내용 수정 (1차 접수)';
    if (formModeBadge) {
      formModeBadge.style.display = 'inline-flex';
      formModeBadge.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 기존 접수 내용 수정 모드입니다. 수정 후 아래 저장 버튼을 눌러주세요.';
    }
    if (submitBtnText) submitBtnText.textContent = '✓ 수정 내용 저장 및 재접수';
    if (submitIcon) submitIcon.className = 'fa-solid fa-check';
    if (btnCancelEdit) btnCancelEdit.style.display = 'inline-flex';
  } else {
    // Normal initial mode
    if (formTitle) formTitle.textContent = '15분 무료 사전 미팅 / 견적 신청';
    if (formModeBadge) formModeBadge.style.display = 'none';
    if (submitBtnText) submitBtnText.textContent = '상담 신청서 제출하기';
    if (submitIcon) submitIcon.className = 'fa-solid fa-paper-plane';
    if (btnCancelEdit) btnCancelEdit.style.display = 'none';
  }

  // Clear any existing error highlights
  document.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
  document.querySelectorAll('.field-error-msg').forEach(e => e.textContent = '');

  // Smooth scroll to form container
  document.getElementById('contactFormContainer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// 2. Show Followup Form (Supports New Followup and Followup Edit)
window.showFollowupForm = function(isEdit = false) {
  isFollowupEditMode = isEdit;
  const primaryForm = document.getElementById('consultationForm');
  const followupWrap = document.getElementById('followupFormWrap');
  const successWrap = document.getElementById('successStateWrap');

  if (!followupWrap) return;

  if (primaryForm) primaryForm.style.display = 'none';
  followupWrap.style.display = 'block';
  if (successWrap) successWrap.style.display = 'none';

  const titleEl = document.getElementById('followupFormTitle');
  const badgeEl = document.getElementById('followupApplicantBadge');
  const btnText = document.getElementById('followupSubmitBtnText');
  const btnIcon = document.getElementById('followupSubmitIcon');
  const catEl = document.getElementById('followupCategory');
  const msgEl = document.getElementById('followupMessage');

  // Display Applicant summary badge
  if (inquiryState.primary && badgeEl) {
    badgeEl.innerHTML = `<i class="fa-solid fa-user-check"></i> <strong>${escapeHtml(inquiryState.primary.company)} | ${escapeHtml(inquiryState.primary.name)}님</strong> (${escapeHtml(inquiryState.primary.phone)}) 정보로 연동 접수됩니다.`;
  }

  if (isEdit && inquiryState.followup) {
    if (titleEl) titleEl.textContent = '추가 문의 내용 수정';
    if (catEl) catEl.value = inquiryState.followup.category || '서비스 범위 및 세부 견적 문의';
    if (msgEl) msgEl.value = inquiryState.followup.message || '';
    if (btnText) btnText.textContent = '✓ 추가 문의 수정 반영하기';
    if (btnIcon) btnIcon.className = 'fa-solid fa-check';
  } else {
    if (titleEl) titleEl.textContent = '추가 문의 및 전달사항 작성';
    if (catEl) catEl.selectedIndex = 0;
    if (msgEl) msgEl.value = '';
    if (btnText) btnText.textContent = '➕ 추가 문의 전달하기';
    if (btnIcon) btnIcon.className = 'fa-solid fa-plus-circle';
  }

  document.getElementById('groupFollowupMessage')?.classList.remove('has-error');
  const errFollowup = document.getElementById('errorFollowupMessage');
  if (errFollowup) errFollowup.textContent = '';

  document.getElementById('contactFormContainer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// 3. Render and Show Success State with Dual Cards & Action Box Buttons
window.renderSuccessState = function() {
  const primaryForm = document.getElementById('consultationForm');
  const followupWrap = document.getElementById('followupFormWrap');
  const successWrap = document.getElementById('successStateWrap');

  if (!successWrap || !inquiryState.primary) return;

  if (primaryForm) primaryForm.style.display = 'none';
  if (followupWrap) followupWrap.style.display = 'none';
  successWrap.style.display = 'block';

  const primary = inquiryState.primary;
  const followup = inquiryState.followup;

  successWrap.innerHTML = `
    <div class="form-success-card">
      <div class="success-icon">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <h3>상담 신청이 성공적으로 접수되었습니다</h3>
      <p class="success-lead">
        <strong>${escapeHtml(primary.company)} (${escapeHtml(primary.name)}님)</strong>의 사전 미팅 신청 내역이 정상 등록되었습니다.
      </p>

      <!-- 1차 기본 상담 신청 내역 카드 -->
      <div class="submission-card primary-submission">
        <div class="card-header-bar">
          <div class="card-title-tag">
            <i class="fa-solid fa-file-lines"></i>
            <span>1차 기본 상담 신청 내역</span>
          </div>
          <button type="button" class="btn-card-action" onclick="showPrimaryForm(true)" title="1차 신청 내용 수정">
            <i class="fa-solid fa-pen-to-square"></i> 내용 수정
          </button>
        </div>
        <div class="card-body-details">
          <div class="detail-row"><span>임직원 규모:</span> <strong>${escapeHtml(primary.employees)}</strong></div>
          <div class="detail-row"><span>관심 영역:</span> <strong>${escapeHtml(primary.service)}</strong></div>
          <div class="detail-row"><span>회신 연락처:</span> <strong>${escapeHtml(primary.phone)}</strong></div>
          <div class="detail-row"><span>이메일 주소:</span> <strong>${escapeHtml(primary.email)}</strong></div>
          ${primary.message ? `
          <div class="detail-row message-row">
            <span>남기신 고민 사항:</span>
            <p>${escapeHtml(primary.message)}</p>
          </div>` : ''}
          <div class="detail-row timestamp-row">
            <span>접수 일시:</span>
            <small>${escapeHtml(primary.submittedAt)}${primary.updatedAt ? ` (최근 수정: ${escapeHtml(primary.updatedAt)})` : ''}</small>
          </div>
        </div>
      </div>

      <!-- 2차 추가 문의 내역 카드 (추가 문의 작성 시에만 노출) -->
      ${followup ? `
      <div class="submission-card followup-submission">
        <div class="card-header-bar">
          <div class="card-title-tag tag-followup">
            <i class="fa-solid fa-comments"></i>
            <span>2차 추가 문의 내역</span>
          </div>
          <button type="button" class="btn-card-action" onclick="showFollowupForm(true)" title="추가 문의 내용 수정">
            <i class="fa-solid fa-pen-to-square"></i> 내용 수정
          </button>
        </div>
        <div class="card-body-details">
          <div class="detail-row"><span>문의 구분:</span> <strong>${escapeHtml(followup.category)}</strong></div>
          <div class="detail-row message-row">
            <span>추가 전달 내용:</span>
            <p>${escapeHtml(followup.message)}</p>
          </div>
          <div class="detail-row timestamp-row">
            <span>접수 일시:</span>
            <small>${escapeHtml(followup.submittedAt)}${followup.updatedAt ? ` (최근 수정: ${escapeHtml(followup.updatedAt)})` : ''}</small>
          </div>
        </div>
      </div>
      ` : ''}

      <p class="success-notice">
        <i class="fa-solid fa-clock-rotate-left"></i> 접수 후 <strong>24시간 이내</strong>에 대표 컨설턴트가 기재해 주신 연락처로 일정 조율 안내를 드립니다.
      </p>

      <!-- 명확하게 분리된 2개의 박스 아이콘 액션 버튼 -->
      <div class="action-box-group">
        <div class="action-box-grid">
          <!-- 박스 1: 1차 신청 내용 수정 -->
          <button type="button" class="action-box-btn box-edit" onclick="showPrimaryForm(true)">
            <div class="box-icon-wrap">
              <i class="fa-solid fa-pen-to-square"></i>
            </div>
            <div class="box-text-wrap">
              <strong class="box-title">신청 내용 수정하기</strong>
              <span class="box-desc">회사 정보, 연락처, 상담 내용 변경</span>
            </div>
          </button>

          <!-- 박스 2: 추가 문의 작성 또는 수정 -->
          <button type="button" class="action-box-btn box-followup" onclick="${followup ? 'showFollowupForm(true)' : 'showFollowupForm(false)'}">
            <div class="box-icon-wrap">
              <i class="fa-solid ${followup ? 'fa-comment-dots' : 'fa-plus-circle'}"></i>
            </div>
            <div class="box-text-wrap">
              <strong class="box-title">${followup ? '추가 문의 내용 수정' : '추가 문의 작성하기'}</strong>
              <span class="box-desc">${followup ? '작성하신 추가 문의 내용 보완' : '추가 질문이나 요청 사항 덧붙이기'}</span>
            </div>
          </button>
        </div>

        <!-- 카카오톡 실시간 상담 버튼 -->
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
