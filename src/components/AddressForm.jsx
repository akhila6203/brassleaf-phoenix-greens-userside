import { STUDENT_CLASSES } from "../utils/addressStorage";

export default function AddressForm({ value, onChange, errors = {}, title }) {
  const update = (name, fieldValue) => onChange({ ...value, [name]: fieldValue });
  const inputClass = (name) => `input-field h-12 rounded-sm ${errors[name] ? "!border-red-500" : ""}`;
  const error = (name) => errors[name] ? <p className="mt-1 text-xs font-semibold text-red-600">{errors[name]}</p> : null;

  return (
    <div>
      {title && <h2 className="mb-6 text-2xl font-black text-[#243346]">{title}</h2>}
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Student First Name <span className="text-red-500">*</span></label>
          <input value={value.firstName || ""} onChange={(e) => update("firstName", e.target.value)} className={inputClass("firstName")} />
          {error("firstName")}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Student Last Name <span className="text-red-500">*</span></label>
          <input value={value.lastName || ""} onChange={(e) => update("lastName", e.target.value)} className={inputClass("lastName")} />
          {error("lastName")}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Student Class <span className="text-red-500">*</span></label>
          <select value={value.studentClass || "Nursery"} onChange={(e) => update("studentClass", e.target.value)} className="input-field h-12 rounded-sm">
            {STUDENT_CLASSES.map((studentClass) => <option key={studentClass} value={studentClass}>{studentClass}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Country / Region <span className="text-red-500">*</span></label>
          <select value={value.country || "India"} onChange={(e) => update("country", e.target.value)} className="input-field h-12 rounded-sm"><option value="India">India</option></select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Street address <span className="text-red-500">*</span></label>
          <input placeholder="House number and street name" value={value.address || ""} onChange={(e) => update("address", e.target.value)} className={inputClass("address")} />
          {error("address")}
        </div>
        <div className="sm:col-span-2">
          <input placeholder="Apartment, suite, unit, etc. (optional)" value={value.address2 || ""} onChange={(e) => update("address2", e.target.value)} className="input-field h-12 rounded-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Town / City <span className="text-red-500">*</span></label>
          <input value={value.city || ""} onChange={(e) => update("city", e.target.value)} className={inputClass("city")} />
          {error("city")}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">State <span className="text-red-500">*</span></label>
          <select value={value.state || "Telangana"} onChange={(e) => update("state", e.target.value)} className="input-field h-12 rounded-sm">
            <option value="Telangana">Telangana</option><option value="Andhra Pradesh">Andhra Pradesh</option><option value="Karnataka">Karnataka</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Maharashtra">Maharashtra</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">PIN Code <span className="text-red-500">*</span></label>
          <input inputMode="numeric" value={value.pincode || ""} onChange={(e) => update("pincode", e.target.value)} className={inputClass("pincode")} />
          {error("pincode")}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Phone <span className="text-red-500">*</span></label>
          {/* <input type="tel" value={value.phone || ""} onChange={(e) => update("phone", e.target.value)} className={inputClass("phone")} /> */}
          <input
  type="tel"
  inputMode="numeric"
  maxLength={10}
  value={value.phone || ""}
  onChange={(e) => {
    const phone =
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 10);

    update("phone", phone);
  }}
  className={inputClass("phone")}
/>
          {error("phone")}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Email address <span className="text-red-500">*</span></label>
          {/* <input type="email" value={value.email || ""} onChange={(e) => update("email", e.target.value)} className={inputClass("email")} /> */}
          <input
            type="email"
            value={value.email || ""}
            onChange={(e) => {
              const email =
                e.target.value.toLowerCase();

              update("email", email);
            }}
            className={inputClass("email")}
          />
          {error("email")}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Student Admission No. <span className="text-red-500">*</span></label>
          <input value={value.admissionNo || ""} onChange={(e) => update("admissionNo", e.target.value)} className={inputClass("admissionNo")} />
          {error("admissionNo")}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#243346]">Parent name <span className="text-red-500">*</span></label>
          <input value={value.parentName || ""} onChange={(e) => update("parentName", e.target.value)} className={inputClass("parentName")} />
          {error("parentName")}
        </div>
      </div>
    </div>
  );
}
