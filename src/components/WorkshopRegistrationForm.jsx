import React, { useId, useState } from "react";
import copy from "../data/registration.json";
import { registrationLimits, validateRegistration } from "../lib/registration.js";
import { formatSession } from "../lib/workshops.js";
import "../styles/registration.css";

export default function WorkshopRegistrationForm({ workshop, session }) {
  const id = useId();
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  function validate(event) {
    event.preventDefault();
    const result = validateRegistration(values);
    setValues(result.values);
    setErrors(result.errors);
  }
  const selectedLocation = session?.location || "";
  return <form className="registrationForm" noValidate onSubmit={validate} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Registrácia na workshop</h2>
    <dl className="registrationSummary">
      {[["Workshop", workshop.title], ["Termín", session ? formatSession(session, workshop.durationMinutes) : "Termín bude doplnený"], ["Miesto", selectedLocation || "Bude upresnené"]].map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    <p>Registrácia zatiaľ nie je otvorená.</p>
    <p id={`${id}-purpose`}>Kontaktné údaje použijeme iba na komunikáciu súvisiacu s workshopom – napríklad pri zmene času, miesta, zrušení workshopu alebo uvoľnení miesta z čakacej listiny.</p>
    <div className="registrationFields">
      {Object.entries(copy.fields).map(([field, label]) => <div key={field}>
        <label htmlFor={`${id}-${field}`}>{label} *</label>
        <input id={`${id}-${field}`} name={field} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
          autoComplete={{ firstName: "given-name", lastName: "family-name", email: "email", phone: "tel" }[field]}
          required maxLength={registrationLimits[field]} value={values[field]} aria-invalid={!!errors[field]}
          aria-describedby={errors[field] ? `${id}-${field}-error` : undefined}
          onChange={(event) => { setValues({ ...values, [field]: event.target.value }); setErrors((current) => ({ ...current, [field]: undefined })); }} />
        {errors[field] ? <p className="registrationError" id={`${id}-${field}-error`}>{copy[errors[field]].replace("{max}", registrationLimits[field])}</p> : null}
      </div>)}
    </div>
    <button type="submit" className="btn" disabled={!workshop.registrationOpen}>Registrácia zatiaľ nie je otvorená</button>
  </form>;
}
