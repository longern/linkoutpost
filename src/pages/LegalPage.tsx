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
    intro: `${siteTitle} is designed for public link pages, local editing, and portable static exports.`,
    sections: [
      {
        heading: "Local editor",
        body: "When you use the local editor without signing in, profile data and uploaded images are stored in your browser storage and can be exported as a static ZIP.",
      },
      {
        heading: "Information you provide",
        body: "If you sign in or publish a hosted page, the service may store your profile content, handle, title, bio, social links, external links, theme settings, uploaded media, and account information received from your OAuth provider, such as display name, username, email address, and avatar URL.",
      },
      {
        heading: "Public pages",
        body: "Hosted profile pages are public. Anything you add to a published page, including contact details, social handles, images, videos, and links, may be viewed by anyone who visits the page.",
      },
      {
        heading: "How information is used",
        body: "Information is used to authenticate you, save and render your pages, store uploaded assets, support static export and import, protect the service, and operate the hosted publishing features you choose to use.",
      },
      {
        heading: "Service providers",
        body: "The hosted service uses infrastructure and authentication providers such as Cloudflare, Google, Twitter/X, and Shopify. These providers may process information needed to deliver hosting, storage, security, and OAuth sign-in.",
      },
      {
        heading: "Cookies",
        body: "The app uses necessary cookies for OAuth sign-in, session state, and security. It does not need a separate cookie banner unless optional analytics or tracking cookies are added later.",
      },
      {
        heading: "Retention and deletion",
        body: "Local editor data remains in your browser until you delete it or clear browser storage. Hosted profile data and uploaded assets are kept while your hosted page or account remains active, unless deleted by you or removed under the Terms.",
      },
      {
        heading: "Your choices",
        body: "You can avoid hosted storage by using the local editor and static export. You can edit or remove public page content from the editor, and hosted deployments should provide a reasonable way to request account or hosted page deletion.",
      },
      {
        heading: "Children",
        body: `${siteTitle} is not intended for children under 13. Do not create a hosted account or publish personal information about a child unless you have the legal right to do so.`,
      },
    ],
  },
  terms: {
    title: "Terms",
    intro: `Use ${siteTitle} to create link pages for content you own, control, or have permission to publish.`,
    sections: [
      {
        heading: "Hosted pages",
        body: "Hosted publishing creates public handle pages. You are responsible for the profile content, links, contact details, images, videos, and other materials you publish.",
      },
      {
        heading: "Your content",
        body: "You keep ownership of your content. By publishing or uploading content, you give the service permission to host, store, copy, resize, display, and distribute it as needed to operate your page and related export features.",
      },
      {
        heading: "Rights and permissions",
        body: "Only publish content that you own or are allowed to use. Do not upload images, videos, names, contact information, or other personal information about someone else unless you have the required permission.",
      },
      {
        heading: "Public information",
        body: "Do not publish private information that should not be visible to the public. Avoid posting sensitive identifiers, confidential information, private addresses, or contact details that could cause harm if copied or shared.",
      },
      {
        heading: "Static export",
        body: "You can export your page files and deploy them outside the hosted service. Once exported, your external hosting is controlled by you.",
      },
      {
        heading: "Acceptable use",
        body: "Do not use the service for unlawful, abusive, deceptive, harmful, hateful, sexually exploitative, malware-related, spam, phishing, impersonation, or rights-infringing content.",
      },
      {
        heading: "Third-party links",
        body: "You are responsible for the destinations you link to. Linked websites and services are not controlled by the hosted service and may have their own terms, privacy practices, and risks.",
      },
      {
        heading: "Moderation and removal",
        body: "Hosted deployments may review, restrict, remove, or disable pages, accounts, uploads, or links that appear to violate these Terms, create risk, or interfere with the service.",
      },
      {
        heading: "Service availability",
        body: "The software and hosted service are provided as-is. Features may change, and hosted availability, storage, custom domains, exports, and third-party integrations are not guaranteed.",
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
