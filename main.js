document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const sections = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6', 'section7'];
    const navMenu = document.querySelector('.nav-menu');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const header = document.querySelector('header');

    // 모든 섹션을 비동기로 로드
    async function loadSections() {
        for (const section of sections) {
            try {
                const response = await fetch(`${section}.html`);
                if (!response.ok) {
                    throw new Error(`Failed to load ${section}.html: ${response.statusText}`);
                }
                const html = await response.text();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const sectionElement = tempDiv.firstElementChild; // 섹션 태그 자체를 가져옴
                mainContent.appendChild(sectionElement);
                console.log(`${section}.html loaded.`);

                // 섹션 로드 후 GSAP 스크롤 트리거 초기화
                initScrollAnimations(sectionElement);

                // section1이 로드되면 이미지 슬라이드쇼 실행
                if (section === 'section1') {
                    initSection1Slideshow();
                }
            } catch (error) {
                console.error(`Error loading ${section}:`, error);
            }
        }
        // 모든 섹션 로드 완료 후 헤더 높이 계산 및 적용
        adjustSection1MarginTop();
    }

    // section1 이미지 슬라이드쇼 초기화 (GSAP 사용)
    function initSection1Slideshow() {
        const images = document.querySelectorAll('#section1 .fade-img');
        let currentImageIndex = 0;

        if (images.length === 0) {
            console.warn('No images found for section1 slideshow.');
            return;
        }

        // 초기 이미지 설정 (GSAP으로 페이드 인)
        gsap.to(images[currentImageIndex], { opacity: 1, duration: 1.5, ease: "power2.inOut" });

        function startSlideshow() {
            setInterval(() => {
                const prevImageIndex = currentImageIndex;
                currentImageIndex = (currentImageIndex + 1) % images.length;

                // 이전 이미지 페이드 아웃 및 비활성화
                gsap.to(images[prevImageIndex], {
                    opacity: 0,
                    duration: 1.5,
                    ease: "power2.inOut",
                    onComplete: () => {
                        images[prevImageIndex].classList.remove('active');
                    }
                });

                // 새 이미지 페이드 인
                images[currentImageIndex].classList.add('active');
                gsap.to(images[currentImageIndex],
                    { opacity: 1, duration: 1.5, ease: "power2.inOut" }
                );
            }, 5000); // 5초마다 이미지 전환
        }

        // GSAP 애니메이션 실행
        startSlideshow();

        // 섹션1 텍스트 애니메이션 (GSAP)
        gsap.fromTo('#section1 .section-text-overlay p:first-of-type',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power2.out" }
        );
        gsap.fromTo('#section1 .section-text-overlay .subtitle',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, delay: 0.8, ease: "power2.out" }
        );
        gsap.fromTo('#section1 .section-text-overlay p:nth-of-type(3)',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, delay: 1.1, ease: "power2.out" }
        );
        gsap.fromTo('#section1 .section-text-overlay p:nth-of-type(4)',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, delay: 1.4, ease: "power2.out" }
        );
        gsap.fromTo('#section1 .button',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, delay: 1.7, stagger: 0.2, ease: "power2.out" }
        );
    }

    // GSAP ScrollTrigger 애니메이션 초기화
    function initScrollAnimations(sectionElement) {
        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.create({
            trigger: sectionElement,
            start: "top 75%", // 뷰포트 상단에서 75% 지점에 도달했을 때 시작
            end: "bottom 25%", // 뷰포트 하단에서 25% 지점을 지날 때 종료
            onEnter: () => {
                if (!sectionElement.classList.contains('is-visible')) {
                    sectionElement.classList.add('is-visible');
                    // 특정 섹션에 대한 추가 애니메이션
                    animateSectionContent(sectionElement);
                }
            },
            onEnterBack: () => { // 스크롤을 위로 올릴 때도 애니메이션 다시 재생
                 if (!sectionElement.classList.contains('is-visible')) {
                    sectionElement.classList.add('is-visible');
                    animateSectionContent(sectionElement);
                }
            },
            // onLeave와 onLeaveBack은 주석 처리 또는 제거하여 섹션이 한 번 보이면 계속 보이도록
            // onLeave: () => {
            //      sectionElement.classList.remove('is-visible');
            // },
            // onLeaveBack: () => {
            //      sectionElement.classList.remove('is-visible');
            // }
            // markers: true // 개발용: 스크롤 트리거 시각화
        });
    }

    // 섹션별 내용 애니메이션 (좀 더 세분화된 애니메이션)
    function animateSectionContent(sectionElement) {
        const sectionId = sectionElement.id;

        // 모든 섹션의 제목에 공통 애니메이션
        gsap.fromTo(sectionElement.querySelector('h2'),
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power2.out" }
        );

        // 모든 섹션의 첫 번째 단락에 공통 애니메이션
        gsap.fromTo(sectionElement.querySelector('p:not(.subtitle):not(.summary-text)'),
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power2.out" }
        );

        switch (sectionId) {
            case 'section2':
                gsap.fromTo(sectionElement.querySelectorAll('.problem-category'),
                    { opacity: 0, y: 50 },
                    { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, delay: 0.6, ease: "power2.out" }
                );
                break;
            case 'section3':
                gsap.fromTo(sectionElement.querySelectorAll('.service-card'),
                    { opacity: 0, scale: 0.9 },
                    { opacity: 1, scale: 1, duration: 0.8, stagger: 0.15, delay: 0.6, ease: "back.out(1.7)" }
                );
                break;
            case 'section4':
                gsap.fromTo(sectionElement.querySelectorAll('.about-section-content'),
                    { opacity: 0, x: -50 },
                    { opacity: 1, x: 0, duration: 0.8, stagger: 0.2, delay: 0.6, ease: "power2.out" }
                );
                break;
            case 'section5':
                gsap.fromTo(sectionElement.querySelectorAll('.case-study-card'),
                    { opacity: 0, y: 50 },
                    { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, delay: 0.6, ease: "power2.out" }
                );
                break;
            case 'section6':
                gsap.fromTo(sectionElement.querySelectorAll('.why-point-item, .solve-point-item'),
                    { opacity: 0, rotateX: -90 },
                    { opacity: 1, rotateX: 0, duration: 0.9, stagger: 0.1, delay: 0.6, ease: "power2.out" }
                );
                break;
            case 'section7':
                gsap.fromTo(sectionElement.querySelectorAll('.testimonial-card'),
                    { opacity: 0, scale: 0.8 },
                    { opacity: 1, scale: 1, duration: 0.8, stagger: 0.15, delay: 0.6, ease: "back.out(1.7)" }
                );
                break;
        }
    }

    // 헤더 높이를 동적으로 계산하여 section1의 margin-top에 적용하는 함수
    function adjustSection1MarginTop() {
        const headerHeight = header.offsetHeight;
        const section1 = document.getElementById('section1');
        if (section1) {
            section1.style.marginTop = `${headerHeight}px`;
        }
    }

    // 햄버거 메뉴 토글 기능
    hamburgerMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        // 햄버거 메뉴 토글 시 section1 margin-top 재조정 (모바일에서 헤더 높이가 변할 수 있으므로)
        setTimeout(adjustSection1MarginTop, 300); // 애니메이션 시간 고려
    });

    // 내비게이션 링크 클릭 시 메뉴 닫기 (모바일)
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                setTimeout(adjustSection1MarginTop, 300); // 애니메이션 시간 고려
            }
        });
    });

    // 윈도우 크기 변경 시에도 헤더 높이 재조정
    window.addEventListener('resize', adjustSection1MarginTop);


    // 스크롤 이벤트에 따라 스크롤 투 탑 버튼 표시/숨김
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) { // 400px 이상 스크롤 시 버튼 표시 (기준점 높임)
            scrollToTopBtn.style.display = 'block';
            gsap.to(scrollToTopBtn, { opacity: 1, duration: 0.3 });
        } else {
            gsap.to(scrollToTopBtn, { opacity: 0, duration: 0.3, onComplete: () => {
                scrollToTopBtn.style.display = 'none';
            }});
        }
    });

    // 스크롤 투 탑 버튼 클릭 시 최상단으로 이동
    scrollToTopBtn.addEventListener('click', () => {
        gsap.to(window, { duration: 1.2, scrollTo: { y: 0 }, ease: "power3.inOut" }); // 스크롤 속도 및 이징 개선
    });


    loadSections();
});