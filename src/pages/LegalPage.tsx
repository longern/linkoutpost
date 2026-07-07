import { SiteTopbar } from "../components/SiteTopbar";
import { siteTitle } from "../siteConfig";
import type { SessionState } from "../types";

type LegalPageKind = "license" | "privacy" | "terms";

type LegalPageContent = {
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

const content: Record<LegalPageKind, LegalPageContent> = {
  license: {
    title: "License",
    intro: `${siteTitle} is open source under the MIT License.`,
    sections: [
      {
        heading: "Source code",
        body: "You can inspect, fork, modify, and self-host the project from the public source repository.",
      },
      {
        heading: "MIT License",
        body: "Permission is granted to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, subject to including the copyright and license notice.",
      },
      {
        heading: "No warranty",
        body: "The software is provided as-is, without warranty of any kind.",
      },
    ],
  },
  privacy: {
    title: "Privacy",
    intro: `${siteTitle} keeps the hosted service small and uses local editing when you do not sign in.`,
    sections: [
      {
        heading: "Local editor",
        body: "When you use the local editor without signing in, profile data and uploaded images are stored in your browser storage and can be exported as a static ZIP.",
      },
      {
        heading: "Hosted accounts",
        body: "If you sign in to publish with hosted pages, the service stores the profile content, social links, theme settings, and uploaded assets needed to render your public page.",
      },
      {
        heading: "Cookies",
        body: "The app uses necessary cookies for OAuth sign-in, session state, and security. It does not need a separate cookie banner unless optional analytics or tracking cookies are added later.",
      },
    ],
  },
  terms: {
    title: "Terms",
    intro: `Use ${siteTitle} to create link pages you own or have permission to publish.`,
    sections: [
      {
        heading: "Hosted pages",
        body: "Hosted publishing is provided for creating public handle pages. You are responsible for the content, links, and images you publish.",
      },
      {
        heading: "Static export",
        body: "You can export your page files and deploy them outside the hosted service. Once exported, your external hosting is controlled by you.",
      },
      {
        heading: "Acceptable use",
        body: "Do not use the service for unlawful, abusive, deceptive, or rights-infringing content.",
      },
    ],
  },
};

export function LegalPage({
  initialSession,
  kind,
}: {
  initialSession: SessionState;
  kind: LegalPageKind;
}) {
  const page = content[kind];

  return (
    <>
      <SiteTopbar signedIn={initialSession.authenticated} />
      <main className="legal-page">
        <section className="legal-card">
          <p className="auth-kicker">{siteTitle}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          {page.sections.map((section) => (
            <section className="legal-section" key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </section>
      </main>
    </>
  );
}
