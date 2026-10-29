import React, { useId, useRef, useState } from "react";
import copy from "../data/registration.json";
import { registrationLimits, validateRegistration } from "../lib/registration.js";
import "../styles/registration.css";

export default function RegistrationForm({ workshop }) {
  const id = useId();
  const formRef = useRef(null);
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [checked, setChecked] = useState(false);

  function check(event) {
    event.preventDefault();
    const result = validateRegistration(values);
    setValues(result.values);
    setErrors(result.errors);
    setChecked(Object.keys(result.errors).length === 0);
    const firstError = Object.keys(result.errors)[0];
    if (firstError) formRef.current.elements.namedItem(firstError)?.focus();
  }

  return <form ref={formRef} className="registrationForm" noValidate onSubmit={check} aria-labelledby={`${id}-title`} aria-describedby={`${id}-preview`}>
    <h3 id={`${id}-title`}>{copy.title}</h3>
    <dl className="registrationSummary">
      {[[copy.workshop, workshop.title], [copy.term, workshop.term], [copy.location, workshop.location]].map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value || copy.pending}</dd></div>)}
    </dl>
    <p id={`${id}-preview`}>{copy.preview}</p>
    <p id={`${id}-purpose`}>{copy.contactPurpose}</p>
    <div className="registrationFields">
      {Object.entries(copy.fields).map(([field, label]) => <div key={field}>
        <label htmlFor={`${id}-${field}`}>{label} *</label>
        <input id={`${id}-${field}`} name={field} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
          autoComplete={{ firstName: "given-name", lastName: "family-name", email: "email", phone: "tel" }[field]}
          required maxLength={registrationLimits[field]} value={values[field]}
          aria-invalid={!!errors[field]}
          aria-describedby={[errors[field] ? `${id}-${field}-error` : "", ["email", "phone"].includes(field) ? `${id}-purpose` : ""].filter(Boolean).join(" ") || undefined}
          onBlur={() => setValues((current) => ({ ...current, [field]: current[field].trim() }))}
          onChange={(event) => {
            setValues({ ...values, [field]: event.target.value });
            setErrors((current) => ({ ...current, [field]: undefined }));
            setChecked(false);
          }} />
        {errors[field] ? <p className="registrationError" id={`${id}-${field}-error`}>{copy[errors[field]].replace("{max}", registrationLimits[field])}</p> : null}
      </div>)}
    </div>
    <button type="submit" className="btn">{copy.check}</button>
    <p role="status">{checked ? copy.valid : ""}</p>
  </form>;
}
