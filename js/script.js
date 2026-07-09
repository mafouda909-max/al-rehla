const siteLinks = [
  { href: 'index.html', label: 'الرئيسية', page: 'home' },
  { href: 'tickets.html', label: 'عروض التذاكر', page: 'tickets' },
  { href: 'visas.html', label: 'عروض التأشيرات', page: 'visas' },
  { href: 'request.html', label: 'اطلب عرضًا', page: 'request' },
  { href: 'join-agent.html', label: 'انضم كوكيل', page: 'join-agent' }
];

const serviceContent = {
  ticket: {
    serviceName: 'تذكرة طيران',
    destinationLabel: 'الوجهة',
    destinationPlaceholder: 'الرياض / جدة / دبي',
    fromLabel: 'من أين؟',
    fromPlaceholder: 'القاهرة',
    dateLabel: 'تاريخ السفر المتوقع',
    travelersLabel: 'عدد المسافرين',
    notesPlaceholder: 'مثال: أبحث عن أقل سعر مع حقيبة 23 كجم أو رحلة مباشرة إن أمكن.',
    next: [
      'يظهر الطلب بشكل تجريبي في نسخة العرض الحالية.',
      'في النسخة الفعلية سيتم إرساله للوكلاء المناسبين.',
      'تأكيد السعر النهائي يكون قبل أي دفع.'
    ]
  },
  visa: {
    serviceName: 'تأشيرة',
    destinationLabel: 'الدولة المطلوبة',
    destinationPlaceholder: 'السعودية / الإمارات / عمان',
    fromLabel: 'نوع التأشيرة',
    fromPlaceholder: 'زيارة / سياحة / عمل',
    dateLabel: 'موعد التقديم المناسب',
    travelersLabel: 'عدد الملفات',
    notesPlaceholder: 'مثال: الأوراق جاهزة وأحتاج أسرع تنفيذ أو مراجعة للمستندات أولًا.',
    next: [
      'يُعرض الطلب كحالة تجريبية على المنصة.',
      'الوكيل يراجع المتطلبات ويعود لك بخطوات واضحة.',
      'المنصة لا تضمن القبول النهائي للتأشيرة.'
    ]
  },
  procedure: {
    serviceName: 'إجراءات سفر',
    destinationLabel: 'الخدمة أو الدولة',
    destinationPlaceholder: 'حجز فندقي / تأمين / دعوة / دولة محددة',
    fromLabel: 'نوع الإجراء',
    fromPlaceholder: 'تجهيز أوراق / استشارة / متابعة ملف',
    dateLabel: 'موعد التنفيذ المناسب',
    travelersLabel: 'عدد الأشخاص أو الملفات',
    notesPlaceholder: 'اشرح ما الذي تحتاجه بالضبط والموعد المتوقع وأي تفاصيل مهمة للوكيل.',
    next: [
      'يتم عرض الطلب بصورة توضيحية فقط في الـ MVP.',
      'في النسخة التالية يمكن ربطه بإدارة ومتابعة حقيقية.',
      'الوكيل المناسب يوضح لك التكلفة والخطوات بعد المراجعة.'
    ]
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || detectPage();

  renderShell(page);
  setupMobileMenu();
  setupHomeTabs();
  setupRequestTabs();

  if (page === 'home') renderHomePage();
  if (page === 'tickets') renderOffersPage('ticket');
  if (page === 'visas') renderOffersPage('visa');
  if (page === 'request') renderRequestPage();
  if (page === 'join-agent') renderJoinAgentPage();
  if (page === 'agent') renderAgentPage();
  if (page === 'offer-details') renderOfferDetailsPage();
  if (page === 'admin') renderAdminPage();

  setupDemoForms();
});

function detectPage() {
  const name = window.location.pathname.split('/').pop() || 'index.html';
  const map = {
    'index.html': 'home',
    'tickets.html': 'tickets',
    'visas.html': 'visas',
    'request.html': 'request',
    'join-agent.html': 'join-agent',
    'agent.html': 'agent',
    'offer-details.html': 'offer-details',
    'admin.html': 'admin'
  };
  return map[name] || 'home';
}

function renderShell(page) {
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');

  if (header) {
    const adminNav = page === 'admin'
      ? [
          { href: 'index.html', label: 'عرض الموقع', page: 'home' },
          { href: 'tickets.html', label: 'العروض', page: 'tickets' },
          { href: 'request.html', label: 'طلبات العملاء', page: 'request' }
        ]
      : siteLinks;

    header.innerHTML = `
      <div class="container nav">
        <a class="brand" href="index.html" aria-label="الرحلة">
          <img src="assets/logo.png" alt="الرحلة">
          <span>الرحلة</span>
        </a>
        <nav class="nav-links" aria-label="التنقل الرئيسي">
          ${adminNav.map(link => `
            <a href="${link.href}" class="${link.page === page ? 'active' : ''}">${link.label}</a>
          `).join('')}
        </nav>
        <div class="nav-actions">
          ${page === 'admin' ? '' : '<a class="btn btn-outline" href="admin.html">لوحة تجريبية</a>'}
          <button class="menu-btn" type="button" aria-label="فتح القائمة">☰</button>
        </div>
      </div>
    `;
  }

  if (footer) {
    const totals = getSummary();
    footer.innerHTML = `
      <div class="container footer-grid">
        <div>
          <a class="brand" href="index.html">
            <img src="assets/logo.png" alt="الرحلة">
            <span>الرحلة</span>
          </a>
          <p>منصة عربية مبسطة تجمع عروض السفر وطلبات العملاء في تجربة أولية واضحة وسهلة للعرض الأول.</p>
          <p class="footer-note">الأسعار تبدأ من وقد تتغير حسب التوافر. تأكيد السعر قبل أي دفع خطوة أساسية.</p>
        </div>
        <div>
          <h4>للعملاء</h4>
          <a href="tickets.html">تصفح عروض التذاكر</a>
          <a href="visas.html">تصفح عروض التأشيرات</a>
          <a href="request.html">اطلب عرضًا خاصًا</a>
        </div>
        <div>
          <h4>للوكلاء</h4>
          <a href="join-agent.html">انضم كوكيل مؤسس</a>
          <a href="agent.html">مثال ملف وكيل</a>
          <a href="admin.html">لوحة العرض التجريبية</a>
        </div>
        <div>
          <h4>لمحة سريعة</h4>
          <p>${totals.offers} عروض جاهزة</p>
          <p>${totals.agents} وكلاء نشطون</p>
          <p>${totals.countries} وجهات وخدمات مطلوبة</p>
        </div>
      </div>
    `;
  }
}

function setupMobileMenu() {
  const nav = document.querySelector('.nav');
  const menuBtn = document.querySelector('.menu-btn');
  if (!nav || !menuBtn) return;
  menuBtn.addEventListener('click', () => nav.classList.toggle('mobile-open'));
}

function setupHomeTabs() {
  const tabs = document.querySelectorAll('.tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.dataset.tab;
      document.querySelectorAll('[data-search-panel]').forEach(panel => {
        panel.style.display = panel.dataset.searchPanel === type ? 'grid' : 'none';
      });
    });
  });
}

function setupRequestTabs() {
  const tabs = document.querySelectorAll('.selector-tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelector('[name="serviceType"]').value = tab.dataset.service;
      tabs.forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      updateRequestFormCopy(tab.dataset.service);
    });
  });
}

function renderHomePage() {
  const homeOffers = document.querySelector('[data-home-offers]');
  const homeAgents = document.querySelector('[data-home-agents]');
  const routeGrid = document.querySelector('[data-route-grid]');
  const requestsGrid = document.querySelector('[data-open-requests]');
  const stats = getSummary();

  renderStats(document.querySelector('[data-home-stats]'), [
    { value: stats.offers, label: 'عرض نشط' },
    { value: stats.founders, label: 'وكيل مؤسس' },
    { value: openRequests.length, label: 'طلبات مفتوحة' }
  ]);

  if (homeOffers) {
    homeOffers.innerHTML = offers.slice(0, 6).map(offerCard).join('');
  }

  if (homeAgents) {
    homeAgents.innerHTML = agents.map(agentCard).join('');
  }

  if (routeGrid) {
    routeGrid.innerHTML = buildRouteCards();
  }

  if (requestsGrid) {
    requestsGrid.innerHTML = openRequests.map(requestCard).join('');
  }
}

function renderOffersPage(type) {
  const form = document.querySelector('[data-filter-form]');
  const grid = document.querySelector('[data-offers-grid]');
  const meta = document.querySelector('[data-filter-meta]');
  const count = document.querySelector('[data-results-count]');
  const empty = document.querySelector('[data-empty-state]');
  const search = readSearchParams();

  if (!form || !grid) return;

  prefillFormFromQuery(form, search);

  const apply = () => {
    const formData = new FormData(form);
    const query = Object.fromEntries(formData.entries());
    const filtered = filterOffers(type, query);
    grid.innerHTML = filtered.length ? filtered.map(offerCard).join('') : '';
    if (count) count.textContent = `${filtered.length} نتيجة`;
    if (meta) meta.innerHTML = buildFilterMeta(type, filtered);
    if (empty) empty.classList.toggle('hidden', filtered.length > 0);
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    apply();
  });

  form.addEventListener('reset', () => {
    window.setTimeout(apply, 0);
  });

  Array.from(form.elements).forEach(field => {
    if (field.tagName === 'INPUT' || field.tagName === 'SELECT') {
      field.addEventListener('change', apply);
    }
  });

  apply();
}

function renderRequestPage() {
  const serviceField = document.querySelector('[name="serviceType"]');
  const search = readSearchParams();
  const offer = offers.find(item => item.id === search.offer);
  const preferredService = offer ? (offer.type === 'ticket' ? 'ticket' : 'visa') : (search.service || 'ticket');

  if (serviceField) serviceField.value = preferredService;
  markActiveRequestTab(preferredService);
  updateRequestFormCopy(preferredService);

  const selectedOffer = document.querySelector('[data-selected-offer]');
  if (selectedOffer) {
    if (offer) {
      selectedOffer.classList.remove('hidden');
      selectedOffer.innerHTML = `
        <strong>الطلب مرتبط بعرض موجود:</strong>
        ${offer.title} - يبدأ من ${formatPrice(offer.price, offer.currency)} مع ${escapeHtml(offer.agent)}.
      `;
    } else {
      selectedOffer.classList.add('hidden');
      selectedOffer.innerHTML = '';
    }
  }
}

function renderJoinAgentPage() {
  const founderGrid = document.querySelector('[data-founder-agents]');
  if (founderGrid) {
    founderGrid.innerHTML = agents.map(agentCard).join('');
  }
}

function renderAgentPage() {
  const params = readSearchParams();
  const agent = agents.find(item => item.id === params.id) || agents[0];
  const relatedOffers = offers.filter(item => item.agentId === agent.id);

  const header = document.querySelector('[data-agent-header]');
  const stats = document.querySelector('[data-agent-stats]');
  const offersGrid = document.querySelector('[data-agent-offers]');
  const trust = document.querySelector('[data-agent-trust]');
  const contact = document.querySelector('[data-agent-contact]');

  if (header) {
    header.innerHTML = `
      <div class="agent-top">
        <img class="avatar" src="${agent.logo}" alt="${escapeHtml(agent.name)}">
        <div>
          <h1 class="offer-hero-title">${escapeHtml(agent.name)}</h1>
          <p>${escapeHtml(agent.specialty)} - ${escapeHtml(agent.city)}</p>
        </div>
      </div>
      <div class="badges">${agent.badges.map(label => `<span>${escapeHtml(label)}</span>`).join('')}</div>
      <p>${escapeHtml(agent.about)}</p>
    `;
  }

  renderStats(stats, [
    { value: agent.rating.toFixed(1), label: 'التقييم' },
    { value: agent.reviews, label: 'تقييمًا' },
    { value: relatedOffers.length, label: 'عرض نشط' },
    { value: `${agent.responseMinutes}د`, label: 'متوسط الرد' }
  ]);

  if (trust) {
    trust.innerHTML = `
      <div class="detail-card">
        <h3>لماذا يثق العميل بهذا الوكيل؟</h3>
        <ul class="detail-list">
          <li><strong>مجال التركيز:</strong> ${escapeHtml(agent.specialty)}</li>
          <li><strong>التغطية:</strong> ${agent.areas.map(escapeHtml).join('، ')}</li>
          <li><strong>وتيرة الرد:</strong> ${escapeHtml(agent.speed)}</li>
          <li><strong>وضعه على المنصة:</strong> ${escapeHtml(agent.founded)}</li>
        </ul>
      </div>
    `;
  }

  if (contact) {
    contact.innerHTML = `
      <div class="panel-card">
        <h3>تواصل سريع</h3>
        <p>إذا كان العرض مناسبًا لك أو تحتاج استشارة مباشرة، تواصل مع الوكيل عبر واتساب أو اطلب عرضًا خاصًا مرتبطًا به.</p>
        <div class="split-actions">
          <a class="btn btn-primary" href="request.html?agent=${agent.id}">اطلب عرضًا من هذا الوكيل</a>
          <a class="btn btn-soft" href="https://wa.me/${agent.phone}" target="_blank" rel="noreferrer">واتساب</a>
        </div>
      </div>
    `;
  }

  if (offersGrid) {
    offersGrid.innerHTML = relatedOffers.length
      ? relatedOffers.map(offerCard).join('')
      : emptyState('لا توجد عروض مرتبطة بهذا الوكيل الآن', 'يمكنك طلب عرض خاص وسيظهر للوكيل كفرصة جديدة.');
  }
}

function renderOfferDetailsPage() {
  const params = readSearchParams();
  const offer = offers.find(item => item.id === params.id) || offers[0];
  const agent = agents.find(item => item.id === offer.agentId) || agents[0];
  const related = offers.filter(item => item.type === offer.type && item.id !== offer.id).slice(0, 3);
  const fallbackBanner = document.querySelector('[data-fallback-banner]');
  const hero = document.querySelector('[data-offer-hero]');
  const details = document.querySelector('[data-offer-details]');
  const side = document.querySelector('[data-offer-side]');
  const relatedGrid = document.querySelector('[data-related-offers]');

  if (fallbackBanner) {
    if (!params.id || params.id === offer.id) {
      fallbackBanner.classList.add('hidden');
    } else {
      fallbackBanner.classList.remove('hidden');
      fallbackBanner.textContent = 'لم يتم العثور على العرض المطلوب، لذلك تم عرض أول عرض متاح من البيانات الحالية.';
    }
  }

  if (hero) {
    hero.innerHTML = `
      <span class="tag">${escapeHtml(offer.tag)}</span>
      <h1 class="offer-hero-title">${escapeHtml(offer.title)}</h1>
      <p>${escapeHtml(offer.desc)}</p>
      <div class="summary-pills">
        <span>${offer.type === 'ticket' ? `من ${escapeHtml(offer.from)} إلى ${escapeHtml(offer.to)}` : escapeHtml(offer.visaType || 'خدمة تأشيرة')}</span>
        <span>${escapeHtml(offer.country)}</span>
        <span>${escapeHtml(offer.updated)}</span>
      </div>
      <div class="notice">السعر يبدأ من وقد يتغير حسب التوافر. يجب طلب تأكيد السعر قبل أي دفع.</div>
    `;
  }

  if (details) {
    details.innerHTML = `
      <div class="detail-card">
        <h3>ماذا يشمل العرض؟</h3>
        <p>${escapeHtml(offer.includes)}</p>
      </div>
      <div class="detail-card">
        <h3>غير شامل</h3>
        <p>${escapeHtml(offer.excludes || 'أي خدمات غير مذكورة في هذا العرض.')}</p>
      </div>
      <div class="detail-card">
        <h3>صلاحية العرض</h3>
        <p>${escapeHtml(offer.validity)}</p>
      </div>
      <div class="detail-card">
        <h3>تنبيه مهم</h3>
        <p>${escapeHtml(offer.note)}</p>
      </div>
    `;
  }

  if (side) {
    side.innerHTML = `
      <div class="panel-card detail-summary">
        <div>
          <strong>السعر الحالي</strong>
          <div class="price">${formatPrice(offer.price, offer.currency)}</div>
        </div>
        <div class="meta">
          <span>${escapeHtml(offer.updated)}</span>
          <span>${escapeHtml(offer.validity)}</span>
        </div>
        <div class="info-note">${escapeHtml(offer.support || 'تواصل مع الوكيل لتأكيد السعر والتفاصيل النهائية.')}</div>
        <div class="split-actions">
          <a class="btn btn-primary" href="request.html?offer=${offer.id}&service=${offer.type === 'ticket' ? 'ticket' : 'visa'}">اطلب تأكيد السعر</a>
          <a class="btn btn-outline" href="agent.html?id=${agent.id}">عرض ملف الوكيل</a>
        </div>
      </div>
      <div class="panel-card">
        <h3>الوكيل المسؤول</h3>
        <div class="agent-top">
          <img class="avatar" src="${agent.logo}" alt="${escapeHtml(agent.name)}">
          <div>
            <strong>${escapeHtml(agent.name)}</strong>
            <p>${escapeHtml(agent.specialty)}</p>
          </div>
        </div>
        <div class="badges">${agent.badges.map(label => `<span>${escapeHtml(label)}</span>`).join('')}</div>
        <ul class="detail-list">
          <li><strong>التقييم:</strong> ${agent.rating} من 5 (${agent.reviews} مراجعة)</li>
          <li><strong>سرعة الرد:</strong> ${escapeHtml(agent.speed)}</li>
          <li><strong>التغطية:</strong> ${agent.areas.map(escapeHtml).join('، ')}</li>
        </ul>
        <a class="btn btn-soft" href="https://wa.me/${agent.phone}" target="_blank" rel="noreferrer">تواصل واتساب</a>
      </div>
    `;
  }

  if (relatedGrid) {
    relatedGrid.innerHTML = related.length ? related.map(offerCard).join('') : '';
  }
}

function renderAdminPage() {
  const stats = getSummary();
  const dashboard = document.querySelector('[data-admin-stats]');
  const requests = document.querySelector('[data-admin-requests]');
  const offersTable = document.querySelector('[data-admin-offers]');
  const joins = document.querySelector('[data-admin-joins]');

  renderStats(dashboard, [
    { value: stats.offers, label: 'إجمالي العروض' },
    { value: stats.tickets, label: 'عروض تذاكر' },
    { value: stats.visas, label: 'عروض تأشيرات' },
    { value: agents.length, label: 'وكلاء نشطون' }
  ]);

  if (requests) {
    requests.innerHTML = openRequests.map((request, index) => `
      <tr>
        <td>عميل تجريبي ${index + 1}</td>
        <td>${request.type === 'ticket' ? 'تذكرة' : 'تأشيرة'}</td>
        <td>${escapeHtml(request.title)}</td>
        <td>${escapeHtml(request.priority)}</td>
        <td><span class="status-badge ${index === 0 ? 'new' : index === 1 ? 'review' : 'pending'}">${index === 0 ? 'جديد' : index === 1 ? 'قيد المراجعة' : 'بانتظار وكيل'}</span></td>
      </tr>
    `).join('');
  }

  if (offersTable) {
    offersTable.innerHTML = offers.map(offer => `
      <tr>
        <td>${escapeHtml(offer.title)}</td>
        <td>${offer.type === 'ticket' ? 'تذكرة' : 'تأشيرة'}</td>
        <td>${escapeHtml(offer.agent)}</td>
        <td>${formatPrice(offer.price, offer.currency)}</td>
        <td><span class="status-badge pending">${escapeHtml(offer.updated)}</span></td>
      </tr>
    `).join('');
  }

  if (joins) {
    joins.innerHTML = joinRequests.map(request => `
      <li>
        <strong>${escapeHtml(request.name)}</strong><br>
        ${escapeHtml(request.service)} - ${escapeHtml(request.status)}
      </li>
    `).join('');
  }
}

function setupDemoForms() {
  document.querySelectorAll('form[data-demo-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const success = form.querySelector('.success-message');
      if (!success) return;
      const selectedType = form.querySelector('[name="serviceType"]')?.value || 'ticket';

      if (form.dataset.demoForm === 'request') {
        const config = serviceContent[selectedType] || serviceContent.ticket;
        success.innerHTML = `
          تم استلام طلب ${config.serviceName} كنموذج تجريبي للعرض الأول.
          في النسخة الحالية لا يتم إرسال بيانات حقيقية، لكن الخطوة التالية المتوقعة هي تواصل الوكيل المناسب مع العميل لتأكيد التفاصيل والسعر.
        `;
      }

      success.classList.add('visible');
      form.reset();

      const hiddenService = form.querySelector('[name="serviceType"]');
      if (hiddenService) {
        hiddenService.value = selectedType;
        markActiveRequestTab(selectedType);
        updateRequestFormCopy(selectedType);
      }
    });
  });
}

function updateRequestFormCopy(service) {
  const config = serviceContent[service] || serviceContent.ticket;
  const destinationLabel = document.querySelector('[data-destination-label]');
  const destinationInput = document.querySelector('[name="destination"]');
  const fromLabel = document.querySelector('[data-from-label]');
  const fromInput = document.querySelector('[name="routeOrType"]');
  const dateLabel = document.querySelector('[data-date-label]');
  const travelersLabel = document.querySelector('[data-travelers-label]');
  const notesInput = document.querySelector('[name="notes"]');
  const nextSteps = document.querySelector('[data-next-steps]');

  if (destinationLabel) destinationLabel.textContent = config.destinationLabel;
  if (destinationInput) destinationInput.placeholder = config.destinationPlaceholder;
  if (fromLabel) fromLabel.textContent = config.fromLabel;
  if (fromInput) fromInput.placeholder = config.fromPlaceholder;
  if (dateLabel) dateLabel.textContent = config.dateLabel;
  if (travelersLabel) travelersLabel.textContent = config.travelersLabel;
  if (notesInput) notesInput.placeholder = config.notesPlaceholder;
  if (nextSteps) {
    nextSteps.innerHTML = config.next.map((step, index) => `
      <div class="step-inline">
        <strong>${index + 1}</strong>
        <div>
          <b>${index === 0 ? 'بعد الإرسال' : index === 1 ? 'المتابعة' : 'التأكيد'}</b>
          <span>${escapeHtml(step)}</span>
        </div>
      </div>
    `).join('');
  }
}

function markActiveRequestTab(service) {
  document.querySelectorAll('.selector-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.service === service);
  });
}

function filterOffers(type, query) {
  return offers.filter(offer => {
    if (offer.type !== type) return false;

    const country = normalize(query.country);
    const from = normalize(query.from);
    const to = normalize(query.to);
    const visa = normalize(query.visa);
    const duration = normalize(query.duration);
    const sort = normalize(query.sort);

    const countryMatch = !country || normalize(offer.country).includes(country);
    const fromMatch = !from || normalize(offer.from).includes(from);
    const toMatch = !to || normalize(offer.to).includes(to) || normalize(offer.country).includes(to);
    const visaMatch = !visa || normalize(offer.visaType).includes(visa) || normalize(offer.title).includes(visa);
    const durationMatch = !duration || normalize(offer.duration).includes(duration);

    return countryMatch && fromMatch && toMatch && visaMatch && durationMatch;
  }).sort((a, b) => {
    const sort = normalize(query.sort);
    if (sort === 'high') return b.price - a.price;
    if (sort === 'updated') return a.updated.localeCompare(b.updated, 'ar');
    return a.price - b.price;
  });
}

function prefillFormFromQuery(form, search) {
  Object.entries(search).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field && typeof value === 'string') field.value = value;
  });
}

function buildFilterMeta(type, filtered) {
  const base = [
    { value: filtered.length, label: 'نتيجة متاحة الآن' },
    { value: filtered.length ? formatPrice(Math.min(...filtered.map(item => item.price)), filtered[0].currency) : '-', label: 'أقل سعر ظاهر' },
    { value: type === 'ticket' ? 'تأكيد السعر قبل الحجز' : 'القبول حسب الجهة المختصة', label: 'ملاحظة سريعة' }
  ];

  return base.map(item => `
    <div class="mini-stat">
      <strong>${escapeHtml(String(item.value))}</strong>
      <span>${escapeHtml(item.label)}</span>
    </div>
  `).join('');
}

function renderStats(node, items) {
  if (!node) return;
  node.innerHTML = items.map(item => `
    <div class="${node.classList.contains('dashboard') ? 'dash-card' : 'stat'}">
      <strong>${escapeHtml(String(item.value))}</strong>
      <span>${escapeHtml(item.label)}</span>
    </div>
  `).join('');
}

function buildRouteCards() {
  const countries = {};
  offers.forEach(offer => {
    countries[offer.country] = (countries[offer.country] || 0) + 1;
  });

  const routeMeta = [
    { name: 'السعودية', flag: '🇸🇦', href: 'tickets.html?country=السعودية', note: 'تذاكر وزيارة وإجراءات' },
    { name: 'الإمارات', flag: '🇦🇪', href: 'tickets.html?country=الإمارات', note: 'تذاكر وتأشيرات' },
    { name: 'الكويت', flag: '🇰🇼', href: 'tickets.html?country=الكويت', note: 'تذاكر الخليج' },
    { name: 'عمان', flag: '🇴🇲', href: 'visas.html?country=عمان', note: 'تأشيرات وخدمات سفر' }
  ];

  return routeMeta.map(route => `
    <a class="route-card" href="${route.href}">
      <span class="flag">${route.flag}</span>
      <div>
        <b>${route.name}</b>
        <small>${route.note}</small>
      </div>
      <strong>${countries[route.name] || 0} عروض</strong>
    </a>
  `).join('');
}

function offerCard(offer) {
  const action = offer.type === 'ticket' ? 'اطلب تأكيد السعر' : 'اطلب التفاصيل';
  const subtitle = offer.type === 'ticket'
    ? `${offer.from} - ${offer.to}`
    : `${offer.visaType || 'تأشيرة'} - ${offer.duration}`;

  return `
    <article class="offer-card">
      <div class="offer-head">
        <div>
          <h3>${escapeHtml(offer.title)}</h3>
          <div class="field-note">${escapeHtml(subtitle)}</div>
        </div>
        <span class="tag">${escapeHtml(offer.tag)}</span>
      </div>
      <div class="price">يبدأ من ${formatPrice(offer.price, offer.currency)}</div>
      <div class="meta">
        <span>${escapeHtml(offer.includes)}</span>
        <span>${escapeHtml(offer.updated)}</span>
        <span>${escapeHtml(offer.country)}</span>
      </div>
      <p>${escapeHtml(offer.desc)}</p>
      <div class="agent-row">
        <span>${escapeHtml(offer.agent)}</span>
        <span class="rating">★ ${(agents.find(agent => agent.id === offer.agentId)?.rating || 4.7).toFixed(1)}</span>
      </div>
      <div class="card-actions">
        <a class="btn btn-primary" href="request.html?offer=${offer.id}&service=${offer.type === 'ticket' ? 'ticket' : 'visa'}">${action}</a>
        <a class="btn btn-outline" href="offer-details.html?id=${offer.id}">تفاصيل</a>
      </div>
    </article>
  `;
}

function agentCard(agent) {
  return `
    <article class="agent-card">
      <div class="agent-top">
        <img class="avatar" src="${agent.logo}" alt="${escapeHtml(agent.name)}">
        <div>
          <h3>${escapeHtml(agent.name)}</h3>
          <p>${escapeHtml(agent.specialty)}</p>
        </div>
      </div>
      <div class="badges">${agent.badges.slice(0, 3).map(label => `<span>${escapeHtml(label)}</span>`).join('')}</div>
      <div class="agent-row">
        <span>${escapeHtml(agent.type)}</span>
        <span class="rating">★ ${agent.rating} (${agent.reviews})</span>
      </div>
      <div class="card-actions" style="margin-top:14px">
        <a class="btn btn-soft" href="agent.html?id=${agent.id}">عرض الملف</a>
        <a class="btn btn-primary" href="https://wa.me/${agent.phone}" target="_blank" rel="noreferrer">واتساب</a>
      </div>
    </article>
  `;
}

function requestCard(request) {
  return `
    <article class="request-card">
      <span class="request-type ${request.type === 'visa' ? 'visa' : ''}">${request.type === 'ticket' ? 'تذكرة' : 'تأشيرة'}</span>
      <h3>${escapeHtml(request.title)}</h3>
      <p>${escapeHtml(request.details)}</p>
      <div class="request-card-footer">
        <b>${request.offersCount} عروض وصلت</b>
        <a href="request.html">قدّم عرضًا</a>
      </div>
    </article>
  `;
}

function emptyState(title, text) {
  return `
    <div class="empty-state">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
      <div class="card-actions" style="justify-content:center;margin-top:16px">
        <a class="btn btn-primary" href="request.html">اطلب عرضًا خاصًا</a>
      </div>
    </div>
  `;
}

function getSummary() {
  const countries = new Set(offers.map(offer => offer.country));
  return {
    offers: offers.length,
    tickets: offers.filter(offer => offer.type === 'ticket').length,
    visas: offers.filter(offer => offer.type === 'visa').length,
    agents: agents.length,
    founders: agents.filter(agent => agent.badge.includes('مؤسس')).length,
    countries: countries.size
  };
}

function readSearchParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params.entries());
}

function formatPrice(value, currency) {
  return `${Number(value).toLocaleString('ar-EG')} ${currency}`;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
