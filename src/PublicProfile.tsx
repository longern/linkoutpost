import type { LinkProfile } from "./profile";

export function ProfilePage({
  avatarUrl,
  profile
}: {
  avatarUrl?: string | null;
  profile: LinkProfile | null;
}) {
  if (!profile) {
    return (
      <main className="public-page">
        <section className="public-profile">
          <p className="eyebrow">Link Outpost</p>
          <h1>Profile not found</h1>
          <p>This handle does not have a published page yet.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="public-page">
      <section className="public-profile">
        {avatarUrl && <img alt="" className="profile-avatar" src={avatarUrl} />}
        <p className="handle">@{profile.handle}</p>
        <h1>{profile.title}</h1>
        <p className="bio">{profile.bio}</p>
        <div className="public-links">
          {profile.links.map((link) => (
            <a href={link.url} key={link.id} rel="noreferrer" target="_blank">
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
