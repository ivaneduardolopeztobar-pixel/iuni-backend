/**
 * iUNI - Load Test (prueba de estres basica)
 * --------------------------------------------
 * Simula N usuarios concurrentes haciendo peticiones reales contra
 * las rutas mas visitadas de la plataforma.
 *
 * Uso: node load-test.js [usuarios] [oleadas]
 * Ejemplo: node load-test.js 50 5
 *
 * Requiere: backend corriendo en http://localhost:3001
 * Requiere: al menos un usuario logueado para rutas autenticadas (opcional)
 */

const axios = require("axios");

const BASE = "http://localhost:3001/api";
const CONCURRENT_USERS = parseInt(process.argv[2]) || 50;
const WAVES = parseInt(process.argv[3]) || 5;
const DELAY_BETWEEN_WAVES_MS = 1500;

// Rutas publicas (no requieren login) - representan lo que mas trafico recibe
const PUBLIC_ROUTES = [
  { method: "GET", path: "/jobs", weight: 5 },           // home / busqueda (mas frecuente)
  { method: "GET", path: "/jobs?search=desarrollador", weight: 3 },
  { method: "GET", path: "/jobs?page=2", weight: 2 },
];

function client() {
  return axios.create({
    baseURL: BASE,
    timeout: 15000,
    validateStatus: () => true,
  });
}

function pickRoute() {
  const totalWeight = PUBLIC_ROUTES.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const route of PUBLIC_ROUTES) {
    if (rand < route.weight) return route;
    rand -= route.weight;
  }
  return PUBLIC_ROUTES[0];
}

async function fireRequest(api, id) {
  const route = pickRoute();
  const start = Date.now();
  try {
    const res = await api.request({ method: route.method, url: route.path });
    const elapsed = Date.now() - start;
    return { id, path: route.path, status: res.status, elapsed, ok: res.status >= 200 && res.status < 300 };
  } catch (err) {
    const elapsed = Date.now() - start;
    return { id, path: route.path, status: "ERROR", elapsed, ok: false, error: err.message };
  }
}

async function runWave(api, waveNum, concurrency) {
  console.log(`\n--- Oleada ${waveNum} -- ${concurrency} peticiones simultaneas ---`);
  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(fireRequest(api, i));
  }
  const waveStart = Date.now();
  const results = await Promise.all(promises);
  const waveElapsed = Date.now() - waveStart;

  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  const times = results.map((r) => r.elapsed);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const sorted = [...times].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  console.log(`Tiempo total de la oleada: ${waveElapsed}ms`);
  console.log(`Exitosas: ${ok}/${concurrency}  |  Fallidas: ${failed.length}`);
  console.log(`Latencia -> min: ${min}ms  avg: ${avg.toFixed(0)}ms  p95: ${p95}ms  max: ${max}ms`);

  if (failed.length > 0) {
    console.log("Detalle de fallos:");
    const grouped = {};
    failed.forEach((f) => {
      const key = f.status + (f.error ? " - " + f.error : "");
      grouped[key] = (grouped[key] || 0) + 1;
    });
    Object.entries(grouped).forEach(([key, count]) => console.log(`  ${key}: ${count} veces`));
  }

  return { waveNum, concurrency, waveElapsed, ok, failed: failed.length, avg, min, max, p95 };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("============================================");
  console.log("  iUNI LOAD TEST");
  console.log("============================================");
  console.log(`Usuarios concurrentes por oleada: ${CONCURRENT_USERS}`);
  console.log(`Numero de oleadas: ${WAVES}`);
  console.log(`Rutas probadas: ${PUBLIC_ROUTES.map((r) => r.path).join(", ")}`);

  const api = client();
  const allWaves = [];

  for (let w = 1; w <= WAVES; w++) {
    const result = await runWave(api, w, CONCURRENT_USERS);
    allWaves.push(result);
    if (w < WAVES) await sleep(DELAY_BETWEEN_WAVES_MS);
  }

  console.log("\n============================================");
  console.log("  RESUMEN FINAL");
  console.log("============================================");
  const totalRequests = allWaves.reduce((s, w) => s + w.concurrency, 0);
  const totalOk = allWaves.reduce((s, w) => s + w.ok, 0);
  const totalFailed = allWaves.reduce((s, w) => s + w.failed, 0);
  const overallAvg = allWaves.reduce((s, w) => s + w.avg, 0) / allWaves.length;
  const worstP95 = Math.max(...allWaves.map((w) => w.p95));

  console.log(`Total de peticiones disparadas: ${totalRequests}`);
  console.log(`Exitosas: ${totalOk} (${((totalOk / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Fallidas: ${totalFailed} (${((totalFailed / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Latencia promedio general: ${overallAvg.toFixed(0)}ms`);
  console.log(`Peor p95 entre todas las oleadas: ${worstP95}ms`);

  console.log("\nTendencia por oleada (revisar si la latencia sube con el tiempo):");
  allWaves.forEach((w) => {
    console.log(`  Oleada ${w.waveNum}: avg=${w.avg.toFixed(0)}ms  p95=${w.p95}ms  fallos=${w.failed}`);
  });

  console.log("\nInterpretacion rapida:");
  if (totalFailed === 0 && overallAvg < 500) {
    console.log("  El servidor respondio bien bajo esta carga. Buen margen.");
  } else if (totalFailed === 0 && overallAvg < 2000) {
    console.log("  El servidor respondio sin errores pero con latencia notoria. Vigilar en produccion.");
  } else if (totalFailed > 0) {
    console.log("  Hubo peticiones fallidas. Revisar si fue rate-limit (esperado) o error real del servidor.");
  }
  console.log("============================================\n");
}

main().catch((err) => {
  console.error("ERROR FATAL:", err.message);
  process.exit(1);
});
