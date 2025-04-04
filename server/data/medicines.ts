export const medicineData = [
  {
    name: "Ibuprofen",
    aliases: "Advil, Motrin, Nurofen",
    description: "A nonsteroidal anti-inflammatory drug (NSAID) used to relieve pain, reduce inflammation, and lower fever.",
    category: "Pain Relief",
    uses: "Relief of mild to moderate pain\nReduction of fever\nTreatment of inflammatory conditions\nManagement of menstrual cramps",
    sideEffects: "Stomach upset or pain\nHeartburn\nNausea\nHeadache",
    dosage: "200-400mg every 4-6 hours",
    forms: "Tablets, Capsules, Liquid, Topical",
    warnings: "May increase risk of heart attack or stroke. Not recommended for people with certain medical conditions.",
    otcRx: "OTC"
  },
  {
    name: "Acetaminophen",
    aliases: "Tylenol, Paracetamol",
    description: "A pain reliever and fever reducer that works differently than NSAIDs and doesn't reduce inflammation.",
    category: "Pain Relief",
    uses: "Relief of mild to moderate pain\nReduction of fever\nHeadache relief\nManagement of osteoarthritis pain",
    sideEffects: "Rare when taken as directed\nLiver damage (with high doses or long-term use)\nRash\nLow blood pressure",
    dosage: "325-650mg every 4-6 hours, not to exceed 3000mg per day",
    forms: "Tablets, Capsules, Liquid, Suppositories",
    warnings: "Can cause liver damage in high doses or when combined with alcohol. Don't take with other products containing acetaminophen.",
    otcRx: "OTC"
  },
  {
    name: "Naproxen",
    aliases: "Aleve, Naprosyn",
    description: "An NSAID used to treat pain, inflammation, and fever with longer-lasting effects than ibuprofen.",
    category: "Pain Relief",
    uses: "Relief of pain and inflammation\nManagement of arthritis\nMenstrual cramp relief\nReduction of fever",
    sideEffects: "Stomach upset\nDizziness\nDrowsiness\nRinging in the ears",
    dosage: "220-500mg every 8-12 hours",
    forms: "Tablets, Capsules, Liquid",
    warnings: "May increase risk of heart attack, stroke, and stomach bleeding. Not recommended for use before or after heart surgery.",
    otcRx: "OTC/Rx"
  },
  {
    name: "Aspirin",
    aliases: "Bayer, Ecotrin, Bufferin",
    description: "An NSAID that reduces pain, fever, and inflammation and also has blood-thinning properties.",
    category: "Pain Relief",
    uses: "Relief of pain and inflammation\nReduction of fever\nPrevention of blood clots\nReduction of heart attack and stroke risk",
    sideEffects: "Stomach upset and bleeding\nRinging in the ears\nEasy bruising\nAllergic reactions",
    dosage: "325-650mg every 4-6 hours for pain, 81-325mg daily for heart health",
    forms: "Tablets, Chewable tablets, Enteric-coated tablets",
    warnings: "May cause Reye's syndrome in children. Not recommended for those under 18 years. Can cause stomach bleeding.",
    otcRx: "OTC"
  },
  {
    name: "Lisinopril",
    aliases: "Prinivil, Zestril",
    description: "An ACE inhibitor used to treat high blood pressure and heart failure.",
    category: "Cardiovascular",
    uses: "Treatment of high blood pressure\nManagement of heart failure\nPrevention of kidney problems in diabetics\nImprovement of survival after heart attack",
    sideEffects: "Dry cough\nDizziness\nHeadache\nHigh potassium levels",
    dosage: "10-40mg once daily",
    forms: "Tablets",
    warnings: "Can cause birth defects if taken during pregnancy. May cause angioedema or kidney problems.",
    otcRx: "Rx"
  },
  {
    name: "Metformin",
    aliases: "Glucophage, Fortamet",
    description: "An oral diabetes medicine that helps control blood sugar levels.",
    category: "Diabetes",
    uses: "Management of type 2 diabetes\nImprovement of insulin sensitivity\nWeight management\nPolycystic ovary syndrome treatment",
    sideEffects: "Stomach upset\nDiarrhea\nMetallic taste\nVitamin B12 deficiency",
    dosage: "500-2000mg daily, divided into doses",
    forms: "Tablets, Extended-release tablets",
    warnings: "May cause lactic acidosis in people with kidney problems. Temporarily stop before procedures using contrast dye.",
    otcRx: "Rx"
  },
  {
    name: "Amoxicillin",
    aliases: "Amoxil, Trimox",
    description: "A penicillin antibiotic used to treat bacterial infections.",
    category: "Antibiotics",
    uses: "Treatment of respiratory infections\nEar infections\nUrinary tract infections\nSkin infections",
    sideEffects: "Diarrhea\nRash\nNausea\nVomiting",
    dosage: "250-500mg three times daily, depending on infection",
    forms: "Capsules, Tablets, Chewable tablets, Liquid",
    warnings: "Can cause allergic reactions in people with penicillin allergy. May reduce effectiveness of birth control pills.",
    otcRx: "Rx"
  },
  {
    name: "Omeprazole",
    aliases: "Prilosec, Losec",
    description: "A proton pump inhibitor (PPI) that reduces stomach acid production.",
    category: "Gastrointestinal",
    uses: "Treatment of heartburn\nGastroesophageal reflux disease (GERD)\nHealing of erosive esophagitis\nTreatment of H. pylori infection",
    sideEffects: "Headache\nAbdominal pain\nDiarrhea\nVitamin deficiencies (with long-term use)",
    dosage: "20-40mg once daily",
    forms: "Capsules, Tablets, Powder",
    warnings: "Long-term use may increase risk of bone fractures, kidney disease, and certain infections.",
    otcRx: "OTC/Rx"
  },
  {
    name: "Atorvastatin",
    aliases: "Lipitor",
    description: "A statin medication used to lower cholesterol and reduce the risk of heart disease.",
    category: "Cardiovascular",
    uses: "Reduction of LDL cholesterol\nPrevention of cardiovascular disease\nReduction of heart attack risk\nReduction of stroke risk",
    sideEffects: "Muscle pain or weakness\nHeadache\nDigestive problems\nLiver enzyme abnormalities",
    dosage: "10-80mg once daily",
    forms: "Tablets",
    warnings: "May cause liver damage. Report muscle pain, weakness, or brown urine to doctor immediately.",
    otcRx: "Rx"
  },
  {
    name: "Sertraline",
    aliases: "Zoloft",
    description: "A selective serotonin reuptake inhibitor (SSRI) antidepressant.",
    category: "Mental Health",
    uses: "Treatment of depression\nManagement of anxiety disorders\nPost-traumatic stress disorder (PTSD)\nObsessive-compulsive disorder (OCD)",
    sideEffects: "Nausea\nInsomnia\nSexual dysfunction\nDizziness",
    dosage: "50-200mg once daily",
    forms: "Tablets, Oral solution",
    warnings: "May increase suicidal thoughts in young adults. Do not use with MAO inhibitors. May cause serotonin syndrome.",
    otcRx: "Rx"
  },
  {
    name: "Loratadine",
    aliases: "Claritin",
    description: "A non-drowsy antihistamine that relieves allergy symptoms.",
    category: "Allergies",
    uses: "Relief of allergy symptoms\nTreatment of hay fever\nReduction of hives\nRelief of nasal congestion",
    sideEffects: "Headache\nDry mouth\nFatigue\nNervousness",
    dosage: "10mg once daily",
    forms: "Tablets, Chewable tablets, Liquid, Dissolvable tablets",
    warnings: "May not be suitable for people with liver or kidney disease. May interact with other medications.",
    otcRx: "OTC"
  },
  {
    name: "Albuterol",
    aliases: "Ventolin, ProAir, Proventil",
    description: "A bronchodilator that relaxes muscles in the airways and increases air flow to the lungs.",
    category: "Respiratory",
    uses: "Treatment of asthma symptoms\nPrevention of exercise-induced asthma\nRelief of bronchospasm\nCOPD management",
    sideEffects: "Tremor\nNervousness\nHeadache\nRapid heartbeat",
    dosage: "2 inhalations every 4-6 hours as needed",
    forms: "Inhaler, Nebulizer solution, Tablets",
    warnings: "Overuse can lead to decreased effectiveness and worsening of asthma. Can cause paradoxical bronchospasm.",
    otcRx: "Rx"
  }
];
