const ASSET_SVG_URL = "./assets/korea_admin_divisions.svg";
const STORAGE_KEY = "matzip-map-records:v1";

const state = {
  mode: /** @type {"country" | "province"} */ ("country"),
  fullViewBox: null,
  selectedProvinceId: null,
  selectedProvinceName: null,
  selectedDistrictId: null,
  selectedDistrictName: null,
  svgEl: null,
};

const el = {
  backBtn: document.getElementById("backBtn"),
  titleText: document.getElementById("titleText"),
  subtitleText: document.getElementById("subtitleText"),
  hintText: document.getElementById("hintText"),
  mapRoot: document.getElementById("mapRoot"),
  mapLoading: document.getElementById("mapLoading"),
  feed: document.getElementById("feed"),
  feedTitle: document.getElementById("feedTitle"),
  clearDistrictBtn: document.getElementById("clearDistrictBtn"),
  sheetBackdrop: document.getElementById("sheetBackdrop"),
  sheet: document.getElementById("sheet"),
  sheetCloseBtn: document.getElementById("sheetCloseBtn"),
  sheetHeading: document.getElementById("sheetHeading"),
  sheetSubheading: document.getElementById("sheetSubheading"),
  entryForm: document.getElementById("entryForm"),
  provinceId: document.getElementById("provinceId"),
  provinceName: document.getElementById("provinceName"),
  districtId: document.getElementById("districtId"),
  districtName: document.getElementById("districtName"),
  visited: document.getElementById("visited"),
  placeName: document.getElementById("placeName"),
  notes: document.getElementById("notes"),
  toast: document.getElementById("toast"),
};

function normalizeName(raw) {
  if (!raw) return "";
  // Illustrator가 중복 방지를 위해 _000000... 같은 suffix를 붙이는 경우가 있음
  return String(raw).replace(/_[0-9]{6,}.*$/u, "");
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.remove("hidden");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => el.toast.classList.add("hidden"), 1400);
}
showToast._t = 0;

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function addRecord(entry) {
  const records = loadRecords();
  const now = new Date().toISOString();
  records.unshift({
    id: crypto?.randomUUID?.() ?? String(Date.now()),
    createdAt: now,
    updatedAt: now,
    ...entry,
  });
  saveRecords(records);
}

function deleteRecord(recordId) {
  const records = loadRecords().filter((r) => r.id !== recordId);
  saveRecords(records);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderFeed() {
  const records = loadRecords();
  const { selectedProvinceName, selectedDistrictName, selectedProvinceId, selectedDistrictId } = state;

  const hasDistrict = Boolean(selectedProvinceId && selectedDistrictId);

  el.clearDistrictBtn.classList.toggle("hidden", !hasDistrict);

  if (!hasDistrict) {
    el.feedTitle.textContent = "구/군을 선택하면 해당 기록이 표시돼요";
    const recent = records.slice(0, 6);
    if (recent.length === 0) {
      el.feed.innerHTML =
        '<div class="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">아직 저장된 기록이 없어요. 지도를 탭해서 첫 기록을 남겨보세요.</div>';
      return;
    }
    el.feedTitle.textContent = "최근 저장한 기록";
    el.feed.innerHTML = recent.map(renderCard).join("");
    bindDeleteButtons();
    return;
  }

  el.feedTitle.textContent = `${selectedProvinceName} · ${selectedDistrictName} 기록`;
  const filtered = records.filter((r) => r.provinceId === selectedProvinceId && r.districtId === selectedDistrictId);
  if (filtered.length === 0) {
    el.feed.innerHTML =
      '<div class="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">이 구/군에는 아직 기록이 없어요. 아래 입력창에서 저장해보세요.</div>';
    return;
  }
  el.feed.innerHTML = filtered.map(renderCard).join("");
  bindDeleteButtons();
}

function renderCard(r) {
  const icon = r.visited ? "✅" : "⬜";
  const subtitle = `${escapeHtml(r.provinceName)} · ${escapeHtml(r.districtName)} · ${new Date(r.createdAt).toLocaleDateString("ko-KR")}`;
  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <div class="text-lg" aria-hidden="true">${icon}</div>
            <div class="min-w-0 truncate text-base font-extrabold text-slate-900">${escapeHtml(r.placeName)}</div>
          </div>
          <div class="mt-1 truncate text-xs text-slate-500">${subtitle}</div>
        </div>
        <button
          class="deleteBtn h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 active:bg-slate-100"
          type="button"
          data-id="${escapeHtml(r.id)}"
        >
          삭제
        </button>
      </div>
      ${
        r.notes
          ? `<div class="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">${escapeHtml(
              r.notes,
            )}</div>`
          : ""
      }
    </article>
  `;
}

function bindDeleteButtons() {
  const buttons = el.feed.querySelectorAll(".deleteBtn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (!id) return;
      deleteRecord(id);
      showToast("삭제했어요");
      renderFeed();
    });
  });
}

function openSheet({ provinceId, provinceName, districtId, districtName }) {
  el.provinceId.value = provinceId;
  el.provinceName.value = provinceName;
  el.districtId.value = districtId;
  el.districtName.value = districtName;

  el.sheetHeading.textContent = `${provinceName} · ${districtName}`;
  el.sheetSubheading.textContent = "방문 기록을 저장하세요";

  el.visited.checked = false;
  el.placeName.value = "";
  el.notes.value = "";

  el.sheetBackdrop.classList.remove("hidden");
  el.sheet.classList.remove("hidden");
  window.setTimeout(() => el.placeName.focus(), 50);
}

function closeSheet() {
  el.sheetBackdrop.classList.add("hidden");
  el.sheet.classList.add("hidden");
}

function setModeCountry() {
  state.mode = "country";
  state.selectedProvinceId = null;
  state.selectedProvinceName = null;
  state.selectedDistrictId = null;
  state.selectedDistrictName = null;

  el.backBtn.classList.add("hidden");
  el.titleText.textContent = "전국 지도";
  el.subtitleText.textContent = "시/도를 탭해 확대하세요";
  el.hintText.textContent = "시/도 탭 → 구/군 탭 → 기록 저장";

  if (state.svgEl && state.fullViewBox) state.svgEl.setAttribute("viewBox", state.fullViewBox);

  if (state.svgEl) {
    const groups = state.svgEl.querySelectorAll("g[id]");
    groups.forEach((g) => {
      g.classList.remove("dimmed");
      g.classList.remove("active-province");
      g.setAttribute("data-province", "1");
    });

    const districtShapes = state.svgEl.querySelectorAll("[data-district]");
    districtShapes.forEach((s) => s.removeAttribute("data-district"));
  }

  renderFeed();
}

function setModeProvince(provinceGroupEl) {
  const provinceId = provinceGroupEl?.id;
  if (!provinceId) return;

  state.mode = "province";
  state.selectedProvinceId = provinceId;
  state.selectedProvinceName = normalizeName(provinceId);
  state.selectedDistrictId = null;
  state.selectedDistrictName = null;

  el.backBtn.classList.remove("hidden");
  el.titleText.textContent = state.selectedProvinceName;
  el.subtitleText.textContent = "구/군을 탭해 기록을 남기세요";
  el.hintText.textContent = "구/군을 탭하면 입력창이 열려요";

  if (state.svgEl) {
    const groups = state.svgEl.querySelectorAll("g[id]");
    groups.forEach((g) => {
      if (g === provinceGroupEl) {
        g.classList.remove("dimmed");
        g.classList.add("active-province");
      } else {
        g.classList.add("dimmed");
        g.classList.remove("active-province");
      }
      g.setAttribute("data-province", "1");
    });

    // 선택된 시/도의 하위 시/군/구를 클릭 대상으로 지정
    const shapes = provinceGroupEl.querySelectorAll("path[id], polygon[id]");
    shapes.forEach((shape) => shape.setAttribute("data-district", "1"));

    // Zoom-in: 해당 group bbox로 viewBox를 재설정
    try {
      const bbox = provinceGroupEl.getBBox();
      const pad = Math.max(8, Math.min(bbox.width, bbox.height) * 0.06);
      const vb = [bbox.x - pad, bbox.y - pad, bbox.width + pad * 2, bbox.height + pad * 2];
      state.svgEl.setAttribute("viewBox", vb.join(" "));
    } catch {
      // getBBox 실패 시(일부 브라우저/조건), viewBox 변경 없이 진행
    }
  }

  renderFeed();
}

function setSelectedDistrict({ districtIdRaw, districtName }) {
  state.selectedDistrictId = districtIdRaw;
  state.selectedDistrictName = districtName;
  renderFeed();
}

function wireEvents() {
  el.backBtn.addEventListener("click", () => setModeCountry());
  el.clearDistrictBtn.addEventListener("click", () => {
    state.selectedDistrictId = null;
    state.selectedDistrictName = null;
    renderFeed();
  });

  el.sheetBackdrop.addEventListener("click", closeSheet);
  el.sheetCloseBtn.addEventListener("click", closeSheet);

  el.entryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const provinceId = el.provinceId.value;
    const provinceName = el.provinceName.value;
    const districtId = el.districtId.value;
    const districtName = el.districtName.value;

    const visited = el.visited.checked;
    const placeName = el.placeName.value.trim();
    const notes = el.notes.value.trim();

    if (!placeName) {
      showToast("맛집 이름을 적어주세요");
      el.placeName.focus();
      return;
    }

    addRecord({ provinceId, provinceName, districtId, districtName, visited, placeName, notes });
    closeSheet();
    showToast("저장했어요");
    renderFeed();
  });
}

function decorateSvg(svgEl) {
  svgEl.classList.add("map-svg");
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svgEl.removeAttribute("width");
  svgEl.removeAttribute("height");
  svgEl.style.width = "100%";
  svgEl.style.height = "100%";

  // 레이어 표시용으로 stroke 조금 강화(모바일에서 구분감)
  const styleEl = svgEl.querySelector("style");
  if (styleEl && typeof styleEl.textContent === "string") {
    styleEl.textContent = styleEl.textContent.replace(/stroke-width:\s*0\.5;?/gu, "stroke-width:0.8;");
  }

  // 그룹/도형에 data 속성을 달아 이벤트 타겟팅을 안정화
  const groups = svgEl.querySelectorAll("g[id]");
  groups.forEach((g) => g.setAttribute("data-province", "1"));

  svgEl.addEventListener("click", (ev) => {
    const target = /** @type {Element | null} */ (ev.target instanceof Element ? ev.target : null);
    if (!target) return;

    if (state.mode === "country") {
      const provinceGroup = target.closest("g[id]");
      if (!provinceGroup) return;
      setModeProvince(provinceGroup);
      return;
    }

    if (state.mode === "province") {
      const provinceGroup = state.svgEl?.querySelector(`g[id="${CSS.escape(state.selectedProvinceId)}"]`);
      if (!provinceGroup) return;

      const shape = target.closest('path[id][data-district], polygon[id][data-district]');
      if (!shape || !provinceGroup.contains(shape)) return;

      const districtIdRaw = shape.getAttribute("id");
      if (!districtIdRaw) return;
      const districtName = normalizeName(districtIdRaw);

      setSelectedDistrict({ districtIdRaw, districtName });
      openSheet({
        provinceId: state.selectedProvinceId,
        provinceName: state.selectedProvinceName,
        districtId: districtIdRaw,
        districtName,
      });
    }
  });
}

async function loadSvgIntoDom() {
  el.mapLoading.classList.remove("hidden");
  try {
    const res = await fetch(ASSET_SVG_URL, { cache: "force-cache" });
    if (!res.ok) throw new Error(`SVG load failed: ${res.status}`);
    const text = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) throw new Error("SVG not found");

    // 앱에서 직접 조작하기 위해 importNode로 복사
    const imported = document.importNode(svg, true);
    state.svgEl = imported;
    state.fullViewBox = imported.getAttribute("viewBox");

    decorateSvg(imported);
    el.mapRoot.innerHTML = "";
    el.mapRoot.appendChild(imported);
    el.mapLoading.classList.add("hidden");

    setModeCountry();
  } catch (err) {
    el.mapLoading.textContent = "지도를 불러오지 못했어요. README의 로컬 서버 실행 방법을 확인해 주세요.";
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

wireEvents();
loadSvgIntoDom();
renderFeed();

