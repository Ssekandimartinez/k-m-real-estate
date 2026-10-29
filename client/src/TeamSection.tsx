import { ArrowUpRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { Entry } from "./api";
import "./team.css";

export default function TeamSection({ members }: { members: Entry[] }) {
  if (!members.length) return null;
  return (
    <section className="team-section" aria-labelledby="team-heading">
      <div className="container">
        <div className="team-heading">
          <div>
            <p className="eyebrow">THE PEOPLE BEHIND K&M</p>
            <h2 id="team-heading">
              Meet our team<span>.</span>
            </h2>
          </div>
          <Link className="team-contact" to="/contact">
            Start a conversation <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="team-grid">
          {members.map((member, index) => (
            <article className="team-card" key={member.id}>
              <div className="team-portrait">
                {member.images[0] ? (
                  <img
                    src={member.images[0].url}
                    alt={member.images[0].alt || member.title}
                    loading="lazy"
                    width="480"
                    height="600"
                  />
                ) : (
                  <div className="team-portrait-placeholder" aria-hidden="true">
                    <Users size={56} strokeWidth={1} />
                  </div>
                )}
                {member.specs.sample === true && (
                  <span className="team-sample">Sample team profile</span>
                )}
                <div className="team-portrait-caption" aria-hidden="true">
                  <span>K&M REAL ESTATE</span>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
              </div>
              <div className="team-card-content">
                <h3>{member.title}</h3>
                <p className="team-role">{member.specs.jobTitle}</p>
                <div className="team-divider" aria-hidden="true" />
                <p className="team-bio">{member.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
