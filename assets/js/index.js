/* COSMOS Space Dashboard - Assignment 11
   APIs: NASA APOD, The Space Devs Launch Library 2, Solar System OpenData. */

const API = {
  nasa: "https://api.nasa.gov/planetary/apod",
  nasaKey: "DEMO_KEY", // Replace with your own free NASA API key if DEMO_KEY reaches its limit.
  launches: "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=10&mode=detailed",
  planets: "https://api.le-systeme-solaire.net/rest/bodies/?filter[]=isPlanet,true&order=semimajorAxis,asc"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const planetImages = {
  mercury: "./assets/images/mercury.png", venus: "./assets/images/venus.png",
  earth: "./assets/images/earth.png", mars: "./assets/images/mars.png",
  jupiter: "./assets/images/jupiter.png", saturn: "./assets/images/saturn.png",
  uranus: "./assets/images/uranus.png", neptune: "./assets/images/neptune.png"
};
const planetColors = {
  mercury: "#eab308", venus: "#f97316", earth: "#3b82f6", mars: "#ef4444",
  jupiter: "#fb923c", saturn: "#facc15", uranus: "#67e8f9", neptune: "#818cf8"
};
let planetsData = [];
let apodCurrentUrl = "";

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function formatDate(dateString, options = { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) {
  if (!dateString) return "Date not available";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? dateString : new Intl.DateTimeFormat("en-US", options).format(date);
}
function formatNumber(value, maximumFractionDigits = 2) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-US", { maximumFractionDigits }) : "N/A";
}
function setMessage(container, message, type = "info") {
  if (!container) return;
  let status = container.querySelector(":scope > .api-status-message");
  if (!status) {
    status = document.createElement("div");
    status.className = "api-status-message col-span-full rounded-xl border px-4 py-3 text-sm";
    container.prepend(status);
  }
  status.className = `api-status-message col-span-full rounded-xl border px-4 py-3 text-sm ${type === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-blue-500/30 bg-blue-500/10 text-blue-200"}`;
  status.textContent = message;
}
function clearMessage(container) {
  container?.querySelector(":scope > .api-status-message")?.remove();
}

// Navigation between the three assignment sections.
function initNavigation() {
  const links = $$(".nav-link");
  const sections = $$(".app-section");
  function showSection(id) {
    sections.forEach(section => section.classList.toggle("hidden", section.id !== id));
    links.forEach(link => {
      const active = link.dataset.section === id;
      link.classList.toggle("bg-blue-500/10", active);
      link.classList.toggle("text-blue-400", active);
      link.classList.toggle("text-slate-300", !active);
      link.classList.toggle("bg-slate-800", false);
    });
    document.getElementById("sidebar")?.classList.remove("sidebar-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  links.forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    showSection(link.dataset.section);
  }));
  $("#sidebar-toggle")?.addEventListener("click", () => {
    $("#sidebar")?.classList.toggle("sidebar-open");
  });
}

// NASA Astronomy Picture of the Day.
async function loadAPOD(date = "") {
  const image = $("#apod-image");
  const imageContainer = $("#apod-image-container");
  const loading = $("#apod-loading");
  const title = $("#apod-title");
  const explanation = $("#apod-explanation");
  const dateInput = $("#apod-date-input");
  const loadButton = $("#load-date-btn");
  if (!image || !imageContainer) return;

  if (loading) loading.classList.remove("hidden");
  if (loadButton) { loadButton.disabled = true; loadButton.classList.add("opacity-60", "cursor-wait"); }
  if (title) title.textContent = "Loading astronomy picture…";
  if (explanation) explanation.textContent = "Getting the latest information from NASA.";
  try {
    const params = new URLSearchParams({ api_key: API.nasaKey });
    if (date) params.set("date", date);
    const response = await fetch(`${API.nasa}?${params.toString()}`);
    if (!response.ok) throw new Error(response.status === 429 ? "NASA API request limit reached. Please try again later or use your own NASA API key." : `NASA API returned ${response.status}.`);
    const data = await response.json();
    if (data.code || data.error) throw new Error(data.msg || data.error.message || "NASA could not return the picture for this date.");

    apodCurrentUrl = data.hdurl || data.url || "";
    if (dateInput) dateInput.value = data.date || date || "";
    const dateLabel = formatDate(data.date, { year: "long", month: "long", day: "numeric", timeZone: "UTC" });
    $("#apod-date") && ($("#apod-date").textContent = `Astronomy Picture of the Day — ${dateLabel}`);
    $("#apod-date-detail") && ($("#apod-date-detail").innerHTML = `<i class="far fa-calendar mr-2" aria-hidden="true"></i>${escapeHTML(data.date || "")}`);
    $("#apod-date-info") && ($("#apod-date-info").textContent = data.date || "N/A");
    $("#apod-media-type") && ($("#apod-media-type").textContent = data.media_type === "video" ? "Video" : "Image");
    if (title) title.textContent = data.title || "Astronomy Picture of the Day";
    if (explanation) explanation.textContent = data.explanation || "No explanation was provided by NASA for this item.";
    $("#apod-copyright") && ($("#apod-copyright").textContent = data.copyright ? `© ${data.copyright}` : "Image credit: NASA / APOD");

    imageContainer.querySelector("iframe.apod-video")?.remove();
    image.classList.remove("hidden");
    if (data.media_type === "video") {
      image.classList.add("hidden");
      const iframe = document.createElement("iframe");
      iframe.className = "apod-video absolute inset-0 h-full w-full";
      iframe.src = data.url;
      iframe.title = data.title || "NASA Astronomy Picture video";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      imageContainer.append(iframe);
      imageContainer.classList.remove("group");
    } else {
      image.src = data.url || "./assets/images/placeholder.webp";
      image.alt = data.title || "NASA Astronomy Picture of the Day";
      image.onerror = () => { image.src = "./assets/images/placeholder.webp"; };
      imageContainer.classList.add("group");
    }
    const fullResolutionButton = $("#apod-full-resolution");
    if (fullResolutionButton) fullResolutionButton.disabled = !apodCurrentUrl || data.media_type === "video";
  } catch (error) {
    if (title) title.textContent = "Unable to load NASA data";
    if (explanation) explanation.textContent = error.message || "Something went wrong while requesting NASA APOD.";
    $("#apod-copyright") && ($("#apod-copyright").textContent = "Check your internet connection and try again.");
  } finally {
    if (loading) loading.classList.add("hidden");
    if (loadButton) { loadButton.disabled = false; loadButton.classList.remove("opacity-60", "cursor-wait"); }
  }
}
function initAPOD() {
  const dateInput = $("#apod-date-input");
  if (dateInput) {
    const today = new Date();
    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    dateInput.max = localToday;
    dateInput.value = localToday;
  }
  $("#load-date-btn")?.addEventListener("click", () => {
    if (!dateInput?.value) return;
    loadAPOD(dateInput.value);
  });
  $("#today-apod-btn")?.addEventListener("click", () => {
    const today = new Date();
    const value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (dateInput) dateInput.value = value;
    loadAPOD(value);
  });
  $("#apod-full-resolution")?.addEventListener("click", () => {
    if (apodCurrentUrl) window.open(apodCurrentUrl, "_blank", "noopener,noreferrer");
  });
  loadAPOD();
}

// The Space Devs Launch Library 2.
function launchStatus(launch) {
  return launch?.status?.abbrev || launch?.status?.name || "TBD";
}
function launchImage(launch) {
  return launch?.image?.image_url || launch?.image?.thumbnail_url || launch?.rocket?.configuration?.image?.image_url || "./assets/images/launch-placeholder.png";
}
function launchProvider(launch) {
  return launch?.launch_service_provider?.name || launch?.rocket?.configuration?.manufacturer?.name || "Provider not listed";
}
function launchRocket(launch) {
  return launch?.rocket?.configuration?.full_name || launch?.rocket?.configuration?.name || "Rocket details unavailable";
}
function launchLocation(launch) {
  return launch?.pad?.name || launch?.pad?.location?.name || "Launch location not announced";
}
function renderFeaturedLaunch(launch) {
  const target = $("#featured-launch");
  if (!target) return;
  const name = escapeHTML(launch.name || "Upcoming launch");
  const status = escapeHTML(launchStatus(launch));
  const provider = escapeHTML(launchProvider(launch));
  const rocket = escapeHTML(launchRocket(launch));
  const location = escapeHTML(launchLocation(launch));
  const country = escapeHTML(launch?.pad?.location?.country?.name || launch?.pad?.location?.country_code || "Not announced");
  const date = launch.net ? new Date(launch.net) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  const days = validDate ? Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000)) : null;
  const description = escapeHTML(launch?.mission?.description || "Mission description has not been published yet.");
  const image = escapeHTML(launchImage(launch));
  target.innerHTML = `
    <article class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 md:p-8">
        <div class="flex flex-col justify-between"><div>
          <div class="flex flex-wrap items-center gap-3 mb-4"><span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold"><i class="fas fa-star mr-2"></i>Featured Launch</span><span class="px-4 py-1.5 bg-slate-700 text-slate-200 rounded-full text-sm font-semibold">${status}</span></div>
          <h3 class="text-2xl md:text-3xl font-bold mb-3 leading-tight">${name}</h3>
          <div class="flex flex-col xl:flex-row xl:items-center gap-3 mb-6 text-slate-400"><span><i class="fas fa-building mr-2"></i>${provider}</span><span><i class="fas fa-rocket mr-2"></i>${rocket}</span></div>
          <div class="inline-flex items-center gap-3 px-5 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6"><i class="fas fa-clock text-2xl text-blue-400"></i><div><p class="text-2xl font-bold text-blue-400">${days === null ? "TBD" : days}</p><p class="text-xs text-slate-400">${days === null ? "Days Until Launch" : days === 1 ? "Day Until Launch" : "Days Until Launch"}</p></div></div>
          <div class="grid sm:grid-cols-2 gap-4 mb-6"><div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-calendar mr-2"></i>Launch Date</p><p class="font-semibold">${validDate ? escapeHTML(formatDate(date.toISOString())) : "Not announced"}</p></div><div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-clock mr-2"></i>Launch Time (UTC)</p><p class="font-semibold">${validDate ? `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}` : "TBD"}</p></div><div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-map-marker-alt mr-2"></i>Location</p><p class="font-semibold text-sm">${location}</p></div><div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-globe mr-2"></i>Country</p><p class="font-semibold">${country}</p></div></div>
          <p class="text-slate-300 leading-relaxed mb-5">${description}</p>
        </div><div class="flex flex-wrap gap-3"><a href="${escapeHTML(launch.url || "https://ll.thespacedevs.com/")}" target="_blank" rel="noopener noreferrer" class="px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold inline-flex items-center gap-2"><i class="fas fa-up-right-from-square"></i>View Full Details</a></div></div>
        <div class="relative min-h-[250px] lg:min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50"><img src="${image}" alt="${name}" class="absolute inset-0 w-full h-full object-cover" onerror="this.onerror=null;this.src='./assets/images/launch-placeholder.png'"><div class="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent"></div></div>
      </div>
    </article>`;
}
function renderLaunchCard(launch) {
  const name = escapeHTML(launch.name || "Upcoming launch");
  const provider = escapeHTML(launchProvider(launch));
  const rocket = escapeHTML(launchRocket(launch));
  const location = escapeHTML(launchLocation(launch));
  const status = escapeHTML(launchStatus(launch));
  const date = launch.net ? new Date(launch.net) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  const dateText = validDate ? escapeHTML(formatDate(date.toISOString())) : "Date not announced";
  const timeText = validDate ? `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")} UTC` : "Time TBD";
  const url = escapeHTML(launch.url || "https://ll.thespacedevs.com/");
  const image = escapeHTML(launchImage(launch));
  return `<article class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group">
    <div class="relative h-48 bg-slate-900/50"><img src="${image}" alt="${name}" class="w-full h-full object-cover" loading="lazy" onerror="this.onerror=null;this.src='./assets/images/launch-placeholder.png'"><span class="absolute top-3 right-3 px-3 py-1 bg-slate-800/90 text-white rounded-full text-xs font-semibold">${status}</span></div>
    <div class="p-5"><h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">${name}</h4><p class="text-sm text-slate-400 mb-4"><i class="fas fa-building text-xs mr-2"></i>${provider}</p>
    <div class="space-y-2 mb-4"><p class="flex items-start gap-2 text-sm"><i class="fas fa-calendar text-slate-500 w-4 mt-1"></i><span class="text-slate-300">${dateText}</span></p><p class="flex items-start gap-2 text-sm"><i class="fas fa-clock text-slate-500 w-4 mt-1"></i><span class="text-slate-300">${timeText}</span></p><p class="flex items-start gap-2 text-sm"><i class="fas fa-rocket text-slate-500 w-4 mt-1"></i><span class="text-slate-300">${rocket}</span></p><p class="flex items-start gap-2 text-sm"><i class="fas fa-map-marker-alt text-slate-500 w-4 mt-1"></i><span class="text-slate-300">${location}</span></p></div>
    <a class="block text-center px-4 py-2 bg-slate-700 rounded-lg hover:bg-blue-500 transition-colors text-sm font-semibold" href="${url}" target="_blank" rel="noopener noreferrer">View Details <i class="fas fa-arrow-up-right-from-square ml-1"></i></a></div></article>`;
}
async function loadLaunches() {
  const grid = $("#launches-grid");
  const featured = $("#featured-launch");
  if (!grid || !featured) return;
  setMessage(grid, "Loading upcoming launches from The Space Devs…");
  try {
    const response = await fetch(API.launches, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(response.status === 429 ? "The Space Devs API rate limit was reached. Please wait a moment and reload." : `Launch API returned ${response.status}.`);
    const data = await response.json();
    const launches = Array.isArray(data.results) ? data.results : [];
    if (!launches.length) throw new Error("The API did not return upcoming launches right now.");
    clearMessage(grid);
    renderFeaturedLaunch(launches[0]);
    grid.innerHTML = launches.slice(0, 10).map(renderLaunchCard).join("");
    const count = launches.length;
    $("#launches-count") && ($("#launches-count").textContent = `${count} Launches`);
    $("#launches-count-mobile") && ($("#launches-count-mobile").textContent = String(count));
  } catch (error) {
    setMessage(grid, `${error.message || "Unable to load launch data."} Check your internet connection and open this project using VS Code Live Server.`, "error");
    grid.innerHTML += `<div class="col-span-full text-sm text-slate-400">Launch data is supplied live by <a class="text-blue-400 underline" href="https://thespacedevs.com/" target="_blank" rel="noopener noreferrer">The Space Devs</a>.</div>`;
  }
}

// Solar System OpenData API.
function normalizePlanet(body) {
  const name = body.englishName || body.name;
  const key = String(name || "").toLowerCase();
  const semimajorKm = Number(body.semimajorAxis);
  const mass = body.mass?.massValue != null && body.mass?.massExponent != null
    ? Number(body.mass.massValue) * (10 ** Number(body.mass.massExponent)) : null;
  const volume = body.vol?.volValue != null && body.vol?.volExponent != null
    ? Number(body.vol.volValue) * (10 ** Number(body.vol.volExponent)) : null;
  return { ...body, displayName: name, key, semimajorAU: Number.isFinite(semimajorKm) ? semimajorKm / 149597870.7 : null, massKg: mass, volumeKm3: volume };
}
function planetMoonCount(planet) {
  return Array.isArray(planet.moons) ? planet.moons.length : 0;
}
function updatePlanetDetail(planet) {
  if (!planet) return;
  const key = planet.key;
  const image = $("#planet-detail-image");
  if (image) { image.src = planetImages[key] || "./assets/images/placeholder.webp"; image.alt = `${planet.displayName} planet`; }
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value == null || value === "" ? "N/A" : value; };
  setText("planet-detail-name", planet.displayName);
  setText("planet-detail-description", planet.discoveredBy || planet.discoveryDate
    ? `${planet.displayName} is classified as a ${planet.bodyType || "planet"}. Its orbital and physical measurements below are loaded from Solar System OpenData. Discovery information: ${planet.discoveredBy || "not recorded"}${planet.discoveryDate ? ` (${planet.discoveryDate})` : ""}.`
    : `${planet.displayName} is a planet in our Solar System. The measurements shown here are provided by Solar System OpenData.`);
  setText("planet-distance", planet.semimajorAU == null ? "N/A" : `${formatNumber(planet.semimajorAU, 2)} AU (${formatNumber(planet.semimajorAxis, 0)} km)`);
  setText("planet-radius", planet.meanRadius == null ? "N/A" : `${formatNumber(planet.meanRadius, 0)} km`);
  setText("planet-mass", planet.massKg == null ? "N/A" : `${planet.massKg.toExponential(2)} kg`);
  setText("planet-density", planet.density == null ? "N/A" : `${formatNumber(planet.density, 2)} g/cm³`);
  setText("planet-orbital-period", planet.sideralOrbit == null ? "N/A" : `${formatNumber(planet.sideralOrbit, 2)} days`);
  setText("planet-rotation", planet.sideralRotation == null ? "N/A" : `${formatNumber(planet.sideralRotation, 2)} hours`);
  setText("planet-moons", planetMoonCount(planet));
  setText("planet-gravity", planet.gravity == null ? "N/A" : `${formatNumber(planet.gravity, 2)} m/s²`);
  setText("planet-discoverer", planet.discoveredBy || "Known since antiquity / not recorded");
  setText("planet-discovery-date", planet.discoveryDate || "Ancient / not recorded");
  setText("planet-body-type", planet.bodyType || "Planet");
  setText("planet-volume", planet.volumeKm3 == null ? "N/A" : `${planet.volumeKm3.toExponential(2)} km³`);
  setText("planet-perihelion", planet.perihelion == null ? "N/A" : `${formatNumber(planet.perihelion / 1e6, 2)}M km`);
  setText("planet-aphelion", planet.aphelion == null ? "N/A" : `${formatNumber(planet.aphelion / 1e6, 2)}M km`);
  setText("planet-eccentricity", planet.eccentricity == null ? "N/A" : formatNumber(planet.eccentricity, 4));
  setText("planet-inclination", planet.inclination == null ? "N/A" : `${formatNumber(planet.inclination, 2)}°`);
  setText("planet-axial-tilt", planet.axialTilt == null ? "N/A" : `${formatNumber(planet.axialTilt, 2)}°`);
  setText("planet-temp", planet.avgTemp == null ? "N/A" : `${formatNumber(Number(planet.avgTemp) - 273.15, 1)}°C`);
  setText("planet-escape", planet.escape == null ? "N/A" : `${formatNumber(planet.escape, 2)} km/s`);
  const facts = $("#planet-facts");
  if (facts) {
    const factList = [
      `Mean radius: ${planet.meanRadius == null ? "N/A" : `${formatNumber(planet.meanRadius, 0)} km`}`,
      `Orbital period: ${planet.sideralOrbit == null ? "N/A" : `${formatNumber(planet.sideralOrbit, 2)} days`}`,
      `Known moons listed by the API: ${planetMoonCount(planet)}`,
      `Average temperature: ${planet.avgTemp == null ? "N/A" : `${formatNumber(Number(planet.avgTemp) - 273.15, 1)}°C`}`
    ];
    facts.innerHTML = factList.map(fact => `<li class="flex items-start"><i class="fas fa-check text-green-400 mt-1 mr-2"></i><span class="text-slate-300">${escapeHTML(fact)}</span></li>`).join("");
  }
  $$(".planet-card").forEach(card => {
    const active = card.dataset.planetId === key;
    card.classList.toggle("border-blue-400", active);
    card.classList.toggle("ring-1", active);
    card.classList.toggle("ring-blue-400/50", active);
  });
}
function renderPlanetCards(planets) {
  const grid = $("#planets-grid");
  if (!grid) return;
  grid.innerHTML = planets.map(planet => {
    const key = planet.key;
    const image = escapeHTML(planetImages[key] || "./assets/images/placeholder.webp");
    const color = planetColors[key] || "#60a5fa";
    const au = planet.semimajorAU == null ? "Distance N/A" : `${formatNumber(planet.semimajorAU, 2)} AU`;
    return `<button type="button" class="planet-card bg-slate-800/50 border border-slate-700 rounded-2xl p-4 transition-all cursor-pointer group text-left" data-planet-id="${escapeHTML(key)}" style="--planet-color:${color};border-color:${color}33" aria-label="View ${escapeHTML(planet.displayName)} details"><div class="relative mb-3 h-24 flex items-center justify-center"><img alt="${escapeHTML(planet.displayName)}" class="w-20 h-20 object-contain group-hover:scale-110 transition-transform" src="${image}" loading="lazy"></div><h4 class="font-semibold text-center text-sm">${escapeHTML(planet.displayName)}</h4><p class="text-xs text-slate-400 text-center">${escapeHTML(au)}</p></button>`;
  }).join("");
  grid.querySelectorAll(".planet-card").forEach(card => card.addEventListener("click", () => {
    const planet = planetsData.find(item => item.key === card.dataset.planetId);
    updatePlanetDetail(planet);
  }));
}
function renderPlanetComparison(planets) {
  const tbody = $("#planet-comparison-tbody");
  if (!tbody) return;
  tbody.innerHTML = planets.map(planet => {
    const color = planetColors[planet.key] || "#60a5fa";
    const type = planet.bodyType || "Planet";
    const distance = planet.semimajorAU == null ? "N/A" : formatNumber(planet.semimajorAU, 2);
    const diameter = planet.meanRadius == null ? "N/A" : formatNumber(planet.meanRadius * 2, 0);
    const massRelativeToEarth = planet.massKg == null ? "N/A" : formatNumber(planet.massKg / 5.9722e24, 3);
    const period = planet.sideralOrbit == null ? "N/A" : `${formatNumber(planet.sideralOrbit, 2)} days`;
    const moons = planetMoonCount(planet);
    return `<tr class="hover:bg-slate-800/30 transition-colors"><td class="px-4 md:px-6 py-3 md:py-4 sticky left-0 bg-slate-800 z-10"><div class="flex items-center space-x-2 md:space-x-3"><div class="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0" style="background-color:${color}"></div><span class="font-semibold text-sm md:text-base whitespace-nowrap">${escapeHTML(planet.displayName)}</span></div></td><td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${distance}</td><td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${diameter}</td><td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${massRelativeToEarth}</td><td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${period}</td><td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${moons}</td><td class="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap"><span class="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-200">${escapeHTML(type)}</span></td></tr>`;
  }).join("");
}
async function loadPlanets() {
  const grid = $("#planets-grid");
  if (!grid) return;
  setMessage(grid, "Loading planet data from Solar System OpenData…");
  try {
    const response = await fetch(API.planets, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Solar System OpenData API returned ${response.status}.`);
    const data = await response.json();
    const bodies = Array.isArray(data.bodies) ? data.bodies : [];
    const planets = bodies.filter(body => body.isPlanet && planetImages[String(body.englishName || body.name).toLowerCase()]).map(normalizePlanet);
    const order = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];
    planets.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    if (planets.length !== 8) throw new Error(`Expected 8 planets, but the API returned ${planets.length}.`);
    planetsData = planets;
    clearMessage(grid);
    renderPlanetCards(planets);
    renderPlanetComparison(planets);
    updatePlanetDetail(planets.find(planet => planet.key === "earth") || planets[0]);
  } catch (error) {
    setMessage(grid, `${error.message || "Unable to load planet data."} Check your connection and use VS Code Live Server.`, "error");
  }
}

function initFullResolutionButton() {
  // The reference design's button is given an ID so its click action can be handled by JS.
  const buttons = $$("#apod-image-container button");
  const button = buttons.find(item => item.textContent.toLowerCase().includes("full resolution"));
  if (button && !button.id) button.id = "apod-full-resolution";
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initFullResolutionButton();
  initAPOD();
  loadLaunches();
  loadPlanets();
});
