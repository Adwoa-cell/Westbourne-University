// FICTIONAL demonstration data. Replace with real university information (and, from Phase 2, database rows).
export const academicYear = '2026/2027';

export const faculties = [
  { id: 'fet', departments: ['Computer Science', 'Systems and Network Engineering', 'Cybersecurity'], name: 'Faculty of Engineering and Technology', summary: 'Computing, systems, networks and cybersecurity taught in labs that mirror industry.' },
  { id: 'fbe', departments: ['Accounting and Finance', 'Management Studies'], name: 'Faculty of Business and Economics', summary: 'Accounting, management and enterprise programmes built around real case work.' },
  { id: 'fhl', departments: ['Nursing Science', 'Biomedical Science'], name: 'Faculty of Health and Life Sciences', summary: 'Clinical and laboratory training with supervised placements.' },
  { id: 'fhs', departments: ['Psychology', 'Education', 'Languages and Communication'], name: 'Faculty of Humanities and Social Sciences', summary: 'Psychology, education and language programmes focused on people and communities.' },
];

export const programmes = [
  { code: 'BSC-CS', name: 'BSc Computer Science', facultyId: 'fet', qualification: 'Bachelor', duration: '4 years', studyMode: 'Full-time', featured: true,
    description: 'Programming, algorithms, databases, operating systems and software engineering, with a final-year industry project.',
    entryRequirements: 'Mathematics and one science subject at credit level, plus English.' },
  { code: 'BENG-SYS', name: 'BEng Systems Engineering', facultyId: 'fet', qualification: 'Bachelor', duration: '4 years', studyMode: 'Full-time', featured: true,
    description: 'Design and integrate complex hardware, software and network systems, from requirements to deployment.',
    entryRequirements: 'Mathematics and Physics at credit level, plus English.' },
  { code: 'DIP-NCA', name: 'Diploma in Network and Cloud Administration', facultyId: 'fet', qualification: 'Diploma', duration: '2 years', studyMode: 'Full-time or Part-time', featured: false,
    description: 'Hands-on Linux, networking and cloud hosting skills for entry-level infrastructure roles.',
    entryRequirements: 'Mathematics and English at pass level.' },
  { code: 'MSC-CYB', name: 'MSc Cybersecurity', facultyId: 'fet', qualification: 'Master', duration: '2 years', studyMode: 'Part-time', featured: false,
    description: 'Secure systems design, penetration testing, incident response and security governance.',
    entryRequirements: 'Bachelor degree in a computing or engineering field, second-class or better.' },
  { code: 'BCOM-ACC', name: 'BCom Accounting', facultyId: 'fbe', qualification: 'Bachelor', duration: '3 years', studyMode: 'Full-time', featured: true,
    description: 'Financial and management accounting, auditing and taxation, preparing graduates for professional exams.',
    entryRequirements: 'Mathematics and Economics or Accounting at credit level, plus English.' },
  { code: 'BBA-MGT', name: 'BBA Business Management', facultyId: 'fbe', qualification: 'Bachelor', duration: '3 years', studyMode: 'Full-time', featured: false,
    description: 'Operations, marketing, people management and entrepreneurship through case studies and live projects.',
    entryRequirements: 'Five subjects at credit level including English and Mathematics.' },
  { code: 'MBA-GEN', name: 'Master of Business Administration', facultyId: 'fbe', qualification: 'Master', duration: '2 years', studyMode: 'Evening', featured: false,
    description: 'Strategy, finance and leadership for working professionals, delivered in evening sessions.',
    entryRequirements: 'Bachelor degree and at least three years of work experience.' },
  { code: 'BSC-NUR', name: 'BSc Nursing Science', facultyId: 'fhl', qualification: 'Bachelor', duration: '4 years', studyMode: 'Full-time', featured: true,
    description: 'Clinical skills, anatomy, community health and professional practice with supervised placements.',
    entryRequirements: 'Biology, Chemistry and English at credit level.' },
  { code: 'BSC-BMS', name: 'BSc Biomedical Science', facultyId: 'fhl', qualification: 'Bachelor', duration: '3 years', studyMode: 'Full-time', featured: false,
    description: 'Laboratory-based study of disease, diagnostics and human biology.',
    entryRequirements: 'Biology and Chemistry at credit level, plus English and Mathematics.' },
  { code: 'BA-PSY', name: 'BA Psychology', facultyId: 'fhs', qualification: 'Bachelor', duration: '3 years', studyMode: 'Full-time', featured: false,
    description: 'Human behaviour, research methods and applied psychology across education, health and work settings.',
    entryRequirements: 'Five subjects at credit level including English.' },
  { code: 'BED-PRI', name: 'BEd Primary Education', facultyId: 'fhs', qualification: 'Bachelor', duration: '4 years', studyMode: 'Full-time', featured: false,
    description: 'Teaching methods, child development and classroom practice with school placements each year.',
    entryRequirements: 'Five subjects at credit level including English and Mathematics.' },
  { code: 'CERT-AEP', name: 'Certificate in Academic English', facultyId: 'fhs', qualification: 'Certificate', duration: '6 months', studyMode: 'Part-time', featured: false,
    description: 'Academic reading, writing and presentation skills for university study.',
    entryRequirements: 'Secondary school completion. No cut-off points apply.' },
];

export const cutoffPoints = [
  { programmeCode: 'BSC-CS', academicYear, points: 28, requiredSubjects: ['Mathematics', 'English', 'Physics or ICT'], additional: 'Minimum credit in Mathematics.' },
  { programmeCode: 'BENG-SYS', academicYear, points: 30, requiredSubjects: ['Mathematics', 'Physics', 'English'], additional: 'Short aptitude interview for shortlisted applicants.' },
  { programmeCode: 'DIP-NCA', academicYear, points: 20, requiredSubjects: ['Mathematics', 'English'], additional: 'Basic computer literacy.' },
  { programmeCode: 'MSC-CYB', academicYear, points: null, requiredSubjects: [], additional: 'Assessed on degree classification; CV and statement of purpose required.' },
  { programmeCode: 'BCOM-ACC', academicYear, points: 26, requiredSubjects: ['Mathematics', 'English', 'Economics or Accounting'], additional: 'None.' },
  { programmeCode: 'BBA-MGT', academicYear, points: 24, requiredSubjects: ['Mathematics', 'English'], additional: 'None.' },
  { programmeCode: 'MBA-GEN', academicYear, points: null, requiredSubjects: [], additional: 'Three years of work experience; two references.' },
  { programmeCode: 'BSC-NUR', academicYear, points: 32, requiredSubjects: ['Biology', 'Chemistry', 'English'], additional: 'Health screening and police clearance before clinical placements.' },
  { programmeCode: 'BSC-BMS', academicYear, points: 29, requiredSubjects: ['Biology', 'Chemistry', 'English'], additional: 'None.' },
  { programmeCode: 'BA-PSY', academicYear, points: 25, requiredSubjects: ['English'], additional: 'None.' },
  { programmeCode: 'BED-PRI', academicYear, points: 24, requiredSubjects: ['English', 'Mathematics'], additional: 'Police clearance before school placements.' },
  { programmeCode: 'CERT-AEP', academicYear, points: null, requiredSubjects: [], additional: 'Short placement test on enrolment.' },
];

export const announcements = [
  { id: 'a1', category: 'Admissions', title: 'Applications open for the 2027 February intake', date: '2026-10-19', summary: 'Applications for undergraduate and diploma programmes are now open. Review the cut-off points before choosing your programme.' },
  { id: 'a2', category: 'Admissions', title: 'Postgraduate application deadline announced', date: '2026-10-12', summary: 'Master-level applications close on 15 December 2026. Applicants should prepare transcripts and a statement of purpose.' },
  { id: 'a3', category: 'Academic calendar', title: 'Semester 2 registration period published', date: '2026-10-05', summary: 'Course registration for Semester 2 opens on 11 January 2027 and closes on 29 January 2027.' },
  { id: 'a4', category: 'General', title: 'New cloud computing laboratory opens', date: '2026-09-28', summary: 'Engineering students now have access to a dedicated cloud and networking laboratory for practical coursework.' },
  { id: 'a5', category: 'General', title: 'Library extends evening hours during examinations', date: '2026-09-21', summary: 'The main library will stay open until 22:00 on weekdays throughout the examination period.' },
];

export const events = [
  { id: 'e1', title: 'Undergraduate open day', date: '2026-11-14', location: 'Main campus, Great Hall', summary: 'Meet lecturers, tour the laboratories and ask questions about programmes and funding.' },
  { id: 'e2', title: 'Postgraduate information evening', date: '2026-11-26', location: 'Online', summary: 'An introduction to Master-level study, supervision and part-time options.' },
  { id: 'e3', title: 'Applications close for February intake', date: '2026-12-15', location: 'Online application portal', summary: 'Final day to submit a complete application for the February 2027 intake.' },
  { id: 'e4', title: 'Orientation week', date: '2027-02-01', location: 'Main campus', summary: 'Welcome sessions, campus tours and student society fair for new students.' },
];

export const admissionsInfo = {
  academicYear,
  requirements: [
    'Secondary school completion with results that meet the programme cut-off points.',
    'Required subjects listed for your chosen programme on the cut-off points page.',
    'A certified copy of your identification document and academic results.',
    'For postgraduate programmes: a degree certificate, transcripts, a CV and a statement of purpose.',
    'Proof of English proficiency if your previous study was not in English.',
  ],
  steps: [
    { title: 'Choose a programme', detail: 'Compare programmes and check the cut-off points and required subjects.' },
    { title: 'Create an account', detail: 'Register with your email address and verify it.' },
    { title: 'Complete the application', detail: 'Enter your personal and educational details and select your programme.' },
    { title: 'Upload documents', detail: 'Attach identification and results as PDF or image files.' },
    { title: 'Submit and track', detail: 'You receive a reference number and can follow your status online.' },
  ],
  deadlines: [
    { label: 'Undergraduate and diploma applications close', date: '2026-12-15' },
    { label: 'Postgraduate applications close', date: '2026-12-15' },
    { label: 'Offers released', date: '2027-01-11' },
    { label: 'Acceptance of offer due', date: '2027-01-25' },
    { label: 'Orientation week begins', date: '2027-02-01' },
  ],
  faqs: [
    { question: 'Can I apply for more than one programme?', answer: 'Each application selects one preferred programme. Submit a separate application if you want to be considered for another.' },
    { question: 'What happens if my cut-off points are slightly below the requirement?', answer: 'Cut-off points can change each year. Admissions officers review borderline applications and may request additional information.' },
    { question: 'Can I save my application and finish later?', answer: 'Yes. A draft can be saved at any stage and edited until you submit it.' },
    { question: 'Which documents should I upload?', answer: 'Identification, academic results and, where required, a CV or statement of purpose. Files must be PDF, JPG or PNG.' },
    { question: 'How will I know my application status?', answer: 'Sign in to your account to see the current status. You will also receive a notification when it changes.' },
    { question: 'Is this information official?', answer: 'This is demonstration content for a fictional university. Replace it with official information before any real use.' },
  ],
};
