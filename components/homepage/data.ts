export const HERO_AVATAR = "/landing/hero_thomas_adam_1790645576100.jpg";

export const marketSkills: ReadonlyArray<{
  name: string;
  change: string;
  trend: "up" | "down";
}> = [
  { name: "AI Engineering", change: "+148%", trend: "up" },
  { name: "Data Engineering", change: "+82%", trend: "up" },
  { name: "Cloud Architecture", change: "+64%", trend: "up" },
  { name: "UX Research", change: "+42%", trend: "up" },
  { name: "Product Management", change: "+35%", trend: "up" },
  { name: "Full-Stack TS/React", change: "+28%", trend: "up" },
  { name: "Manual QA", change: "-46%", trend: "down" },
  { name: "Legacy Maintenance", change: "-58%", trend: "down" },
];

export const testimonials: ReadonlyArray<{
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  image: string;
}> = [
  {
    id: "amara",
    name: "Amara Okafor",
    role: "Senior Frontend Architect",
    location: "Lagos, Nigeria",
    quote: "Jobbers flagged that my profile was missing Docker experience for a high-match role. I added it before applying and got a callback in 48 hours.",
    image: "/landing/testimonial_amara.jpg",
  },
  {
    id: "marcus",
    name: "Marcus Reed",
    role: "Senior Backend Engineer",
    location: "Austin, United States",
    quote: "Matched me with a stealth startup role I had bookmarked for months, in four minutes. I never had to open a dozen job tabs again.",
    image: "/landing/testimonial_marcus_1790645586040.jpg",
  },
  {
    id: "priya",
    name: "Priya Sharma",
    role: "Lead Product Designer",
    location: "Bengaluru, India",
    quote: "The instant company research dossiers gave me specific product talking points that impressed the VP of Design during my initial screen.",
    image: "/landing/testimonial_priya.jpg",
  },
  {
    id: "elena",
    name: "Elena Rostova",
    role: "Site Reliability Engineer",
    location: "Toronto, Canada",
    quote: "The 4-stage tracking board replaced my messy spreadsheet. The automatic follow-up reminders kept me from dropping the ball on warm leads.",
    image: "/landing/testimonial_elena.jpg",
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
