import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:yosra@localhost:5432/reviewapp',
});

async function run() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 10 Students (mix of short, medium, and long realistic names)
  // 3 Teachers (mix of short, medium, and long names)
  const students = [
    {
      first_name: 'Ana',
      middle_name: '',
      last_name: 'Go',
      suffix: '',
      email: 'ana.go@test.com',
      role: 'student',
      gender: 'female',
      birthday: '2003-02-14',
      phone: '09171110001',
      address: '12 Rizal St.',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 17,
      academic_course_id: 10,
      year_graduated: '2025',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 16,
      major_id: null
    },
    {
      first_name: 'Ian Mark',
      middle_name: 'Co',
      last_name: 'Tan',
      suffix: 'Jr.',
      email: 'ian.tan@test.com',
      role: 'student',
      gender: 'male',
      birthday: '2002-05-20',
      phone: '09182220002',
      address: '45 Velez St.',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 16,
      academic_course_id: 11,
      year_graduated: '2024',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 15,
      major_id: 20
    },
    {
      first_name: 'John Paul',
      middle_name: 'Reyes',
      last_name: 'Santos',
      suffix: '',
      email: 'johnpaul.santos@test.com',
      role: 'student',
      gender: 'male',
      birthday: '2002-09-15',
      phone: '09193330003',
      address: '78 Kauswagan Diversion',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 18,
      academic_course_id: 11,
      year_graduated: '2024',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 15,
      major_id: 18
    },
    {
      first_name: 'Marie Dominique',
      middle_name: 'Villanueva',
      last_name: 'Dela Cruz',
      suffix: '',
      email: 'marie.delacruz@test.com',
      role: 'student',
      gender: 'female',
      birthday: '2003-08-30',
      phone: '09204440004',
      address: '23 Carmen Valley Rd.',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 17,
      academic_course_id: 10,
      year_graduated: '2025',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 16,
      major_id: null
    },
    {
      first_name: 'Christian Gabriel',
      middle_name: 'Montenegro',
      last_name: 'Villareal',
      suffix: 'III',
      email: 'christian.villareal@test.com',
      role: 'student',
      gender: 'male',
      birthday: '2001-11-12',
      phone: '09215550005',
      address: '88 Masterson Ave., Pueblo',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 16,
      academic_course_id: 11,
      year_graduated: '2023',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 15,
      major_id: 19
    },
    {
      first_name: 'Princess Angelica Mae',
      middle_name: 'De Los Santos',
      last_name: 'Castillo-Hernandez',
      suffix: '',
      email: 'princess.castillo@test.com',
      role: 'student',
      gender: 'female',
      birthday: '2003-01-25',
      phone: '09226660006',
      address: '104 Macasandig Riverside',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 18,
      academic_course_id: 11,
      year_graduated: '2025',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 15,
      major_id: 18
    },
    {
      first_name: 'Alyssa Nicole',
      middle_name: 'Navarro',
      last_name: 'Mendoza',
      suffix: '',
      email: 'alyssa.mendoza@test.com',
      role: 'student',
      gender: 'female',
      birthday: '2002-04-18',
      phone: '09237770007',
      address: '56 Corrales Ext.',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 17,
      academic_course_id: 11,
      year_graduated: '2024',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 15,
      major_id: 20
    },
    {
      first_name: 'Leo',
      middle_name: '',
      last_name: 'Uy',
      suffix: '',
      email: 'leo.uy@test.com',
      role: 'student',
      gender: 'male',
      birthday: '2002-12-05',
      phone: '09248880008',
      address: '19 Nazareth 10th St.',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 16,
      academic_course_id: 10,
      year_graduated: '2024',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 16,
      major_id: null
    },
    {
      first_name: 'Marc Justine',
      middle_name: 'Salvador',
      last_name: 'Pascual',
      suffix: '',
      email: 'marc.pascual@test.com',
      role: 'student',
      gender: 'male',
      birthday: '2001-07-22',
      phone: '09259990009',
      address: '33 Bulua Highway',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 18,
      academic_course_id: 11,
      year_graduated: '2023',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 15,
      major_id: 19
    },
    {
      first_name: 'Samantha Danielle',
      middle_name: 'Alcantara',
      last_name: 'Bernardo',
      suffix: '',
      email: 'samantha.bernardo@test.com',
      role: 'student',
      gender: 'female',
      birthday: '2003-10-10',
      phone: '09260000010',
      address: '67 Lapasan Coastal Rd.',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 17,
      academic_course_id: 11,
      year_graduated: '2025',
      highest_education: 'bachelor',
      exam_id: 11,
      batch_id: 13,
      program_id: 15,
      major_id: 18
    }
  ];

  const teachers = [
    {
      first_name: 'Roy',
      middle_name: '',
      last_name: 'Yu',
      suffix: '',
      email: 'roy.yu@test.com',
      role: 'teacher',
      gender: 'male',
      birthday: '1987-03-15',
      phone: '09170010011',
      address: '15 Corrales Ave.',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 17,
      academic_course_id: 11,
      year_graduated: '2009',
      highest_education: 'master',
      exam_id: 11,
      batch_id: 13,
      program_id: 15,
      major_id: 20
    },
    {
      first_name: 'Eleanor Mae',
      middle_name: 'Bautista',
      last_name: 'Soriano',
      suffix: 'Ph.D.',
      email: 'eleanor.soriano@test.com',
      role: 'teacher',
      gender: 'female',
      birthday: '1982-06-28',
      phone: '09180020012',
      address: '92 Tomas Saco St.',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 16,
      academic_course_id: 10,
      year_graduated: '2004',
      highest_education: 'doctorate',
      exam_id: 11,
      batch_id: 13,
      program_id: 16,
      major_id: null
    },
    {
      first_name: 'Prof. Alexander Bartholomew',
      middle_name: 'Crisostomo',
      last_name: 'Valderrama',
      suffix: '',
      email: 'alexander.valderrama@test.com',
      role: 'teacher',
      gender: 'male',
      birthday: '1979-11-04',
      phone: '09190030013',
      address: '110 Upper Balulang Heights',
      city: 'Cagayan de Oro',
      province: 'Misamis Oriental',
      zip_code: '9000',
      school_id: 18,
      academic_course_id: 11,
      year_graduated: '2001',
      highest_education: 'master',
      exam_id: 11,
      batch_id: 13,
      program_id: 15,
      major_id: 18
    }
  ];

  const allNewUsers = [...students, ...teachers];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Clearing non-admin user dependent records...');
    await client.query(`DELETE FROM submissions WHERE student_id IN (SELECT id FROM users WHERE role != 'admin')`);
    await client.query(`DELETE FROM assignments WHERE teacher_id IN (SELECT id FROM users WHERE role != 'admin')`);
    await client.query(`DELETE FROM student_subjects WHERE student_id IN (SELECT id FROM users WHERE role != 'admin')`);
    await client.query(`DELETE FROM mock_exam_scores WHERE student_id IN (SELECT id FROM users WHERE role != 'admin')`);
    await client.query(`DELETE FROM student_activities WHERE student_id IN (SELECT id FROM users WHERE role != 'admin')`);
    await client.query(`DELETE FROM student_calendar_notes WHERE student_id IN (SELECT id FROM users WHERE role != 'admin')`);
    await client.query(`DELETE FROM student_quiz_submissions WHERE student_id IN (SELECT id FROM users WHERE role != 'admin')`);
    await client.query(`DELETE FROM notifications WHERE student_id IN (SELECT id FROM users WHERE role != 'admin')`);

    console.log('2. Deleting old non-admin users...');
    const delRes = await client.query(`DELETE FROM users WHERE role != 'admin'`);
    console.log(`Deleted ${delRes.rowCount} previous non-admin users.`);

    console.log('3. Inserting new users (10 students, 3 teachers)...');
    for (const u of allNewUsers) {
      const fullName = [u.first_name, u.middle_name, u.last_name, u.suffix].filter(Boolean).join(' ');
      await client.query(
        `INSERT INTO users (
          name, email, password, role,
          first_name, middle_name, last_name, suffix,
          birthday, gender, phone, address, city, province, zip_code,
          school_id, academic_course_id, year_graduated, highest_education,
          exam_id, batch_id, program_id, major_id, created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19,
          $20, $21, $22, $23, NOW()
        )`,
        [
          fullName, u.email, hashedPassword, u.role,
          u.first_name, u.middle_name, u.last_name, u.suffix,
          u.birthday, u.gender, u.phone, u.address, u.city, u.province, u.zip_code,
          u.school_id, u.academic_course_id, u.year_graduated, u.highest_education,
          u.exam_id, u.batch_id, u.program_id, u.major_id
        ]
      );
    }

    await client.query('COMMIT');
    console.log('Transaction committed successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error during user replacement, rolled back:', e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
