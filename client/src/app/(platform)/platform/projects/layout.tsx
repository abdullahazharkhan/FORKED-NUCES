import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Project Details",
    description: "Review a project, its issues, collaborators, and community discussion.",
};

export default function ProjectsLayout({ children }: { children: ReactNode }) {
    return children;
}
