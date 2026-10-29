import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpRight, Check } from "lucide-react";
import { api, write, type Entry, type CustomerRequest } from "./api";
const groupNames = [
  "Real Estate & Property Services",
  "Construction & Design",
  "Construction Materials",
  "General Supplies & Procurement",
  "Electrical, Electronics & IT Solutions",
  "Plumbing & Technical Services",
];
const formSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^[+\d ()-]{7,30}$/, "Enter a valid telephone number"),
  kind: z.enum(["CONTACT", "PROPERTY", "VIEWING", "QUOTATION", "CONSULTATION"]),
  service: z.string(),
  location: z.string(),
  message: z
    .string()
    .min(10, "Please provide at least 10 characters")
    .max(10000),
  quantities: z.string(),
  preferredDate: z.string(),
  website: z.string().max(0),
  consent: z.boolean().refine((v) => v, "Please consent so we can respond"),
});
type FormValues = z.infer<typeof formSchema>;
export default function RequestForm({
  entry,
  defaultKind = "CONTACT",
}: {
  entry?: Entry;
  defaultKind?: CustomerRequest["kind"];
}) {
  const [params] = useSearchParams();
  const [result, setResult] = useState(""),
    [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      kind: defaultKind as FormValues["kind"],
      service: entry?.title || params.get("service") || "",
      location: "",
      message: "",
      quantities: "",
      preferredDate: "",
      website: "",
      consent: false,
    },
  });
  const kind = watch("kind");
  return result ? (
    <div className="success" role="status">
      <Check />
      <h3>Thank you. Your request is saved.</h3>
      <p>{result}</p>
      <button onClick={() => setResult("")}>Send another request</button>
    </div>
  ) : (
    <form
      className="request-form"
      onSubmit={handleSubmit(async (values) => {
        setError("");
        try {
          const data = await api<{ id: string; notificationStatus: string }>(
            "/requests",
            write("POST", {
              ...values,
              consent: true,
              entryId: entry?.id || null,
              preferredDate: values.preferredDate
                ? new Date(values.preferredDate).toISOString()
                : null,
            }),
          );
          setResult(
            `Reference: ${data.id}. ${data.notificationStatus === "SENT" ? "Our team has been notified." : "Our team can review your request in the staff dashboard. Email notifications are currently unavailable."}`,
          );
          reset();
        } catch (e) {
          setError((e as Error).message);
        }
      })}
    >
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <label>
        Full name *<input autoComplete="name" {...register("name")} />
        {errors.name && (
          <span className="field-error">{errors.name.message}</span>
        )}
      </label>
      <div className="form-row">
        <label>
          Email *
          <input type="email" autoComplete="email" {...register("email")} />
          {errors.email && (
            <span className="field-error">{errors.email.message}</span>
          )}
        </label>
        <label>
          Telephone *
          <input type="tel" autoComplete="tel" {...register("phone")} />
          {errors.phone && (
            <span className="field-error">{errors.phone.message}</span>
          )}
        </label>
      </div>
      <label>
        How can we help?
        <select {...register("kind")}>
          <option value="CONTACT">General inquiry</option>
          <option value="CONSULTATION">Consultation request</option>
          <option value="QUOTATION">Quotation request</option>
          {entry?.kind === "property" && (
            <>
              <option value="PROPERTY">Property inquiry</option>
              <option value="VIEWING">Request a viewing</option>
            </>
          )}
        </select>
      </label>
      <label>
        Service or item
        <input
          {...register("service")}
          placeholder="What are you interested in?"
          list="service-options"
        />
        <datalist id="service-options">
          {groupNames.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </label>
      <label>
        Location
        <input autoComplete="address-level2" {...register("location")} />
      </label>
      {kind === "VIEWING" && (
        <label>
          Preferred viewing date
          <input type="datetime-local" {...register("preferredDate")} />
        </label>
      )}
      <label>
        {kind === "QUOTATION" ? "Project requirements *" : "Your message *"}
        <textarea rows={4} {...register("message")} />
        {errors.message && (
          <span className="field-error">{errors.message.message}</span>
        )}
      </label>
      {kind === "QUOTATION" && (
        <label>
          Materials, quantities & specifications
          <textarea rows={3} {...register("quantities")} />
        </label>
      )}
      <label className="honeypot" aria-hidden="true">
        Website
        <input tabIndex={-1} autoComplete="off" {...register("website")} />
      </label>
      <label className="checkbox">
        <input type="checkbox" {...register("consent")} />
        <span>
          I agree to the <Link to="/privacy">Privacy Policy</Link> and consent
          to being contacted about this request. *
        </span>
      </label>
      {errors.consent && (
        <span className="field-error">{errors.consent.message}</span>
      )}
      <button className="button" disabled={isSubmitting}>
        {isSubmitting ? "Saving your request…" : "Send request"}
        <ArrowUpRight size={16} />
      </button>
    </form>
  );
}
