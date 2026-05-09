import fs from 'fs'

const filePath = 'src/app/(dashboard)/admin/master-data/page.jsx'
let content = fs.readFileSync(filePath, 'utf8')

// 1. Add expansion states
const statesRegex = /  \/\/ Schools & Courses State\n  const \[schools, setSchools\] = useState\(\[\]\)\n  const \[academicCourses, setAcademicCourses\] = useState\(\[\]\)/
const newStates = `  // Schools & Courses State
  const [schools, setSchools] = useState([])
  const [academicCourses, setAcademicCourses] = useState([])
  const [isSchoolsExpanded, setIsSchoolsExpanded] = useState(false)
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(false)`
content = content.replace(statesRegex, newStates)

// 2. Wrap Schools UI
const schoolsTableRegex = /<TableBody>([\s\S]*?)\{\/\* Courses Section \*\/\}/
const extractedSchoolsContent = (content.match(schoolsTableRegex) || [])[1]

if (extractedSchoolsContent) {
  // Fix the map loop
  let newSchoolsContent = extractedSchoolsContent.replace(
    /\{schools\.map\(school => \(/,
    `{(isSchoolsExpanded ? schools : schools.slice(0, 5)).map(school => (`
  )
  
  // Wrap Table with dynamic overflow logic instead of just "overflow-hidden"
  // Wait, I need to replace the Table Wrapper, which is just before <Table>
  // Let's replace the whole Table section.
}

const fullSchoolsRegex = /<div className="rounded-lg border border-border overflow-hidden">[\s\S]*?<\/div>[\s\S]*?\{\/\* Courses Section \*\/\}/
const newSchoolsFull = `<div className={\`rounded-lg border border-border \${isSchoolsExpanded ? 'max-h-[350px] overflow-y-auto' : 'overflow-hidden'}\`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>School Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schools.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No schools active.</TableCell>
                         </TableRow>
                      )}
                      {(isSchoolsExpanded ? schools : schools.slice(0, 5)).map(school => (
                        <TableRow key={school.id}>
                          <TableCell className="font-bold text-foreground">{school.name}</TableCell>
                          <TableCell className="text-muted-foreground">{school.address || <span className="opacity-50 italic">No Address Configured</span>}</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <SettingsBtn onClick={() => handleOpenEditSchool(school)} />
                            <DeleteBtn onClick={async () => { await apiCall("DELETE", "SCHOOL", { id: school.id }); await fetchData(); }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {schools.length > 5 && (
                  <div className="flex justify-center mt-3">
                    <button 
                      onClick={() => setIsSchoolsExpanded(!isSchoolsExpanded)}
                      className="text-sm font-semibold text-primary hover:text-primary/70 transition-colors"
                    >
                      {isSchoolsExpanded ? "Show Less" : \`Show All (\${schools.length})\`}
                    </button>
                  </div>
                )}
              </div>

              {/* Courses Section */}`

content = content.replace(fullSchoolsRegex, newSchoolsFull)

// 3. Wrap Courses UI
const fullCoursesRegex = /<div className="rounded-lg border border-border overflow-hidden">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/motion.div>/
// Actually the courses section ends right before </motion.div>
const newCoursesFull = `<div className={\`rounded-lg border border-border \${isCoursesExpanded ? 'max-h-[350px] overflow-y-auto' : 'overflow-hidden'}\`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>Course Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicCourses.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">No courses active.</TableCell>
                         </TableRow>
                      )}
                      {(isCoursesExpanded ? academicCourses : academicCourses.slice(0, 5)).map(course => (
                        <TableRow key={course.id}>
                          <TableCell className="font-bold text-foreground">{course.name}</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <SettingsBtn onClick={() => openPrompt("Rename Course", "RENAME_COURSE", { id: course.id }, "Course Name", course.name)} />
                            <DeleteBtn onClick={async () => { await apiCall("DELETE", "COURSE", { id: course.id }); await fetchData(); }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {academicCourses.length > 5 && (
                  <div className="flex justify-center mt-3">
                    <button 
                      onClick={() => setIsCoursesExpanded(!isCoursesExpanded)}
                      className="text-sm font-semibold text-primary hover:text-primary/70 transition-colors"
                    >
                      {isCoursesExpanded ? "Show Less" : \`Show All (\${academicCourses.length})\`}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>`

content = content.replace(fullCoursesRegex, newCoursesFull)

fs.writeFileSync(filePath, content)
console.log('Successfully refactored padding!')
