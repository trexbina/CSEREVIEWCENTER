import fs from 'fs'

const filePath = 'src/app/(dashboard)/admin/master-data/page.jsx'
let content = fs.readFileSync(filePath, 'utf8')

// 1. Remove mock initial states
const initialStatesRegex = /\/\/ --- Initial Dummy State[\s\S]*?(?=\/\/ Custom Prompt Dialog Component)/
content = content.replace(initialStatesRegex, '\n\n')

// 2. Refactor state initialization inside MasterDataBuilderPage
const stateRegex = /  \/\/ Tree State\n  const \[tree, setTree\] = useState\(initialTree\)\n  const \[expandedNodes, setExpandedNodes\] = useState\(\{\}\) \n  const \[selectedExamId, setSelectedExamId\] = useState\(null\)(.*?\n)*?  \/\/ Schools & Courses State\n  const \[schools, setSchools\] = useState\(initialSchools\)\n  const \[academicCourses, setAcademicCourses\] = useState\(initialAcademicCourses\)/s
const newStates = `  // Tree State
  const [tree, setTree] = useState([])
  const [expandedNodes, setExpandedNodes] = useState({}) 
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/master-data/dropdowns')
      const data = await res.json()
      
      // Build tree
      const builtTree = (data.examinations || []).map(exam => ({
        id: exam.id, name: exam.name, maxLevel: 3, hasSettings: true,
        programs: (data.programs || []).filter(p => p.exam_id === exam.id).map(prog => ({
          id: prog.id, name: prog.name,
          majors: (data.majors || []).filter(m => m.program_id === prog.id).map(maj => ({
            id: maj.id, name: maj.name
          }))
        }))
      }))
      
      setTree(builtTree)
      setBatches(data.batches || [])
      setSchools(data.schools || [])
      setAcademicCourses(data.academic_courses || [])
      setIsLoading(false)
    } catch (e) {
      console.error("Failed to fetch master data", e)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])
  
  // Auto-reset if selected exam gets deleted
  useEffect(() => {
    if (selectedExamId && !tree.find(e => e.id === selectedExamId)) {
      setSelectedExamId(null)
    }
  }, [tree, selectedExamId])

  // Custom Prompt State
  const [promptData, setPromptData] = useState({ isOpen: false, title: "", value: "", actionType: null, targetParams: null, placeholder: "" })
  
  // Exam Settings Dialog State
  const [isExamSettingsOpen, setIsExamSettingsOpen] = useState(false)
  const [examSettings, setExamSettings] = useState({ examId: "", name: "", maxLevel: 3 })
  
  const openExamSettings = (exam) => {
    setExamSettings({ examId: exam.id, name: exam.name, maxLevel: exam.maxLevel || 3 })
    setIsExamSettingsOpen(true)
  }
  const handleSaveExamSettings = () => {
    if (!examSettings.name.trim()) return;
    const level = parseInt(examSettings.maxLevel);
    setTree(tree.map(e => {
      if (e.id === examSettings.examId) return { ...e, name: examSettings.name, maxLevel: isNaN(level) ? 3 : level }
      return e
    }))
    setIsExamSettingsOpen(false)
  }
  
  // Batch State
  const [batches, setBatches] = useState([])
  
  // Schools & Courses State
  const [schools, setSchools] = useState([])
  const [academicCourses, setAcademicCourses] = useState([])`

content = content.replace(stateRegex, newStates)

// 3. Replace handlePromptConfirm
const promptRegex = /  const handlePromptConfirm = \(\) => \{[\s\S]*?closePrompt\(\);\n  \}/
const newPrompt = `  const apiCall = async (action, entity, payload) => {
    const res = await fetch('/api/admin/master-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, entity, payload })
    });
    return res.json();
  }

  const handlePromptConfirm = async () => {
    if (!promptData.value.trim()) return;
    
    const { actionType, targetParams, value } = promptData;

    try {
      if (actionType === "ADD_EXAM") {
        await apiCall("ADD", "EXAM", { name: value })
      } 
      else if (actionType === "ADD_PROGRAM") {
        await apiCall("ADD", "PROGRAM", { examId: targetParams.examId, name: value })
      }
      else if (actionType === "ADD_MAJOR") {
         await apiCall("ADD", "MAJOR", { programId: targetParams.programId, name: value })
      }
      else if (actionType === "RENAME_EXAM") {
        await apiCall("RENAME", "EXAM", { id: targetParams.examId, name: value })
      }
      else if (actionType === "RENAME_PROGRAM") {
        await apiCall("RENAME", "PROGRAM", { id: targetParams.programId, name: value })
      }
      else if (actionType === "RENAME_MAJOR") {
        await apiCall("RENAME", "MAJOR", { id: targetParams.majorId, name: value })
      }
      else if (actionType === "ADD_SCHOOL") {
        await apiCall("ADD", "SCHOOL", { name: value })
      }
      else if (actionType === "RENAME_SCHOOL") {
        await apiCall("RENAME", "SCHOOL", { id: targetParams.id, name: value })
      }
      else if (actionType === "ADD_COURSE") {
        await apiCall("ADD", "COURSE", { name: value })
      }
      else if (actionType === "RENAME_COURSE") {
        await apiCall("RENAME", "COURSE", { id: targetParams.id, name: value })
      }
      
      await fetchData(); // Refresh all state natively from backend
    } catch(e) {
      console.error(e)
    }
    
    closePrompt();
  }`

content = content.replace(promptRegex, newPrompt)

// 4. Replace Tree Actions
const treeActionsRegex = /  const handleDeleteExam = \(examId\) => setTree\(tree\.filter\(e => e\.id !== examId\)\)\n  const handleDeleteProgram = \(examId, programId\) => \{\n    setTree\(tree\.map\(e => \{\n      if \(e\.id === examId\) return \{ \.\.\.e, programs: e\.programs\.filter\(p => p\.id !== programId\) \}\n      return e\n    \}\)\)\n  \}\n  const handleDeleteMajor = \(examId, programId, majorId\) => \{\n    setTree\(tree\.map\(e => \{\n      if \(e\.id === examId\) return \{\n        \.\.\.e, programs: e\.programs\.map\(p => \{\n          if \(p\.id === programId\) return \{ \.\.\.p, majors: p\.majors\.filter\(m => m\.id !== majorId\) \}\n          return p\n        \}\)\n      \}\n      return e\n    \}\)\)\n  \}/
const newTreeActions = `  const handleDeleteExam = async (examId) => {
    await apiCall("DELETE", "EXAM", { id: examId });
    await fetchData();
  }
  const handleDeleteProgram = async (examId, programId) => {
    await apiCall("DELETE", "PROGRAM", { id: programId });
    await fetchData();
  }
  const handleDeleteMajor = async (examId, programId, majorId) => {
    await apiCall("DELETE", "MAJOR", { id: majorId });
    await fetchData();
  }`
content = content.replace(treeActionsRegex, newTreeActions)

// 5. Replace handleBatchSubmit and handleDeleteBatch
const batchRegex = /  const handleBatchSubmit = \(e\) => \{\n    e.preventDefault\(\);\n    if \(!batchForm\.batchNumber\.trim\(\) \|\| !batchForm\.examId\) return;\n    \n    const newName = \`Batch \$\{batchForm\.batchNumber\}\`\n    if \(isBatchEdit\) \{\n      setBatches\(batches\.map\(b => b\.id === batchForm\.id \? \{ \.\.\.b, name: newName, year: batchForm\.year, examId: batchForm\.examId, status: batchForm\.status \} : b\)\)\n    \} else \{\n      setBatches\(\[..., batches, \{ \.\.\.batchForm, id: \`b\$\{Date\.now\(\)\}\`, name: newName \}\]\)\n    \}\n    setIsBatchDialogOpen\(false\)\n  \}\n\n  const handleDeleteBatch = \(batchId\) => \{\n    setBatches\(batches\.filter\(b => b\.id !== batchId\)\)\n  \}/
// wait, the literal string matches might fail due to spaces. Better use RegEx carefully.
const batchRegex2 = /  const handleBatchSubmit = \(e\) => \{[\s\S]*?  const handleDeleteBatch = \(batchId\) => \{[\s\S]*?  \}/

const newBatchFuncs = `  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!batchForm.batchNumber || !batchForm.examId) return;
    
    const newName = \`Batch \${batchForm.batchNumber}\`
    try {
      if (isBatchEdit) {
        await apiCall("UPDATE", "BATCH", { id: batchForm.id, name: newName, target_year: batchForm.year, exam_id: batchForm.examId, status: batchForm.status });
      } else {
        await apiCall("ADD", "BATCH", { name: newName, target_year: batchForm.year, exam_id: batchForm.examId, status: batchForm.status });
      }
      await fetchData();
    } catch(err) {
      console.error(err);
    }
    setIsBatchDialogOpen(false)
  }

  const handleDeleteBatch = async (batchId) => {
    await apiCall("DELETE", "BATCH", { id: batchId });
    await fetchData();
  }`
content = content.replace(batchRegex2, newBatchFuncs)

// Save
fs.writeFileSync(filePath, content)
console.log('Successfully refactored page.jsx!')
