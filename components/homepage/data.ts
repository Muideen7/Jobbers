export const HERO_AVATAR = "/landing/hero_thomas_adam_1790645576100.jpg";

export const marketSkills: ReadonlyArray<{
  name: string;
  change: string;
  trend: "up" | "down";
}> = [
  { name: "AI Engineering", change: "+318%", trend: "up" },
  { name: "Prompt Engineering", change: "+3169%", trend: "up" },
  { name: "Data Engineering", change: "+182%", trend: "up" },
  { name: "Vibe Coding", change: "+302%", trend: "up" },
  { name: "UX Research", change: "+96%", trend: "up" },
  { name: "Product Management", change: "+74%", trend: "up" },
  { name: "Manual Testing", change: "-71%", trend: "down" },
  { name: "Boilerplate CRUD", change: "-209%", trend: "down" },
];

export const testimonials: ReadonlyArray<{
  id: string;
  name: string;
  role: string;
  quote: string;
  image: string;
}> = [
  {
    id: "marcus",
    name: "Marcus R.",
    role: "Senior Software Engineer",
    quote:
      "Jobbers matched me with a role I had bookmarked for months, in four minutes. I never had to search once.",
    image: "/landing/testimonial_marcus_1790645586040.jpg",
  },
  {
    id: "dylan",
    name: "Dylan L.",
    role: "Product Designer",
    quote:
      "The match score was honest. It told me exactly what I was missing before I spent a night on a cover letter.",
    image: "/landing/testimonial_dylan_1790645596170.jpg",
  },
  {
    id: "james",
    name: "James W.",
    role: "Data Analyst",
    quote:
      "I stopped refreshing job boards the day I signed up. It just sends me the ones worth my time.",
    image: "/landing/testimonial_james_1790645605386.jpg",
  },
  {
    id: "ravi",
    name: "Ravi K.",
    role: "Frontend Developer",
    quote:
      "Two interviews in my first week. The company research on each role is what actually won me the screen.",
    image: "/landing/testimonial_ravi_1790645616770.jpg",
  },
];

export const faqs: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: "How does the AI matching actually work?",
    answer:
      "We score every open role against your profile — your skills, years of experience, target industries and job titles — and return a match score with a plain-English breakdown of what fits and what is missing. Nothing is a black box, so you can decide whether a role is worth your time before you apply.",
  },
  {
    question: "What kinds of roles does Jobbers search?",
    answer:
      "We index roles across software engineering, AI and machine learning, data, product, design and marketing, from early-stage startups to large enterprises. Every listing includes salary, location, contract type and experience level so you can filter out noise quickly.",
  },
  {
    question: "Can I tailor my resume and cover letter?",
    answer:
      "Yes. Once you upload your resume we extract your skills and work history, then generate a tailored version and a role-specific cover letter for any job you are serious about. You can edit or regenerate either one at any time before you send it.",
  },
  {
    question: "Does Jobbers apply to jobs on my behalf?",
    answer:
      "No, and that is deliberate. Jobbers shortlists and explains, but you stay in control of every application. We research the company for you so you walk into each conversation knowing what they do and what you want to ask.",
  },
  {
    question: "What research do you do on a company?",
    answer:
      "For any saved role we research the company — what they build, how they work, recent news and what the team looks like — and summarise it into a dossier you can read in under a minute before an interview.",
  },
  {
    question: "Is my data private?",
    answer:
      "Your profile, resume and job history are only visible to you. Every saved job, log and analytics record is scoped to your own account at the database level, and we never sell your data to recruiters.",
  },
  {
    question: "Is Jobbers really different from a job board?",
    answer:
      "Job boards give you a thousand listings and leave you to sort them. Jobbers ranks them for you, explains the fit, tailors your application and researches the company — so you spend your time on the handful of roles that are actually worth it.",
  },
];

export const companyPillsRowOne: ReadonlyArray<string> = [
  "OpenAI",
  "GitLab",
  "GitHub",
  "Microsoft",
  "Google",
  "Amazon",
  "Meta",
  "Adobe",
  "IBM",
];

export const companyPillsRowTwo: ReadonlyArray<string> = [
  "Figma",
  "Anthropic",
  "Nvidia",
  "Datadog",
  "Stripe",
  "1,200 more",
];
