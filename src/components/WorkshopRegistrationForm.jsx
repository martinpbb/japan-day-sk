import React, { useId, useState } from "react";
import copy from "../data/registration.json";
import { registrationLimits, validateRegistration } from "../lib/registration.js";
import { formatSession } from "../lib/workshops.js";
import "../styles/registration.css";
import { workshopApi } from "../lib/workshopApi.js";

export default function WorkshopRegistrationForm({ workshop, session }) {
  const id = useId();
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState("");
  const open = workshop.registrationOpen && session?.registrationOpen;
  async function validate(event) {
    event.preventDefault();
    const result = validateRegistration(values);
    setValues(result.values);
    setErrors(result.errors);
    if (!open || busy || Object.keys(result.errors).length) return;
    setBusy(true);
    setFailure("");
    try {
      const response = await fetch(`${workshopApi}/api/sessions/${encodeURIComponent(session.id)}/register`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: result.values.firstName, last_name: result.values.lastName, email: result.values.email, phone: result.values.phone }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) { setFailure(body.error?.code === 'DUPLICATE_REGISTRATION' ? copy.duplicate : copy.failed); return; }
      setResult(body.data);
    } catch { setFailure(copy.failed); }
    finally { setBusy(false); }
  }
  const selectedLocation = session?.location || "";
  return <form className="registrationForm" noValidate onSubmit={validate} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Registrácia na workshop</h2>
    <dl className="registrationSummary">
      {[["Workshop", workshop.title], ["Termín", session ? formatSession(session, workshop.durationMinutes) : "Termín bude doplnený"], ["Miesto", selectedLocation || "Bude upresnené"]].map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    {!open ? <p>{copy.preview}</p> : null}
    <p id={`${id}-purpose`}>Kontaktné údaje použijeme iba na komunikáciu súvisiacu s workshopom – napríklad pri zmene času, miesta, zrušení workshopu alebo uvoľnení miesta z čakacej listiny.</p>
    {result ? <div role="status">
      <p>{copy.success}</p><p>{result.status === 'waitlist' ? copy.waitlist : copy.registered}</p>
      {result.payment ? <>
        <dl className="registrationSummary">
          {[[copy.amount, new Intl.NumberFormat('sk-SK', { style: 'currency', currency: result.payment.currency }).format(result.payment.amount_cents / 100)],
            [copy.reference, result.payment.payment_reference], [copy.beneficiary, result.payment.beneficiary_name], ['IBAN', result.payment.iban],
            ...(result.payment.bic ? [['BIC', result.payment.bic]] : [])].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <p>{copy.paymentInstructions}</p>
        <img src={`${workshopApi}${result.payment.qr_url}`} alt={copy.qrAlt} width="320" height="320" style={{ maxWidth: '100%', height: 'auto' }} />
      </> : null}
    </div> : <>
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
    <p role="alert">{failure}</p>
    <button type="submit" className="btn" disabled={!open || busy}>{busy ? copy.sending : copy.submit}</button>
    </>}
  </form>;
}
