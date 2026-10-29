import { Link } from "react-router-dom";

const guides: Record<
  string,
  { title: string; intro: string; points: [string, string][] }
> = {
  property: {
    title: "Make your property search more focused.",
    intro:
      "Whether you are looking for a home, business premises or an investment, begin with the requirements that matter to you.",
    points: [
      [
        "Define your priorities",
        "Share your preferred location, property type, budget and move-in or purchase timeline. Include access, parking and space requirements where relevant.",
      ],
      [
        "Ask about the details",
        "Contact our team to ask about availability, viewing arrangements and the terms associated with a published listing.",
      ],
      [
        "Have a property to offer?",
        "Tell us whether you want to sell, lease or discuss property management. Include the location, property details and your objectives.",
      ],
    ],
  },
  project: {
    title: "Bring your project into focus.",
    intro:
      "Published project records provide context for the work described. For a new enquiry, help us understand your own site, objectives and priorities.",
    points: [
      [
        "Describe the intended use",
        "Explain what you want to build, improve or develop, who will use the space and where the site is located.",
      ],
      [
        "Share your starting point",
        "Mention any existing drawings, dimensions, site photographs or design references you can provide during follow-up.",
      ],
      [
        "Discuss the scope",
        "Outline your budget and preferred timeline. The work, assessment requirements and quotation can then be discussed for your particular project.",
      ],
    ],
  },
  product: {
    title: "A clearer specification. A more useful quotation.",
    intro:
      "Explore the published catalogue for materials and supplies, then describe the items your project or organization needs.",
    points: [
      [
        "Specify the items",
        "Include quantities, dimensions, grades, finishes or model numbers. Mention any required compatibility with existing equipment.",
      ],
      [
        "Explain delivery needs",
        "Provide the delivery location, required dates and any access or handling requirements that may affect your order.",
      ],
      [
        "Confirm before ordering",
        "Ask the team to confirm pricing, availability, specifications and delivery terms for your request. A catalogue entry alone does not confirm stock.",
      ],
    ],
  },
  post: {
    title: "Put the information in context.",
    intro:
      "Explore published articles on property, construction, design and supplies, and use them to prepare questions for your next conversation.",
    points: [
      [
        "Start with your interests",
        "Use search and category filters to find articles related to your property plans, project or procurement needs.",
      ],
      [
        "Consider your circumstances",
        "General guidance may need to be adapted to the location, condition, specifications and intended use of your property or project.",
      ],
      [
        "Continue the conversation",
        "If an article raises a question, include its title in your enquiry and explain what you would like to discuss with the team.",
      ],
    ],
  },
};

export function CollectionGuide({ kind }: { kind: string }) {
  const guide = guides[kind];
  if (!guide) return null;
  return (
    <section className="section sandstone">
      <div className="container">
        <p className="eyebrow">YOUR NEXT STEP</p>
        <h2>{guide.title}</h2>
        <p>{guide.intro}</p>
        <div className="grid three">
          {guide.points.map(([title, text]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <Link
          className="text-link"
          to={kind === "product" ? "/quote" : "/contact"}
        >
          {kind === "product"
            ? "Request a quotation"
            : "Discuss your requirements"}
        </Link>
      </div>
    </section>
  );
}

export function EnquiryGuide({ quote }: { quote: boolean }) {
  return (
    <section className="section sandstone">
      <div className="container service-enquiry-guide">
        <div>
          <p className="eyebrow">HELP US UNDERSTAND YOUR NEEDS</p>
          <h2>
            {quote
              ? "Prepare your quotation request."
              : "Start with what matters to you."}
          </h2>
          <p>
            We welcome enquiries from individuals, property owners, businesses,
            investors, contractors, NGOs and institutions. You can browse the
            website and send a request without creating an account.
          </p>
        </div>
        <div className="service-questions">
          <details open>
            <summary>What should I include in my message?</summary>
            <p>
              Describe the property, service or supplies you need, the location,
              your preferred timeline and any budget or specification
              requirements. For a published property or catalogue item, include
              its title.
            </p>
          </details>
          <details>
            <summary>Can I share drawings or an item list?</summary>
            <p>
              Mention any drawings, photographs or itemized lists in your
              message. Contact the team by email to discuss sharing supporting
              documents.
            </p>
          </details>
          <details>
            <summary>
              Does sending a request confirm a booking or order?
            </summary>
            <p>
              An enquiry starts a discussion. Availability, scope, pricing,
              payment terms and scheduling need to be agreed with the team
              before a viewing, service or supply order is confirmed.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
