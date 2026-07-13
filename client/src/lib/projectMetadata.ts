export const PROJECT_TAGS = [
    "frontend",
    "backend",
    "fullstack",
    "mobile",
    "desktop",
    "api",
    "machine-learning",
    "artificial-intelligence",
    "data-science",
    "devops",
    "cloud",
    "cybersecurity",
    "blockchain",
    "game-development",
    "iot",
    "automation",
    "database",
    "open-source",
] as const;

export type ProjectTag = (typeof PROJECT_TAGS)[number];

export const PROJECT_TAG_LABELS: Record<ProjectTag, string> = {
    frontend: "Frontend",
    backend: "Backend",
    fullstack: "Full stack",
    mobile: "Mobile",
    desktop: "Desktop",
    api: "API",
    "machine-learning": "Machine learning",
    "artificial-intelligence": "Artificial intelligence",
    "data-science": "Data science",
    devops: "DevOps",
    cloud: "Cloud",
    cybersecurity: "Cybersecurity",
    blockchain: "Blockchain",
    "game-development": "Game development",
    iot: "IoT",
    automation: "Automation",
    database: "Database",
    "open-source": "Open source",
};

export const GITHUB_REPOSITORY_URL_REGEX =
    /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9._-]{1,100}$/;

export const GITHUB_REPOSITORY_URL_ERROR =
    "Use the format https://github.com/<username>/<project_name>";
