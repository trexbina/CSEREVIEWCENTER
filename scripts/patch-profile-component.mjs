import fs from 'fs'
import path from 'path'

const filePath = 'src/components/user-profile-detail.jsx'

try {
  console.log('Reading user-profile-detail.jsx...')
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const lines = fileContent.split('\n')
  
  // Find the exact line index of the start of the return statement
  // We look for '  return (' or similar
  let returnLineIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'return (' && i > 200) {
      returnLineIdx = i
      break
    }
  }

  if (returnLineIdx === -1) {
    throw new Error('Could not find the return statement in the component file.')
  }

  console.log(`Found return statement at line ${returnLineIdx + 1}`)

  // Keep everything before the return statement
  const prefix = lines.slice(0, returnLineIdx).join('\n')

  // The new return block content
  const newReturnBlock = `  return (
    <div className="space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to User List
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-[32px] border border-border bg-card shadow-md">
        {/* Banner with Illustrative Pattern from SVG */}
        <div
          className="h-56 md:h-72 w-full bg-cover bg-center relative"
          style={{ backgroundImage: "url('/images/image0_1850_4352.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute right-8 bottom-6 text-xs font-bold text-white bg-black/40 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            Enrolled: {formatDate(user.created_at)}
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-8 pb-8 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20 z-10 text-center md:text-left">
          {/* Avatar (overlapping the banner) */}
          <div className="h-32 w-32 md:h-36 md:w-36 rounded-full border-4 border-card bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-xl overflow-hidden relative z-20 shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-5xl font-extrabold text-slate-600 dark:text-slate-200">
                {getAvatarInitial(user.name)}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2 self-end pb-2 md:pt-16">
            <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                {user.name}
              </h1>
              <div className="flex justify-center md:justify-start gap-2">
                <span className={\`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider \${
                  user.role === 'admin' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                  user.role === 'teacher' ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20' : 
                  'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                }\`}>
                  {user.role}
                </span>
                {user.role === 'student' && batchName !== '—' && (
                  <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold bg-muted text-muted-foreground border border-border">
                    {batchName}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Logins: 18 · Last login: 2 hours ago
            </p>
          </div>

          {/* Edit User Button */}
          <div className="md:self-end pb-3">
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#eed48f] hover:bg-[#e4c46c] text-slate-900 font-extrabold text-xs uppercase tracking-widest rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all px-6 py-3 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              EDIT USER
            </Button>
          </div>
        </div>

        {/* Sticky Custom Nav Tabs */}
        <div className="border-t border-border bg-slate-50/50 dark:bg-slate-900/50 px-6 py-3 flex justify-center gap-2 sticky top-0 z-30 backdrop-blur-md">
          <button
            onClick={() => handleTabClick("info")}
            type="button"
            className={\`px-6 py-2 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all \${
              activeTab === "info"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }\`}
          >
            INFO
          </button>
          
          {user.role === 'student' && (
            <>
              <button
                onClick={() => handleTabClick("analytics")}
                type="button"
                className={\`px-6 py-2 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all \${
                  activeTab === "analytics"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }\`}
              >
                ANALYTICAL OVERVIEW
              </button>
              
              <button
                onClick={() => handleTabClick("history")}
                type="button"
                className={\`px-6 py-2 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all \${
                  activeTab === "history"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }\`}
              >
                HISTORY
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stacked Panels (All visible, scrolling navigates) */}
      <div className="space-y-8 pb-16">
        {/* PANEL: INFO */}
        <div id="profile-info" className="scroll-mt-24 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Basics Card */}
            <div className="md:col-span-2 rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-border/80 pb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Personal Details</h3>
              </div>

              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 text-sm">
                {[
                  { label: "Birthday", value: formatDate(user.birthday) },
                  { label: "Gender", value: user.gender || "—", capitalize: true },
                  { label: "Street Address", value: user.address || "—" },
                  { label: "City / Municipality", value: user.city || "—" },
                  { label: "Province", value: user.province || "—" },
                  { label: "ZIP Code", value: user.zip_code || "—" },
                  { label: "Highest Education", value: user.highest_education ? user.highest_education.replace('_', ' ') : "—", capitalize: true },
                  { label: "School / University", value: schoolName },
                  { label: "Course / Program", value: courseName },
                  { label: "Year Graduated", value: user.year_graduated || "—" },
                ].map((field) => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">{field.label}</p>
                    <p className={\`text-sm font-semibold text-foreground \${field.capitalize ? "capitalize" : ""}\`}>{field.value}</p>
                  </div>
                ))}
                
                {user.role === 'admin' && (
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Job Role Description</p>
                    <p className="text-sm font-semibold text-foreground">{user.job_role_description || "—"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact and Targets column */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-border/80 pb-4">
                  <Phone className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Contact Info</h3>
                </div>

                <div className="space-y-5 text-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Email Address</p>
                    <a href={\`mailto:\${user.email}\`} className="text-sm font-semibold text-primary hover:underline break-all block">
                      {user.email}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Phone Number</p>
                    <p className="text-sm font-semibold text-foreground">{user.phone || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Academic Target Card (For Students) */}
              {user.role === 'student' && (
                <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b border-border/80 pb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">Academic Profile</h3>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Target Examination</p>
                      <p className="text-sm font-semibold text-foreground">{examName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Batch / Year</p>
                      <p className="text-sm font-semibold text-foreground">{batchName}</p>
                    </div>
                    {programName && programName !== "—" && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Program</p>
                        <p className="text-sm font-semibold text-foreground">{programName}</p>
                      </div>
                    )}
                    {majorName && majorName !== "—" && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Specialization / Major</p>
                        <p className="text-sm font-semibold text-foreground">{majorName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL: ANALYTICAL OVERVIEW */}
        {user.role === 'student' && (
          <div id="profile-analytics" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
            <div className="grid gap-6 md:grid-cols-5">
              {/* Readiness Score Card */}
              <div className="md:col-span-2 rounded-[28px] border border-border bg-card p-8 shadow-sm flex flex-col items-center justify-between text-center min-h-[340px]">
                <h3 className="text-sm font-extrabold text-muted-foreground uppercase tracking-widest">
                  Overall Readiness
                </h3>
                
                {/* Circular Donut Chart */}
                <div className="relative h-44 w-44 flex items-center justify-center my-4">
                  <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-[#eed48f]"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={\`\${2 * Math.PI * 40}\`}
                      strokeDashoffset={\`\${2 * Math.PI * 40 * (1 - 0.62)}\`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-foreground">62%</span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Target: 80%</span>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/25 px-5 py-1.5 text-xs font-extrabold text-amber-600 uppercase tracking-widest">
                  FOR MONITORING
                </span>
              </div>

              {/* Competency Breakdown Bar Widget */}
              <div className="md:col-span-3 rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground border-b border-border/80 pb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Competency Breakdown
                  </h3>
                </div>

                <div className="space-y-6 py-2">
                  {[
                    { name: "General Education", score: 65, color: "bg-[#eed48f]" },
                    { name: "Professional Education", score: 58, color: "bg-orange-400" },
                    { name: "Specialization (English)", score: 64, color: "bg-amber-400" }
                  ].map((comp) => (
                    <div key={comp.name} className="space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-foreground">{comp.name}</span>
                        <span className="text-muted-foreground">{comp.score}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={\`h-full \${comp.color} rounded-full transition-all duration-500\`}
                          style={{ width: \`\${comp.score}%\` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: HISTORY */}
        {user.role === 'student' && (
          <div id="profile-history" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
            <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-foreground border-b border-border/80 pb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>

              <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                {[
                  {
                    title: "Completed Quiz: Child and Adolescent Development (Quiz 4)",
                    details: "Score: 52% (Failed) · Time taken: 14m 20s",
                    time: "Today, 10:12 AM",
                    success: false
                  },
                  {
                    title: "Retook Comprehensive Mock Exam 1",
                    details: "Overall Score: 80% · Target achieved!",
                    time: "Oct 14, 2026, 2:00 PM",
                    success: true
                  },
                  {
                    title: "Completed Comprehensive Mock Exam 1",
                    details: "Overall Score: 58% (Passed) · Score needs improvement.",
                    time: "Oct 11, 2026, 2:00 PM",
                    success: true
                  }
                ].map((act, index) => (
                  <div key={index} className="flex gap-4 relative pl-8">
                    <div className={\`absolute left-[5px] top-1.5 h-4 w-4 rounded-full border-2 bg-card \${
                      act.success ? "border-emerald-500" : "border-rose-500"
                    }\`} />

                    <div className="space-y-1.5">
                      <p className="font-semibold text-foreground text-sm leading-snug">
                        {act.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {act.details}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase">
                        {act.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-border w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8">
            {/* Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit User Profile</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 max-h-[70vh] space-y-6 bg-white dark:bg-slate-950">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* ═══ Personal Details ═══ */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 border-b border-border pb-1">
                  <User className="h-4 w-4" /> Personal Details
                </h4>

                {/* Avatar Edit Upload */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-border/50">
                  <div className="relative h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <Label htmlFor="edit-avatar-file" className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground hover:bg-secondary/80 transition-colors">
                      Change Photo
                    </Label>
                    <input
                      id="edit-avatar-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <p className="text-[10px] text-muted-foreground">JPG, PNG or WEBP. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-first-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">First Name</Label>
                    <Input id="edit-first-name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-middle-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Middle Name</Label>
                    <Input id="edit-middle-name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-last-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Last Name</Label>
                    <Input id="edit-last-name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-suffix" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Suffix</Label>
                    <Input id="edit-suffix" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={suffix} onChange={(e) => setSuffix(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-birthday" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Birthday</Label>
                    <Input id="edit-birthday" type="date" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phone Number</Label>
                    <Input id="edit-phone" type="tel" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label htmlFor="edit-address" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Street Address</Label>
                    <Input id="edit-address" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-city" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">City / Municipality</Label>
                    <Input id="edit-city" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-province" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Province</Label>
                    <Input id="edit-province" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={province} onChange={(e) => setProvince(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-zip" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">ZIP Code</Label>
                    <Input id="edit-zip" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ═══ Education Background ═══ */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 border-b border-border pb-1">
                  <GraduationCap className="h-4 w-4" /> Education Background
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Highest Education</Label>
                    <Select value={highestEducation} onValueChange={setHighestEducation}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Level" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                        <SelectItem value="high_school">High School</SelectItem>
                        <SelectItem value="vocational">Vocational / Technical</SelectItem>
                        <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="master">Master's Degree</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">School / University</Label>
                    <Select value={schoolId} onValueChange={setSchoolId}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select School" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                        {dropdownData.schools.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Course / Program</Label>
                    <Select value={academicCourseId} onValueChange={setAcademicCourseId}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Course" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                        {dropdownData.academic_courses.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-year-grad" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Year Graduated</Label>
                    <Input id="edit-year-grad" type="number" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={yearGraduated} onChange={(e) => setYearGraduated(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ═══ Academic Targets (Students only) ═══ */}
              {role === "student" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 border-b border-border pb-1">
                    <BookOpen className="h-4 w-4" /> Academic Details
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Examination</Label>
                      <Select value={examId} onValueChange={(val) => { setExamId(val); setProgramId(""); setMajorId(""); }}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                          {dropdownData.examinations.map(e => (
                            <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Batch / Review Year</Label>
                      <Select value={batchId} onValueChange={setBatchId}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                          {dropdownData.batches
                            .filter(b => !examId || b.exam_id.toString() === examId)
                            .map(b => (
                              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {examId && dropdownData.programs?.some(p => p.exam_id.toString() === examId) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Program</Label>
                        <Select value={programId} onValueChange={(val) => { setProgramId(val); setMajorId(""); }}>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Program" /></SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                            {dropdownData.programs
                              .filter(p => p.exam_id.toString() === examId)
                              .map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {programId && dropdownData.majors?.some(m => m.program_id.toString() === programId) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Specialization / Major</Label>
                        <Select value={majorId} onValueChange={setMajorId}>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Major" /></SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                            {dropdownData.majors
                              .filter(m => m.program_id.toString() === programId)
                              .map(m => (
                                <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleEditSubmit} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
`

  // Combine prefix and new return block, and then append the final closing bracket of the function
  const updatedContent = prefix + '\\n' + newReturnBlock + '\\n}'
  
  console.log('Writing updated content...')
  fs.writeFileSync(filePath, updatedContent, 'utf8')
  console.log('Component file updated successfully.')

} catch (error) {
  console.error('Error patching file:', error)
}
