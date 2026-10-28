window.CONFIG = {
  site: 'thatstanishk.wordpress.com',

  /* Weather, sunrise/sunset, air quality and the top-bar clock */
  city: { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },

  /* Footer clocks (any IANA timezone) */
  clocks: [
    { label: 'Bengaluru', tz: 'Asia/Kolkata' },
    { label: 'Sydney',    tz: 'Australia/Sydney' },
    { label: 'London',    tz: 'Europe/London' }
  ],

  /* Your photo. Rename your Gemini file to this, or change the name here. */
  portrait: 'portrait.png',

  /* Leave '' to hide. Email: just the address (it will be public). */
  social: {
    LinkedIn: 'https://www.linkedin.com/in/thatstanishk/',
    Reuters: 'https://www.reuters.com/authors/kumar-tanishk/',
    Linktree: 'https://linktr.ee/thatstanishk',
    Instagram: 'https://www.instagram.com/thatstanishk/',   // CHECK: guessed from your Paperclip credit
    X: '',
    Email: ''
  },

  /* ---------- ABOUT (built from your LinkedIn) ---------- */
  about: {
    name: 'Kumar Tanishk',
    role: 'Journalist · Reuters, Asian markets',
    intro: [
      "I'm a journalist based in Bengaluru. I'm an Associate Correspondent on Reuters' Asia Headline News desk, where I write fast, concise market copy on Australia, New Zealand, Hong Kong, Singapore and Southeast Asia.",
      "This blog is the other side of my writing: reports, explainers and political opinion, written on my own time. I studied journalism, international relations and peace studies at St. Joseph's University, and I came to reporting through student media, digital storytelling and social-media work before joining a newsroom.",
      "Opinions here are mine, not my employer's. The Transparency page lists every company I have a relationship with, and each article carries its own disclosure."
    ],
    languages: 'English (full professional), Hindi (proficient), Bengali (limited)',
    timeline: [
      { when: '2025 – now',  role: 'Associate Correspondent, Asia Headline News', org: 'Reuters', note: 'Breaking news from PR wires and national economic data for traders and investors. Market copy on AUNZ, Hong Kong, Singapore and Southeast Asia.' },
      { when: '2024 – 2025', role: 'Trainee Correspondent, Asia Headline News',   org: 'Reuters', note: 'Concise stories on Australian, New Zealand, Hong Kong, Singapore and other SEA market developments.' },
      { when: '2023 – 2024', role: 'Social Media Marketing Manager',              org: 'Open Heart', note: '' },
      { when: '2023',        role: 'Storyteller (internship)',                    org: 'The Paperclip', note: 'History and culture stories for web and social.' },
      { when: '2022 – 2023', role: 'Public Relations Intern',                     org: "St. Joseph's University", note: '' },
      { when: '2021 – 2022', role: 'Editor-in-Chief (volunteer)',                 org: 'Sehmat Foundation', note: 'Led a team of five volunteers: writing, editing and proofreading.' }
    ],
    education: [
      { when: '2021 – 2024', role: 'BA, Journalism, International Relations & Peace Studies', org: "St. Joseph's University", note: 'Office bearer at NOUS, Under25 and CRISYS.' },
      { when: '2019 – 2021', role: 'Intermediate, Business/Commerce',                         org: "St. Xavier's School, Doranda, Ranchi", note: '' }
    ],
    skills: ['News writing', 'Web content writing', 'Digital storytelling', 'Public relations', 'Social media', 'SEO']
  },

  /* ---------- TRANSPARENCY ---------- */
  ledgerUpdated: '2026-10',

  /* CONFIRM each line is TRUE before publishing, or edit/delete it. */
  standing: [
    "I work for Reuters. This blog is a personal project: opinions on it are mine and not Reuters'.",
    'No payment or sponsorship has been received for any piece on this site.'
  ],

  /* One entry per company. type is one of:
       employer | former | alumni | volunteer | holding | customer | family | none | other
     'none' = I have checked and I have no relationship.
     aliases = other spellings that should trigger the disclosure (exact capitalisation).
     stance (optional) = a plain line on how I treat this company in my writing. */
  ledger: [
    { name: 'Reuters', aliases: ['Thomson Reuters', 'Reuters News'], type: 'employer', since: '2024-08',
      note: 'Full-time Associate Correspondent on the Asia Headline News desk (trainee from Aug 2024).',
      stance: "I am not a neutral outsider on Reuters. Read anything I say about it with that in mind." },
    { name: 'Open Heart', aliases: [], type: 'former', since: '2023-05',
      note: 'Social Media Marketing Manager, May 2023 to Apr 2024.' },
    { name: 'The Paperclip', aliases: ['Paperclip'], type: 'former', since: '2023-07',
      note: 'Storyteller (internship), Jul to Sep 2023. They published stories I wrote.' },
    { name: "St. Joseph's University", aliases: ["St Joseph's University", "St. Joseph's", "St Joseph's"], type: 'alumni', since: '2021',
      note: 'BA 2021 to 2024, and PR intern Oct 2022 to Sep 2023.' },
    { name: 'Sehmat Foundation', aliases: ['SehMat Foundation'], type: 'volunteer', since: '2021',
      note: 'Volunteer Editor-in-Chief, 2021 to 2022.' },
    { name: 'NOUS', aliases: [], type: 'volunteer', since: '2021', note: "Office bearer during my time at St. Joseph's." },
    { name: 'Under25', aliases: [], type: 'volunteer', since: '2021', note: "Office bearer during my time at St. Joseph's." },
    { name: 'CRISYS', aliases: [], type: 'volunteer', since: '2021', note: "Office bearer during my time at St. Joseph's." }

    /* ADD YOUR HOLDINGS HERE (I don't know them). Examples:
    ,{ name: 'Some Corp', aliases: ['SomeCorp'], type: 'holding', since: '2025-03', note: 'I own a small number of shares.', stance: '' }
    ,{ name: 'Other Corp', aliases: [], type: 'none', since: '2026-10', note: '' }
    */
  ]
};