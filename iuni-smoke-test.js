/**
 * iUNI - Smoke Test End-to-End
 * --------------------------------
 * Simula el flujo completo: registro estudiante -> registro empleador ->
 * publicar oferta -> estudiante aplica y marca favorito -> empleador revisa
 * postulante y lo acepta.
 *
 * Uso: node smoke-test.js
 * Requiere: backend corriendo en http://localhost:3001
 */

const axios = require("axios");

const BASE = "http://localhost:3001/api";

// ---- Datos de prueba (fijos, segun lo solicitado) ----
const STUDENT = {
  email: "Lt22009@ues.edu.sv",
  password: "Pepino00",
  userType: "STUDENT",
  firstName: "Luis",
  lastName: "Torres",
};

const EMPLOYER = {
  email: "contacto@jmtech-solutions.com",
  password: "Pepino00",
  userType: "EMPLOYER",
  repName: "Jorge Martinez",
  companyName: "JM Tech Solutions",
};

const JOB = {
  title: "Desarrollador Frontend Junior",
  description: "Buscamos un desarrollador frontend junior con conocimientos en React para apoyar al equipo de producto en el desarrollo de nuevas funcionalidades.",
  jobType: "Tiempo completo",
  experienceRequired: "Sin experiencia",
  minEducation: "Universitario",
  technicalSkills: "React, JavaScript, CSS",
  softSkills: "Trabajo en equipo, comunicacion",
  workConditions: "Modalidad hibrida",
  studentBenefits: "Horario flexible para estudiantes",
  salary: "$400 - $500 / mes",
};

// ---- Helpers de reporte ----
let passed = 0;
let failed = 0;
const results = [];

function logStep(name, ok, detail) {
  const icon = ok ? "PASS" : "FAIL";
  results.push({ name, ok, detail });
  if (ok) passed++; else failed++;
  console.log(`[${icon}] ${name}${detail ? " -> " + detail : ""}`);
}

function client() {
  return axios.create({
    baseURL: BASE,
    validateStatus: () => true, // manejamos los status manualmente
  });
}

async function main() {
  console.log("============================================");
  console.log("  iUNI SMOKE TEST - Flujo completo E2E");
  console.log("============================================\n");

  const api = client();
  let studentToken, employerToken;
  let jobId, studentProfileId, employerProfileId, applicationId;

  // ---------- 1. REGISTRO ESTUDIANTE ----------
  console.log("--- FASE 1: Registro de estudiante ---");
  const regStudent = await api.post("/auth/register", STUDENT);
  logStep(
    "Registro estudiante (" + STUDENT.email + ")",
    regStudent.status === 201,
    "status " + regStudent.status + " - " + JSON.stringify(regStudent.data).slice(0, 150)
  );

  if (regStudent.status !== 201 || !regStudent.data.requiresVerification) {
    logStep("Flujo de verificacion de email requerido", false, "No se detecto requiresVerification:true, revisar manualmente");
  } else {
    logStep("Flujo de verificacion de email requerido", true, "Correo de verificacion enviado (revisar bandeja/spam)");
  }

  // Intentar login sin verificar (debe fallar con 403)
  const loginUnverified = await api.post("/auth/login", {
    email: STUDENT.email,
    password: STUDENT.password,
  });
  logStep(
    "Login bloqueado antes de verificar email (esperado 403)",
    loginUnverified.status === 403,
    "status " + loginUnverified.status
  );

  console.log("\n>>> ACCION MANUAL REQUERIDA <<<");
  console.log("Revisa el correo de " + STUDENT.email + " (o la consola del backend en modo dev),");
  console.log("haz click en el link de verificacion, y luego presiona ENTER aqui para continuar...\n");
  await waitForEnter();

  // ---------- 2. LOGIN ESTUDIANTE (post-verificacion) ----------
  console.log("\n--- FASE 2: Login de estudiante (post-verificacion) ---");
  const loginStudent = await api.post("/auth/login", {
    email: STUDENT.email,
    password: STUDENT.password,
  });
  logStep(
    "Login estudiante exitoso",
    loginStudent.status === 200 && !!loginStudent.data.token,
    "status " + loginStudent.status
  );
  studentToken = loginStudent.data.token;
  studentProfileId = loginStudent.data.profileId;

  if (!studentToken) {
    console.log("\nNo se pudo obtener token de estudiante. Abortando pruebas dependientes.");
    printSummary();
    return;
  }

  const studentApi = authedClient(studentToken);

  // Completar perfil minimo del estudiante (necesario para poder aplicar)
  const updateStudent = await studentApi.put("/student/profile", {
    firstName: STUDENT.firstName,
    lastName: STUDENT.lastName,
    city: "San Salvador",
    country: "El Salvador",
    career: "Ingenieria en Desarrollo de Software",
    desiredPosition: "Desarrollador Frontend",
    technicalSkills: "React, JavaScript, HTML, CSS",
    softSkills: "Trabajo en equipo, comunicacion",
    profileDescription: "Estudiante de Ingenieria en Desarrollo de Software, quinto año.",
    languages: "Español, Ingles basico",
  });
  logStep(
    "Completar perfil de estudiante (requisito para aplicar)",
    updateStudent.status === 200,
    "status " + updateStudent.status
  );

  // ---------- 3. REGISTRO EMPLEADOR ----------
  console.log("\n--- FASE 3: Registro de empleador corporativo ---");
  const regEmployer = await api.post("/auth/register", EMPLOYER);
  logStep(
    "Registro empleador (" + EMPLOYER.email + ")",
    regEmployer.status === 201,
    "status " + regEmployer.status
  );
  employerToken = regEmployer.data.token;

  if (!employerToken) {
    console.log("\nNo se pudo obtener token de empleador. Abortando pruebas dependientes.");
    printSummary();
    return;
  }

  const employerApi = authedClient(employerToken);

  // Verificar clasificacion automatica de dominio (debe ser CORPORATE)
  const employerProfile = await employerApi.get("/employer/profile");
  employerProfileId = employerProfile.data.id;
  logStep(
    "Clasificacion de dominio = CORPORATE (correo no generico)",
    employerProfile.data.emailDomainType === "CORPORATE",
    "emailDomainType=" + employerProfile.data.emailDomainType
  );

  // Completar perfil de empleador
  const updateEmployer = await employerApi.put("/employer/profile", {
    phone: "2234-5678",
    city: "San Salvador",
    country: "El Salvador",
    sector: "Tecnologia",
    workerCount: 25,
    website: "jmtech-solutions.com",
    companySchedule: "Lunes a Viernes, 8am - 5pm",
  });
  logStep(
    "Completar perfil de empleador",
    updateEmployer.status === 200,
    "status " + updateEmployer.status
  );

  // ---------- 4. PUBLICAR OFERTA ----------
  console.log("\n--- FASE 4: Publicar oferta de empleo ---");
  const createJob = await employerApi.post("/jobs", JOB);
  logStep(
    "Publicar oferta '" + JOB.title + "'",
    createJob.status === 201,
    "status " + createJob.status
  );
  jobId = createJob.data.id;

  if (jobId) {
    logStep("Job ID generado correctamente", true, "id=" + jobId);
  }

  // Verificar que la oferta aparece en el listado publico
  const jobsList = await api.get("/jobs");
  const jobsArray = jobsList.data.jobs || jobsList.data;
  const foundInList = Array.isArray(jobsArray) && jobsArray.some((j) => j.id === jobId);
  logStep(
    "Oferta visible en listado general /jobs",
    foundInList,
    foundInList ? "encontrada" : "NO aparece en el listado"
  );

  // ---------- 5. ESTUDIANTE: APLICAR Y MARCAR FAVORITO ----------
  console.log("\n--- FASE 5: Estudiante aplica y marca favorito ---");

  const toggleFav = await studentApi.post("/favorites/" + jobId + "/toggle");
  logStep(
    "Marcar oferta como favorito",
    toggleFav.status === 200 && toggleFav.data.favorited === true,
    "favorited=" + toggleFav.data.favorited
  );

  const myFavs = await studentApi.get("/favorites/my");
  const favFound = myFavs.data.some((f) => f.jobPostId === jobId);
  logStep(
    "Oferta aparece en /favorites/my",
    favFound,
    favFound ? "encontrada" : "NO aparece en favoritos"
  );

  const apply = await studentApi.post("/applications/" + jobId + "/apply");
  logStep(
    "Estudiante aplica a la oferta",
    apply.status === 201,
    "status " + apply.status + " - " + JSON.stringify(apply.data).slice(0, 150)
  );
  applicationId = apply.data.id;

  // Intentar aplicar de nuevo (debe fallar, ya aplico)
  const applyAgain = await studentApi.post("/applications/" + jobId + "/apply");
  logStep(
    "Bloquear postulacion duplicada (esperado 400)",
    applyAgain.status === 400,
    "status " + applyAgain.status
  );

  const myApps = await studentApi.get("/applications/my");
  const appFound = myApps.data.some((a) => a.jobPostId === jobId);
  logStep(
    "Postulacion aparece en /applications/my",
    appFound,
    appFound ? "encontrada" : "NO aparece"
  );

  // ---------- 6. EMPLEADOR: VER POSTULANTES Y PERFIL ----------
  console.log("\n--- FASE 6: Empleador revisa postulantes ---");

  const applicants = await employerApi.get("/applications/" + jobId + "/list");
  const applicantFound = applicants.data.find((a) => a.id === applicationId);
  logStep(
    "Postulante visible en lista de aplicantes de la oferta",
    !!applicantFound,
    applicantFound ? "studentId=" + applicantFound.student?.id : "no encontrado"
  );

  if (applicantFound) {
    const studentIdForView = applicantFound.student.id;

    const publicProfile = await employerApi.get("/student/public/" + studentIdForView);
    logStep(
      "Empleador ve perfil publico del estudiante",
      publicProfile.status === 200,
      "status " + publicProfile.status
    );

    logStep(
      "Perfil publico NO expone email del estudiante",
      publicProfile.data.email === undefined,
      publicProfile.data.email ? "FALLO: email expuesto = " + publicProfile.data.email : "email ausente, correcto"
    );

    logStep(
      "Perfil publico muestra universidad en lugar de email",
      !!publicProfile.data.university,
      "university=" + publicProfile.data.university
    );

    // Registrar vista de perfil (notificacion para el estudiante)
    const registerView = await employerApi.post("/views/student/" + studentIdForView);
    logStep(
      "Registrar vista de perfil del estudiante",
      registerView.status === 200 || registerView.status === 201,
      "status " + registerView.status
    );

    // ---------- 7. ACEPTAR POSTULACION ----------
    console.log("\n--- FASE 7: Empleador acepta la postulacion ---");

    const acceptApp = await employerApi.patch("/applications/" + applicationId + "/status", {
      status: "ACEPTADO",
    });
    logStep(
      "Cambiar estado de postulacion a ACEPTADO",
      acceptApp.status === 200 && acceptApp.data.status === "ACEPTADO",
      "status final=" + acceptApp.data.status
    );

    // Verificar que el estudiante ve el cambio de estado reflejado
    const myAppsAfter = await studentApi.get("/applications/my");
    const appAfter = myAppsAfter.data.find((a) => a.id === applicationId);
    logStep(
      "Estudiante ve estado actualizado a ACEPTADO",
      appAfter && appAfter.status === "ACEPTADO",
      appAfter ? "status=" + appAfter.status : "no encontrado"
    );

    // Verificar notificacion generada para el estudiante
    const studentNotifs = await studentApi.get("/notifications");
    const hasAcceptNotif = studentNotifs.data.some(
      (n) => n.message && n.message.toLowerCase().includes("acept")
    );
    logStep(
      "Notificacion de aceptacion generada para el estudiante",
      hasAcceptNotif,
      hasAcceptNotif ? "encontrada" : "NO se encontro notificacion de aceptacion"
    );
  }

  // ---------- 8. PRUEBAS ADICIONALES DE SEGURIDAD ----------
  console.log("\n--- FASE 8: Pruebas adicionales de seguridad ---");

  // Estudiante intenta acceder a ruta de empleador (debe fallar)
  const studentTriesEmployerRoute = await studentApi.get("/jobs/my-posts");
  logStep(
    "Estudiante no puede acceder a /jobs/my-posts (ruta de empleador)",
    studentTriesEmployerRoute.status === 403 || studentTriesEmployerRoute.status === 401,
    "status " + studentTriesEmployerRoute.status
  );

  // Acceso sin token a ruta protegida (debe fallar con 401)
  const noTokenApi = client();
  const noAuth = await noTokenApi.get("/notifications");
  logStep(
    "Acceso sin token a ruta protegida es rechazado (esperado 401)",
    noAuth.status === 401,
    "status " + noAuth.status
  );

  // Empleador intenta editar la oferta (debe poder, es su oferta)
  const editOwnJob = await employerApi.put("/jobs/" + jobId, { title: JOB.title + " (editado)" });
  logStep(
    "Empleador puede editar su propia oferta",
    editOwnJob.status === 200,
    "status " + editOwnJob.status
  );

  // Estudiante intenta editar la oferta ajena (debe fallar)
  const editForeignJob = await studentApi.put("/jobs/" + jobId, { title: "Hackeado" });
  logStep(
    "Estudiante no puede editar oferta ajena (esperado 403/401/500)",
    editForeignJob.status >= 400,
    "status " + editForeignJob.status
  );

  printSummary();
}

function authedClient(token) {
  return axios.create({
    baseURL: BASE,
    validateStatus: () => true,
    headers: { Authorization: "Bearer " + token },
  });
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.once("data", () => resolve());
  });
}

function printSummary() {
  console.log("\n============================================");
  console.log("  RESUMEN");
  console.log("============================================");
  console.log("Total pruebas: " + (passed + failed));
  console.log("Pasaron:       " + passed);
  console.log("Fallaron:      " + failed);
  if (failed > 0) {
    console.log("\nPruebas fallidas:");
    results.filter((r) => !r.ok).forEach((r) => console.log("  - " + r.name + " (" + r.detail + ")"));
  }
  console.log("============================================\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\nERROR FATAL en el script de pruebas:", err.message);
  console.error(err);
  process.exit(1);
});
