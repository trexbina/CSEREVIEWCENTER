import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env' });
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

const CDO_SCHOOLS = [
  { name: 'Xavier University – Ateneo de Cagayan', address: 'Corrales Ave, Cagayan de Oro' },
  { name: 'Liceo de Cagayan University', address: 'RN Pelaez Blvd, Carmen, Cagayan de Oro' },
  { name: 'Capitol University', address: 'Osmeña Extension, Cagayan de Oro' },
  { name: 'PHINMA – Cagayan de Oro College (COC)', address: 'Max Suniel St, Carmen, Cagayan de Oro' },
  { name: 'University of Science and Technology of Southern Philippines (USTP)', address: 'Claro M. Recto Ave, Lapasan, Cagayan de Oro' },
  { name: 'Southern Philippines College (SPC)', address: 'Julio Pacana St, Licuan, Cagayan de Oro' },
  { name: 'Lourdes College Cagayan de Oro', address: 'Capistrano-Hayes St, Cagayan de Oro' },
  { name: 'Pilgrim Christian College', address: 'Akut St, Cagayan de Oro' },
  { name: 'Golden Heritage Polytechnic College', address: 'Macahambus St, Cagayan de Oro' },
  { name: 'STI College – Cagayan de Oro', address: 'Kauswagan National Highway, Cagayan de Oro' },
];

const BEED_STUDENTS = [
  {
    first_name: 'Maria Clarisse',
    middle_name: 'Flores',
    last_name: 'Santos',
    suffix: null,
    gender: 'Female',
    birthday: '2003-02-14',
    address: 'Zone 4, Barangay Carmen',
    email: 'maria.clarisse.santos2003@gmail.com',
    phone: '09171234501',
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Joshua',
    middle_name: 'David',
    last_name: 'Mendoza',
    suffix: null,
    gender: 'Male',
    birthday: '2003-03-22',
    address: 'Block 12 Lot 5, Xavier Heights, Barangay Upper Balulang',
    email: 'joshua.mendoza2003@gmail.com',
    phone: '09171234502',
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Alyssa Jane',
    middle_name: 'Tan',
    last_name: 'Navarro',
    suffix: null,
    gender: 'Female',
    birthday: '2003-05-18',
    address: 'Purok 3, Barangay Macasandig',
    email: 'alyssa.navarro2003@gmail.com',
    phone: '09171234503',
    year_graduated: '2025',
    highest_education: 'Undergraduate',
  },
  {
    first_name: 'Christian',
    middle_name: 'Paul',
    last_name: 'Villanueva',
    suffix: 'Jr.',
    gender: 'Male',
    birthday: '2003-06-11',
    address: 'Zone 2, Highway, Barangay Lapasan',
    email: 'christian.villanueva.jr2003@gmail.com',
    phone: '09171234504',
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Bea Louise',
    middle_name: 'Reyes',
    last_name: 'Aquino',
    suffix: null,
    gender: 'Female',
    birthday: '2003-07-29',
    address: 'Block 6 Lot 14, Morning Mist Village, Barangay Upper Carmen',
    email: 'bea.aquino2003@gmail.com',
    phone: '09171234505',
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Angelo Mark',
    middle_name: 'Cruz',
    last_name: 'Del Rosario',
    suffix: null,
    gender: 'Male',
    birthday: '2003-08-15',
    address: 'Zone 5, Barangay Kauswagan',
    email: 'angelo.delrosario2003@gmail.com',
    phone: '09171234506',
    year_graduated: '2025',
    highest_education: 'Undergraduate',
  },
  {
    first_name: 'Patricia Ann',
    middle_name: 'Lim',
    last_name: 'Bautista',
    suffix: null,
    gender: 'Female',
    birthday: '2003-09-03',
    address: '28 Tomas Saco St., Barangay Nazareth',
    email: 'patricia.bautista2003@gmail.com',
    phone: '09171234507',
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Kevin Vance',
    middle_name: 'Chua',
    last_name: 'Mercado',
    suffix: null,
    gender: 'Male',
    birthday: '2003-10-21',
    address: 'Zone 1, Calaanan, Barangay Canitoan',
    email: 'kevin.mercado2003@gmail.com',
    phone: '09171234508',
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Kimberly Joy',
    middle_name: 'Morales',
    last_name: 'Castillo',
    suffix: null,
    gender: 'Female',
    birthday: '2003-11-08',
    address: 'Block 3 Lot 9, Golden Village, Barangay Carmen',
    email: 'kimberly.castillo2003@gmail.com',
    phone: '09171234509',
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Gabriel Ian',
    middle_name: 'Soriano',
    last_name: 'Salazar',
    suffix: 'III',
    gender: 'Male',
    birthday: '2003-12-19',
    address: '144 Hayes St., Barangay 40',
    email: 'gabriel.salazar2003@gmail.com',
    phone: '09171234510',
    year_graduated: '2025',
    highest_education: 'Undergraduate',
  },
];

const BSED_STUDENTS = [
  {
    first_name: 'Princess Nicole',
    middle_name: 'Alcantara',
    last_name: 'Ramos',
    suffix: null,
    gender: 'Female',
    birthday: '2003-01-25',
    address: 'Zone 3, Barangay Bulua',
    email: 'princess.ramos2003@gmail.com',
    phone: '09171234511',
    major_id: 1, // English
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Rafael',
    middle_name: 'Gomez',
    last_name: 'Torres',
    suffix: null,
    gender: 'Male',
    birthday: '2003-02-10',
    address: '75 Pabayo St., Barangay 12',
    email: 'rafael.torres2003@gmail.com',
    phone: '09171234512',
    major_id: 2, // Filipino
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Hannah Grace',
    middle_name: 'Suarez',
    last_name: 'Pascual',
    suffix: null,
    gender: 'Female',
    birthday: '2003-04-05',
    address: 'Zone 2, Riverside, Barangay Macasandig',
    email: 'hannah.pascual2003@gmail.com',
    phone: '09171234513',
    major_id: 3, // Mathematics
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Mark Anthony',
    middle_name: 'Castro',
    last_name: 'Valdez',
    suffix: 'Jr.',
    gender: 'Male',
    birthday: '2003-05-30',
    address: 'Block 8 Lot 15, Pueblo de Oro, Barangay Upper Carmen',
    email: 'mark.valdez.jr2003@gmail.com',
    phone: '09171234514',
    major_id: 1, // English
    year_graduated: '2025',
    highest_education: 'Undergraduate',
  },
  {
    first_name: 'Camille Rose',
    middle_name: 'Tolentino',
    last_name: 'Galang',
    suffix: null,
    gender: 'Female',
    birthday: '2003-06-24',
    address: 'Zone 7, Barangay Gusa',
    email: 'camille.galang2003@gmail.com',
    phone: '09171234515',
    major_id: 2, // Filipino
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'John Dominic',
    middle_name: 'Gutierrez',
    last_name: 'Padilla',
    suffix: null,
    gender: 'Male',
    birthday: '2003-07-14',
    address: 'Zone 1, Barangay Patag',
    email: 'john.padilla2003@gmail.com',
    phone: '09171234516',
    major_id: 3, // Mathematics
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Erika Mae',
    middle_name: 'Perez',
    last_name: 'Ocampo',
    suffix: null,
    gender: 'Female',
    birthday: '2003-08-27',
    address: 'Zone 4, Barangay Camaman-an',
    email: 'erika.ocampo2003@gmail.com',
    phone: '09171234517',
    major_id: 1, // English
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Dominic Kyle',
    middle_name: 'Velasco',
    last_name: 'Romero',
    suffix: null,
    gender: 'Male',
    birthday: '2003-09-16',
    address: 'Purok 4, Barangay Puerto',
    email: 'dominic.romero2003@gmail.com',
    phone: '09171234518',
    major_id: 2, // Filipino
    year_graduated: '2025',
    highest_education: 'Undergraduate',
  },
  {
    first_name: 'Rochelle Ann',
    middle_name: 'Santiago',
    last_name: 'Cordero',
    suffix: null,
    gender: 'Female',
    birthday: '2003-10-12',
    address: 'Zone 6, Barangay Tablon',
    email: 'rochelle.cordero2003@gmail.com',
    phone: '09171234519',
    major_id: 3, // Mathematics
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
  {
    first_name: 'Adrian Paul',
    middle_name: 'Estrella',
    last_name: 'Miranda',
    suffix: null,
    gender: 'Male',
    birthday: '2003-11-23',
    address: 'Zone 3, Barangay Iponan',
    email: 'adrian.miranda2003@gmail.com',
    phone: '09171234520',
    major_id: 1, // English
    year_graduated: '2024',
    highest_education: 'College Graduate',
  },
];

async function ensureSchools() {
  const schoolMap = new Map();

  for (const s of CDO_SCHOOLS) {
    const existing = await pool.query('SELECT id, name FROM schools WHERE LOWER(name) = LOWER($1)', [s.name]);
    if (existing.rows.length > 0) {
      schoolMap.set(s.name, existing.rows[0].id);
    } else {
      const res = await pool.query(
        'INSERT INTO schools (name, address, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id, name',
        [s.name, s.address]
      );
      schoolMap.set(s.name, res.rows[0].id);
      console.log(`[School Created] ${res.rows[0].name} (ID: ${res.rows[0].id})`);
    }
  }

  return schoolMap;
}

async function insertPreRegistration(student, schoolObj, programDetails) {
  const cleanEmail = student.email.toLowerCase().trim();

  const insertQuery = `
    INSERT INTO pre_registrations (
      first_name, middle_name, last_name, suffix,
      email, phone, birthday, gender,
      address, city, province, zip_code,
      school, school_id, course, academic_course_id,
      year_graduated, highest_education,
      exam_id, program_id, major_id, batch_id,
      status
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8,
      $9, $10, $11, $12,
      $13, $14, $15, $16,
      $17, $18,
      $19, $20, $21, $22,
      'PENDING'
    )
    ON CONFLICT (email) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      middle_name = EXCLUDED.middle_name,
      last_name = EXCLUDED.last_name,
      suffix = EXCLUDED.suffix,
      phone = EXCLUDED.phone,
      birthday = EXCLUDED.birthday,
      gender = EXCLUDED.gender,
      address = EXCLUDED.address,
      city = EXCLUDED.city,
      province = EXCLUDED.province,
      zip_code = EXCLUDED.zip_code,
      school = EXCLUDED.school,
      school_id = EXCLUDED.school_id,
      course = EXCLUDED.course,
      academic_course_id = EXCLUDED.academic_course_id,
      year_graduated = EXCLUDED.year_graduated,
      highest_education = EXCLUDED.highest_education,
      exam_id = EXCLUDED.exam_id,
      program_id = EXCLUDED.program_id,
      major_id = EXCLUDED.major_id,
      batch_id = EXCLUDED.batch_id,
      status = 'PENDING',
      created_at = NOW(),
      reviewed_at = NULL,
      reviewed_by = NULL
    RETURNING id, first_name, last_name, email, created_at, status;
  `;

  const values = [
    student.first_name,
    student.middle_name || null,
    student.last_name,
    student.suffix || null,
    cleanEmail,
    student.phone || null,
    student.birthday,
    student.gender,
    student.address,
    'Cagayan de Oro',
    'Misamis Oriental',
    '9000',
    schoolObj.name,
    schoolObj.id,
    programDetails.course_name,
    programDetails.academic_course_id,
    student.year_graduated,
    student.highest_education,
    programDetails.exam_id,
    programDetails.program_id,
    student.major_id || null,
    null,
  ];

  const res = await pool.query(insertQuery, values);
  return res.rows[0];
}

async function run() {
  console.log('--- Ensuring Pre-Registrations Table & Schools ---');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pre_registrations (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100),
      last_name VARCHAR(100) NOT NULL,
      suffix VARCHAR(20),
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      birthday DATE,
      gender VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      province VARCHAR(100),
      zip_code VARCHAR(20),
      school VARCHAR(255),
      school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
      course VARCHAR(255),
      academic_course_id INTEGER REFERENCES academic_courses(id) ON DELETE SET NULL,
      year_graduated VARCHAR(20),
      highest_education VARCHAR(100),
      exam_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL,
      program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
      major_id INTEGER REFERENCES majors(id) ON DELETE SET NULL,
      batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      reviewed_at TIMESTAMP WITH TIME ZONE,
      reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS pre_registrations_email_unique_idx ON pre_registrations(email);
  `);

  const schoolMap = await ensureSchools();

  console.log('\n--- Inserting 10 Pre-Registrations for BEEd (Bachelor of Elementary Education) ---');
  const beedProgramDetails = {
    exam_id: 1, // LEPT
    program_id: 2, // BEEd
    academic_course_id: 1, // BEEd
    course_name: 'Bachelor of Elementary Education (BEEd)',
  };

  const beedResults = [];
  for (let i = 0; i < BEED_STUDENTS.length; i++) {
    const student = BEED_STUDENTS[i];
    const schoolName = CDO_SCHOOLS[i].name;
    const schoolId = schoolMap.get(schoolName);
    const row = await insertPreRegistration(student, { id: schoolId, name: schoolName }, beedProgramDetails);
    beedResults.push({ ...row, school: schoolName });
    console.log(`[BEEd ${i + 1}/10] ${row.first_name} ${row.last_name} | ${schoolName} | DOB: ${student.birthday}`);
  }

  console.log('\n--- Inserting 10 Pre-Registrations for BSEd (Bachelor of Secondary Education) ---');
  const bsedProgramDetails = {
    exam_id: 1, // LEPT
    program_id: 3, // BSEd
    academic_course_id: 2, // BSEd
    course_name: 'Bachelor of Secondary Education (BSEd)',
  };

  const bsedResults = [];
  for (let i = 0; i < BSED_STUDENTS.length; i++) {
    const student = BSED_STUDENTS[i];
    const schoolName = CDO_SCHOOLS[i].name;
    const schoolId = schoolMap.get(schoolName);
    const row = await insertPreRegistration(student, { id: schoolId, name: schoolName }, bsedProgramDetails);
    bsedResults.push({ ...row, school: schoolName });
    console.log(`[BSEd ${i + 1}/10] ${row.first_name} ${row.last_name} | ${schoolName} | DOB: ${student.birthday}`);
  }

  console.log(`\n Successfully added ${beedResults.length} BEEd and ${bsedResults.length} BSEd pre-registrations!`);
  await pool.end();
}

run().catch((err) => {
  console.error('Error running seed script:', err);
  process.exit(1);
});
