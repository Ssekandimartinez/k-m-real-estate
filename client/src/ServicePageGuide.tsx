import { ArrowUpRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import type { Category } from "./api";
import { useVisual } from "./visualMedia";

const guides: Record<
  string,
  { title: string; image: string; alt: string; brief: string[] }
> = {
  "real-estate-and-property-services": {
    title: "Give your property plans a clear starting point.",
    image: "interior",
    alt: "A furnished residential living space",
    brief: [
      "Whether you want to buy, rent, sell, lease or manage a property",
      "Your preferred location, property type and budget",
      "Any available property documents and your intended timeline",
    ],
  },
  "construction-and-design": {
    title: "From an initial idea to a considered project brief.",
    image: "design-poster",
    alt: "Architectural design inspiration",
    brief: [
      "The type of building, proposed use and site location",
      "Drawings, dimensions or reference images, where available",
      "Your budget, preferred programme and site access arrangements",
    ],
  },
  "construction-materials": {
    title: "The right specification starts with the details.",
    image: "steel-sections",
    alt: "Stacked steel angle sections",
    brief: [
      "A materials list or bill of quantities",
      "Required sizes, grades, finishes and quantities",
      "The delivery location and the dates materials are needed",
    ],
  },
  "general-supplies-and-procurement": {
    title: "Turn your procurement list into a clear request.",
    image: "supplies",
    alt: "Furniture displayed outdoors",
    brief: [
      "An itemized list with quantities and specifications",
      "Your organization’s quality, packaging and documentation requirements",
      "The delivery address, schedule and any procurement deadlines",
    ],
  },
  "electrical-electronics-and-it-solutions": {
    title: "Choose equipment around the way it will be used.",
    image: "electrical",
    alt: "A microphone for audio and public address applications",
    brief: [
      "The intended use, equipment type and required quantities",
      "Model preferences and compatibility requirements for existing equipment",
      "The delivery location, budget and preferred timeline",
    ],
  },
  "plumbing-and-technical-services": {
    title: "A clearer description helps define the work.",
    image: "plumbing-repair",
    alt: "Hands working on a basin waste pipe connection",
    brief: [
      "Whether you need a new installation, repair or maintenance",
      "Photographs of the affected area and any known pipe or fitting sizes",
      "The property location, access arrangements and preferred visit time",
    ],
  },
};

const considerations: Record<string, [string, string][]> = {
  "real-estate-and-property-services": [
    [
      "Buying or renting",
      "Think about how you will use the space, the locations that suit your day-to-day needs and the costs you need to plan for. Include your preferred property type and any essential features in your enquiry.",
    ],
    [
      "Selling or leasing",
      "Prepare a description of the property, its location, current use and available documentation. Explain your timing and whether the property is occupied so marketing and viewing requirements can be discussed.",
    ],
    [
      "Managing a property",
      "Outline the number and type of units, occupancy and the support you need. Tenant communication, maintenance, financial reporting and compliance questions can then be considered as part of the scope.",
    ],
  ],
  "construction-and-design": [
    [
      "Define the spaces you need",
      "Describe who will use the building and how each space should function. For design enquiries, reference images can help communicate preferences for layout, materials, lighting and finishes.",
    ],
    [
      "Understand the site",
      "Share the site location, approximate dimensions, access information and any existing drawings or surveys. Identify existing structures and the information that still needs to be assessed.",
    ],
    [
      "Plan the scope and sequence",
      "Separate essential work from optional features and explain whether the project needs to be phased. State any operational constraints, such as keeping part of a building in use during the work.",
    ],
  ],
  "construction-materials": [
    [
      "Specify before comparing",
      "Use consistent units, dimensions, grades and finishes in your materials list. If a drawing or bill of quantities is available, refer to it so the requested materials can be identified more clearly.",
    ],
    [
      "Allow for project stages",
      "Explain which materials are needed first and whether deliveries need to follow construction stages. Include storage space, unloading access and any restrictions at the site.",
    ],
    [
      "Clarify acceptable alternatives",
      "Mention whether a particular brand or specification is mandatory. Any proposed alternative should be reviewed against your project requirements before it is included in an agreed order.",
    ],
  ],
  "general-supplies-and-procurement": [
    [
      "Build a complete item list",
      "Describe each item, quantity, unit and intended use. For furniture, include dimensions and finish preferences; for foodstuff and consumables, include packaging and any shelf-life requirements.",
    ],
    [
      "Document your requirements",
      "Mention any tender references, approval procedures or documents your organization requires. For institutional and relief enquiries, provide your confirmed specifications rather than relying on a general category name.",
    ],
    [
      "Organize delivery points",
      "List each destination and the quantities required there. Include receiving contacts, access conditions and preferred delivery windows so logistics can be considered when reviewing the request.",
    ],
  ],
  "electrical-electronics-and-it-solutions": [
    [
      "Start with the application",
      "Explain what the equipment needs to do and where it will be used. For computers, describe the intended software and workload; for audio, communication or surveillance equipment, describe the coverage and operating environment.",
    ],
    [
      "Check the connections",
      "Record model numbers, interfaces and relevant power requirements for equipment already in use. Identify any accessories or connections that need to be included in the request.",
    ],
    [
      "Clarify the full requirement",
      "Separate equipment supply from any installation, configuration or ongoing support you would like to discuss. Ask for the applicable product specifications and warranty terms to be confirmed with the quotation.",
    ],
  ],
  "plumbing-and-technical-services": [
    [
      "Describe the affected system",
      "Identify whether the work concerns a bathroom, water supply pipe, tank connection, pool plumbing or another installation. Explain where the issue occurs and whether it affects one fitting or several areas.",
    ],
    [
      "Share what you have observed",
      "Describe visible leaks, blockages, recurring faults or changes in water flow. Photographs and the approximate age or material of existing pipes can help explain the situation before an assessment is arranged.",
    ],
    [
      "Plan around the property",
      "Mention occupancy, working-hour restrictions and access to the affected area. If water isolation or access to concealed pipework may be needed, include any relevant building information in the discussion.",
    ],
  ],
};

export function ServicePageGuide({
  category,
  related = [],
}: {
  category: Category;
  related?: Category[];
}) {
  const planningPhoto = useVisual(`service-guide-${category.slug}`);
  const guide = guides[category.slug];
  if (!guide) return null;
  const product = category.kind === "product";
  return (
    <>
      <section className="section container service-considerations">
        <p className="eyebrow">A MORE INFORMED START</p>
        <h2>
          {product
            ? "Plan the purchase around the requirement."
            : "Make room for the details that matter."}
        </h2>
        <p className="service-section-intro">
          Use these points to shape your brief for {category.name.toLowerCase()}
          . A clear starting point makes it easier to discuss the work, the
          specification and the decisions ahead.
        </p>
        <div className="service-consideration-grid">
          {considerations[category.slug]?.map(([title, text], index) => (
            <article key={title}>
              <span className="service-step-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="service-planning">
        <div className="container service-planning-grid">
          <figure>
            {planningPhoto && (
              <img
                src={planningPhoto.url}
                alt={planningPhoto.alt}
                loading="lazy"
                width="1000"
                height="700"
              />
            )}
            <figcaption className="caption">{category.name}</figcaption>
          </figure>
          <div>
            <p className="eyebrow">PLAN YOUR NEXT STEP</p>
            <h2>{guide.title}</h2>
            <p>
              Help us understand your requirements. Include the following
              details when you contact us so the scope can be discussed around
              your needs.
            </p>
            <ul className="service-brief-list">
              {guide.brief.map((text) => (
                <li key={text}>
                  <Check size={18} aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <Link
              className="button"
              to={`/quote?service=${encodeURIComponent(category.name)}`}
            >
              Start your enquiry <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section container service-request-steps">
        <div className="service-step-heading">
          <p className="eyebrow">YOUR ENQUIRY, STEP BY STEP</p>
          <h2>From an idea to a defined request.</h2>
          <p>
            This guide helps you prepare for the conversation. The scope and
            next steps will depend on your particular requirements.
          </p>
          <Link
            className="text-link"
            to={`/quote?service=${encodeURIComponent(category.name)}`}
          >
            Prepare a request <ArrowUpRight size={16} />
          </Link>
        </div>
        <ol className="service-request-timeline">
          <li>
            <h3>Describe the objective</h3>
            <p>
              {product
                ? "List what you want to source, how it will be used and the quantities required. Include the destination and any procurement deadline."
                : "Explain what you want to achieve, the location and the support you are looking for. Include your preferred schedule and any constraints."}
            </p>
          </li>
          <li>
            <h3>Identify the details to clarify</h3>
            <p>
              {product
                ? "Flag missing specifications, compatibility questions and acceptable alternatives. Note any packaging, quality or documentation requirements."
                : "Note any missing drawings, dimensions or documents. Explain whether access, a site assessment or specialist input needs to be discussed."}
            </p>
          </li>
          <li>
            <h3>Review the proposed scope</h3>
            <p>
              {product
                ? "Before confirming an order, review the item descriptions, quantities, pricing, availability and delivery arrangements in the quotation."
                : "Before authorizing work, review the proposed services, responsibilities, fees, exclusions and schedule. Raise any questions about the assessment or scope."}
            </p>
          </li>
        </ol>
      </section>
      <section className="section container service-enquiry-guide">
        <div>
          <p className="eyebrow">BEFORE YOU ENQUIRE</p>
          <h2>A little preparation. A clearer conversation.</h2>
          <p>
            Start with the information you have. Use the enquiry form to
            describe your requirements and mention any drawings, photographs or
            specifications you can share during follow-up.
          </p>
        </div>
        <div className="service-questions">
          <details open>
            <summary>What if I am still defining the scope?</summary>
            <p>
              Describe your objective, location and preferred timeline. Mention
              what is still undecided so the conversation can focus on the
              details you need to clarify.
            </p>
          </details>
          <details>
            <summary>
              {product
                ? "How do I request pricing and availability?"
                : "How do I request a quotation?"}
            </summary>
            <p>
              {product
                ? "Include item specifications, quantities and the delivery location. Pricing, availability and delivery arrangements need to be confirmed for your request."
                : "Describe the work, property or site, and any relevant dimensions. Assessment requirements, scope, fees and scheduling need to be confirmed for your request."}
            </p>
          </details>
          <details>
            <summary>Can I enquire about more than one service?</summary>
            <p>
              Yes. List the services or supplies you need in one message and
              explain how they relate to your property, project or organization.
            </p>
          </details>
        </div>
      </section>
      {related.some((item) => item.slug !== category.slug) && (
        <section className="service-related">
          <div className="container section">
            <p className="eyebrow">CONNECTED EXPERTISE</p>
            <h2>Explore the wider picture.</h2>
            <p className="service-section-intro">
              Your requirements may involve more than one area. Explore these
              categories and include any connected needs in your enquiry.
            </p>
            <div className="service-related-grid">
              {related
                .filter((item) => item.slug !== category.slug)
                .slice(0, 3)
                .map((item) => (
                  <article key={item.id}>
                    <div>
                      <h3>
                        <Link to={`/services/category/${item.slug}`}>
                          {item.name}
                        </Link>
                      </h3>
                      <p>{item.description}</p>
                      <Link
                        className="text-link"
                        to={`/services/category/${item.slug}`}
                      >
                        Explore category <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
