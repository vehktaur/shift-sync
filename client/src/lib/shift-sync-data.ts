export type Tone = "critical" | "warning" | "success" | "info" | "neutral";
export type ShiftState = "scheduled" | "open" | "warning" | "blocked" | "pending";

export type Metric = {
  label: string;
  value: string;
  context: string;
  delta: string;
  tone: Tone;
};

export type ShiftCardData = {
  id: string;
  title: string;
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  time: string;
  location: string;
  locationCode: string;
  timezone: string;
  requiredSkill: string;
  headcount: number;
  assignees: string[];
  openSlots: number;
  premium: boolean;
  state: ShiftState;
  note: string;
  explanation?: string;
  suggestions?: string[];
  projectedImpact?: string;
};

type WorkflowStep = {
  label: string;
  status: "done" | "current" | "upcoming";
};

type CoverageRequest = {
  id: string;
  type: "swap" | "drop";
  shift: string;
  location: string;
  requestedBy: string;
  counterpart?: string;
  status: string;
  expiresIn: string;
  note: string;
  steps: WorkflowStep[];
};

type TeamMember = {
  id: string;
  name: string;
  roleFocus: string;
  skills: string[];
  locations: string[];
  assignedHours: number;
  desiredHours: number;
  premiumShifts: number;
  pendingRequests: number;
  status: Tone;
  availability: string;
  note: string;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  audience: string;
  channel: string;
  time: string;
  read: boolean;
  tone: Tone;
};

type LiveDutyLocation = {
  location: string;
  timezone: string;
  manager: string;
  clockedIn: string[];
  note: string;
};

type AlertItem = {
  id: string;
  title: string;
  description: string;
  action: string;
  tone: Tone;
};

type ScenarioCard = {
  title: string;
  summary: string;
  result: string;
  tone: Tone;
};

type CandidateImpact = {
  name: string;
  impact: string;
  tone: Tone;
};

type NotificationPreference = {
  label: string;
  value: string;
  note: string;
};

type WeeklyDay = {
  key: string;
  label: string;
  dateLabel: string;
  shifts: ShiftCardData[];
};

const shifts: ShiftCardData[] = [
  {
    id: "mon-boardwalk-lunch",
    title: "Lunch Service",
    dayKey: "mon",
    dayLabel: "Monday",
    dateLabel: "Mar 30",
    time: "11:00 AM - 4:00 PM",
    location: "Boardwalk Kitchen",
    locationCode: "BWK",
    timezone: "ET",
    requiredSkill: "server",
    headcount: 3,
    assignees: ["Maria Gomez", "Aisha Bello", "Priya Nair"],
    openSlots: 0,
    premium: false,
    state: "scheduled",
    note: "Published and fully staffed for the east coast lunch rush.",
  },
  {
    id: "mon-harbor-dinner",
    title: "Dinner Line",
    dayKey: "mon",
    dayLabel: "Monday",
    dateLabel: "Mar 30",
    time: "4:00 PM - 10:00 PM",
    location: "Harbor Point Grill",
    locationCode: "HPG",
    timezone: "ET",
    requiredSkill: "line cook",
    headcount: 2,
    assignees: ["Jamal Carter"],
    openSlots: 1,
    premium: false,
    state: "open",
    note: "One cook slot is still open before publish cutoff.",
    suggestions: ["Olivia Brooks", "Aisha Bello"],
    projectedImpact: "Filling with Olivia keeps the day legal, but nudges her to 39h.",
  },
  {
    id: "tue-sunset-brunch",
    title: "Beachfront Brunch",
    dayKey: "tue",
    dayLabel: "Tuesday",
    dateLabel: "Mar 31",
    time: "9:00 AM - 3:00 PM",
    location: "Sunset Pier",
    locationCode: "SNP",
    timezone: "PT",
    requiredSkill: "host",
    headcount: 2,
    assignees: ["Noah Kim", "Devon Lee"],
    openSlots: 0,
    premium: false,
    state: "scheduled",
    note: "Balanced assignment keeps Noah within preferred hours.",
  },
  {
    id: "tue-tidehouse-close",
    title: "Closing Bar",
    dayKey: "tue",
    dayLabel: "Tuesday",
    dateLabel: "Mar 31",
    time: "6:00 PM - 1:00 AM",
    location: "Tidehouse Cantina",
    locationCode: "THC",
    timezone: "PT",
    requiredSkill: "bartender",
    headcount: 2,
    assignees: ["Sarah Chen"],
    openSlots: 1,
    premium: false,
    state: "warning",
    note: "Sarah can work it, but it becomes her sixth consecutive day.",
    explanation:
      "Assigning Sarah covers the skill requirement, but the shift triggers a sixth-day warning and leaves only one bartender on the close.",
    suggestions: ["John Rivera", "Devon Lee"],
  },
  {
    id: "wed-harbor-dinner",
    title: "Terrace Dinner",
    dayKey: "wed",
    dayLabel: "Wednesday",
    dateLabel: "Apr 1",
    time: "5:00 PM - 11:00 PM",
    location: "Harbor Point Grill",
    locationCode: "HPG",
    timezone: "ET",
    requiredSkill: "bartender",
    headcount: 2,
    assignees: ["Devon Lee", "Aisha Bello"],
    openSlots: 0,
    premium: false,
    state: "scheduled",
    note: "No conflicts and enough cross-trained coverage if someone drops.",
  },
  {
    id: "wed-boardwalk-hotline",
    title: "Hot Line",
    dayKey: "wed",
    dayLabel: "Wednesday",
    dateLabel: "Apr 1",
    time: "2:00 PM - 10:00 PM",
    location: "Boardwalk Kitchen",
    locationCode: "BWK",
    timezone: "ET",
    requiredSkill: "line cook",
    headcount: 2,
    assignees: ["Jamal Carter", "Olivia Brooks"],
    openSlots: 0,
    premium: false,
    state: "warning",
    note: "This shift is the tipping point in Olivia's overtime chain.",
    explanation:
      "Olivia stays legal on Wednesday, but keeping her here makes Friday's premium close a 52h week unless another cook absorbs one west-coast assignment.",
    suggestions: ["Jamal Carter", "Priya Nair"],
  },
  {
    id: "thu-sunset-dinner",
    title: "Sunset Dinner",
    dayKey: "thu",
    dayLabel: "Thursday",
    dateLabel: "Apr 2",
    time: "6:00 PM - 12:00 AM",
    location: "Sunset Pier",
    locationCode: "SNP",
    timezone: "PT",
    requiredSkill: "server",
    headcount: 3,
    assignees: ["Ethan Cole", "John Rivera"],
    openSlots: 1,
    premium: false,
    state: "blocked",
    note: "The attempted third assignment breaks availability rules.",
    explanation:
      "Ethan set 9:00 AM - 5:00 PM availability in each certified location's timezone. A Pacific close sits outside that availability window and cannot be assigned.",
    suggestions: ["Devon Lee", "Noah Kim"],
  },
  {
    id: "fri-tidehouse-premium",
    title: "Friday Closing Bar",
    dayKey: "fri",
    dayLabel: "Friday",
    dateLabel: "Apr 3",
    time: "7:00 PM - 1:00 AM",
    location: "Tidehouse Cantina",
    locationCode: "THC",
    timezone: "PT",
    requiredSkill: "bartender",
    headcount: 2,
    assignees: ["John Rivera"],
    openSlots: 1,
    premium: true,
    state: "open",
    note: "A premium close still needs one approved bartender before publish.",
    suggestions: ["Devon Lee", "Sarah Chen", "Aisha Bello"],
    projectedImpact: "Picking Devon keeps premium distribution even and avoids pushing Sarah into day-six overtime.",
  },
  {
    id: "fri-harbor-patio",
    title: "Patio Server Bank",
    dayKey: "fri",
    dayLabel: "Friday",
    dateLabel: "Apr 3",
    time: "5:30 PM - 11:30 PM",
    location: "Harbor Point Grill",
    locationCode: "HPG",
    timezone: "ET",
    requiredSkill: "server",
    headcount: 4,
    assignees: ["Maria Gomez", "Aisha Bello", "Priya Nair", "Devon Lee"],
    openSlots: 0,
    premium: true,
    state: "scheduled",
    note: "Published premium shift with balanced premium distribution this week.",
  },
  {
    id: "sat-boardwalk-rush",
    title: "Saturday Rush",
    dayKey: "sat",
    dayLabel: "Saturday",
    dateLabel: "Apr 4",
    time: "5:00 PM - 11:00 PM",
    location: "Boardwalk Kitchen",
    locationCode: "BWK",
    timezone: "ET",
    requiredSkill: "server",
    headcount: 4,
    assignees: ["Maria Gomez", "Aisha Bello", "Priya Nair"],
    openSlots: 1,
    premium: true,
    state: "warning",
    note: "One premium slot is open and the fairness score will dip if it goes to Maria again.",
    explanation:
      "Maria already has three premium shifts in the selected period. Filling the final slot with Priya or Devon keeps the premium fairness score above 80.",
    suggestions: ["Priya Nair", "Devon Lee"],
  },
  {
    id: "sat-sunset-bar",
    title: "Pier Bar Close",
    dayKey: "sat",
    dayLabel: "Saturday",
    dateLabel: "Apr 4",
    time: "8:00 PM - 2:00 AM",
    location: "Sunset Pier",
    locationCode: "SNP",
    timezone: "PT",
    requiredSkill: "bartender",
    headcount: 2,
    assignees: ["Sarah Chen", "John Rivera"],
    openSlots: 0,
    premium: true,
    state: "scheduled",
    note: "Premium close stays within rest windows and keeps west-coast demand covered.",
  },
  {
    id: "sun-boardwalk-chaos",
    title: "Emergency Dinner Coverage",
    dayKey: "sun",
    dayLabel: "Sunday",
    dateLabel: "Apr 5",
    time: "7:00 PM - 12:00 AM",
    location: "Boardwalk Kitchen",
    locationCode: "BWK",
    timezone: "ET",
    requiredSkill: "server",
    headcount: 3,
    assignees: ["Aisha Bello", "Priya Nair"],
    openSlots: 1,
    premium: false,
    state: "open",
    note: "Maria called out. This is the fastest path to coverage in the evaluator's Sunday-night scenario.",
    explanation:
      "Original assignment remains until manager approval. Two qualified staff are free within the availability window and can claim instantly.",
    suggestions: ["Devon Lee", "John Rivera"],
    projectedImpact: "Approving Devon keeps the shift covered with no overtime. John is legal, but leaves Tidehouse thin if a second callout hits.",
  },
  {
    id: "sun-sunset-lock",
    title: "Dual-Manager Bartender Conflict",
    dayKey: "sun",
    dayLabel: "Sunday",
    dateLabel: "Apr 5",
    time: "7:00 PM - 1:00 AM",
    location: "Sunset Pier",
    locationCode: "SNP",
    timezone: "PT",
    requiredSkill: "bartender",
    headcount: 2,
    assignees: ["Sarah Chen"],
    openSlots: 1,
    premium: false,
    state: "blocked",
    note: "A second manager tried to assign John Rivera at the same time from another location.",
    explanation:
      "The assignment is locked because John is already being reserved in a parallel manager session. One manager sees the win, the other gets an immediate conflict toast and suggested substitutes.",
    suggestions: ["Devon Lee", "Aisha Bello"],
  },
];

const weeklyDays: WeeklyDay[] = [
  { key: "mon", label: "Mon", dateLabel: "Mar 30", shifts: shifts.filter((shift) => shift.dayKey === "mon") },
  { key: "tue", label: "Tue", dateLabel: "Mar 31", shifts: shifts.filter((shift) => shift.dayKey === "tue") },
  { key: "wed", label: "Wed", dateLabel: "Apr 1", shifts: shifts.filter((shift) => shift.dayKey === "wed") },
  { key: "thu", label: "Thu", dateLabel: "Apr 2", shifts: shifts.filter((shift) => shift.dayKey === "thu") },
  { key: "fri", label: "Fri", dateLabel: "Apr 3", shifts: shifts.filter((shift) => shift.dayKey === "fri") },
  { key: "sat", label: "Sat", dateLabel: "Apr 4", shifts: shifts.filter((shift) => shift.dayKey === "sat") },
  { key: "sun", label: "Sun", dateLabel: "Apr 5", shifts: shifts.filter((shift) => shift.dayKey === "sun") },
];

const coverageRequests: CoverageRequest[] = [
  {
    id: "cov-1",
    type: "swap",
    shift: "Friday Closing Bar",
    location: "Tidehouse Cantina",
    requestedBy: "Sarah Chen",
    counterpart: "John Rivera",
    status: "Staff accepted, manager approval pending",
    expiresIn: "18h left",
    note: "If the manager edits the shift before approval, the swap auto-cancels and both staff are notified instantly.",
    steps: [
      { label: "Sarah requested swap", status: "done" },
      { label: "John accepted", status: "done" },
      { label: "Manager approval", status: "current" },
      { label: "Assignments update", status: "upcoming" },
    ],
  },
  {
    id: "cov-2",
    type: "drop",
    shift: "Emergency Dinner Coverage",
    location: "Boardwalk Kitchen",
    requestedBy: "Maria Gomez",
    status: "Live coverage search",
    expiresIn: "43m left",
    note: "Two qualified claimants are free right now. The original assignment stays attached until the manager confirms the replacement.",
    steps: [
      { label: "Maria dropped shift", status: "done" },
      { label: "Qualified staff notified", status: "done" },
      { label: "Manager reviewing claimant", status: "current" },
      { label: "Coverage approved", status: "upcoming" },
    ],
  },
  {
    id: "cov-3",
    type: "swap",
    shift: "Saturday Rush",
    location: "Boardwalk Kitchen",
    requestedBy: "Aisha Bello",
    counterpart: "Devon Lee",
    status: "Auto-cancelled after edit",
    expiresIn: "Closed",
    note: "Manager changed headcount after both staff approved. The pending swap was cancelled automatically and returned to the original schedule.",
    steps: [
      { label: "Swap agreed by staff", status: "done" },
      { label: "Manager edits shift", status: "done" },
      { label: "Swap auto-cancelled", status: "done" },
      { label: "Users notified", status: "done" },
    ],
  },
];

const teamMembers: TeamMember[] = [
  {
    id: "staff-1",
    name: "Sarah Chen",
    roleFocus: "Senior bartender",
    skills: ["bartender", "server"],
    locations: ["Sunset Pier", "Tidehouse Cantina"],
    assignedHours: 38,
    desiredHours: 32,
    premiumShifts: 4,
    pendingRequests: 1,
    status: "warning",
    availability: "Wed-Sun, 11 AM - 2 AM local",
    note: "High performer, but she is the easiest path into sixth-day warnings if the west coast gets short.",
  },
  {
    id: "staff-2",
    name: "John Rivera",
    roleFocus: "Bartender / opener",
    skills: ["bartender", "host"],
    locations: ["Sunset Pier", "Tidehouse Cantina"],
    assignedHours: 28,
    desiredHours: 30,
    premiumShifts: 2,
    pendingRequests: 1,
    status: "success",
    availability: "Thu-Sun, 2 PM - 2 AM local",
    note: "Best alternative for fast west-coast coverage without hurting fairness.",
  },
  {
    id: "staff-3",
    name: "Maria Gomez",
    roleFocus: "Lead server",
    skills: ["server", "host"],
    locations: ["Boardwalk Kitchen", "Harbor Point Grill"],
    assignedHours: 31,
    desiredHours: 30,
    premiumShifts: 3,
    pendingRequests: 1,
    status: "neutral",
    availability: "Tue-Sun, 10 AM - 11 PM ET",
    note: "Most premium opportunities on the east coast this month, which is why fairness monitoring is focused here.",
  },
  {
    id: "staff-4",
    name: "Olivia Brooks",
    roleFocus: "Line cook / flex",
    skills: ["line cook"],
    locations: ["Harbor Point Grill", "Boardwalk Kitchen", "Sunset Pier"],
    assignedHours: 44,
    desiredHours: 36,
    premiumShifts: 1,
    pendingRequests: 0,
    status: "critical",
    availability: "Mon-Sat, 8 AM - 11 PM local",
    note: "Friday close takes Olivia to 52h. She is the center of the overtime trap scenario.",
  },
  {
    id: "staff-5",
    name: "Jamal Carter",
    roleFocus: "Prep + hot line",
    skills: ["line cook"],
    locations: ["Harbor Point Grill", "Boardwalk Kitchen"],
    assignedHours: 36,
    desiredHours: 38,
    premiumShifts: 0,
    pendingRequests: 0,
    status: "success",
    availability: "Mon-Fri, 8 AM - 10 PM ET",
    note: "A clean way to offload one cook shift without triggering overtime.",
  },
  {
    id: "staff-6",
    name: "Priya Nair",
    roleFocus: "Host / server",
    skills: ["host", "server"],
    locations: ["Boardwalk Kitchen", "Harbor Point Grill"],
    assignedHours: 24,
    desiredHours: 28,
    premiumShifts: 1,
    pendingRequests: 0,
    status: "info",
    availability: "Thu-Sun, 9 AM - 10 PM ET",
    note: "Most under-scheduled qualified option for east-coast premium balancing.",
  },
  {
    id: "staff-7",
    name: "Devon Lee",
    roleFocus: "Cross-location closer",
    skills: ["bartender", "server", "host"],
    locations: ["All four locations"],
    assignedHours: 34,
    desiredHours: 34,
    premiumShifts: 2,
    pendingRequests: 1,
    status: "success",
    availability: "All week, 9 AM - 1 AM local",
    note: "Best universal fallback when managers collide across time zones.",
  },
  {
    id: "staff-8",
    name: "Ethan Cole",
    roleFocus: "Server / travel flex",
    skills: ["server"],
    locations: ["Harbor Point Grill", "Sunset Pier"],
    assignedHours: 22,
    desiredHours: 24,
    premiumShifts: 1,
    pendingRequests: 0,
    status: "warning",
    availability: "9 AM - 5 PM per location timezone",
    note: "Timezone handling is explicit: his 9-5 window follows the restaurant's timezone, not his current device timezone.",
  },
];

const notifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Coverage needed for Boardwalk Kitchen",
    body: "Maria Gomez dropped Sunday's 7 PM dinner shift. Two qualified staff are free right now.",
    audience: "Managers",
    channel: "In-app + email simulation",
    time: "2m ago",
    read: false,
    tone: "critical",
  },
  {
    id: "notif-2",
    title: "Schedule publish ready",
    body: "Only two shifts remain open before the Mar 30 week can be published.",
    audience: "Admin + assigned managers",
    channel: "In-app",
    time: "8m ago",
    read: false,
    tone: "warning",
  },
  {
    id: "notif-3",
    title: "Swap accepted by John Rivera",
    body: "Sarah Chen's Friday closing swap is waiting on manager approval.",
    audience: "Sarah, John, west-coast manager",
    channel: "In-app + email simulation",
    time: "14m ago",
    read: false,
    tone: "info",
  },
  {
    id: "notif-4",
    title: "Availability updated for Ethan Cole",
    body: "Timezone-aware 9 AM - 5 PM windows were recalculated after DST alignment.",
    audience: "Harbor + Sunset managers",
    channel: "In-app",
    time: "1h ago",
    read: true,
    tone: "info",
  },
  {
    id: "notif-5",
    title: "Auto-cancelled swap",
    body: "Aisha Bello and Devon Lee were notified after the Saturday Rush shift was edited.",
    audience: "Affected staff + manager",
    channel: "In-app",
    time: "3h ago",
    read: true,
    tone: "neutral",
  },
];

const liveDutyBoard: LiveDutyLocation[] = [
  {
    location: "Harbor Point Grill",
    timezone: "ET",
    manager: "Lauren Price",
    clockedIn: ["Jamal Carter", "Maria Gomez", "Priya Nair"],
    note: "Dinner prep is on pace and no break violations are projected.",
  },
  {
    location: "Boardwalk Kitchen",
    timezone: "ET",
    manager: "Andre Stone",
    clockedIn: ["Aisha Bello", "Olivia Brooks", "Noah Kim"],
    note: "Current labor spend is tracking 4% under plan.",
  },
  {
    location: "Sunset Pier",
    timezone: "PT",
    manager: "Maya Torres",
    clockedIn: ["Sarah Chen", "John Rivera"],
    note: "One bartender request is still unlocked for the Sunday close.",
  },
  {
    location: "Tidehouse Cantina",
    timezone: "PT",
    manager: "Maya Torres",
    clockedIn: ["Devon Lee", "Ethan Cole"],
    note: "Coverage risk stays low if Devon is preserved for Friday's premium close.",
  },
];

const alerts: AlertItem[] = [
  {
    id: "alert-1",
    title: "Sunday Night Chaos",
    description:
      "A server called out one hour before the Boardwalk dinner shift. Two qualified staff are available and both remain inside labor and rest rules.",
    action: "Open coverage panel",
    tone: "critical",
  },
  {
    id: "alert-2",
    title: "Overtime Trap",
    description:
      "Olivia Brooks is already projected at 44 hours. Assigning her Friday premium close lifts the week to 52 hours and adds avoidable overtime cost.",
    action: "View what-if impact",
    tone: "warning",
  },
  {
    id: "alert-3",
    title: "Fairness Drift",
    description:
      "Maria Gomez has the highest share of Friday and Saturday premium shifts. Assigning Priya or Devon to the remaining premium slot improves equity.",
    action: "Review fairness report",
    tone: "warning",
  },
  {
    id: "alert-4",
    title: "Timezone Tangle",
    description:
      "Ethan's availability is applied in each location's timezone. Managers see the same shift times rendered in the restaurant's local time, not the viewer's.",
    action: "Inspect availability rules",
    tone: "info",
  },
];

const scenarioCards: ScenarioCard[] = [
  {
    title: "Fast Coverage Path",
    summary: "Drop request launches to the qualified pool, keeps the original assignee attached, and surfaces the best legal replacement first.",
    result: "Boardwalk dinner can be covered in under five taps from the manager dashboard.",
    tone: "critical",
  },
  {
    title: "Fairness Audit",
    summary: "Premium shift counts and desired-hour deltas sit beside each teammate so complaints can be checked with evidence, not guesswork.",
    result: "Managers can confirm whether Saturday nights are being shared equitably.",
    tone: "warning",
  },
  {
    title: "Concurrency Guard",
    summary: "Two managers cannot win the same person at the same time. One sees the assignment confirmed and the other gets a conflict notice instantly.",
    result: "Double-booking is blocked before publish, not after payroll cleanup.",
    tone: "info",
  },
];

const candidateImpacts: CandidateImpact[] = [
  {
    name: "Devon Lee",
    impact: "No overtime, no rest violation, premium fairness +6 points.",
    tone: "success",
  },
  {
    name: "Sarah Chen",
    impact: "Legal on skill and certification, but creates a sixth-day warning and raises premium concentration.",
    tone: "warning",
  },
  {
    name: "Olivia Brooks",
    impact: "Hard block. Friday close pushes weekly total to 52h and violates the overtime guardrail.",
    tone: "critical",
  },
];

const notificationPreferences: NotificationPreference[] = [
  {
    label: "Managers",
    value: "In-app + email simulation",
    note: "Coverage, overtime, and availability changes all fan out immediately.",
  },
  {
    label: "Staff",
    value: "In-app by default",
    note: "Assignments, schedule publishes, and swap status changes respect per-user preferences.",
  },
  {
    label: "Admins",
    value: "In-app digest",
    note: "Cross-location fairness and labor anomalies roll up into a single oversight stream.",
  },
];

const fairnessLeaders = [
  { name: "Priya Nair", delta: "-4h vs desired", premiumShifts: 1, tone: "info" as Tone },
  { name: "Devon Lee", delta: "On target", premiumShifts: 2, tone: "success" as Tone },
  { name: "Maria Gomez", delta: "+1h vs desired", premiumShifts: 3, tone: "warning" as Tone },
];

export const appData = {
  workspace: {
    weekLabel: "Week of Mar 30 - Apr 5",
    locationsLabel: "4 locations / 2 time zones",
    publishProgress: "10 of 12 shifts publish-ready",
    liveRisks: "3 active risks",
  },
  metrics: [
    {
      label: "Coverage Ready",
      value: "92%",
      context: "Open shifts remaining: 2",
      delta: "+8 pts from last draft",
      tone: "success",
    },
    {
      label: "Projected Overtime",
      value: "$1,480",
      context: "Olivia is the biggest driver",
      delta: "-$320 if Devon takes Friday close",
      tone: "warning",
    },
    {
      label: "Premium Fairness",
      value: "82 / 100",
      context: "Friday and Saturday evenings only",
      delta: "+6 if Priya gets the open slot",
      tone: "info",
    },
    {
      label: "Real-Time Activity",
      value: "7 unread",
      context: "Swap, coverage, and availability events",
      delta: "2 critical right now",
      tone: "critical",
    },
  ] satisfies Metric[],
  alerts,
  liveDutyBoard,
  scenarioCards,
  fairnessLeaders,
  weeklyDays,
  candidateImpacts,
  coverageRequests,
  teamMembers,
  notifications,
  notificationPreferences,
  openShiftCount: shifts.filter((shift) => shift.state === "open").length,
  riskShiftCount: shifts.filter((shift) => shift.state === "warning" || shift.state === "blocked").length,
  premiumShiftCount: shifts.filter((shift) => shift.premium).length,
};
