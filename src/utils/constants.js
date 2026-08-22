import { PROBLEM_STATUS } from "../types";
import PROBLEM_DATA from "../data/problem-statements.json";
export const NAV_LINKS = [
    { href: "/#home", label: "Home" },
    { href: "/#about", label: "About" },
    { href: "/#timeline", label: "Timeline" },
    { href: "/problems", label: "Problem Statements" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#rules", label: "Rules" },
    { href: "/#faq", label: "FAQ" },
    { href: "/#contact", label: "Contact" },
];
export const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
];
export const STREAMS_CONFIG = {
    "B.Tech": {
        id: "B.Tech",
        label: "B.Tech / B.E. (Engineering)",
        years: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
        durationYears: 4,
    },
    "Diploma": {
        id: "Diploma",
        label: "Diploma (Polytechnic)",
        years: ["1st Year", "2nd Year", "3rd Year"],
        durationYears: 3,
    },
    "B.Voc": {
        id: "B.Voc",
        label: "B.Voc (Vocational Studies)",
        years: ["1st Year", "2nd Year", "3rd Year"],
        durationYears: 3,
    },
    "BCA": {
        id: "BCA",
        label: "BCA (Computer Applications)",
        years: ["1st Year", "2nd Year", "3rd Year"],
        durationYears: 3,
    },
    "MCA": {
        id: "MCA",
        label: "MCA (Master of Computer App.)",
        years: ["1st Year", "2nd Year"],
        durationYears: 2,
    },
};

export const BRANCHES = [
    "Computer Science & Engineering (CSE)",
    "Information Technology (IT)",
    "Artificial Intelligence & Data Science (AI/DS)",
    "Electronics & Telecommunication (E&TC)",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Computer Applications / Software",
    "Other Department",
];

export const DEFAULT_SETTINGS = {
    fee: 300,
    currency: "INR",
    isActive: true,
    minMembers: 6,
    maxMembers: 6,
};
export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/Ex6wG7jEomRE70UUAw9AGa";
export const ORGANIZER_CONTACT_NUMBER = "+91 9511841275";
export const SIH_OFFICIAL_WEBSITE_URL = "https://sih.gov.in/sih2026PS";
export const PROBLEM_STATEMENTS_PDF = "/docs/SIH-Themes-and-Problem-Statements.pdf";
export const OPEN_INNOVATION_PROBLEM = {
    id: "OPEN_INNOVATION",
    code: "OPEN_INNO",
    title: "Open Innovation - Bring Your Own Custom Idea",
    organization: "Ministry / Open Category",
    category: "Open Innovation",
    theme: "Open Innovation",
    difficulty: "Custom",
    description: "Have a unique innovative idea outside the listed problem statements? Choose Open Innovation to submit your team's custom problem title, abstract, tech stack, and architecture solution!",
    background: "Encouraging student breakthroughs in AI, IoT, Web3, FinTech, Healthcare, Agriculture, and Sustainability.",
    expectedSolution: "A working software or hardware prototype solving a high-impact real-world challenge.",
    technicalRequirements: ["Open Tech Stack", "Modern Frameworks", "Scalable Cloud Architecture"],
    technologies: ["Python", "React", "Node", "FastAPI", "AI/ML", "Cloudflare", "Docker"],
    constraints: ["Original work", "Working prototype required for grand finale"],
    evaluationCriteria: ["Novelty & Innovation", "Technical Complexity", "Feasibility & Market Impact"],
    selectedCount: 0,
    maxSelections: 9999,
    isOpenInnovation: true,
    status: PROBLEM_STATUS.AVAILABLE,
    sortOrder: 0
};
export const SAMPLE_PROBLEMS = [
    OPEN_INNOVATION_PROBLEM,
    ...PROBLEM_DATA.map((item) => ({ ...item, status: item.status || PROBLEM_STATUS.AVAILABLE }))
];
export const FAQ_ITEMS = [
    {
        q: "What is SIH?",
        a: "Smart India Hackathon 2026 is a national innovation programme where student teams solve real problem statements published by ministries, departments, and industry partners.",
    },
    {
        q: "Who can participate?",
        a: "Any student team of exactly 6 members can register. At least one female member is mandatory. Open to all branches. No account or sign-in is required.",
    },
    {
        q: "What is the registration fee?",
        a: "The registration fee is ₹300 per team. Scan the QR, click Payment done, enter your UTR / transaction number, then wait for organizer confirmation.",
    },
    {
        q: "How do we pay without a payment gateway?",
        a: "Scan Payment QR, complete the UPI transfer, click Payment done, and submit your UTR. Organizers then accept or reject the request. If verified, you are added to the WhatsApp group.",
    },
    {
        q: "How many members can be in a team?",
        a: "Each team must have exactly 6 members, including the team leader, and at least one female member. Open to all branches.",
    },
    {
        q: "How does problem selection work?",
        a: "Browse problem statements on the official SIH portal (sih.gov.in/sih2026PS). Enter your chosen Problem Statement ID & Title to confirm selection. A maximum of 5 teams can select the same problem statement.",
    },
    {
        q: "Can we change our selected problem?",
        a: "No. Selection is final for teams. Only an administrator can reset or reassign a problem, and every override is logged.",
    },
    {
        q: "How many teams can select one problem?",
        a: "A maximum of 5 teams / ideas can select the same problem statement ID. When the 5th team locks it, the problem statement becomes FULL automatically.",
    },
    {
        q: "What happens if payment fails?",
        a: "If organizers reject the UTR, pay again using the QR and submit a new transaction number. Your team is kept. You do not need to register again.",
    },
    {
        q: "Can we register after the deadline?",
        a: "No. When organizers close registration in settings, new teams and payments are rejected.",
    },
    {
        q: "How can we contact organizers?",
        a: "Call 9511841275 or use the contact form. Include your registration ID if you already have one.",
    },
];
export const RULES = [
    {
        title: "Team size",
        body: "Each team must have exactly 6 student members, including one team leader. At least one member must be female. Open to all branches.",
    },
    {
        title: "Eligibility",
        body: "Participants must be currently enrolled students. Accurate college, course, and student ID details are required for every member.",
    },
    {
        title: "Registration deadline",
        body: "Registrations are accepted only while the organizer setting isActive is true and before the published deadline.",
    },
    {
        title: "Payment rules",
        body: "A team is confirmed only after organizers verify the submitted UTR / transaction number. If verified, the team is added to the WhatsApp group.",
    },
    {
        title: "Problem selection rules",
        body: "Only a confirmed team can select a problem, after payment is verified. The team may hold exactly one active selection.",
    },
    {
        title: "Five-team maximum",
        body: "Each problem statement can be claimed by at most 5 teams / ideas. When the 5th team locks it, it becomes FULL in real time and no more teams can select it.",
    },
    {
        title: "Selection finality",
        body: "Once locked, a problem cannot be changed by the team. Admin resets and reassignments are written to the audit log.",
    },
    {
        title: "Cancellation and refunds",
        body: "Cancellations and refunds are handled by organizers. Refunded payments move the registration to CANCELLED.",
    },
    {
        title: "Hackathon conduct",
        body: "Original work, respectful collaboration, and compliance with SIH code of conduct are mandatory. Organizers may disqualify teams for policy violations.",
    },
];
