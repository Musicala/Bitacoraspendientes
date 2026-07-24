import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { FIREBASE_CONFIGS, COLLECTIONS, ADMIN_EMAILS } from "./firebase-config.js";

const state = {
  ripUser: null,
  bitacorasUser: null,
  fsaUser: null,
  ripRows: [],
  bitacorasRows: [],
  fsaClassLogs: [],
  bitacorasStudents: [],
  expectedRows: [],
  expandedLogs: [],
  results: [],
  filteredResults: [],
  personalView: false,
  teacherTab: "inicio",
  bitacoraSeg: "pending",
  teacherNamesByEmail: new Map(),
  teacherEmailsByName: new Map(),
  teacherCanonicalNames: [],
  teacherManualAliases: new Map(loadTeacherAliases()),
  catalogLoaded: false,
  catalogError: false,
  demoMode: false,
  loadingData: false,
  pendingAutoLoad: false,
  loadedForUsers: "",
};

const els = {
  ripLoginBtn: document.querySelector("#ripLoginBtn"),
  personalViewBtn: document.querySelector("#personalViewBtn"),
  bitacorasLoginBtn: document.querySelector("#bitacorasLoginBtn"),
  fsaLoginBtn: document.querySelector("#fsaLoginBtn"),
  signOutBtn: document.querySelector("#signOutBtn"),
  connectionStatus: document.querySelector("#connectionStatus"),
  connectionGuide: document.querySelector("#connectionGuide"),
  authActions: document.querySelector(".auth-actions"),
  topbar: document.querySelector(".topbar"),
  tabbar: document.querySelector("#tabbar"),
  tabbarPending: document.querySelector("#tabbarPending"),
  settingsPanel: document.querySelector("#settingsPanel"),
  settingsSlot: document.querySelector("#settingsSlot"),
  bitacoraSeg: document.querySelector("#bitacoraSeg"),
  rankingCard: document.querySelector("#rankingCard"),
  rankingPos: document.querySelector("#rankingPos"),
  rankingTotal: document.querySelector("#rankingTotal"),
  rankingPhrase: document.querySelector("#rankingPhrase"),
  rankingMedal: document.querySelector("#rankingMedal"),
  rankingRateChip: document.querySelector("#rankingRateChip"),
  rankingPodium: document.querySelector("#rankingPodium"),
  loadDataBtn: document.querySelector("#loadDataBtn"),
  runDemoBtn: document.querySelector("#runDemoBtn"),
  clearFiltersBtn: document.querySelector("#clearFiltersBtn"),
  filterCount: document.querySelector("#filterCount"),
  attentionPanel: document.querySelector("#attentionPanel"),
  attentionChips: document.querySelector("#attentionChips"),
  teacherGreetingTitle: document.querySelector("#teacherGreetingTitle"),
  teacherGreetingSub: document.querySelector("#teacherGreetingSub"),
  drawer: document.querySelector("#detailDrawer"),
  drawerOverlay: document.querySelector("#drawerOverlay"),
  drawerClose: document.querySelector("#drawerClose"),
  detailSummary: document.querySelector("#detailSummary"),
  fromDate: document.querySelector("#fromDate"),
  toDate: document.querySelector("#toDate"),
  teacherFilter: document.querySelector("#teacherFilter"),
  studentFilter: document.querySelector("#studentFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  sortFilter: document.querySelector("#sortFilter"),
  includeDuplicates: document.querySelector("#includeDuplicates"),
  kpiExpected: document.querySelector("#kpiExpected"),
  kpiPendingClasses: document.querySelector("#kpiPendingClasses"),
  kpiCompletedClasses: document.querySelector("#kpiCompletedClasses"),
  kpiLogs: document.querySelector("#kpiLogs"),
  kpiMissing: document.querySelector("#kpiMissing"),
  kpiReview: document.querySelector("#kpiReview"),
  kpiRate: document.querySelector("#kpiRate"),
  teacherKpis: document.querySelector("#teacherKpis"),
  classGroups: document.querySelector("#classGroups"),
  resultsBody: document.querySelector("#resultsBody"),
  lastUpdate: document.querySelector("#lastUpdate"),
  detailsBox: document.querySelector("#detailsBox"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  exportExpectedBtn: document.querySelector("#exportExpectedBtn"),
  exportExpandedBtn: document.querySelector("#exportExpandedBtn"),
  syncExpectedBtn: document.querySelector("#syncExpectedBtn"),
  toast: document.querySelector("#toast"),
  // Onboarding
  onboardingModal: document.querySelector("#onboardingModal"),
  onbStep1: document.querySelector("#onbStep1"),
  onbStep2: document.querySelector("#onbStep2"),
  onbStep3: document.querySelector("#onbStep3"),
  onbRipBtn: document.querySelector("#onbRipBtn"),
  onbBitacorasBtn: document.querySelector("#onbBitacorasBtn"),
  onbFsaBtn: document.querySelector("#onbFsaBtn"),
  onbEnterBtn: document.querySelector("#onbEnterBtn"),
  onbDemoBtn: document.querySelector("#onbDemoBtn"),
  onbEnterLabel: document.querySelector(".onb-enter-label"),
  // Streak
  streakWidget: document.querySelector("#streakWidget"),
  streakTrophyBadge: document.querySelector("#streakTrophyBadge"),
  streakTrophyTitle: document.querySelector("#streakTrophyTitle"),
  streakTrophyDesc: document.querySelector("#streakTrophyDesc"),
  streakIcon: document.querySelector("#streakIcon"),
  streakFlameWrap: document.querySelector("#streakFlameWrap"),
  streakDaysNum: document.querySelector("#streakDaysNum"),
  streakDaysSub: document.querySelector("#streakDaysSub"),
  streakRateArc: document.querySelector("#streakRateArc"),
  streakRateNum: document.querySelector("#streakRateNum"),
  streakRateSub: document.querySelector("#streakRateSub"),
  // Progreso docente (Te faltan N)
  tpTabs: document.querySelector("#tpTabs"),
  teacherProgress: document.querySelector("#teacherProgress"),
  tpRemaining: document.querySelector("#tpRemaining"),
  tpSub: document.querySelector("#tpSub"),
  tpTrack: document.querySelector("#tpTrack"),
  tpFill: document.querySelector("#tpFill"),
  tpDots: document.querySelector("#tpDots"),
  // Celebración
  celebrationOverlay: document.querySelector("#celebrationOverlay"),
  celebrationClose: document.querySelector("#celebrationClose"),
  celebrationCta: document.querySelector("#celebrationCta"),
  celebrationSub: document.querySelector("#celebrationSub"),
  celebrationStreak: document.querySelector("#celebrationStreak"),
  celebrationStreakText: document.querySelector("#celebrationStreakText"),
  celebStatDone: document.querySelector("#celebStatDone"),
  celebStatRate: document.querySelector("#celebStatRate"),
  celebStatLabel: document.querySelector("#celebStatLabel"),
};

const firebase = createFirebaseClients();
setDefaultDates();
positionTeacherSummary();
bindEvents();
listenAuth();
handleRedirectResults();
initOnboarding();
renderConnectionStatus();

function createFirebaseClients() {
  const ripApp = getApps().find((app) => app.name === "rip") || initializeApp(FIREBASE_CONFIGS.rip, "rip");
  const bitacorasApp = getApps().find((app) => app.name === "bitacoras") || initializeApp(FIREBASE_CONFIGS.bitacoras, "bitacoras");
  const fsaApp = getApps().find((app) => app.name === "fsa") || initializeApp(FIREBASE_CONFIGS.fsa, "fsa");

  return {
    rip: {
      app: ripApp,
      auth: getAuth(ripApp),
      db: getFirestore(ripApp),
      provider: buildGoogleProvider(),
    },
    bitacoras: {
      app: bitacorasApp,
      auth: getAuth(bitacorasApp),
      db: getFirestore(bitacorasApp),
      provider: buildGoogleProvider(),
    },
    fsa: {
      app: fsaApp,
      auth: getAuth(fsaApp),
      db: getFirestore(fsaApp),
      provider: buildGoogleProvider(),
    },
  };
}

function positionTeacherSummary() {
  const summary = els.teacherKpis?.closest(".teacher-kpis-panel");
  const mainKpis = document.querySelector(".kpi-grid");
  if (summary && mainKpis) mainKpis.after(summary);
}

function buildGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function bindEvents() {
  els.ripLoginBtn.addEventListener("click", () => loginProject("rip"));
  els.personalViewBtn.addEventListener("click", togglePersonalView);
  els.bitacorasLoginBtn.addEventListener("click", () => loginProject("bitacoras"));
  els.fsaLoginBtn.addEventListener("click", () => loginProject("fsa"));
  els.signOutBtn.addEventListener("click", signOutBoth);
  els.connectionGuide?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-login-project]");
    if (button) loginProject(button.dataset.loginProject);
  });
  els.loadDataBtn.addEventListener("click", () => loadRealData({ force: true }));
  els.runDemoBtn.addEventListener("click", runDemo);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.exportExpectedBtn.addEventListener("click", exportExpectedJson);
  els.exportExpandedBtn.addEventListener("click", exportExpandedBitacorasJson);
  els.syncExpectedBtn.addEventListener("click", syncExpectedClassLogs);
  els.clearFiltersBtn.addEventListener("click", clearFilters);
  [els.fromDate, els.toDate, els.includeDuplicates]
    .forEach((el) => el.addEventListener("input", () => reconcileAndRender()));
  [els.teacherFilter, els.studentFilter, els.statusFilter, els.sortFilter]
    .forEach((el) => el.addEventListener("input", debounce(applyFiltersAndRender, 220)));

  // Tabs de rango rápido para docentes (Hoy / Semana / Todas)
  els.tpTabs?.addEventListener("click", onRangeTabClick);

  // Menú inferior tipo app (Inicio / Bitácoras / Ajustes)
  els.tabbar?.addEventListener("click", (event) => {
    const btn = event.target.closest(".tabbar-btn");
    if (btn) setTeacherTab(btn.dataset.goto);
  });

  // Segmento Pendientes / Subidas dentro de Bitácoras
  els.bitacoraSeg?.addEventListener("click", (event) => {
    const btn = event.target.closest(".bita-seg-btn");
    if (btn) setBitacoraSegment(btn.dataset.seg);
  });

  // Celebración
  els.celebrationClose?.addEventListener("click", closeCelebration);
  els.celebrationCta?.addEventListener("click", closeCelebration);
  els.celebrationOverlay?.addEventListener("click", (event) => {
    if (event.target === els.celebrationOverlay) closeCelebration();
  });

  // Delegación: chips de atención, tarjetas de docente y filas de la tabla.
  els.attentionChips.addEventListener("click", onAttentionChipClick);
  els.teacherKpis.addEventListener("click", onTeacherCardClick);
  els.classGroups.addEventListener("click", onClassGroupClick);
  els.resultsBody.addEventListener("click", onResultRowClick);
  els.resultsBody.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      if (event.target.closest("tr[data-result-index]")) { event.preventDefault(); onResultRowClick(event); }
    }
  });

  // Drawer de detalle técnico.
  els.drawerClose.addEventListener("click", closeDrawer);
  els.drawerOverlay.addEventListener("click", closeDrawer);
  els.detailSummary.addEventListener("click", onTeacherAliasMerge);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.drawer.classList.contains("is-open")) closeDrawer();
  });
}

function clearFilters() {
  els.teacherFilter.value = "";
  els.studentFilter.value = "";
  els.statusFilter.value = "pending";
  els.sortFilter.value = "date";
  setDefaultDates();
  if (els.includeDuplicates.checked) {
    els.includeDuplicates.checked = false;
    reconcileAndRender();
  } else {
    reconcileAndRender();
  }
  toast("Filtros restablecidos.", "info");
}

function onAttentionChipClick(event) {
  const chip = event.target.closest(".attn-chip");
  if (!chip) return;
  const status = chip.dataset.status;
  els.statusFilter.value = els.statusFilter.value === status ? "all" : status;
  applyFiltersAndRender();
}

function onTeacherCardClick(event) {
  const card = event.target.closest(".teacher-kpi-card");
  if (!card) return;
  const key = card.dataset.teacherKey || "";
  const name = card.dataset.teacherName || "";
  const stat = event.target.closest(".teacher-kpi-stat");
  if (stat) {
    els.teacherFilter.value = name;
    els.statusFilter.value = stat.dataset.status || "all";
    applyFiltersAndRender();
    els.classGroups.closest(".class-groups-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const current = canonicalTeacherKey(els.teacherFilter.value);
  els.teacherFilter.value = current === key ? "" : name;
  applyFiltersAndRender();
}

function onResultRowClick(event) {
  const row = event.target.closest("tr[data-result-index]");
  if (!row) return;
  const index = Number(row.dataset.resultIndex);
  const item = state.filteredResults[index];
  if (!item) return;
  els.resultsBody.querySelectorAll("tr.is-selected").forEach((tr) => tr.classList.remove("is-selected"));
  row.classList.add("is-selected");
  openDetailDrawer(item);
}

function onClassGroupClick(event) {
  const button = event.target.closest(".class-teacher-alias-merge");
  if (!button) return;
  mergeTeacherAlias(button.dataset.alias || "", button.dataset.canonical || "");
}

function listenAuth() {
  onAuthStateChanged(firebase.rip.auth, (user) => {
    state.ripUser = user;
    renderConnectionStatus();
    updateOnboardingSteps();
    autoLoadDataWhenReady();
  });
  onAuthStateChanged(firebase.bitacoras.auth, (user) => {
    state.bitacorasUser = user;
    renderConnectionStatus();
    updateOnboardingSteps();
    autoLoadDataWhenReady();
  });
  onAuthStateChanged(firebase.fsa.auth, (user) => {
    state.fsaUser = user;
    renderConnectionStatus();
    updateOnboardingSteps();
    autoLoadDataWhenReady();
  });
}

function autoLoadDataWhenReady() {
  if (!state.ripUser || !state.bitacorasUser) return;
  const userKey = `${state.ripUser?.uid || state.ripUser?.email || "sin-rip"}|${state.bitacorasUser.uid || state.bitacorasUser.email}|${state.fsaUser?.uid || "sin-fsa"}`;
  if (state.loadingData) {
    state.pendingAutoLoad = state.loadedForUsers !== userKey;
    return;
  }
  if (state.loadedForUsers === userKey) return;
  // FSA suele terminar de restaurar su sesión después de RIP y Bitácoras.
  // Si ya hay una lectura FSA, no la borremos por ese estado transitorio.
  if (!state.fsaUser && state.fsaClassLogs.length && state.loadedForUsers) return;
  loadRealData({ force: false, userKey });
}

async function loginProject(projectKey) {
  try {
    const client = firebase[projectKey];
    if (shouldUseRedirectLogin()) {
      sessionStorage.setItem("musicala-pending-login-project", projectKey);
      await signInWithRedirect(client.auth, client.provider);
      return;
    }
    const result = await signInWithPopup(client.auth, client.provider);
    const email = result.user?.email || "";
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      toast(`Entraste como ${email}. Verás únicamente la información que te corresponde.`, "info");
    } else {
      const projectLabel = projectKey === "rip" ? "RIP" : projectKey === "fsa" ? "FSA" : "Bitácoras";
      toast(`Conectado a ${projectLabel} como ${email}.`, "success");
    }
  } catch (error) {
    console.error(error);
    toast(loginErrorMessage(error), "error");
  }
}

async function handleRedirectResults() {
  const projectKeys = ["rip", "bitacoras", "fsa"];
  for (const projectKey of projectKeys) {
    try {
      const result = await getRedirectResult(firebase[projectKey].auth);
      if (!result?.user) continue;
      sessionStorage.removeItem("musicala-pending-login-project");
      const label = projectKey === "rip" ? "RIP" : projectKey === "bitacoras" ? "Bitácoras" : "FSA";
      toast(`Conectado a ${label} como ${result.user.email || "tu cuenta"}.`, "success");
      break;
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem("musicala-pending-login-project");
      toast(loginErrorMessage(error), "error");
      break;
    }
  }
}

function shouldUseRedirectLogin() {
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    /WhatsApp|FBAN|FBAV|Instagram/i.test(navigator.userAgent);
}

function loginErrorMessage(error) {
  if (error?.code === "auth/unauthorized-domain") {
    return "Falta autorizar musicala.github.io en Firebase Authentication > Settings > Authorized domains.";
  }
  if (error?.code === "auth/popup-blocked" || error?.code === "auth/cancelled-popup-request") {
    return "El navegador bloqueó la ventana de acceso. Abre el enlace en Safari o Chrome e inténtalo de nuevo.";
  }
  return "No se pudo iniciar sesión. Abre el enlace en Safari o Chrome e inténtalo de nuevo.";
}

async function signOutBoth() {
  await Promise.allSettled([signOut(firebase.rip.auth), signOut(firebase.bitacoras.auth), signOut(firebase.fsa.auth)]);
  state.personalView = false;
  state.demoMode = false;
  state.loadedForUsers = "";
  state.pendingAutoLoad = false;
  state.ripRows = [];
  state.bitacorasRows = [];
  state.fsaClassLogs = [];
  state.bitacorasStudents = [];
  state.results = [];
  renderConnectionStatus();
  renderResults([]);
  renderKpis([]);
  renderTeacherKpis([]);
  renderAttention([]);
  updateFilterCount();
  // Al cerrar sesión, mostrar el modal de onboarding de nuevo
  openOnboarding();
  toast("Sesiones cerradas.", "info");
}

function renderConnectionStatus() {
  els.connectionStatus.innerHTML = [
    connectionPill("RIP", state.ripUser?.email),
    connectionPill("Bitácoras", state.bitacorasUser?.email),
    connectionPill("FSA", state.fsaUser?.email),
  ].join("");
  renderPersonalViewControl();
  applyRoleUi();
  renderConnectionGuide();
}

function renderConnectionGuide() {
  if (!els.connectionGuide) return;
  const ripStep = els.connectionGuide.querySelector('[data-login-project="rip"]');
  const bitacorasStep = els.connectionGuide.querySelector('[data-login-project="bitacoras"]');
  ripStep?.classList.toggle("is-connected", Boolean(state.ripUser));
  bitacorasStep?.classList.toggle("is-connected", Boolean(state.bitacorasUser));
  els.connectionGuide.hidden = Boolean(state.ripUser && state.bitacorasUser);
}

function connectionPill(label, email) {
  const on = Boolean(email);
  const who = on ? shortEmail(email) : "Sin conectar";
  return `
    <span class="conn-pill ${on ? "is-on" : "is-off"}" title="${escapeHtml(email || "Sin conectar")}">
      <span class="dot"></span><b>${escapeHtml(label)}</b>
      <span class="who">${escapeHtml(who)}</span>
    </span>`;
}

function shortEmail(email) {
  const text = String(email || "");
  return text.length > 22 ? `${text.slice(0, 20)}…` : text;
}

function applyRoleUi() {
  const access = getAccessContext();
  const isTeacher = !access.isAdmin;
  document.body.classList.toggle("teacher-view", isTeacher);
  document.body.classList.toggle("admin-view", access.isAdmin);

  // Menú inferior tipo app solo para docentes
  if (els.tabbar) els.tabbar.hidden = !isTeacher;
  if (els.bitacoraSeg) els.bitacoraSeg.hidden = !isTeacher;

  // Reubica el estado de conexión y las acciones de cuenta:
  // en docente van al panel de Ajustes; en admin, de vuelta a la topbar.
  moveAccountControls(isTeacher);

  // Aplica la pestaña activa (o limpia el estado de pestañas en admin)
  if (isTeacher) {
    applyTeacherTab();
    syncBitacoraSegmentButtons();
  } else {
    document.querySelectorAll("[data-tab].tab-off").forEach((el) => el.classList.remove("tab-off"));
  }
}

/**
 * Mueve #connectionStatus y .auth-actions al panel de Ajustes (docente)
 * o de vuelta a la topbar (admin). Los listeners viven en los elementos,
 * así que moverlos no rompe nada.
 */
function moveAccountControls(toSettings) {
  if (!els.settingsSlot || !els.connectionStatus || !els.authActions) return;
  const inSettings = els.settingsSlot.contains(els.connectionStatus);
  if (toSettings && !inSettings) {
    els.settingsSlot.append(els.connectionStatus, els.authActions);
  } else if (!toSettings && inSettings) {
    // Reinsertar en la topbar en su orden original (antes: spacer, conn, auth)
    els.topbar?.append(els.connectionStatus, els.authActions);
  }
}

/** Cambia de pestaña por interacción del usuario (con scroll al inicio). */
function setTeacherTab(tab) {
  const valid = ["inicio", "bitacoras", "settings"];
  state.teacherTab = valid.includes(tab) ? tab : "inicio";
  applyTeacherTab();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Aplica visualmente la pestaña activa sin hacer scroll (uso interno en render). */
function applyTeacherTab() {
  const next = state.teacherTab;
  document.body.setAttribute("data-teacher-tab", next);
  document.querySelectorAll("[data-tab]").forEach((el) => {
    el.classList.toggle("tab-off", el.dataset.tab !== next);
  });
  els.tabbar?.querySelectorAll(".tabbar-btn").forEach((btn) => {
    const active = btn.dataset.goto === next;
    btn.classList.toggle("is-active", active);
    if (active) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
}

/** Alterna entre bitácoras Pendientes / Subidas (usa el statusFilter). */
function setBitacoraSegment(seg) {
  state.bitacoraSeg = seg === "uploaded" ? "uploaded" : "pending";
  els.statusFilter.value = state.bitacoraSeg;
  syncBitacoraSegmentButtons();
  applyFiltersAndRender();
}

function syncBitacoraSegmentButtons() {
  els.bitacoraSeg?.querySelectorAll(".bita-seg-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.seg === state.bitacoraSeg);
  });
}

/**
 * Concurso: ubica al docente en el ranking de cumplimiento de TODOS los
 * docentes (usa el dataset completo en memoria) y muestra una frase.
 */
function renderRanking(allResults) {
  if (!els.rankingCard) return;
  const access = getAccessContext();
  if (access.isAdmin) { els.rankingCard.hidden = true; return; }

  const ranked = buildTeacherSummaries(allResults)
    .filter((t) => t.expected > 0)
    .sort((a, b) => b.rate - a.rate || a.missing - b.missing || b.classes - a.classes);

  const myIndex = ranked.findIndex((t) => access.teacherKeys.has(t.key));
  if (myIndex === -1 || ranked.length === 0) { els.rankingCard.hidden = true; return; }

  const me = ranked[myIndex];
  const pos = myIndex + 1;
  const total = ranked.length;
  els.rankingCard.hidden = false;

  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  els.rankingMedal.textContent = medals[pos] || (pos <= Math.ceil(total / 2) ? "🎵" : "🎯");
  els.rankingPos.textContent = `#${pos}`;
  els.rankingTotal.textContent = `de ${total}`;
  els.rankingRateChip.textContent = `${me.rate}%`;
  els.rankingPhrase.textContent = rankingPhrase(pos, total, me);

  // Mini podio: top 3 + tú si no estás en el podio
  const podium = ranked.slice(0, 3).map((t, i) => ({ t, place: i + 1 }));
  if (pos > 3) podium.push({ t: me, place: pos });
  els.rankingPodium.hidden = total < 2;
  els.rankingPodium.innerHTML = podium.map(({ t, place }) => {
    const mine = access.teacherKeys.has(t.key);
    const medal = medals[place] || `#${place}`;
    return `<span class="ranking-podium-item ${mine ? "is-me" : ""}">${medal} <b>${escapeHtml(mine ? "Tú" : firstNameOf(t.name))}</b> · ${t.rate}%</span>`;
  }).join("");
}

function firstNameOf(name) {
  const clean = String(name || "").trim();
  return clean ? clean.split(/\s+/)[0] : "Docente";
}

/** Frase bonita o chistosa según el puesto. */
function rankingPhrase(pos, total, me) {
  if (total === 1) return "Eres el único por ahora, ¡lidera con el ejemplo! 👑";
  if (pos === 1) return "¡Eres el #1! 🎉 Nadie sube bitácoras como tú.";
  if (pos === 2) return "¡Casi en la cima! Un empujoncito y tomas la corona. 👑";
  if (pos === 3) return "¡Podio! Estás entre los 3 mejores. 🔥";
  if (pos <= Math.ceil(total / 2)) return "Vas en la mitad de arriba, ¡sigue trepando! 💪";
  if (pos === total) return "Alguien tiene que ir de último... ¡hoy empiezas a subir! 😅🚀";
  return "Cada bitácora te acerca al podio, ¡tú puedes! 🚀";
}

/** Badge de pendientes en el menú inferior (Bitácoras). */
function updateTabbarBadge(allResults) {
  if (!els.tabbarPending) return;
  const access = getAccessContext();
  if (access.isAdmin) { els.tabbarPending.hidden = true; return; }
  const pending = allResults.filter((item) => {
    const tk = item.expected?.profesorKey || item.bitacora?.profesorKey || "";
    return access.teacherKeys.has(tk) && ["faltante", "parcial_grupal", "revisar"].includes(item.status);
  }).length;
  els.tabbarPending.hidden = pending === 0;
  els.tabbarPending.textContent = pending > 99 ? "99+" : String(pending);
}

function renderPersonalViewControl() {
  const email = String(state.bitacorasUser?.email || state.ripUser?.email || "").toLowerCase();
  const canToggle = [
    "catalina.medina.leal@gmail.com",
    "alekcaballeromusic@gmail.com",
  ].includes(email);
  els.personalViewBtn.hidden = !canToggle;
  els.personalViewBtn.textContent = state.personalView ? "Volver a vista administrativa" : "Ver mis pendientes";
}

function togglePersonalView() {
  state.personalView = !state.personalView;
  els.teacherFilter.value = "";
  els.studentFilter.value = "";
  els.statusFilter.value = "pending";
  renderPersonalViewControl();
  applyFiltersAndRender();
  toast(state.personalView ? "Mostrando únicamente tus clases y pendientes." : "Vista administrativa restaurada.", "info");
}

async function loadRealData({ force = true, userKey = "" } = {}) {
  if (!state.ripUser || !state.bitacorasUser) {
    toast("Conecta Bitácoras antes de cargar la información.", "info");
    return;
  }
  const isAdmin = isAdminEmail(state.bitacorasUser.email || state.ripUser?.email);
  if (isAdmin && !state.ripUser) {
    toast("Conecta RIP y Bitácoras antes de cargar la información administrativa.", "info");
    return;
  }
  const currentUserKey = userKey || `${state.ripUser?.uid || state.ripUser?.email || "sin-rip"}|${state.bitacorasUser.uid || state.bitacorasUser.email}|${state.fsaUser?.uid || "sin-fsa"}`;
  if (state.loadingData || (!force && state.loadedForUsers === currentUserKey)) return;
  state.loadingData = true;
  setLoading(true);
  state.demoMode = false;
  try {
    const [ripRows, bitacorasRows, students, fsaClassLogs] = await Promise.all([
      loadCollection(firebase.rip.db, COLLECTIONS.ripRegistro),
      loadCollection(firebase.bitacoras.db, COLLECTIONS.bitacoras),
      loadCollection(firebase.bitacoras.db, COLLECTIONS.bitacorasStudents),
      loadFsaClassLogs(),
    ]);
    await loadTeacherCatalog();
    state.ripRows = ripRows;
    state.bitacorasRows = bitacorasRows;
    state.bitacorasStudents = students;
    state.fsaClassLogs = fsaClassLogs;
    state.loadedForUsers = currentUserKey;
    reconcileAndRender();
    toast(`Información cargada: ${ripRows.length} registros RIP, ${bitacorasRows.length} bitácoras, ${students.length} estudiantes.`, "success");
  } catch (error) {
    console.error(error);
    toast("No se pudo cargar la información. Revisa tu conexión e inténtalo otra vez.", "error");
    els.classGroups.innerHTML = `<div class="empty-card access-warning"><strong>No se pudo cargar la información</strong><span>Revisa tu conexión con RIP y Bitácoras e inténtalo de nuevo.</span></div>`;
  } finally {
    state.loadingData = false;
    setLoading(false);
    if (state.pendingAutoLoad) {
      state.pendingAutoLoad = false;
      autoLoadDataWhenReady();
    }
  }
}

async function loadTeacherExpectedClassLogs(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return [];
  const expectedQuery = query(
    collection(firebase.bitacoras.db, COLLECTIONS.expectedClassLogs),
    where("profesorEmail", "==", normalizedEmail)
  );
  const snap = await getDocs(expectedQuery);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

function renderTeacherExpectedClassLogs(rows) {
  const results = rows.map((row) => {
    const status = normalizeExpectedStatus(row.reconciliationStatus);
    return {
      type: "expected",
      status,
      statusLabel: row.reconciliationLabel || statusLabel(status),
      expected: {
        expectedDocId: row.expectedDocId || row.id,
        ripRegistroId: row.ripRegistroId || "",
        fecha: row.fecha || "",
        hora: row.hora || "",
        profesor: row.profesorNombre || "",
        profesorKey: row.profesorKey || "",
        profesorEmail: row.profesorEmail || "",
        estudiante: row.estudianteNombre || "",
        estudianteKey: row.estudianteKey || "",
        contadorClase: row.contadorClase || null,
        classLogKey: row.classLogKey || "",
        servicioOriginal: row.servicioOriginal || "Clase",
      },
      bitacora: row.matchedBitacoraId ? { bitacoraId: row.matchedBitacoraId, title: "Bitácora vinculada" } : null,
      notes: row.reconciliationNotes || "Clase asignada desde RIP.",
    };
  });
  state.ripRows = [];
  state.bitacorasRows = [];
  state.bitacorasStudents = [];
  state.fsaClassLogs = [];
  state.expectedRows = results.map((item) => item.expected);
  state.expandedLogs = [];
  state.results = results;
  applyFiltersAndRender();
  els.lastUpdate.textContent = results.length
    ? `Actualizado ${new Date().toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}`
    : "No tienes clases pendientes en este periodo";
}

function normalizeExpectedStatus(value) {
  const status = String(value || "faltante").trim().toLowerCase();
  return ["ok", "faltante", "parcial_grupal", "revisar", "duplicada", "profe_distinto", "hora_diferente", "extra"].includes(status)
    ? status
    : "faltante";
}

function statusLabel(status) {
  return {
    ok: "Bitácora completa",
    faltante: "Falta bitácora",
    parcial_grupal: "Falta en grupal",
    revisar: "Necesita revisión",
    duplicada: "Duplicada",
    profe_distinto: "Docente distinto",
    hora_diferente: "Hora diferente",
    extra: "Sin clase en RIP",
  }[status] || "Falta bitácora";
}

async function loadCollection(db, collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

async function loadFsaClassLogs() {
  if (!state.fsaUser) return [];
  try {
    return await loadCollection(firebase.fsa.db, COLLECTIONS.fsaClassLogs);
  } catch (error) {
    console.warn("No se pudieron leer las bitácoras FSA:", error);
    toast("No fue posible leer FSA con esta cuenta; se cargó el resto de la información.", "info");
    return [];
  }
}

async function loadTeacherCatalog() {
  state.teacherNamesByEmail = new Map();
  state.teacherEmailsByName = new Map();
  state.teacherCanonicalNames = [];
  try {
    const snapshot = await getDoc(doc(firebase.bitacoras.db, "app_config", "catalogos"));
    const teachers = snapshot.exists() ? asArray(snapshot.data()?.docentes) : [];
    for (const teacher of teachers) {
      const email = firstText(teacher.email, teacher.correo, teacher.mail).toLowerCase();
      if (!email) continue;
      const names = uniqueStrings([teacher.nombre, teacher.alias, teacher.name])
        .map((name) => String(name).trim())
        .filter(Boolean);
      const primaryName = [...names].sort((a, b) => teacherNameTokens(b).length - teacherNameTokens(a).length)[0] || "";
      const primaryKey = canonicalTeacherKeyBase(primaryName);
      state.teacherCanonicalNames.push({ key: primaryKey, tokens: teacherNameTokens(primaryName) });
      const knownNames = state.teacherNamesByEmail.get(email) || new Set();
      names.map(canonicalTeacherKey).forEach((name) => knownNames.add(name));
      state.teacherNamesByEmail.set(email, knownNames);
      names.forEach((name) => state.teacherEmailsByName.set(canonicalTeacherKey(name), email));
    }
    state.catalogLoaded = true;
    state.catalogError = false;
  } catch (error) {
    state.catalogLoaded = false;
    state.catalogError = true;
    console.warn("No se pudo cargar el catálogo de docentes:", error);
  }
}

async function runDemo() {
  const [ripRows, bitacorasRows] = await Promise.all([
    fetchJson("data/sample-rip.json"),
    fetchJson("data/sample-bitacoras.json"),
  ]);
  els.fromDate.value = "2026-07-01";
  els.toDate.value = "2026-07-06";
  state.ripRows = ripRows;
  state.bitacorasRows = bitacorasRows;
  state.fsaClassLogs = [];
  state.demoMode = true;
  state.bitacorasStudents = demoStudentsFromRows(bitacorasRows);
  reconcileAndRender();
  toast("Modo prueba activo: datos de ejemplo para explorar la herramienta.", "success");
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`No se pudo leer ${path}`);
  return response.json();
}

function reconcileAndRender() {
  const expected = buildExpectedRows(state.ripRows, { includeDuplicates: els.includeDuplicates.checked });
  const expandedLogs = attachRipCounterToBitacoras([
    ...expandBitacoras(state.bitacorasRows, state.bitacorasStudents),
    ...expandFsaClassLogs(state.fsaClassLogs, expected),
  ], expected);
  const results = reconcile(expected, expandedLogs);
  state.expectedRows = expected;
  state.expandedLogs = expandedLogs;
  state.results = results;
  applyRoleUi();
  state.filteredResults = filterResults(results);
  const summaryResults = filterResults(results, { ignoreStatus: true });
  renderKpis(summaryResults, state.filteredResults);
  renderTeacherKpis(summaryResults);
  renderResults(state.filteredResults);
  renderAttention(state.results);
  updateFilterCount();
  updateTeacherGreeting(state.filteredResults);
  renderStreakWidget(state.results);
  renderRanking(state.results);
  updateTabbarBadge(state.results);
  els.lastUpdate.textContent = results.length
    ? `Actualizado ${new Date().toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}`
    : "Sin datos todavía";
}

function applyFiltersAndRender() {
  applyRoleUi();
  state.filteredResults = filterResults(state.results);
  const summaryResults = filterResults(state.results, { ignoreStatus: true });
  renderKpis(summaryResults, state.filteredResults);
  renderTeacherKpis(summaryResults);
  renderResults(state.filteredResults);
  renderAttention(state.results);
  updateFilterCount();
  updateTeacherGreeting(state.filteredResults);
  renderStreakWidget(state.results);
  renderRanking(state.results);
  updateTabbarBadge(state.results);
}


// Cuenta cuántos filtros están activos y lo muestra junto al título.
function updateFilterCount() {
  const active = countActiveFilters();
  els.filterCount.textContent = active ? `${active} filtro${active === 1 ? "" : "s"} activo${active === 1 ? "" : "s"}` : "";
  els.filterCount.classList.toggle("is-visible", active > 0);
}

function countActiveFilters() {
  let count = 0;
  if (els.teacherFilter.value.trim()) count += 1;
  if (els.studentFilter.value.trim()) count += 1;
  if (els.statusFilter.value !== "pending") count += 1;
  if (els.includeDuplicates.checked) count += 1;
  return count;
}

// Chips de "Requiere atención": cuentas por estado, clic para filtrar.
function renderAttention(results) {
  const order = [
    { status: "faltante", label: "Faltan bitácora", tone: "danger" },
    { status: "parcial_grupal", label: "Falta en grupal", tone: "danger" },
    { status: "revisar", label: "Necesitan revisión", tone: "warn" },
    { status: "profe_distinto", label: "Docente distinto", tone: "warn" },
    { status: "hora_diferente", label: "Hora diferente", tone: "warn" },
    { status: "duplicada", label: "Duplicadas", tone: "warn" },
    { status: "extra", label: "Sin clase en RIP", tone: "warn" },
  ];
  const counts = new Map();
  results.forEach((item) => counts.set(item.status, (counts.get(item.status) || 0) + 1));
  const active = order.filter((entry) => counts.get(entry.status));
  const current = els.statusFilter.value;

  if (!active.length) {
    els.attentionPanel.classList.add("is-clear");
    els.attentionChips.innerHTML = `
      <div class="attention-clear">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div><strong>Todo en orden.</strong><div class="small">No hay casos pendientes con estos filtros.</div></div>
      </div>`;
    return;
  }

  els.attentionPanel.classList.remove("is-clear");
  els.attentionChips.innerHTML = active.map((entry) => `
    <button type="button" class="attn-chip ${current === entry.status ? "is-active" : ""}"
            data-status="${entry.status}" data-tone="${entry.tone}"
            aria-pressed="${current === entry.status}">
      ${escapeHtml(entry.label)}
      <span class="n">${counts.get(entry.status)}</span>
    </button>
  `).join("");
}

function updateTeacherGreeting(results) {
  const access = getAccessContext();
  if (access.isAdmin) return;
  const expectedItems = results.filter((item) => item.type === "expected");
  const pending = expectedItems.filter((item) => ["faltante", "parcial_grupal", "revisar"].includes(item.status)).length;
  if (!expectedItems.length) {
    els.teacherGreetingTitle.textContent = "Hola 👋";
    els.teacherGreetingSub.textContent = "Aquí verás tus clases y pendientes.";
  } else if (pending === 0) {
    els.teacherGreetingTitle.textContent = "¡Vas al día! 🎉";
    els.teacherGreetingSub.textContent = "Sin pendientes por ahora.";
  } else {
    els.teacherGreetingTitle.textContent = `📌 ${pending} por resolver`;
    els.teacherGreetingSub.textContent = "Toca una clase y regístrala.";
  }
}

// =====================================================================
// ONBOARDING MODAL
// =====================================================================

function initOnboarding() {
  if (!els.onboardingModal) return;
  // Vincular botones del onboarding
  els.onbRipBtn?.addEventListener("click", async () => {
    await loginProject("rip");
    updateOnboardingSteps();
  });
  els.onbBitacorasBtn?.addEventListener("click", async () => {
    await loginProject("bitacoras");
    updateOnboardingSteps();
  });
  els.onbFsaBtn?.addEventListener("click", async () => {
    await loginProject("fsa");
    updateOnboardingSteps();
  });
  els.onbEnterBtn?.addEventListener("click", closeOnboarding);
  els.onbDemoBtn?.addEventListener("click", async () => {
    closeOnboarding();
    await runDemo();
  });

  // El onboarding se muestra al inicio; listenAuth lo irá actualizando
  // Mostrarlo directamente ya que no hay sesión todavía
  openOnboarding();
}

function openOnboarding() {
  if (!els.onboardingModal) return;
  els.onboardingModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeOnboarding() {
  if (!els.onboardingModal) return;
  els.onboardingModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function updateOnboardingSteps() {
  if (!els.onboardingModal) return;

  const ripDone = Boolean(state.ripUser);
  const bitacorasDone = Boolean(state.bitacorasUser);
  const fsaDone = Boolean(state.fsaUser);

  // Si ambas conexiones principales están activas al cargar (sesión restaurada),
  // cerrar el modal automáticamente sin que el usuario deba hacer clic
  if (ripDone && bitacorasDone) {
    closeOnboarding();
  }

  // Actualizar estado visual de cada paso
  els.onbStep1?.classList.toggle("is-done", ripDone);
  els.onbStep2?.classList.toggle("is-done", bitacorasDone);
  els.onbStep3?.classList.toggle("is-done", fsaDone);

  // Habilitar botón entrar
  const canEnter = ripDone && bitacorasDone;
  if (els.onbEnterBtn) {
    els.onbEnterBtn.disabled = !canEnter;
    if (els.onbEnterLabel) {
      els.onbEnterLabel.textContent = canEnter
        ? "¡Entrar a mis bitácoras!"
        : !ripDone
          ? "Conecta RIP para continuar"
          : "Conecta Bitácoras para continuar";
    }
  }
}

// =====================================================================
// STREAK WIDGET
// =====================================================================

function renderStreakWidget(allResults) {
  const access = getAccessContext();
  if (!els.streakWidget) return;

  // Solo visible en vista docente
  if (access.isAdmin) {
    els.streakWidget.hidden = true;
    if (els.tpTabs) els.tpTabs.hidden = true;
    if (els.teacherProgress) els.teacherProgress.hidden = true;
    return;
  }
  els.streakWidget.hidden = false;

  // ⚠️ CLAVE: filtrar SOLO las clases de este docente (sin filtro de estado)
  // para que los números correspondan a sus propios registros, no a todos los profes.
  const results = filterResults(allResults, { ignoreStatus: true });

  // --- Copa: pendientes de la semana actual ---
  const todayStr = todayKey();
  const weekStart = weekStartKey(todayStr);
  const weekEnd = weekEndKey(todayStr);

  const thisWeekExpected = results.filter((item) => {
    if (item.type !== "expected" || !item.expected) return false;
    const fecha = item.expected.fecha;
    return fecha >= weekStart && fecha <= weekEnd;
  });
  const thisWeekPending = thisWeekExpected.filter((item) =>
    ["faltante", "parcial_grupal", "revisar"].includes(item.status)
  ).length;
  const thisWeekTotal = thisWeekExpected.length;

  if (els.streakTrophyBadge) {
    els.streakTrophyBadge.textContent = thisWeekPending;
    els.streakTrophyBadge.classList.toggle("is-zero", thisWeekPending === 0);
  }
  if (els.streakTrophyTitle) {
    els.streakTrophyTitle.textContent = thisWeekPending === 0
      ? "¡Al día esta semana!"
      : `${thisWeekPending} pendiente${thisWeekPending === 1 ? "" : "s"} esta semana`;
  }
  if (els.streakTrophyDesc) {
    const done = thisWeekTotal - thisWeekPending;
    els.streakTrophyDesc.textContent = thisWeekPending === 0
      ? `Semana perfecta 🎉 · ${done} clase${done === 1 ? "" : "s"}`
      : `${done} de ${thisWeekTotal} listas esta semana`;
  }

  // --- Racha de días: días únicos con al menos 1 bitácora subida (solo las del profe) ---
  const streak = computeDayStreak(results);
  const prevStreak = Number(localStorage.getItem("musicala-streak-best") || 0);
  if (streak > prevStreak) {
    localStorage.setItem("musicala-streak-best", String(streak));
  }

  // Tipo de racha
  let icon, cls, sub;
  if (streak === 0) {
    icon = "💤"; cls = ""; sub = "Empieza tu racha hoy";
  } else if (streak < 3) {
    icon = "🔥"; cls = "is-fire"; sub = "¡Vas bien!";
  } else if (streak < 7) {
    icon = "⚡"; cls = "is-lightning"; sub = "¡Constancia de pro!";
  } else {
    icon = "💎"; cls = "is-diamond"; sub = "¡Leyenda Musicala!";
  }

  if (els.streakIcon) els.streakIcon.textContent = icon;
  if (els.streakFlameWrap) {
    els.streakFlameWrap.classList.toggle("is-active", streak > 0);
  }
  if (els.streakDaysSub) els.streakDaysSub.textContent = sub;

  // Animar el número de días
  if (els.streakDaysNum) {
    els.streakDaysNum.className = `streak-days-num ${cls}`;
    animateCounter(els.streakDaysNum, streak);
  }

  // --- Cumplimiento del periodo ---
  const expectedItems = results.filter((item) => item.type === "expected");
  const matched = expectedItems.filter((item) => ["ok", "duplicada", "hora_diferente"].includes(item.status)).length;
  const rate = expectedItems.length ? Math.round((matched / expectedItems.length) * 100) : 0;

  if (els.streakRateNum) els.streakRateNum.textContent = `${rate}%`;
  if (els.streakRateSub) {
    els.streakRateSub.textContent = `${matched} de ${expectedItems.length} clases`;
  }
  // Animar el arco SVG (circumference = 2π×20 ≈ 125.66)
  if (els.streakRateArc) {
    const offset = 125.66 * (1 - rate / 100);
    els.streakRateArc.style.strokeDashoffset = String(offset);
    els.streakRateArc.closest("[role=progressbar]")?.setAttribute("aria-valuenow", String(rate));
  }

  renderTeacherProgress(expectedItems);
  maybeCelebrate(expectedItems, { rate, streak });
}

// =====================================================================
// PROGRESO DOCENTE (Te faltan N) + TABS DE RANGO
// =====================================================================

function onRangeTabClick(event) {
  const tab = event.target.closest(".tp-tab");
  if (!tab) return;
  const range = tab.dataset.range;
  const today = todayKey();
  if (range === "today") {
    els.fromDate.value = today;
    els.toDate.value = today;
  } else if (range === "week") {
    els.fromDate.value = weekStartKey(today);
    els.toDate.value = weekEndKey(today);
  } else {
    setDefaultDates();
  }
  els.tpTabs.querySelectorAll(".tp-tab").forEach((el) => {
    el.classList.toggle("is-active", el === tab);
    el.setAttribute("aria-pressed", String(el === tab));
  });
  reconcileAndRender();
}

/**
 * Barra de progreso estilo "Te faltan N": puntos por clase (máx. 12)
 * y relleno proporcional a las bitácoras ya subidas del periodo visible.
 */
function renderTeacherProgress(expectedItems) {
  const access = getAccessContext();
  const show = !access.isAdmin && expectedItems.length > 0;
  if (els.tpTabs) els.tpTabs.hidden = access.isAdmin;
  if (!els.teacherProgress) return;
  els.teacherProgress.hidden = !show;
  if (!show) return;

  const total = expectedItems.length;
  const pending = expectedItems.filter((item) =>
    ["faltante", "parcial_grupal", "revisar"].includes(item.status)
  ).length;
  const done = total - pending;
  const pct = total ? Math.round((done / total) * 100) : 0;

  if (els.tpRemaining) els.tpRemaining.textContent = pending;
  els.teacherProgress.classList.toggle("is-complete", pending === 0);
  const title = els.teacherProgress.querySelector(".tp-title");
  if (title) {
    title.innerHTML = pending === 0
      ? "¡Estás al día! 🎉"
      : `Te falta${pending === 1 ? "" : "n"} <b id="tpRemaining">${pending}</b>`;
  }
  if (els.tpSub) {
    els.tpSub.textContent = pending === 0
      ? "Todas tus bitácoras del periodo están registradas."
      : pending <= 2
        ? "Te acercas a estar al día ✨"
        : `${done} de ${total} listas · ¡Tú puedes!`;
  }
  if (els.tpFill) els.tpFill.style.width = `${pct}%`;
  els.tpTrack?.setAttribute("aria-valuenow", String(pct));
  if (els.tpDots) {
    const dotCount = Math.min(total, 12);
    const doneDots = total ? Math.round((done / total) * dotCount) : 0;
    els.tpDots.innerHTML = Array.from({ length: dotCount }, (_, i) =>
      `<span class="tp-dot ${i < doneDots ? "is-done" : ""}"></span>`
    ).join("");
  }
}

// =====================================================================
// CELEBRACIÓN (¡Vas muy bien!)
// =====================================================================

function maybeCelebrate(expectedItems, { rate, streak }) {
  const access = getAccessContext();
  if (access.isAdmin || !expectedItems.length || !els.celebrationOverlay) return;
  const pending = expectedItems.filter((item) =>
    ["faltante", "parcial_grupal", "revisar"].includes(item.status)
  ).length;
  if (pending > 0) return;
  // Solo celebrar una vez al día para no volverse repetitivo.
  const seenKey = `musicala-celebrated-${todayKey()}`;
  if (localStorage.getItem(seenKey)) return;
  localStorage.setItem(seenKey, "1");
  openCelebration({ done: expectedItems.length, rate, streak });
}

function openCelebration({ done, rate, streak }) {
  if (els.celebStatDone) els.celebStatDone.textContent = done;
  if (els.celebStatRate) els.celebStatRate.textContent = `${rate}%`;
  if (els.celebStatLabel) {
    els.celebStatLabel.textContent = rate >= 95 ? "Excelente" : rate >= 80 ? "Muy bien" : "Bien";
  }
  if (els.celebrationStreak) {
    els.celebrationStreak.hidden = streak <= 0;
    if (streak > 0 && els.celebrationStreakText) {
      els.celebrationStreakText.textContent = `Racha de registro: ${streak} día${streak === 1 ? "" : "s"} seguido${streak === 1 ? "" : "s"}`;
    }
  }
  els.celebrationOverlay.setAttribute("aria-hidden", "false");
}

function closeCelebration() {
  els.celebrationOverlay?.setAttribute("aria-hidden", "true");
}

/**
 * Calcula la racha de días consecutivos hacia atrás desde hoy en que
 * el docente tiene al menos 1 bitácora subida (status ok, duplicada u hora_diferente).
 */
function computeDayStreak(results) {
  // Recopilar días únicos con bitácora subida
  const daysWithBitacora = new Set();
  for (const item of results) {
    if (["ok", "duplicada", "hora_diferente"].includes(item.status)) {
      const fecha = item.expected?.fecha || item.bitacora?.fecha;
      if (fecha) daysWithBitacora.add(fecha);
    }
  }
  if (!daysWithBitacora.size) return 0;

  let streak = 0;
  let cursor = new Date(todayKey() + "T12:00:00Z");
  // Buscar hacia atrás, máximo 90 días
  for (let i = 0; i < 90; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (daysWithBitacora.has(key)) {
      streak++;
    } else if (streak > 0) {
      // Rompió la racha
      break;
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/**
 * Devuelve el último día (domingo) de la semana que empieza en weekStart.
 */
function weekEndKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || "")) return "";
  const date = new Date(`${dateKey}T12:00:00Z`);
  const daysFromMonday = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - daysFromMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday.toISOString().slice(0, 10);
}

/** Anima un número del 0 al target en ~600 ms */
function animateCounter(el, target) {
  const duration = 600;
  const start = performance.now();
  const from = Number(el.textContent) || 0;
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = String(Math.round(from + (target - from) * eased));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function buildExpectedRows(rows, options = {}) {
  // El contador se calcula desde RIP: para cada dupla estudiante + profesor
  // se ordenan las clases cronologicamente y se asigna la posicion resultante.
  // Servicio/proceso no entra en la llave porque cambia entre sistemas.
  const classRows = rows
    .map(normalizeRipRow)
    .filter((row) => isClassType(row.tipo))
    .filter((row) => !isExcludedService(row.servicioOriginal))
    .filter((row) => options.includeDuplicates || !row.duplicateReview)
    .filter((row) => row.fecha && row.estudianteKey && row.profesorKey)
    .sort(sortClassRows);

  const counters = new Map();
  return classRows.map((row) => {
    const counterKey = `${row.estudianteKey}|${row.profesorKey}`;
    const next = (counters.get(counterKey) || 0) + 1;
    counters.set(counterKey, next);
    const classLogKey = buildClassLogKey(row.fecha, row.profesorKey, row.estudianteKey, next);
    return {
      ...row,
      contadorClase: next,
      classLogKey,
      expectedDocId: safeDocId(row.id || classLogKey),
    };
  }).filter(isWithinDateRange);
}

function normalizeRipRow(row) {
  const estudiante = firstText(row.estudiante, row.name, row.nombre, row.studentName);
  const estudianteId = firstText(row.studentId, row.estudianteId, row.studentRef, row.alumnoId, row.student?.id);
  const profesorOriginal = firstText(row.profesor, row.docente, row.teacherName, row.teacher);
  const profesor = canonicalTeacherName(profesorOriginal);
  const profesorKey = canonicalTeacherKey(profesorOriginal || row.profesorKey || row.teacherKey);
  const fecha = toDateKey(row.fecha || row.fechaRaw || row.date || row.fechaClase || row.fechaTs || row.createdAt);
  const hora = toTimeKey(row.hora || row.hour || row.time || "");
  return {
    raw: row,
    id: row.id || "",
    ripRegistroId: row.id || row.ripRegistroId || "",
    fecha,
    hora,
    tipo: firstText(row.tipo, row.type),
    estudiante,
    estudianteKey: normalizeKey(row.estudianteKey || row.studentKey || estudiante),
    estudianteId,
    studentCanonicalIds: canonicalStudentIds(estudianteId, row.estudianteKey, row.studentKey, estudiante),
    profesor,
    profesorKey,
    profesorEmail: firstText(row.profesorEmail, row.emailProfesor, row.teacherEmail).toLowerCase(),
    servicioOriginal: firstText(row.servicio, row.process, row.proceso),
    duplicateReview: Boolean(row.duplicateReview || row.isDuplicate || row.duplicada),
  };
}

function expandBitacoras(bitacoras, students) {
  const studentMap = buildStudentMap(students);
  const expanded = [];

  for (const bitacora of bitacoras) {
    const title = firstText(bitacora.title, bitacora.titulo, bitacora.name, bitacora.nombre);
    const titleData = parseClassRecordTitle(title);
    const serviceLabel = firstText(bitacora.servicio, bitacora.service, bitacora.proceso, bitacora.processLabel, bitacora.process?.processLabel, title);
    if (isExcludedService(serviceLabel)) continue;
    const fecha = toDateKey(
      bitacora.fechaClase || bitacora.fecha || bitacora.classDate || bitacora.date ||
      bitacora.fechaRegistro || bitacora.class?.date || bitacora.session?.date ||
      titleData.fecha || bitacora.createdAt
    );
    const hora = toTimeKey(
      bitacora.horaClase || bitacora.hora || bitacora.classTime || bitacora.time ||
      bitacora.sessionTime || bitacora.class?.time || bitacora.session?.time || ""
    );
    const docenteName = canonicalTeacherName(resolveTeacherName(bitacora));
    const profesorKey = canonicalTeacherKey(docenteName || bitacora.profesorKey || bitacora.teacherKey);
    const studentRefs = resolveStudentRefs(bitacora);
    const mode = firstText(bitacora.mode, bitacora.modo, studentRefs.length > 1 ? "group" : "individual");
    const counters = bitacora.classCounters || bitacora.contadoresClase || {};
    const explicitKeys = asArray(bitacora.classLogKeys || bitacora.classLogKey);
    const ripIds = asArray(bitacora.ripRegistroIds || bitacora.ripRegistroId || bitacora.ripIds);

    if (!studentRefs.length) {
      const name = firstText(
        bitacora.estudiante, bitacora.studentName, bitacora.nombreEstudiante,
        bitacora.student?.name, bitacora.student?.nombre, bitacora.selectedStudent?.name,
        bitacora.studentData?.name, titleData.estudiante
      );
      studentRefs.push({ id: normalizeKey(name), name, key: normalizeKey(name) });
    }

    // Una bitacora grupal se convierte en una fila por estudiante para poder
    // detectar grupos completos, parciales y extras con la misma regla.
    for (const studentRef of studentRefs) {
      const studentData = resolveStudentData(studentRef, studentMap);
      const estudianteKey = studentData.key;
      const estudiante = studentData.name;
      const contadorClase = Number(
        counters[studentRef.id] ||
        counters[studentData.key] ||
        counters[studentData.name] ||
        bitacora.contadorClase ||
        bitacora.classNumber ||
        0
      ) || null;
      const generatedKey = contadorClase
        ? buildClassLogKey(fecha, profesorKey, studentData.key, contadorClase)
        : "";
      expanded.push({
        bitacoraId: bitacora.id || "",
        raw: bitacora,
        fecha,
        hora,
        docente: docenteName,
        profesorKey,
        studentId: studentRef.id || studentData.id || "",
        estudiante,
        estudianteKey,
        studentCanonicalIds: canonicalStudentIds(studentRef.id, studentData.id, studentData.key, estudianteKey, estudiante),
        mode,
        contadorClase,
        classLogKeys: uniqueStrings([...explicitKeys, generatedKey]).filter(Boolean),
        ripRegistroIds: ripIds,
        title: firstText(title, bitacora.processLabel, bitacora.process?.processLabel),
      });
    }
  }
  return expanded;
}

// Los classLogs de FSA son bitácoras de sesión grupal: no incluyen cada
// estudiante. Se enlazan únicamente con una sesión RIP marcada FSA cuando
// coinciden fecha, docente y una hora/sesión no ambigua; luego se expanden a
// los estudiantes que RIP registra para esa sesión.
function expandFsaClassLogs(classLogs, expectedRows) {
  const sessions = new Map();
  expectedRows.filter(isFsaExpected).forEach((expected) => {
    const key = [expected.fecha, expected.profesorKey, expected.hora, normalizeKey(expected.servicioOriginal)].join("|");
    if (!sessions.has(key)) sessions.set(key, { expected: [], fecha: expected.fecha, profesorKey: expected.profesorKey, hora: expected.hora, servicio: expected.servicioOriginal });
    sessions.get(key).expected.push(expected);
  });

  const expanded = [];
  for (const classLog of classLogs || []) {
    const fecha = toDateKey(classLog.date || classLog.fecha || classLog.createdAt);
    const hora = toTimeKey(classLog.sessionTime || classLog.time || "");
    const teacherEmail = firstText(classLog.teacherEmail).toLowerCase();
    const teacherKey = canonicalTeacherKey(firstText(classLog.teacherName, classLog.teacher));
    const sessionName = firstText(classLog.sessionName, classLog.areaName);
    const candidates = [...sessions.values()].filter((session) =>
      session.fecha === fecha && (session.profesorKey === teacherKey || session.expected.some((row) => row.profesorEmail && row.profesorEmail === teacherEmail))
    );
    const session = chooseFsaSession(candidates, hora, sessionName);
    if (!session) continue;

    session.expected.forEach((expected) => expanded.push({
      bitacoraId: `fsa-${classLog.id || safeDocId(`${fecha}-${teacherEmail}-${hora}`)}`,
      raw: classLog,
      fecha,
      hora,
      docente: canonicalTeacherName(firstText(classLog.teacherName, expected.profesor)),
      profesorKey: expected.profesorKey,
      estudiante: expected.estudiante,
      estudianteKey: expected.estudianteKey,
      mode: "group",
      contadorClase: null,
      classLogKeys: [],
      ripRegistroIds: [expected.ripRegistroId],
      title: firstText(classLog.sessionName, classLog.areaName, "Sesión FSA"),
      source: "fsa",
    }));
  }
  return expanded;
}

function isFsaExpected(row) {
  return normalizeKey(row.servicioOriginal).includes("fsa");
}

function chooseFsaSession(candidates, logTime, sessionName) {
  if (!candidates.length) return null;
  const sessionKey = normalizeKey(sessionName);
  const byName = sessionKey
    ? candidates.filter((session) => normalizeKey(session.servicio).includes(sessionKey) || sessionKey.includes(normalizeKey(session.servicio)))
    : [];
  const options = byName.length ? byName : candidates;
  if (options.length === 1) return options[0];
  const ranked = options
    .map((session) => ({ session, diff: timeDistanceMinutes(logTime, session.hora) }))
    .filter((item) => item.diff !== null)
    .sort((a, b) => a.diff - b.diff);
  if (!ranked.length || ranked[0].diff > 75 || (ranked[1] && ranked[1].diff === ranked[0].diff)) return null;
  return ranked[0].session;
}

function buildStudentMap(students) {
  const map = new Map();
  for (const student of students || []) {
    const id = String(student.id || student.studentId || student.ref || "").trim();
    const name = firstText(student.name, student.nombre, student.displayName, student.estudiante, student.studentName, id);
    const key = normalizeKey(student.nameKey || student.estudianteKey || student.studentKey || name || id);
    [id, key, normalizeKey(id), name, normalizeKey(name)].filter(Boolean).forEach((candidate) => map.set(String(candidate), { id, name, key }));
  }
  return map;
}

function resolveStudentRefs(bitacora) {
  const out = [];
  const arrays = [
    bitacora.studentIds, bitacora.studentRefs, bitacora.students, bitacora.estudiantes,
    bitacora.alumnos, bitacora.selectedStudents, bitacora.participants, bitacora.studentList,
    bitacora.linkedStudentIds,
  ];
  arrays.forEach((items) => {
    asArray(items).forEach((item) => {
      if (typeof item === "string") out.push({ id: item, name: item, key: normalizeKey(item) });
      else if (item && typeof item === "object") {
        const id = firstText(item.id, item.studentId, item.ref, item.key, item.uid);
        const name = firstText(item.name, item.nombre, item.estudiante, item.studentName, id);
        out.push({ id, name, key: normalizeKey(item.nameKey || item.estudianteKey || item.studentKey || name || id) });
      }
    });
  });

  const singleId = firstText(
    bitacora.studentId, bitacora.studentRef, bitacora.estudianteId, bitacora.estudianteKey,
    bitacora.student?.id, bitacora.student?.studentId, bitacora.selectedStudent?.id,
    bitacora.studentData?.id, bitacora.primaryStudentId
  );
  const singleName = firstText(
    bitacora.estudiante, bitacora.studentName, bitacora.nombreEstudiante,
    bitacora.student?.name, bitacora.student?.nombre, bitacora.selectedStudent?.name,
    bitacora.studentData?.name
  );
  if (singleId || singleName) {
    out.push({ id: singleId || normalizeKey(singleName), name: singleName || singleId, key: normalizeKey(singleName || singleId) });
  }

  Object.entries(bitacora.studentOverrides || {}).forEach(([id, override]) => {
    const name = firstText(override?.name, override?.nombre, override?.estudiante, id);
    out.push({ id, name, key: normalizeKey(override?.nameKey || override?.estudianteKey || name || id) });
  });

  return mergeStudentRefs(out);
}

function mergeStudentRefs(items) {
  const merged = new Map();
  for (const item of items.filter((entry) => entry.id || entry.name)) {
    const id = String(item.id || "").trim();
    const name = firstText(item.name);
    const key = normalizeKey(item.key || name || id);
    const mergeKey = id || key;
    const existing = merged.get(mergeKey);
    if (!existing) {
      merged.set(mergeKey, { id, name, key });
      continue;
    }

    const existingNameLooksLikeId = looksLikeStudentId(existing.name);
    const newNameLooksLikeId = looksLikeStudentId(name);
    if ((!existing.name || existingNameLooksLikeId) && name && !newNameLooksLikeId) {
      existing.name = name;
      existing.key = normalizeKey(item.key || name);
    }
    if (!existing.id && id) existing.id = id;
  }
  return [...merged.values()];
}

function looksLikeStudentId(value) {
  return /^stu[-_]/i.test(String(value || "").trim());
}

function resolveStudentData(studentRef, map) {
  const refName = firstText(studentRef.name);
  const refNameIsHuman = refName && !looksLikeStudentId(refName);
  if (refNameIsHuman) {
    return {
      id: studentRef.id || "",
      name: refName,
      key: normalizeKey(studentRef.nameKey || studentRef.estudianteKey || refName),
    };
  }

  const candidates = [studentRef.id, studentRef.key, normalizeKey(studentRef.id), studentRef.name].filter(Boolean);
  for (const candidate of candidates) {
    if (map.has(candidate)) return map.get(candidate);
  }
  const name = firstText(studentRef.name, studentRef.id);
  return {
    id: studentRef.id || normalizeKey(name),
    name,
    key: normalizeKey(studentRef.key || name || studentRef.id),
  };
}

function resolveTeacherName(bitacora) {
  const docentes = asArray(bitacora.docentes || bitacora.teachers);
  const firstDocente = docentes[0];
  if (typeof firstDocente === "string") return firstDocente;
  if (firstDocente && typeof firstDocente === "object") {
    return firstText(firstDocente.name, firstDocente.nombre, firstDocente.email, firstDocente.id);
  }
  return firstText(
    bitacora.docente,
    bitacora.profesor,
    bitacora.teacherName,
    bitacora.teacher,
    bitacora.profesorNombre,
    bitacora.docenteNombre,
    bitacora.teacher?.name,
    bitacora.teacher?.nombre,
    bitacora.teacherData?.name,
    bitacora.docenteData?.name,
    bitacora.selectedTeacher?.name,
    bitacora.process?.docente,
    bitacora.process?.profesor,
    bitacora.metadata?.docente,
    bitacora.metadata?.profesor,
    bitacora.author?.name,
    bitacora.author?.email,
    bitacora.createdBy
  );
}

function parseClassRecordTitle(title) {
  const text = String(title || "").trim();
  // Formato actual de Bitácoras: "Registro de clase 2026-07-22 – Ricardo Chaparro Garcia".
  const match = text.match(/registro\s+de\s+clase\s+(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s*[-–—]\s*(.+)$/i);
  if (!match) return { fecha: "", estudiante: "" };
  return { fecha: toDateKey(match[1]), estudiante: match[2].trim() };
}


function attachRipCounterToBitacoras(expandedLogs, expectedRows) {
  return expandedLogs.map((log) => {
    const sameDayCandidates = expectedRows.filter((expected) => sameStudentTeacherDate(expected, log));
    // Respaldo para documentos antiguos/importados: el docente puede venir en
    // formatos distintos, pero fecha + estudiante canónico sigue siendo seguro
    // cuando existe una única clase RIP candidata ese día.
    const sameStudentDateCandidates = expectedRows.filter((expected) =>
      expected.fecha === log.fecha && sameCanonicalStudent(expected, log)
    );
    let matched = null;
    let counterSource = "";
    let reviewReason = "";

    matched = findExpectedByRipId(log, expectedRows);
    if (matched) counterSource = "rip_id_from_bitacora";

    if (!matched) {
      matched = findExpectedByClassKey(log, expectedRows);
      if (matched) counterSource = "class_log_key_from_bitacora";
    }

    if (!matched && log.contadorClase) {
      matched = sameDayCandidates.find((expected) => expected.contadorClase === log.contadorClase) || null;
      if (matched) counterSource = "counter_from_bitacora";
    }

    if (!matched && sameDayCandidates.length === 1) {
      matched = sameDayCandidates[0];
      counterSource = "rip_single_candidate";
    }

    if (!matched && sameStudentDateCandidates.length === 1) {
      matched = sameStudentDateCandidates[0];
      counterSource = "rip_student_date_fallback";
    }

    // Si hay varias clases del mismo estudiante con el mismo profe el mismo
    // dia, la hora es solo un desempate. Sin una decision clara, queda revisar.
    if (!matched && sameDayCandidates.length > 1) {
      const byTime = pickExpectedByClosestTime(log, sameDayCandidates);
      if (byTime.expected) {
        matched = byTime.expected;
        counterSource = "rip_time_match";
      } else {
        reviewReason = byTime.reason || "Hay varias clases RIP posibles para la misma fecha, profe y estudiante.";
      }
    }

    if (!matched) {
      return {
        ...log,
        counterSource: reviewReason ? "ambiguous_same_day" : (log.contadorClase ? "counter_without_rip_match" : "no_rip_match"),
        reviewReason,
        possibleExpectedDocIds: sameDayCandidates.map((expected) => expected.expectedDocId),
        possibleRipRegistroIds: sameDayCandidates.map((expected) => expected.ripRegistroId),
        possibleCounters: sameDayCandidates.map((expected) => expected.contadorClase),
      };
    }

    const contadorClase = matched.contadorClase;
    const classLogKey = buildClassLogKey(matched.fecha, matched.profesorKey, matched.estudianteKey, contadorClase);
    const timeDeltaMinutes = timeDistanceMinutes(log.hora, matched.hora);

    return {
      ...log,
      fecha: log.fecha || matched.fecha,
      horaRip: matched.hora || "",
      contadorClase,
      contadorClaseCalculado: contadorClase,
      counterSource,
      matchedExpectedDocId: matched.expectedDocId,
      matchedRipRegistroId: matched.ripRegistroId,
      timeDeltaMinutes,
      ripRegistroIds: uniqueStrings([...(log.ripRegistroIds || []), matched.ripRegistroId]),
      classLogKeys: uniqueStrings([...(log.classLogKeys || []), classLogKey]),
    };
  });
}

function findExpectedByRipId(log, expectedRows) {
  const ids = new Set(log.ripRegistroIds || []);
  if (!ids.size) return null;
  return expectedRows.find((expected) => ids.has(expected.ripRegistroId)) || null;
}

function findExpectedByClassKey(log, expectedRows) {
  const keys = new Set(log.classLogKeys || []);
  if (!keys.size) return null;
  return expectedRows.find((expected) => keys.has(expected.classLogKey)) || null;
}

function pickExpectedByClosestTime(log, candidates) {
  if (!log.hora) {
    return {
      expected: null,
      reason: "El estudiante tiene varias clases RIP el mismo día con el mismo profe y la bitácora no trae hora. Sin hora o vínculo manual, toca revisar.",
    };
  }

  const ranked = candidates
    .map((expected) => ({ expected, diff: timeDistanceMinutes(log.hora, expected.hora) }))
    .filter((item) => item.diff !== null)
    .sort((a, b) => a.diff - b.diff || String(a.expected.ripRegistroId).localeCompare(String(b.expected.ripRegistroId)));

  if (!ranked.length) {
    return {
      expected: null,
      reason: "Hay varias clases RIP posibles, pero no hay horas válidas suficientes para desempatar.",
    };
  }

  const best = ranked[0];
  const second = ranked[1];
  if (best.diff > 45) {
    return {
      expected: null,
      reason: `La hora de la bitácora queda a ${best.diff} minutos de la clase RIP más cercana. Mejor revisar antes de amarrarla mal.`,
    };
  }

  if (second && second.diff === best.diff) {
    return {
      expected: null,
      reason: "La hora queda empatada entre dos clases RIP posibles. El universo eligió violencia administrativa; toca revisar manualmente.",
    };
  }

  return { expected: best.expected, reason: "" };
}

function timeDistanceMinutes(a, b) {
  const am = timeToMinutes(a);
  const bm = timeToMinutes(b);
  if (am === null || bm === null) return null;
  return Math.abs(am - bm);
}

function timeToMinutes(value) {
  const key = toTimeKey(value);
  const match = key.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function reconcile(expectedRows, expandedLogs) {
  const results = [];
  const usedLogs = new Set();

  // Estados de conciliacion:
  // ok, faltante, extra, revisar, duplicada, parcial_grupal, profe_distinto,
  // hora_diferente. Los casos ambiguos no se inventan: se mandan a revisar.
  for (const expected of expectedRows) {
    const sameDayLogs = expandedLogs.filter((log) => sameStudentTeacherDate(expected, log));
    const exactCandidates = sameDayLogs.filter((log) => logMatchesExpected(log, expected));
    const ambiguousCandidates = sameDayLogs.filter((log) =>
      log.counterSource === "ambiguous_same_day" &&
      asArray(log.possibleExpectedDocIds).includes(expected.expectedDocId)
    );
    const availableExact = exactCandidates.filter((log) => !usedLogs.has(logUsageKey(log)));

    const exactByRipId = availableExact.find((log) => log.ripRegistroIds.includes(expected.ripRegistroId));
    const exactByKey = availableExact.find((log) => log.classLogKeys.includes(expected.classLogKey));
    const byAttachedExpected = availableExact.find((log) => log.matchedExpectedDocId === expected.expectedDocId);
    const byCounter = availableExact.find((log) => log.contadorClase && log.contadorClase === expected.contadorClase);

    let matched = exactByRipId || exactByKey || byAttachedExpected || byCounter || null;
    let status = "faltante";
    let statusLabel = "Falta bitácora";
    let notes = "No se encontró bitácora para esta clase.";

    if (matched) {
      usedLogs.add(logUsageKey(matched));
      status = "ok";
      statusLabel = matched.counterSource === "rip_single_candidate" ? "Coincidencia probable" : "Bitácora completa";
      notes = matched.counterSource === "rip_single_candidate"
        ? "Solo había una clase RIP posible para esa fecha + profe + estudiante; el contador fue calculado desde RIP."
        : "Coincide por ID, llave, contador calculado o por hora como desempate.";

      if (matched.counterSource === "rip_time_match") {
        notes = `Coincide por fecha + profe + estudiante y la hora fue el desempate. Diferencia: ${matched.timeDeltaMinutes ?? "—"} min.`;
      }
      if (matched.hora && expected.hora && matched.hora !== expected.hora) {
        status = "hora_diferente";
        statusLabel = "Hora diferente";
        notes += ` Hora diferente: RIP ${expected.hora}, bitácora ${matched.hora}.`;
      }

      const duplicates = availableExact.filter((log) => log !== matched);
      if (duplicates.length) {
        status = "duplicada";
        statusLabel = "Duplicada";
        notes += ` Hay ${duplicates.length} bitácora(s) adicional(es) para esta misma clase.`;
        duplicates.forEach((log) => usedLogs.add(logUsageKey(log)));
      }
    } else if (ambiguousCandidates.length) {
      const ambiguous = ambiguousCandidates[0];
      usedLogs.add(logUsageKey(ambiguous));
      matched = ambiguous;
      status = "revisar";
      statusLabel = "Necesita revisión";
      notes = ambiguous.reviewReason || "Hay una bitácora probable, pero no se puede saber a cuál clase RIP pertenece sin hora o vínculo manual.";
    } else {
      const teacherMismatch = expandedLogs.find((log) =>
        log.fecha === expected.fecha &&
        log.estudianteKey === expected.estudianteKey &&
        log.profesorKey !== expected.profesorKey
      );
      const groupSameTeacher = expandedLogs.find((log) =>
        log.fecha === expected.fecha &&
        log.profesorKey === expected.profesorKey &&
        String(log.mode).toLowerCase() === "group"
      );

      if (teacherMismatch) {
        matched = teacherMismatch;
        usedLogs.add(logUsageKey(teacherMismatch));
        status = "profe_distinto";
        statusLabel = "Docente distinto";
        notes = `Hay bitácora para el estudiante en la fecha, pero con otro docente: ${teacherMismatch.docente || teacherMismatch.profesorKey}.`;
      } else if (groupSameTeacher) {
        status = "parcial_grupal";
        statusLabel = "Falta en grupal";
        notes = "Existe bitácora grupal para ese día/profe, pero no incluye a este estudiante.";
      }
    }

    results.push({
      type: "expected",
      status,
      statusLabel,
      expected,
      bitacora: matched,
      notes,
    });
  }

  for (const log of expandedLogs) {
    const usageKey = logUsageKey(log);
    if (usedLogs.has(usageKey)) continue;
    if (!isWithinDateRange(log)) continue;
    results.push({
      type: "extra",
      status: log.counterSource === "ambiguous_same_day" ? "revisar" : "extra",
      statusLabel: log.counterSource === "ambiguous_same_day" ? "Necesita revisión" : "Sin clase en RIP",
      expected: null,
      bitacora: log,
      notes: log.reviewReason || "Hay bitácora, pero no se encontró clase RIP equivalente en el periodo/filtros.",
    });
  }

  return enrichPossibleMatches(results).sort((a, b) => {
    const ad = a.expected?.fecha || a.bitacora?.fecha || "";
    const bd = b.expected?.fecha || b.bitacora?.fecha || "";
    const ah = a.expected?.hora || a.bitacora?.hora || "";
    const bh = b.expected?.hora || b.bitacora?.hora || "";
    return ad.localeCompare(bd) || ah.localeCompare(bh) || getStudentName(a).localeCompare(getStudentName(b), "es");
  });
}

function logMatchesExpected(log, expected) {
  return log.matchedExpectedDocId === expected.expectedDocId ||
    asArray(log.ripRegistroIds).includes(expected.ripRegistroId) ||
    asArray(log.classLogKeys).includes(expected.classLogKey) ||
    (log.contadorClase && log.contadorClase === expected.contadorClase && sameStudentTeacherDate(expected, log));
}

function logUsageKey(log) {
  return `${log.bitacoraId || "sin-id"}|${log.estudianteKey || "sin-estudiante"}`;
}

// Busca errores frecuentes de fecha sin conciliarlos automáticamente: la misma
// persona en la misma semana, o una bitácora grupal no relacionada con el mismo
// conjunto de participantes. Así la persona revisora ve una pista, no una unión
// inventada por el sistema.
function enrichPossibleMatches(results) {
  const extraItems = results.filter((item) => item.type === "extra" && item.bitacora);
  const expectedItems = results.filter((item) => item.type === "expected" && item.expected);
  const sessions = new Map();

  expectedItems.forEach((item) => {
    const row = item.expected;
    const key = [row.fecha, row.hora, row.profesorKey, normalizeKey(row.servicioOriginal)].join("|");
    if (!sessions.has(key)) sessions.set(key, new Set());
    sessions.get(key).add(row.estudianteKey);
  });

  const extraGroups = new Map();
  extraItems.forEach((item) => {
    const log = item.bitacora;
    if (String(log.mode).toLowerCase() !== "group") return;
    const key = log.bitacoraId || `sin-id-${log.fecha}`;
    if (!extraGroups.has(key)) extraGroups.set(key, { log, students: new Set(), items: [] });
    const group = extraGroups.get(key);
    group.students.add(log.estudianteKey);
    group.items.push(item);
  });

  const suggestionsByExtra = new Map();
  expectedItems.forEach((item) => {
    if (!["faltante", "parcial_grupal", "revisar"].includes(item.status)) return;
    const expected = item.expected;
    const sessionKey = [expected.fecha, expected.hora, expected.profesorKey, normalizeKey(expected.servicioOriginal)].join("|");
    const sessionStudents = sessions.get(sessionKey) || new Set();
    const possible = [];

    extraItems.forEach((extra) => {
      const log = extra.bitacora;
      if (log.profesorKey !== expected.profesorKey || log.estudianteKey !== expected.estudianteKey ||
          log.fecha === expected.fecha || !isSameCalendarWeek(log.fecha, expected.fecha)) return;
      possible.push({ type: "same_student_week", log, text: `Bitácora ${log.bitacoraId || "sin ID"} del ${log.fecha}: mismo estudiante y docente en la misma semana.` });
      if (!suggestionsByExtra.has(extra)) suggestionsByExtra.set(extra, []);
      suggestionsByExtra.get(extra).push(expected);
    });

    if (sessionStudents.size > 1) {
      extraGroups.forEach((group) => {
        const log = group.log;
        if (log.profesorKey !== expected.profesorKey || log.fecha === expected.fecha ||
            !isSameCalendarWeek(log.fecha, expected.fecha)) return;
        const missingStudents = [...sessionStudents].filter((student) => !group.students.has(student));
        const extraStudents = [...group.students].filter((student) => !sessionStudents.has(student));
        const sharedStudents = [...sessionStudents].filter((student) => group.students.has(student));
        if (!sharedStudents.length) return;
        const sameParticipants = sameStudentSet(group.students, sessionStudents);
        const participantDifference = [
          missingStudents.length ? `faltan ${missingStudents.length}` : "",
          extraStudents.length ? `sobran ${extraStudents.length}` : "",
        ].filter(Boolean).join(" y ");
        possible.push({
          type: sameParticipants ? "same_group_week" : "group_participants_differ",
          log,
          text: sameParticipants
            ? `Bitácora grupal ${log.bitacoraId || "sin ID"} del ${log.fecha}: tiene los mismos estudiantes de esta clase.`
            : `Bitácora grupal ${log.bitacoraId || "sin ID"} del ${log.fecha}: coincide parcialmente; ${participantDifference} participante(s).`,
        });
        group.items.forEach((extra) => {
          if (!suggestionsByExtra.has(extra)) suggestionsByExtra.set(extra, []);
          suggestionsByExtra.get(extra).push(expected);
        });
      });
    }

    if (!possible.length) return;
    const unique = uniquePossibleMatches(possible);
    item.status = "revisar";
    item.statusLabel = "Necesita revisión";
    item.possibleMatches = unique;
    item.notes = `${item.notes} Posibles coincidencias: ${unique.map((match) => match.text).join(" ")}`;
  });

  suggestionsByExtra.forEach((expectedList, extra) => {
    const uniqueExpected = [...new Map(expectedList.map((row) => [row.expectedDocId, row])).values()];
    extra.status = "revisar";
    extra.statusLabel = "Necesita revisión";
    extra.possibleMatches = uniqueExpected.map((expected) => ({
      type: "expected_same_week",
      expectedDocId: expected.expectedDocId,
      text: `Posible clase RIP: ${expected.estudiante}, ${expected.fecha}${expected.hora ? ` a las ${expected.hora}` : ""}.`,
    }));
    extra.notes = `${extra.notes} Posibles coincidencias: ${extra.possibleMatches.map((match) => match.text).join(" ")}`;
  });

  return results;
}

function uniquePossibleMatches(matches) {
  const seen = new Set();
  return matches.filter((match) => {
    const key = `${match.type}|${match.log?.bitacoraId}|${match.log?.fecha}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sameStudentSet(a, b) {
  return a.size === b.size && [...a].every((student) => b.has(student));
}

function isSameCalendarWeek(first, second) {
  return weekStartKey(first) === weekStartKey(second);
}

function weekStartKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || "")) return "";
  const date = new Date(`${dateKey}T12:00:00Z`);
  const daysFromMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysFromMonday);
  return date.toISOString().slice(0, 10);
}

function sameStudentTeacherDate(expected, log) {
  return expected.fecha === log.fecha &&
    expected.profesorKey === log.profesorKey &&
    sameCanonicalStudent(expected, log);
}

function sameCanonicalStudent(expected, log) {
  return expected.estudianteKey === log.estudianteKey ||
    sharesCanonicalStudentId(expected.studentCanonicalIds, log.studentCanonicalIds);
}

function canonicalStudentIds(...values) {
  return uniqueStrings(values.flatMap((value) => asArray(value))
    .map((value) => normalizeKey(value))
    .filter(Boolean));
}

function sharesCanonicalStudentId(first, second) {
  const secondIds = new Set(asArray(second));
  return asArray(first).some((id) => secondIds.has(id));
}

function filterResults(results, { ignoreStatus = false } = {}) {
  const teacher = canonicalTeacherKey(els.teacherFilter.value);
  const student = normalizeKey(els.studentFilter.value);
  const status = els.statusFilter.value;
  const access = getAccessContext();
  const filtered = results.filter((item) => {
    const teacherKey = item.expected?.profesorKey || item.bitacora?.profesorKey || "";
    const studentKey = item.expected?.estudianteKey || item.bitacora?.estudianteKey || "";
    if (!ignoreStatus && status === "pending" && !["faltante", "parcial_grupal", "revisar"].includes(item.status)) return false;
    if (!ignoreStatus && status === "missing" && !["faltante", "parcial_grupal"].includes(item.status)) return false;
    if (!ignoreStatus && status === "uploaded" && !["ok", "duplicada", "hora_diferente"].includes(item.status)) return false;
    if (!ignoreStatus && status === "review" && !["revisar", "profe_distinto", "hora_diferente", "parcial_grupal", "extra", "duplicada"].includes(item.status)) return false;
    if (!ignoreStatus && !["all", "pending", "missing", "uploaded", "review"].includes(status) && item.status !== status) return false;
    if (teacher && !teacherKey.includes(teacher)) return false;
    if (student && !studentKey.includes(student)) return false;
    if (!access.isAdmin) {
      const rowEmail = String(item.expected?.profesorEmail || "").toLowerCase();
      const allowedByEmail = rowEmail && access.emails.has(rowEmail);
      if (!allowedByEmail && !access.teacherKeys.has(teacherKey)) return false;
    }
    return true;
  });
  return sortFilteredResults(filtered, els.sortFilter?.value || "date");
}

function getAccessContext() {
  const emailList = [state.ripUser?.email, state.bitacorasUser?.email, state.fsaUser?.email]
    .filter(Boolean)
    .map((email) => email.toLowerCase());
  const emails = new Set(emailList);
  const hasAdminAccess = state.demoMode || emailList.some(isAdminEmail);
  const isAdmin = hasAdminAccess && !state.personalView;
  const teacherKeys = new Set();

  if (!isAdmin) {
    emailList.forEach((email) => {
      state.teacherNamesByEmail.get(email)?.forEach((name) => teacherKeys.add(name));
    });
  }
  return {
    isAdmin,
    teacherKeys,
    emails,
    isLinked: isAdmin || teacherKeys.size > 0 ||
      state.expectedRows.some((row) => row.profesorEmail && emails.has(row.profesorEmail)),
  };
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || "").toLowerCase());
}

function sortFilteredResults(results, mode) {
  return [...results].sort((a, b) => {
    const expectedA = a.expected || a.bitacora || {};
    const expectedB = b.expected || b.bitacora || {};
    if (mode === "student") {
      return getStudentName(a).localeCompare(getStudentName(b), "es") ||
        String(expectedA.fecha || "").localeCompare(String(expectedB.fecha || ""));
    }
    if (mode === "service") {
      return String(expectedA.servicioOriginal || "").localeCompare(String(expectedB.servicioOriginal || ""), "es") ||
        getStudentName(a).localeCompare(getStudentName(b), "es");
    }
    return String(expectedA.fecha || "").localeCompare(String(expectedB.fecha || "")) ||
      getStudentName(a).localeCompare(getStudentName(b), "es");
  });
}

function renderKpis(results, classResults = results) {
  const expectedItems = results.filter((item) => item.type === "expected");
  const sessions = buildClassSessions(expectedItems);
  const expectedCount = expectedItems.length;
  const logsCount = new Set(
    results
      .map((item) => item.bitacora)
      .filter(Boolean)
      // Una bitácora grupal se expande por estudiante para conciliar, pero
      // este indicador debe contar el documento subido una sola vez.
      .map((log) => log.bitacoraId || logUsageKey(log))
  ).size;
  const matched = results.filter((item) => ["ok", "duplicada", "hora_diferente"].includes(item.status)).length;
  const missing = results.filter((item) => ["faltante", "parcial_grupal"].includes(item.status)).length;
  const pendingClasses = buildClassSessions(
    results.filter((item) => ["faltante", "parcial_grupal", "revisar", "profe_distinto"].includes(item.status))
  ).length;
  const completedClasses = sessions.filter((session) =>
    session.participants.every((participant) => ["ok", "duplicada", "hora_diferente"].includes(participant.status))
  ).length;
  const review = results.filter((item) => ["profe_distinto", "extra", "duplicada", "revisar", "hora_diferente"].includes(item.status)).length;
  const rate = expectedCount ? Math.round((matched / expectedCount) * 1000) / 10 : 0;

  els.kpiExpected.textContent = sessions.length;
  els.kpiCompletedClasses.textContent = completedClasses;
  els.kpiPendingClasses.textContent = pendingClasses;
  els.kpiLogs.textContent = logsCount;
  els.kpiMissing.textContent = missing;
  els.kpiReview.textContent = review;
  els.kpiRate.textContent = `${rate}%`;
  renderClassGroups(classResults);
}

function buildClassSessions(results) {
  const sessions = new Map();
  for (const item of results) {
    if (item.type !== "expected" || !item.expected) continue;
    const row = item.expected;
    const key = [row.fecha, row.hora, row.profesorKey, normalizeKey(row.servicioOriginal)].join("|");
    if (!sessions.has(key)) {
      sessions.set(key, {
        key,
        fecha: row.fecha, hora: row.hora, profesor: row.profesor,
        servicio: row.servicioOriginal || "Sin servicio",
        participants: [],
      });
    }
    sessions.get(key).participants.push({
      name: row.estudiante,
      status: item.status,
      label: item.statusLabel,
      ripTeacher: row.profesor,
      logTeacher: item.bitacora?.docente || "",
      logStudent: item.bitacora?.estudiante || "",
      logDate: item.bitacora?.fecha || "",
      logTime: item.bitacora?.hora || "",
      logTitle: item.bitacora?.title || "",
    });
  }
  return [...sessions.values()].sort((a, b) =>
    a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora) || a.profesor.localeCompare(b.profesor, "es")
  );
}

function renderClassGroups(results) {
  const sessions = buildClassSessions(results);
  const access = getAccessContext();
  if (!access.isAdmin && state.catalogError && !access.isLinked) {
    els.classGroups.innerHTML = `
      <div class="empty-card access-warning">
        <strong>No fue posible verificar tu docente.</strong>
        <span>Intenta cargar los datos nuevamente.</span>
      </div>`;
    return;
  }
  if (!access.isAdmin && state.catalogLoaded && !access.isLinked) {
    els.classGroups.innerHTML = `
      <div class="empty-card access-warning">
        <strong>Tu correo aún no está asociado a un docente.</strong>
        <span>Solicita que lo agreguen al catálogo de docentes.</span>
      </div>`;
    return;
  }
  if (!sessions.length) {
    els.classGroups.innerHTML = `<div class="empty-card"><strong>🎉 Todo al día</strong><span>Nada con estos filtros.</span></div>`;
    return;
  }
  if (!access.isAdmin) {
    renderTeacherGroups(sessions, els.sortFilter?.value || "date");
    return;
  }
  els.classGroups.innerHTML = sessions.map(renderSession).join("");
}

/**
 * Agrupa cada estado en un tono para el color de fila: ok (verde),
 * danger (rosa, falta bitácora) o warn (ámbar, requiere revisión).
 */
function statusTone(status) {
  if (status === "ok") return "ok";
  if (status === "faltante" || status === "parcial_grupal") return "danger";
  return "warn";
}

/**
 * Devuelve el HTML del ícono SVG según el tipo de clase (danza, música, artes).
 */
function classTypeIcon(servicio, extraClass = "") {
  const key = normalizeKey(servicio);
  const isDance = key.includes("ballet") || key.includes("danza") || key.includes("baile") ||
    key.includes("contemporane") || key.includes("jazz") || key.includes("flamenco") ||
    key.includes("hip-hop") || key.includes("ritmo");
  const isArt = key.includes("plast") || key.includes("arte") || key.includes("pintura") ||
    key.includes("dibujo") || key.includes("visual") || key.includes("ceramic");
  const extra = extraClass ? ` ${extraClass}` : "";

  if (isDance) {
    return `<span class="class-type-icon dance${extra}" aria-label="Danza" title="Danza / Ballet">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="4" r="1.8"/>
        <path d="M12 6.5 C10 9 8 10 6 12"/>
        <path d="M12 6.5 C14 9 16 10 18 12"/>
        <path d="M12 6.5 L12 14"/>
        <path d="M12 14 C10 16 9 18 8 20"/>
        <path d="M12 14 C14 16 15 18 16 20"/>
      </svg>
    </span>`;
  }
  if (isArt) {
    return `<span class="class-type-icon art${extra}" aria-label="Artes" title="Artes plásticas">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21 L9 3 L12 10 L15 3 L21 21"/>
        <path d="M6.5 15 L17.5 15"/>
      </svg>
    </span>`;
  }
  return `<span class="class-type-icon music${extra}" aria-label="Música" title="Música">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  </span>`;
}

function renderSession(session) {
  const isGroup = session.participants.length > 1;
  const names = session.participants.map((participant) => participant.name);
  const pending = session.participants.filter((participant) =>
    ["faltante", "parcial_grupal", "profe_distinto", "revisar"].includes(participant.status)
  ).length;
  return `
    <details class="class-session">
      <summary>
        <div class="session-lead">
          ${classTypeIcon(session.servicio)}
          <div class="session-main">
            <div class="session-title">
              <div class="session-title-wrap">
                <strong>${escapeHtml(session.servicio)}</strong>
              </div>
              ${isGroup ? `<span class="group-label">Grupal · ${names.length}</span>` : `<span class="group-label individual">Individual</span>`}
            </div>
            <span class="session-students">${escapeHtml(names.join(", "))}</span>
            <div class="session-meta">
              <span>${escapeHtml(formatDateLabel(session.fecha))} · ${escapeHtml(session.hora || "Sin hora")}</span>
              <span>Docente: ${escapeHtml(session.profesor)}</span>
            </div>
          </div>
        </div>
        <span class="participant-count ${pending ? "has-pending" : ""}">${pending ? `${pending} pendiente${pending === 1 ? "" : "s"}` : "Al día"}</span>
      </summary>
      <div class="participant-list">${session.participants.map((participant) => `
        <div><span class="participant-info"><b>${escapeHtml(participant.name)}</b>${participant.status === "profe_distinto" && participant.logTeacher ? `<small>Bitácora: ${escapeHtml(participant.logTitle || "Sin título")} · estudiante ${escapeHtml(participant.logStudent || "sin dato")} · docente ${escapeHtml(participant.logTeacher)} · ${escapeHtml(participant.logDate || "sin fecha")} ${escapeHtml(participant.logTime || "")}. RIP tiene a ${escapeHtml(participant.ripTeacher)}.</small>` : ""}</span><span class="participant-actions"><span class="badge ${participant.status}">${escapeHtml(participant.label)}</span>${participant.status === "profe_distinto" && participant.logTeacher ? `<button type="button" class="btn secondary small class-teacher-alias-merge" data-alias="${escapeHtml(participant.logTeacher)}" data-canonical="${escapeHtml(participant.ripTeacher)}">Unificar docentes</button>` : ""}</span></div>
      `).join("")}</div>
    </details>
  `;
}

function renderTeacherGroups(sessions, mode) {
  if (mode === "class") {
    els.classGroups.innerHTML = sessions.map(renderSession).join("");
    return;
  }
  const groups = new Map();
  for (const session of sessions) {
    const values = mode === "student"
      ? session.participants.map((participant) => [normalizeKey(participant.name), participant.name])
      : [[session.fecha, formatDateLabel(session.fecha)]];
    values.forEach(([key, label]) => {
      if (!groups.has(key)) groups.set(key, { label, sessions: [] });
      groups.get(key).sessions.push(session);
    });
  }
  els.classGroups.innerHTML = [...groups.values()].map((group) => `
    <section class="teacher-group">
      <header><strong>${escapeHtml(group.label)}</strong><span>${group.sessions.length} ${group.sessions.length === 1 ? "clase" : "clases"}</span></header>
      <div>${group.sessions.map(renderSession).join("")}</div>
    </section>
  `).join("");
}

function formatDateLabel(date) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" })
    .format(new Date(`${date}T12:00:00`));
}

function renderTeacherKpis(results) {
  const summaries = buildTeacherSummaries(results);
  if (!summaries.length) {
    els.teacherKpis.innerHTML = `<div class="empty-card">Carga datos reales o abre el modo prueba.</div>`;
    return;
  }

  const selectedKey = canonicalTeacherKey(els.teacherFilter.value);
  els.teacherKpis.innerHTML = summaries.map((teacher) => `
    <article class="teacher-kpi-card ${teacher.rateClass} ${selectedKey && teacher.key === selectedKey ? "is-selected" : ""}"
            data-teacher-key="${escapeHtml(teacher.key)}" data-teacher-name="${escapeHtml(teacher.name)}"
            aria-label="Filtrar por ${escapeHtml(teacher.name)}">
      <div class="teacher-kpi-title">
        <strong>${escapeHtml(teacher.name)}</strong>
      </div>
      <div class="teacher-kpi-rate"><span class="rate">${teacher.rate}%</span><span>Cumplimiento</span></div>
      <div class="teacher-kpi-stats">
        <button type="button" class="teacher-kpi-stat" data-status="missing"><b>${teacher.missing}</b><span>sin subir</span></button>
        <button type="button" class="teacher-kpi-stat" data-status="uploaded"><b>${teacher.matched}</b><span>subidas</span></button>
        <button type="button" class="teacher-kpi-stat" data-status="review"><b>${teacher.review}</b><span>revisión</span></button>
      </div>
    </article>
  `).join("");
}

function buildTeacherSummaries(results) {
  const summaries = new Map();
  for (const item of results) {
    if (item.type !== "expected" || !item.expected) continue;
    const expected = item.expected;
    const key = expected.profesorKey || "sin-docente";
    if (!summaries.has(key)) {
      summaries.set(key, {
        key,
        name: expected.profesor || key,
        expected: 0,
        matched: 0,
        missing: 0,
        review: 0,
        sessionKeys: new Set(),
      });
    }

    const summary = summaries.get(key);
    summary.sessionKeys.add([expected.fecha, expected.hora, expected.profesorKey, normalizeKey(expected.servicioOriginal)].join("|"));
    summary.expected += 1;
    if (["ok", "duplicada", "hora_diferente"].includes(item.status)) summary.matched += 1;
    if (["faltante", "parcial_grupal"].includes(item.status)) summary.missing += 1;
    if (["profe_distinto", "duplicada", "revisar", "hora_diferente", "parcial_grupal"].includes(item.status)) summary.review += 1;
  }

  return [...summaries.values()]
    .map((summary) => {
      const rate = summary.expected ? Math.round((summary.matched / summary.expected) * 1000) / 10 : 0;
      return {
        ...summary,
        classes: summary.sessionKeys.size,
        rate,
        rateClass: rate >= 90 ? "good-rate" : rate >= 70 ? "warning-rate" : "danger-rate",
      };
    })
    .sort((a, b) => a.rate - b.rate || b.missing - a.missing || a.name.localeCompare(b.name, "es"));
}

function renderResults(results) {
  if (!results.length) {
    els.resultsBody.innerHTML = `<tr><td colspan="6" class="empty-cell">No hay resultados con esos filtros.</td></tr>`;
    return;
  }
  els.resultsBody.innerHTML = results.map((item, index) => {
    const expected = item.expected || {};
    const log = item.bitacora || {};
    const source = expected.fecha ? expected : log;
    const bitacoraLabel = log.bitacoraId
      ? `<span class="log-pill is-up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>Subida</span><div class="cell-sub">${escapeHtml(log.title || "Bitácora")}</div>`
      : `<span class="log-pill is-pending"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Pendiente</span>`;
    return `
      <tr data-result-index="${index}" tabindex="0" data-tone="${statusTone(item.status)}">
        <td data-label="Estado"><span class="badge ${item.status}">${escapeHtml(item.statusLabel)}</span></td>
        <td data-label="Clase"><div class="cell-class">${classTypeIcon(source.servicioOriginal || "Clase", "mini")}<div class="cell-class-text"><span class="cell-title">${escapeHtml(source.servicioOriginal || "Clase")}</span><div class="cell-sub">${escapeHtml(source.fecha || "—")} · ${escapeHtml(source.hora || "Sin hora")}</div></div></div></td>
        <td data-label="Estudiante">${escapeHtml(source.estudiante || "—")}</td>
        <td data-label="Docente">${escapeHtml(expected.profesor || log.docente || "—")}</td>
        <td data-label="Bitácora">${bitacoraLabel}</td>
        <td data-label="Observación" class="small">${escapeHtml(item.notes)}</td>
      </tr>`;
  }).join("");
}

function exportCsv() {
  if (!state.filteredResults.length) return toast("No hay resultados para exportar.");
  const rows = state.filteredResults.map((item) => ({
    estadoCodigo: item.status,
    estado: item.statusLabel,
    fechaRip: item.expected?.fecha || "",
    fechaBitacora: item.bitacora?.fecha || "",
    horaRip: item.expected?.hora || "",
    horaBitacora: item.bitacora?.hora || "",
    docenteRip: item.expected?.profesor || "",
    docenteBitacora: item.bitacora?.docente || "",
    profesorKeyRip: item.expected?.profesorKey || "",
    profesorKeyBitacora: item.bitacora?.profesorKey || "",
    estudianteRip: item.expected?.estudiante || "",
    estudianteBitacora: item.bitacora?.estudiante || "",
    estudianteKeyRip: item.expected?.estudianteKey || "",
    estudianteKeyBitacora: item.bitacora?.estudianteKey || "",
    llaveConciliacionRip: item.expected
      ? buildConciliationKey(item.expected.fecha, item.expected.profesorKey, item.expected.estudianteKey)
      : "",
    llaveConciliacionBitacora: item.bitacora
      ? buildConciliationKey(item.bitacora.fecha, item.bitacora.profesorKey, item.bitacora.estudianteKey)
      : "",
    contadorClase: item.expected?.contadorClase || item.bitacora?.contadorClase || "",
    ripRegistroId: item.expected?.ripRegistroId || "",
    bitacoraId: item.bitacora?.bitacoraId || "",
    classLogKeyRip: item.expected?.classLogKey || "",
    classLogKeyBitacora: item.bitacora?.classLogKeys?.[0] || "",
    notas: item.notes,
  }));
  downloadText(`conciliacion-bitacoras-${todayKey()}.csv`, toCsv(rows), "text/csv;charset=utf-8");
}

function exportExpectedJson() {
  const payload = buildExpectedClassLogsPayload();
  if (!payload.length) return toast("No hay clases esperadas para exportar.");
  downloadText(`expected_class_logs-${todayKey()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

function exportExpandedBitacorasJson() {
  const payload = state.expandedLogs
    .filter(isWithinDateRange)
    .map((log) => ({
      bitacoraId: log.bitacoraId,
      fecha: log.fecha,
      hora: log.hora,
      docente: log.docente,
      profesorKey: log.profesorKey,
      estudiante: log.estudiante,
      estudianteKey: log.estudianteKey,
      mode: log.mode,
      contadorClase: log.contadorClase || null,
      contadorClaseCalculado: log.contadorClaseCalculado || null,
      counterSource: log.counterSource || "bitacora_or_empty",
      ripRegistroIds: log.ripRegistroIds || [],
      classLogKeys: log.classLogKeys || [],
      matchedExpectedDocId: log.matchedExpectedDocId || null,
      title: log.title || "",
    }));
  if (!payload.length) return toast("No hay bitácoras conciliadas para exportar.");
  downloadText(`bitacoras-conciliadas-${todayKey()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

async function syncExpectedClassLogs() {
  const payload = buildExpectedClassLogsPayload();
  if (!payload.length) return toast("No hay clases esperadas para sincronizar.", "info");
  if (!state.bitacorasUser) return toast("Conecta Bitácoras antes de sincronizar.", "info");

  const confirmed = window.confirm(
    `Vas a escribir o actualizar ${payload.length} documento(s) en la colección "${COLLECTIONS.expectedClassLogs}" del Firebase de Bitácoras.\n\n` +
    `Esta acción modifica datos reales. ¿Deseas continuar?`
  );
  if (!confirmed) return;

  setLoading(true);
  try {
    const db = firebase.bitacoras.db;
    for (const item of payload) {
      await setDoc(doc(db, COLLECTIONS.expectedClassLogs, item.expectedDocId), {
        ...item,
        syncedAt: serverTimestamp(),
        syncedBy: state.bitacorasUser.email || "",
      }, { merge: true });
    }
    toast(`Sincronización lista: ${payload.length} documentos actualizados en expected_class_logs.`, "success");
  } catch (error) {
    console.error(error);
    toast("No se pudo completar la sincronización. No se guardaron los cambios; inténtalo de nuevo.", "error");
  } finally {
    setLoading(false);
  }
}

function buildExpectedClassLogsPayload() {
  return state.results
    .filter((item) => item.type === "expected")
    .map((item) => {
      const expected = item.expected;
      return {
        expectedDocId: expected.expectedDocId,
        source: "rip",
        ripRegistroId: expected.ripRegistroId,
        fecha: expected.fecha,
        hora: expected.hora,
        profesorNombre: expected.profesor,
        profesorKey: expected.profesorKey,
        profesorEmail: expected.profesorEmail || "",
        estudianteNombre: expected.estudiante,
        estudianteKey: expected.estudianteKey,
        contadorClase: expected.contadorClase,
        classLogKey: expected.classLogKey,
        servicioOriginal: expected.servicioOriginal || "",
        matchedBitacoraId: item.bitacora?.bitacoraId || null,
        reconciliationStatus: item.status,
        reconciliationLabel: item.statusLabel,
        reconciliationNotes: item.notes,
        updatedAtClient: new Date().toISOString(),
      };
    });
}

function toCsv(rows) {
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => csvCell(row[header])).join(","));
  return [headers.join(","), ...body].join("\n");
}

function csvCell(value) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

function canonicalTeacherKey(value) {
  const baseKey = canonicalTeacherKeyBase(value);
  if (baseKey === "isabel-gomez") return baseKey;
  const tokens = teacherNameTokens(value);
  const matchedCatalogTeacher = state.teacherCanonicalNames.find((teacher) =>
    tokens.length >= 2 && teacher.tokens[0] === tokens[0] &&
    tokens.slice(1).some((token) => teacher.tokens.slice(1).includes(token))
  );
  return matchedCatalogTeacher?.key || baseKey;
}

function canonicalTeacherKeyBase(value) {
  const key = normalizeKey(value);
  const manualAlias = state.teacherManualAliases.get(key);
  if (manualAlias) return manualAlias;
  if (key.includes("tania-isabel") || (key.includes("tania") && key.includes("isabel"))) return "isabel-gomez";
  if (key.includes("isabel") && key.includes("gomez")) return "isabel-gomez";
  if (key.includes("angie") && key.includes("nitola")) return "angie-natalia-nitola";
  return key;
}

function canonicalTeacherName(value) {
  const key = canonicalTeacherKey(value);
  if (key === "isabel-gomez") return "Isabel Gómez";
  if (key === "angie-natalia-nitola") return "Angie Natalia Nitola";
  return value;
}

function teacherNameTokens(value) {
  return normalizeKey(value).split("-").filter(Boolean);
}

function loadTeacherAliases() {
  try {
    // Se deshacen las unificaciones manuales creadas antes de añadir la
    // confirmación; las nuevas sí se conservarán entre recargas.
    if (localStorage.getItem("musicala-teacher-aliases-version") !== "confirmed-v1") {
      localStorage.removeItem("musicala-teacher-aliases");
      localStorage.setItem("musicala-teacher-aliases-version", "confirmed-v1");
      return [];
    }
    const aliases = JSON.parse(localStorage.getItem("musicala-teacher-aliases") || "{}");
    return Object.entries(aliases);
  } catch {
    return [];
  }
}

function onTeacherAliasMerge(event) {
  const button = event.target.closest(".teacher-alias-merge");
  if (!button) return;
  mergeTeacherAlias(button.dataset.alias || "", button.dataset.canonical || "");
}

function mergeTeacherAlias(alias, canonical) {
  if (!getAccessContext().isAdmin) return;
  const aliasKey = normalizeKey(alias);
  const canonicalKey = canonicalTeacherKey(canonical);
  if (!aliasKey || !canonicalKey || aliasKey === canonicalKey) return;
  const confirmed = window.confirm(`Vas a unificar el docente “${alias}” con “${canonical}”.\n\nLas bitácoras de “${alias}” se conciliarán como si pertenecieran a “${canonical}”. ¿Deseas continuar?`);
  if (!confirmed) return;
  state.teacherManualAliases.set(aliasKey, canonicalKey);
  localStorage.setItem("musicala-teacher-aliases", JSON.stringify(Object.fromEntries(state.teacherManualAliases)));
  closeDrawer();
  reconcileAndRender();
  toast(`Se unificó ${alias} con ${canonical}.`, "success");
}

function resetManualTeacherAliases() {
  state.teacherManualAliases.clear();
  localStorage.removeItem("musicala-teacher-aliases");
  reconcileAndRender();
}

function firstText(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = typeof value === "object" ? "" : String(value).trim();
    if (text) return text;
  }
  return "";
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

function toDateKey(value) {
  if (!value) return "";
  if (typeof value?.toDate === "function") return toDateKey(value.toDate());
  if (typeof value?.seconds === "number") return toDateKey(new Date(value.seconds * 1000));
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 100000000000 ? value : value * 1000;
    return toDateKey(new Date(millis));
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  if (!text) return "";
  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${pad2(iso[2])}-${pad2(iso[3])}`;
  const latam = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (latam) {
    const year = latam[3].length === 2 ? `20${latam[3]}` : latam[3];
    return `${year}-${pad2(latam[2])}-${pad2(latam[1])}`;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return text.slice(0, 10);
}

function toTimeKey(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "";
  const clean = text
    .replace(/\s+/g, " ")
    .replace(/a\.\s*m\.|a\.m\.|am/g, "am")
    .replace(/p\.\s*m\.|p\.m\.|pm/g, "pm");
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return text;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridian = match[3];
  if (meridian === "pm" && hour < 12) hour += 12;
  if (meridian === "am" && hour === 12) hour = 0;
  return `${pad2(hour)}:${pad2(minute)}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function isClassType(tipo) {
  const key = normalizeKey(tipo);
  return key === "clase" || key.includes("clase");
}

function isExcludedService(servicio) {
  const key = normalizeKey(servicio);
  if (!key) return false;
  return key.includes("reserva") ||
    key.includes("musigym") ||
    key.includes("taller-vacacional") ||
    key === "me" ||
    key.startsWith("me-") ||
    key.endsWith("-me");
}

function buildClassLogKey(fecha, profesorKey, estudianteKey, contadorClase) {
  return `${fecha}|${profesorKey}|${estudianteKey}|${contadorClase}`;
}

function buildConciliationKey(fecha, profesorKey, estudianteKey) {
  return `${fecha || ""}|${profesorKey || ""}|${estudianteKey || ""}`;
}

function safeDocId(value) {
  return String(value || "")
    .replace(/[\/\\?#\[\]*]/g, "-")
    .slice(0, 140) || crypto.randomUUID();
}

function sortClassRows(a, b) {
  return a.estudianteKey.localeCompare(b.estudianteKey) ||
    a.profesorKey.localeCompare(b.profesorKey) ||
    a.fecha.localeCompare(b.fecha) ||
    a.hora.localeCompare(b.hora) ||
    a.id.localeCompare(b.id);
}

function isWithinDateRange(row) {
  const date = row.fecha || row.expected?.fecha || row.bitacora?.fecha || "";
  const from = els.fromDate.value;
  const to = els.toDate.value;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function getStudentName(item) {
  return item.expected?.estudiante || item.bitacora?.estudiante || "";
}

function setDefaultDates() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 60);
  const end = today;
  els.fromDate.value = dateInputKey(start);
  els.toDate.value = dateInputKey(end);
  els.statusFilter.value = "pending";
}

function dateInputKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setLoading(isLoading) {
  [els.loadDataBtn, els.runDemoBtn, els.syncExpectedBtn].forEach((button) => {
    button.disabled = isLoading;
  });
  document.body.classList.toggle("is-loading", isLoading);
  if (isLoading) {
    renderLoadingSkeletons();
    toast("Cargando y cruzando la información…", "info");
  }
}

function renderLoadingSkeletons() {
  els.classGroups.innerHTML = Array.from({ length: 3 }, () => `<div class="skeleton sk-card"></div>`).join("");
  els.resultsBody.innerHTML = `<tr><td colspan="6" style="padding:0;border:0;">
    ${Array.from({ length: 4 }, () => `<div class="skeleton sk-line" style="height:20px;margin:12px;"></div>`).join("")}
  </td></tr>`;
}

let toastTimer = null;
function toast(message, type = "info") {
  els.toast.textContent = message;
  els.toast.className = `toast show is-${type}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 5200);
}

// ---------------------------- Drawer de detalle ----------------------------
let drawerLastFocus = null;

function openDetailDrawer(item) {
  const expected = item.expected || {};
  const log = item.bitacora || {};
  const source = expected.fecha ? expected : log;
  const rows = [
    ["Estado", item.statusLabel],
    ["Clase", source.servicioOriginal || "Clase"],
    ["Fecha", source.fecha || "—"],
    ["Hora", source.hora || "Sin hora"],
    ...(item.status === "profe_distinto" ? [
      ["Estudiante RIP", expected.estudiante || "—"],
      ["Estudiante bitácora", log.estudiante || "—"],
      ["Docente RIP", expected.profesor || "—"],
      ["Docente bitácora", log.docente || log.profesorKey || "—"],
    ] : [
      ["Estudiante", source.estudiante || "—"],
      ["Docente", expected.profesor || log.docente || "—"],
    ]),
    ["Contador de clase", expected.contadorClase || log.contadorClase || "—"],
    ["Bitácora", log.bitacoraId ? (log.title || "Subida") : "Sin bitácora"],
  ];
  const mergeControl = item.status === "profe_distinto" && expected.profesor && log.docente ? `
    <button type="button" class="btn secondary small teacher-alias-merge"
            data-alias="${escapeHtml(log.docente)}" data-canonical="${escapeHtml(expected.profesor)}">
      Unificar “${escapeHtml(log.docente)}” con “${escapeHtml(expected.profesor)}”
    </button>` : "";
  els.detailSummary.innerHTML = `
    <div class="detail-row"><span>Observación</span><strong>${escapeHtml(item.notes || "—")}</strong></div>
    ${rows.map(([label, value]) => `<div class="detail-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`).join("")}
    ${mergeControl}
  `;
  els.detailsBox.textContent = JSON.stringify(
    { status: item.status, statusLabel: item.statusLabel, notes: item.notes, expected: item.expected, bitacora: item.bitacora },
    null, 2
  );

  drawerLastFocus = document.activeElement;
  els.drawer.classList.add("is-open");
  els.drawer.setAttribute("aria-hidden", "false");
  els.drawerOverlay.classList.add("is-open");
  els.drawerClose.focus();
}

function closeDrawer() {
  els.drawer.classList.remove("is-open");
  els.drawer.setAttribute("aria-hidden", "true");
  els.drawerOverlay.classList.remove("is-open");
  els.resultsBody.querySelectorAll("tr.is-selected").forEach((tr) => tr.classList.remove("is-selected"));
  if (drawerLastFocus && typeof drawerLastFocus.focus === "function") drawerLastFocus.focus();
}

function demoStudentsFromRows(rows) {
  const students = [];
  rows.forEach((row) => {
    asArray(row.studentIds).forEach((id) => students.push({ id, name: id.replace(/-/g, " "), nameKey: id }));
  });
  return dedupeBy(students, (student) => student.id);
}
