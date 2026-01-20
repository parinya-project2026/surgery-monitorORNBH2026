export type LabReference = {
    label: string;
    min: number;
    max: number;
    unit: string;
};

export const LAB_REFERENCES: Record<string, LabReference> = {
    Na: { label: "Sodium (Na)", min: 135, max: 145, unit: "mEq/L" },
    K: { label: "Potassium (K)", min: 3.5, max: 5.5, unit: "mEq/L" },
    Cl: { label: "Chloride (Cl)", min: 98, max: 107, unit: "mEq/L" },
    Hct: { label: "Hematocrit (Hct)", min: 30, max: 50, unit: "%" }, // ค่ากลางๆ สำหรับ screen
    Plt: { label: "Platelet", min: 140000, max: 400000, unit: "cell/mm3" },
    BS: { label: "Blood Sugar", min: 70, max: 180, unit: "mg%" },
    Cr: { label: "Creatinine", min: 0.5, max: 1.5, unit: "mg/dL" },
    // --- Coagulogram ---
    PT: { label: "PT (Prothrombin Time)", min: 10, max: 14, unit: "sec" },
    PTT: { label: "PTT", min: 22, max: 35, unit: "sec" },
    INR: { label: "INR", min: 0.8, max: 1.2, unit: "ratio" }
};
