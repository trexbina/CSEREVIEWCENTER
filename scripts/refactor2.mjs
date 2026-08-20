import fs from 'fs'

const filePath = 'src/app/(dashboard)/admin/master-data/page.jsx'
let content = fs.readFileSync(filePath, 'utf8')

// 1. Add School Dialog State
const batchDialogHooksRegex = /  const \[isBatchDialogOpen, setIsBatchDialogOpen\] = useState\(false\)[ \t]*\n[ \t]*const \[isBatchEdit, setIsBatchEdit\] = useState\(false\)[ \t]*\n[ \t]*const \[batchForm, setBatchForm\] = useState\(\{ id: "", batchNumber: "", year: "2025", examId: "", status: "upcoming" \}\)/
const newDialogHooks = `  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [isBatchEdit, setIsBatchEdit] = useState(false)
  const [batchForm, setBatchForm] = useState({ id: "", batchNumber: "", year: "2025", examId: "", status: "upcoming" })
  
  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false)
  const [isSchoolEdit, setIsSchoolEdit] = useState(false)
  const [schoolForm, setSchoolForm] = useState({ id: "", name: "", address: "" })

  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    if (!schoolForm.name.trim()) return;
    try {
      if (isSchoolEdit) {
        await apiCall("UPDATE", "SCHOOL", { id: schoolForm.id, name: schoolForm.name, address: schoolForm.address });
      } else {
        await apiCall("ADD", "SCHOOL", { name: schoolForm.name, address: schoolForm.address });
      }
      await fetchData();
    } catch(err) {
      console.error(err);
    }
    setIsSchoolDialogOpen(false)
  }

  const handleOpenEditSchool = (school) => {
    setSchoolForm({ id: school.id, name: school.name, address: school.address || "" })
    setIsSchoolEdit(true)
    setIsSchoolDialogOpen(true)
  }
`
content = content.replace(batchDialogHooksRegex, newDialogHooks)

// 2. Insert SchoolDialog
const batchDialogRegex = /const BatchDialog = \(\{ isOpen, batchForm, setBatchForm, onSubmit, onCancel, tree, isEdit \}\) => \{/
const schoolDialog = `const SchoolDialog = ({ isOpen, schoolForm, setSchoolForm, onSubmit, onCancel, isEdit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border"
      >
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {isEdit ? <Settings className="h-5 w-5 text-primary" /> : <PlusCircle className="h-5 w-5 text-primary" />}
            {isEdit ? "Edit School Details" : "Register New School"}
          </h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">School Name</label>
            <input 
              type="text" 
              placeholder="e.g. University of the Philippines"
              value={schoolForm.name}
              onChange={e => setSchoolForm({...schoolForm, name: e.target.value})}
              className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Address</label>
            <input 
              type="text" 
              placeholder="e.g. Diliman, Quezon City"
              value={schoolForm.address}
              onChange={e => setSchoolForm({...schoolForm, address: e.target.value})}
              className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
             <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
             <button type="submit" className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"><Save className="h-4 w-4"/> Save Record</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

const BatchDialog = ({ isOpen, batchForm, setBatchForm, onSubmit, onCancel, tree, isEdit }) => {`
content = content.replace(batchDialogRegex, schoolDialog)

// 3. Inject school dialog in JSX
const dialogsRegex = /      <BatchDialog/
const dialogsInject = `      <SchoolDialog
        isOpen={isSchoolDialogOpen}
        schoolForm={schoolForm}
        setSchoolForm={setSchoolForm}
        onSubmit={handleSchoolSubmit}
        onCancel={() => setIsSchoolDialogOpen(false)}
        isEdit={isSchoolEdit}
      />

      <BatchDialog`
content = content.replace(dialogsRegex, dialogsInject)


// 4. Overhaul the tab rendering to be tables
const tabRegex = /              \{\/\* Schools Section \*\/\}[\s\S]*?\{\/\* Courses Section \*\/\}[\s\S]*?<\/div>[\s\S]*?<\/motion\.div>/
const newTables = `              {/* Schools Section */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    School Management Data
                  </h3>
                  <button 
                    onClick={() => {
                        setSchoolForm({ id: "", name: "", address: "" })
                        setIsSchoolEdit(false)
                        setIsSchoolDialogOpen(true)
                    }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-1.5 px-3 rounded-lg shadow-sm transition-all text-sm"
                  >
                    <PlusCircle className="h-4 w-4" /> Add School
                  </button>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
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
                      {schools.map(school => (
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
              </div>

              {/* Courses Section */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    Course Management Data
                  </h3>
                  <button 
                    onClick={() => openPrompt("Add Course", "ADD_COURSE", null, "e.g. BS Computer Science")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-1.5 px-3 rounded-lg shadow-sm transition-all text-sm"
                  >
                    <PlusCircle className="h-4 w-4" /> Add Course
                  </button>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
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
                      {academicCourses.map(course => (
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
              </div>
            </motion.div>`

content = content.replace(tabRegex, newTables)

fs.writeFileSync(filePath, content)
console.log('Successfully refactored page.jsx tables!')
