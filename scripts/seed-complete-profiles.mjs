import pg from "pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const { Pool } = pg

const connectionString = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/gi, "")

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function seedCompleteData() {
  console.log("Seeding Master Data and Complete User Profiles...")

  // 1. Seed Examinations
  const examsList = [
    "Philippine Nursing Licensure Examination (PNLE)",
    "National Council Licensure Examination (NCLEX)",
    "Licensure Examination for Professional Teachers (LEPT)",
  ]
  const examIds = []
  for (const name of examsList) {
    let row = (await pool.query("SELECT id FROM examinations WHERE name = $1", [name])).rows[0]
    if (!row) {
      row = (await pool.query("INSERT INTO examinations (name) VALUES ($1) RETURNING id", [name])).rows[0]
    }
    examIds.push(row.id)
  }

  // 2. Seed Batches
  const batchList = [
    { name: "Batch 2026 - Alpha", exam_id: examIds[0], target_year: 2026 },
    { name: "Batch 2026 - Bravo", exam_id: examIds[0], target_year: 2026 },
    { name: "Batch 2026 - Comprehensive NCLEX", exam_id: examIds[1], target_year: 2026 },
  ]
  const batchIds = []
  for (const b of batchList) {
    let row = (await pool.query("SELECT id FROM batches WHERE name = $1", [b.name])).rows[0]
    if (!row) {
      row = (await pool.query(
        "INSERT INTO batches (name, exam_id, target_year, status) VALUES ($1, $2, $3, 'active') RETURNING id",
        [b.name, b.exam_id, b.target_year]
      )).rows[0]
    }
    batchIds.push(row.id)
  }

  // 3. Seed Schools
  const schoolList = [
    { name: "University of the Philippines Manila", address: "Ermita, Manila" },
    { name: "University of Santo Tomas", address: "España Blvd, Manila" },
    { name: "Xavier University - Ateneo de Cagayan", address: "Cagayan de Oro City" },
    { name: "Cebu Doctors' University", address: "Mandaue City, Cebu" },
    { name: "Saint Louis University", address: "Baguio City" },
    { name: "Capitol University", address: "Cagayan de Oro City" },
    { name: "Mindanao State University - IIT", address: "Iligan City" },
  ]
  const schoolIds = []
  for (const s of schoolList) {
    let row = (await pool.query("SELECT id FROM schools WHERE name = $1", [s.name])).rows[0]
    if (!row) {
      row = (await pool.query("INSERT INTO schools (name, address) VALUES ($1, $2) RETURNING id", [s.name, s.address])).rows[0]
    }
    schoolIds.push(row.id)
  }

  // 4. Seed Academic Courses
  const academicCoursesList = [
    "Bachelor of Science in Nursing (BSN)",
    "Bachelor of Secondary Education (BSED)",
    "Bachelor of Science in Medical Technology (BSMT)",
    "Bachelor of Science in Pharmacy (BSP)",
    "Bachelor of Science in Psychology (BS Psych)",
  ]
  const courseIds = []
  for (const c of academicCoursesList) {
    let row = (await pool.query("SELECT id FROM academic_courses WHERE name = $1", [c])).rows[0]
    if (!row) {
      row = (await pool.query("INSERT INTO academic_courses (name) VALUES ($1) RETURNING id", [c])).rows[0]
    }
    courseIds.push(row.id)
  }

  const passwordHash = await bcrypt.hash("password123", 10)

  // 5. Complete Students Profile Data
  const studentProfiles = [
    {
      name: "Maria Santos",
      email: "maria.santos@peak.edu.ph",
      firstName: "Maria",
      middleName: "Clara",
      lastName: "Santos",
      suffix: "",
      birthday: "2002-05-14",
      gender: "Female",
      phone: "+63 917 234 5678",
      address: "Block 12 Lot 4, Sunflower St., Brgy. Carmen",
      city: "Cagayan de Oro City",
      province: "Misamis Oriental",
      zipCode: "9000",
      highestEducation: "College Graduate",
      schoolId: schoolIds[2],
      courseId: courseIds[0],
      schoolName: "Xavier University - Ateneo de Cagayan",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2024",
      examId: examIds[0],
      batchId: batchIds[0],
    },
    {
      name: "Juan Reyes",
      email: "juan.reyes@peak.edu.ph",
      firstName: "Juan",
      middleName: "Dela Cruz",
      lastName: "Reyes",
      suffix: "Jr.",
      birthday: "2001-11-20",
      gender: "Male",
      phone: "+63 928 456 7890",
      address: "Unit 502, Pine Crest Residences, Aurora Blvd.",
      city: "Quezon City",
      province: "Metro Manila",
      zipCode: "1112",
      highestEducation: "College Graduate",
      schoolId: schoolIds[0],
      courseId: courseIds[0],
      schoolName: "University of the Philippines Manila",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2023",
      examId: examIds[0],
      batchId: batchIds[0],
    },
    {
      name: "Alyssa Cruz",
      email: "alyssa.cruz@peak.edu.ph",
      firstName: "Alyssa",
      middleName: "Mae",
      lastName: "Cruz",
      suffix: "",
      birthday: "2003-02-18",
      gender: "Female",
      phone: "+63 919 678 1234",
      address: "45 Sampaguita St., Banilad",
      city: "Cebu City",
      province: "Cebu",
      zipCode: "6000",
      highestEducation: "College Graduate",
      schoolId: schoolIds[3],
      courseId: courseIds[0],
      schoolName: "Cebu Doctors' University",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2024",
      examId: examIds[1],
      batchId: batchIds[2],
    },
    {
      name: "Gabriel Mendoza",
      email: "gabriel.mendoza@peak.edu.ph",
      firstName: "Gabriel",
      middleName: "Luis",
      lastName: "Mendoza",
      suffix: "",
      birthday: "2002-09-08",
      gender: "Male",
      phone: "+63 935 123 9876",
      address: "18 Session Road, DPS Compound",
      city: "Baguio City",
      province: "Benguet",
      zipCode: "2600",
      highestEducation: "College Graduate",
      schoolId: schoolIds[4],
      courseId: courseIds[0],
      schoolName: "Saint Louis University",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2024",
      examId: examIds[0],
      batchId: batchIds[1],
    },
    {
      name: "Kaye Dela Rosa",
      email: "kaye.delarosa@peak.edu.ph",
      firstName: "Kaye",
      middleName: "Anne",
      lastName: "Dela Rosa",
      suffix: "",
      birthday: "2001-07-25",
      gender: "Female",
      phone: "+63 945 789 2345",
      address: "Phase 3 Block 8, Villa Ernesto Subd., Gusa",
      city: "Cagayan de Oro City",
      province: "Misamis Oriental",
      zipCode: "9000",
      highestEducation: "College Graduate",
      schoolId: schoolIds[5],
      courseId: courseIds[0],
      schoolName: "Capitol University",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2023",
      examId: examIds[0],
      batchId: batchIds[0],
    },
    {
      name: "Mark Villanueva",
      email: "mark.villanueva@peak.edu.ph",
      firstName: "Mark",
      middleName: "Anthony",
      lastName: "Villanueva",
      suffix: "III",
      birthday: "2000-12-03",
      gender: "Male",
      phone: "+63 956 345 6789",
      address: "102 MacArthur Highway, Matina",
      city: "Davao City",
      province: "Davao del Sur",
      zipCode: "8000",
      highestEducation: "College Graduate",
      schoolId: schoolIds[1],
      courseId: courseIds[0],
      schoolName: "University of Santo Tomas",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2022",
      examId: examIds[0],
      batchId: batchIds[1],
    },
    {
      name: "Sophia Bautista",
      email: "sophia.bautista@peak.edu.ph",
      firstName: "Sophia",
      middleName: "Grace",
      lastName: "Bautista",
      suffix: "",
      birthday: "2003-04-12",
      gender: "Female",
      phone: "+63 967 890 1234",
      address: "24 Tibanga Highway",
      city: "Iligan City",
      province: "Lanao del Norte",
      zipCode: "9200",
      highestEducation: "College Graduate",
      schoolId: schoolIds[6],
      courseId: courseIds[0],
      schoolName: "Mindanao State University - IIT",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2024",
      examId: examIds[0],
      batchId: batchIds[0],
    },
    {
      name: "Christian Lim",
      email: "christian.lim@peak.edu.ph",
      firstName: "Christian",
      middleName: "Paul",
      lastName: "Lim",
      suffix: "",
      birthday: "2002-01-30",
      gender: "Male",
      phone: "+63 978 234 5678",
      address: "77 Real Street, Downtown",
      city: "Tacloban City",
      province: "Leyte",
      zipCode: "6500",
      highestEducation: "College Graduate",
      schoolId: schoolIds[3],
      courseId: courseIds[0],
      schoolName: "Cebu Doctors' University",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2024",
      examId: examIds[1],
      batchId: batchIds[2],
    },
    {
      name: "Patricia Navarro",
      email: "patricia.navarro@peak.edu.ph",
      firstName: "Patricia",
      middleName: "Nicole",
      lastName: "Navarro",
      suffix: "",
      birthday: "2001-08-19",
      gender: "Female",
      phone: "+63 989 456 7890",
      address: "15 Fortich St., Poblacion",
      city: "Malaybalay City",
      province: "Bukidnon",
      zipCode: "8700",
      highestEducation: "College Graduate",
      schoolId: schoolIds[2],
      courseId: courseIds[0],
      schoolName: "Xavier University - Ateneo de Cagayan",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2023",
      examId: examIds[0],
      batchId: batchIds[0],
    },
    {
      name: "Joshua Ramos",
      email: "joshua.ramos@peak.edu.ph",
      firstName: "Joshua",
      middleName: "Santos",
      lastName: "Ramos",
      suffix: "",
      birthday: "2002-10-10",
      gender: "Male",
      phone: "+63 999 123 4567",
      address: "88 Rizal Avenue, San Nicolas",
      city: "Surigao City",
      province: "Surigao del Norte",
      zipCode: "8400",
      highestEducation: "College Graduate",
      schoolId: schoolIds[5],
      courseId: courseIds[0],
      schoolName: "Capitol University",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2024",
      examId: examIds[0],
      batchId: batchIds[0],
    },
  ]

  // 6. Complete Teachers Profile Data
  const teacherProfiles = [
    {
      name: "Dr. Roberto Garcia",
      email: "roberto.garcia@peak.edu.ph",
      firstName: "Roberto",
      middleName: "Alvarez",
      lastName: "Garcia",
      suffix: "MD",
      birthday: "1984-06-15",
      gender: "Male",
      phone: "+63 917 555 1212",
      address: "14 Mahogany Drive, Greenhills",
      city: "San Juan City",
      province: "Metro Manila",
      zipCode: "1500",
      highestEducation: "Doctorate / Post-Graduate",
      schoolId: schoolIds[0],
      courseId: courseIds[0],
      schoolName: "University of the Philippines Manila",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2008",
      examId: examIds[0],
    },
    {
      name: "Prof. Elena Fernandez",
      email: "elena.fernandez@peak.edu.ph",
      firstName: "Elena",
      middleName: "Cruz",
      lastName: "Fernandez",
      suffix: "RN, MAN",
      birthday: "1988-03-22",
      gender: "Female",
      phone: "+63 918 555 3434",
      address: "21 Orchid Lane, Pueblo de Oro",
      city: "Cagayan de Oro City",
      province: "Misamis Oriental",
      zipCode: "9000",
      highestEducation: "Master's Degree",
      schoolId: schoolIds[2],
      courseId: courseIds[0],
      schoolName: "Xavier University - Ateneo de Cagayan",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2012",
      examId: examIds[0],
    },
    {
      name: "Dr. Anthony De Leon",
      email: "anthony.deleon@peak.edu.ph",
      firstName: "Anthony",
      middleName: "Velasco",
      lastName: "De Leon",
      suffix: "PhD",
      birthday: "1980-09-05",
      gender: "Male",
      phone: "+63 919 555 7878",
      address: "88 Escario Street, Lahug",
      city: "Cebu City",
      province: "Cebu",
      zipCode: "6000",
      highestEducation: "Doctorate / Post-Graduate",
      schoolId: schoolIds[1],
      courseId: courseIds[0],
      schoolName: "University of Santo Tomas",
      courseName: "Bachelor of Science in Nursing (BSN)",
      yearGraduated: "2005",
      examId: examIds[1],
    },
  ]

  for (const s of studentProfiles) {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [s.email])
    const values = [
      s.name, s.email, passwordHash, "student",
      s.firstName, s.middleName, s.lastName, s.suffix,
      s.birthday, s.gender, s.phone, s.address, s.city, s.province, s.zipCode,
      s.highestEducation, s.schoolId, s.courseId, s.schoolName, s.courseName, s.yearGraduated,
      s.examId, s.batchId
    ]

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE users SET
          name = $1, password = $3, role = $4,
          first_name = $5, middle_name = $6, last_name = $7, suffix = $8,
          birthday = $9, gender = $10, phone = $11, address = $12, city = $13, province = $14, zip_code = $15,
          highest_education = $16, school_id = $17, academic_course_id = $18, school = $19, course = $20, year_graduated = $21,
          exam_id = $22, batch_id = $23
        WHERE email = $2`,
        values
      )
      console.log(`[Student Updated Full Profile]: ${s.email} (${s.name})`)
    } else {
      await pool.query(
        `INSERT INTO users (
          name, email, password, role,
          first_name, middle_name, last_name, suffix,
          birthday, gender, phone, address, city, province, zip_code,
          highest_education, school_id, academic_course_id, school, course, year_graduated,
          exam_id, batch_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
        values
      )
      console.log(`[Student Created Full Profile]: ${s.email} (${s.name})`)
    }
  }

  for (const t of teacherProfiles) {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [t.email])
    const values = [
      t.name, t.email, passwordHash, "teacher",
      t.firstName, t.middleName, t.lastName, t.suffix,
      t.birthday, t.gender, t.phone, t.address, t.city, t.province, t.zipCode,
      t.highestEducation, t.schoolId, t.courseId, t.schoolName, t.courseName, t.yearGraduated,
      t.examId
    ]

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE users SET
          name = $1, password = $3, role = $4,
          first_name = $5, middle_name = $6, last_name = $7, suffix = $8,
          birthday = $9, gender = $10, phone = $11, address = $12, city = $13, province = $14, zip_code = $15,
          highest_education = $16, school_id = $17, academic_course_id = $18, school = $19, course = $20, year_graduated = $21,
          exam_id = $22
        WHERE email = $2`,
        values
      )
      console.log(`[Teacher Updated Full Profile]: ${t.email} (${t.name})`)
    } else {
      await pool.query(
        `INSERT INTO users (
          name, email, password, role,
          first_name, middle_name, last_name, suffix,
          birthday, gender, phone, address, city, province, zip_code,
          highest_education, school_id, academic_course_id, school, course, year_graduated,
          exam_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        values
      )
      console.log(`[Teacher Created Full Profile]: ${t.email} (${t.name})`)
    }
  }

  console.log("\nAll master data and full user profile records populated successfully!")
  await pool.end()
}

seedCompleteData().catch(err => {
  console.error("Error populating data:", err)
  process.exit(1)
})
