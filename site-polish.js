'use strict';
(() => {
  const toggle = document.querySelector('.hyram-menu-toggle');
  const menu = document.getElementById('hyram-navigation');
  if (toggle && menu) {
    toggle.hidden = false;
    const close = () => { toggle.setAttribute('aria-expanded', 'false'); menu.dataset.collapsed = 'true'; };
    close();
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      menu.dataset.collapsed = String(!open);
    });
    menu.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { close(); toggle.focus(); }
    });
  }
  const reset = document.getElementById('hyram-reset-filters');
  if (reset) reset.addEventListener('click', () => {
    for (const id of ['search', 'brand', 'type', 'condition', 'shaft', 'length']) {
      const field = document.getElementById(id);
      if (field) { field.value = ''; field.dispatchEvent(new Event('input', {bubbles:true})); field.dispatchEvent(new Event('change', {bubbles:true})); }
    }
    document.getElementById('search')?.focus();
  });
  const region = document.getElementById('ccRegion');
  const updateRegions = () => {
    document.querySelectorAll('.region-chip').forEach(chip => {
      const active = chip.dataset.region === region.value;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    const names = document.getElementById('ccName');
    if (region.value && names?.disabled) {
      document.getElementById('ccDetails').textContent = '이 지역의 골프장 목록은 준비 중입니다. 골프장명을 직접 입력해 문의해 주세요.';
    }
  };
  if (region) { region.addEventListener('change', updateRegions); updateRegions(); }
  const phone = document.getElementById('phone');
  if (phone) phone.addEventListener('input', () => { phone.value = phone.value.replace(/[\s-]/g, ''); });
  const form = document.getElementById('requestForm');
  const name = document.getElementById('name');
  if (name) name.addEventListener('input', () => name.setCustomValidity(name.value.trim() ? '' : '성함을 입력해 주세요.'));
  if (form) {
    const hint = document.createElement('p');
    hint.className = 'hyram-form-hint';
    hint.id = 'hyram-local-draft';
    hint.textContent = '입력 내용은 이 화면에서 초안을 확인하는 데만 사용됩니다. 작성만으로 접수되거나 저장되지 않으며, 그룹 오픈채팅에는 개인정보를 보내지 마세요.';
    form.prepend(hint);
    form.setAttribute('aria-describedby', hint.id);
    const done = document.getElementById('done');
    if (done) {
      done.tabIndex = -1;
      form.addEventListener('submit', () => { if (!done.hidden) done.focus({preventScroll:true}); });
      form.addEventListener('input', () => {
        done.hidden = true;
        document.getElementById('requestStatus').textContent = '내용을 수정했습니다. 상담 초안을 다시 확인해 주세요.';
      });
      form.addEventListener('change', () => { done.hidden = true; });
    }
  }
})();
